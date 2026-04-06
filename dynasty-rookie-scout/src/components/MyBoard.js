import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPlayers } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyBoards, createBoard, updateBoard, shareBoard, deleteBoard } from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk } from '../utils/helpers';
import SleeperSync from './SleeperSync';

const STORAGE_KEY_1QB = 'dynasty_myboard_1qb';

/**
 * Check if a board position should show a pick marker.
 * If picks have exact slot info, matches on exact overall position.
 * Otherwise, places markers at evenly-spaced positions within each round.
 */
function getPickLabel(position, picks, totalTeams) {
  if (!picks || picks.length === 0 || !totalTeams) return null;

  // Try exact slot match first
  for (const pick of picks) {
    if (pick.slot) {
      const overallPos = (pick.round - 1) * totalTeams + pick.slot;
      if (overallPos === position) {
        return `YOUR PICK · ${pick.round}.${String(pick.slot).padStart(2, '0')}`;
      }
    }
  }

  // Fall back to round-based markers for picks without slot info
  const round = Math.ceil(position / totalTeams);
  const posInRound = position - (round - 1) * totalTeams;
  const picksInRound = picks.filter(p => p.round === round && !p.slot);
  if (picksInRound.length === 0) return null;

  const spacing = Math.floor(totalTeams / (picksInRound.length + 1));
  for (let i = 0; i < picksInRound.length; i++) {
    if (posInRound === spacing * (i + 1)) {
      return `YOUR PICK · RD ${round}`;
    }
  }
  return null;
}

/* ── Sortable row extracted so useSortable hook works per-item ── */
const SortableRow = ({ player, index, activeFormat, pickLabel }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(player.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging ? 'var(--bg-hover)' : pickLabel ? 'var(--warning-light)' : 'var(--bg-card)',
    borderRadius: 6,
    borderLeft: `3px solid ${pickLabel ? 'var(--warning)' : (positionColors[player.position] || positionColors.WR).border}`,
    padding: '10px 16px',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
  };

  const posColor = positionColors[player.position] || positionColors.WR;
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Rank number */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-tertiary)',
        width: 32,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* Drag handle */}
      <div
        {...listeners}
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 18,
          cursor: 'grab',
          flexShrink: 0,
          lineHeight: 1,
          touchAction: 'none',
          padding: '8px 4px',
          minWidth: 28,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⋮⋮
      </div>

      {/* Player info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text-primary)',
          }}>
            {player.name}
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 12,
            color: posColor.text,
            background: posColor.bg,
            padding: '1px 6px',
            borderRadius: 3,
          }}>
            {player.position}
          </span>
          {injured && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--danger)',
              background: 'var(--danger-light)',
              padding: '1px 6px',
              borderRadius: 3,
            }}>
              🚨 INJURY
            </span>
          )}
          {pickLabel && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--warning)',
              background: 'var(--warning-light)',
              border: '1px solid var(--warning)',
              padding: '1px 6px',
              borderRadius: 3,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}>
              {pickLabel}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}>
          {[player.college, player.draftRound ? `${capital.emoji} ${getDraftRangeLabel(player.draftRound, player.draftPick) || 'TBD'}${player.draftIsProjected ? ' (proj)' : ''}` : null].filter(Boolean).join(' · ') || 'TBD'}
        </div>
      </div>

      {/* Quick stats */}
      <div className="myboard-row-stats" style={{
        display: 'flex',
        gap: 16,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        flexShrink: 0,
      }}>
        {(() => {
          const adpKey = activeFormat === 'oneQB' ? 'oneQB' : 'superflex';
          const adp = player.dynastyADP?.[adpKey];
          const userRank = index + 1;
          const diff = adp != null ? adp - userRank : null;
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 9, textTransform: 'uppercase' }}>
                {activeFormat === 'oneQB' ? '1QB' : 'SF'} ADP
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {adp != null ? `#${adp}` : '—'}
                </span>
                {diff != null && diff !== 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: diff > 0 ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {diff > 0 ? `▲${diff}` : `▼${Math.abs(diff)}`}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
        {player.breakoutAge && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 9, textTransform: 'uppercase' }}>BO AGE</div>
            <div style={{
              color: player.breakoutAge <= 20 ? 'var(--warning)' : player.breakoutAge <= 21 ? 'var(--success)' : 'var(--text-tertiary)',
              fontWeight: 700,
            }}>{player.breakoutAge}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const MyBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allBoards, setAllBoards] = useState([]); // [{id, name, format, player_ids, visibility, share_token, players:[]}]
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const shareCopiedTimer = useRef(null);
  const boardListRef = useRef(null);
  const [sleeperPicks, setSleeperPicks] = useState([]);
  const [sleeperLeagueCount, setSleeperLeagueCount] = useState(null);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardFormat, setNewBoardFormat] = useState('oneQB');
  const [renamingBoardId, setRenamingBoardId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const activeBoard = allBoards.find(b => b.id === activeBoardId);
  const currentBoard = activeBoard?.players || [];
  const activeFormat = activeBoard?.format === 'SF' || activeBoard?.format === 'superflex' ? 'superflex' : 'oneQB';

  useEffect(() => {
    const loadPlayers = async () => {
      let data;
      try {
        data = await getPlayers();
      } catch (err) {
        console.error('[MyBoard] Failed to load players:', err);
        setError(err.message || 'Failed to load player data');
        return;
      }
      setAllPlayers(data);

      const safeAdp = (p, key) => { const a = p.dynastyADP?.[key]; return (a == null || a === 'UNR') ? 999 : a; };
      const default1QB = [...data].sort((a, b) => safeAdp(a, 'oneQB') - safeAdp(b, 'oneQB'));
      const boardFromIds = (ids) => ids.map(id => data.find(p => p.id === id)).filter(Boolean);

      if (user) {
        try {
          const boardsRes = await fetchMyBoards();
          const boards = (boardsRes.boards || boardsRes || []).map(b => ({
            ...b,
            players: boardFromIds(b.player_ids),
          }));

          if (boards.length === 0) {
            // Create a default board
            const ids = default1QB.map(p => p.id);
            const created = await createBoard('My 1QB Board', 'oneQB', ids, 'private');
            const newBoard = {
              id: created.board?.id || created.id,
              name: 'My 1QB Board',
              format: 'oneQB',
              player_ids: ids,
              players: default1QB,
              visibility: 'private',
            };
            setAllBoards([newBoard]);
            setActiveBoardId(newBoard.id);
          } else {
            setAllBoards(boards);
            // Restore last active or pick first
            const savedId = localStorage.getItem('drs_active_board');
            const restored = boards.find(b => String(b.id) === savedId);
            const active = restored || boards[0];
            setActiveBoardId(active.id);
            setShareUrl(active.share_token ? `${window.location.origin}/board/shared/${active.share_token}` : null);
            setIsPublished(active.visibility === 'public');
          }
          return;
        } catch (err) {
          console.warn('[MyBoard] API board fetch failed:', err.message);
        }
      }

      // Anonymous fallback
      const savedIds = localStorage.getItem(STORAGE_KEY_1QB);
      const boardPlayers = savedIds ? boardFromIds(JSON.parse(savedIds)) : default1QB;
      setAllBoards([{ id: 'local', name: 'My Board', format: 'oneQB', players: boardPlayers, player_ids: boardPlayers.map(p => p.id) }]);
      setActiveBoardId('local');
    };
    loadPlayers();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save active board ID
  useEffect(() => {
    if (activeBoardId) {
      try { localStorage.setItem('drs_active_board', String(activeBoardId)); } catch {}
      // Update share state for new active board
      const board = allBoards.find(b => b.id === activeBoardId);
      if (board) {
        setShareUrl(board.share_token ? `${window.location.origin}/board/shared/${board.share_token}` : null);
        setIsPublished(board.visibility === 'public');
      }
    }
  }, [activeBoardId, allBoards]);

  const persist = useCallback((boardId, players) => {
    const ids = players.map(p => p.id);
    if (user && boardId && boardId !== 'local') {
      updateBoard(boardId, { player_ids: ids }).catch(err =>
        console.warn('[MyBoard] API persist failed:', err.message)
      );
    } else {
      localStorage.setItem(STORAGE_KEY_1QB, JSON.stringify(ids));
    }
  }, [user]);

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleShareBoard = async () => {
    if (!activeBoardId || activeBoardId === 'local') {
      showToast('Sign in to share your board');
      return;
    }
    try {
      const result = await shareBoard(activeBoardId);
      const token = result.shareToken || result.share_token;
      if (!token) { showToast('Failed to generate share link'); return; }
      const url = `${window.location.origin}/board/shared/${token}`;
      setShareUrl(url);
      setAllBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, share_token: token } : b));
      navigator.clipboard.writeText(url).then(() => showToast('Share link copied!'));
    } catch (err) {
      showToast('Failed to share board');
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !user) return;
    try {
      const defaultPlayers = [...allPlayers].sort((a, b) =>
        (a.dynastyADP?.oneQB ?? 999) - (b.dynastyADP?.oneQB ?? 999)
      );
      const ids = defaultPlayers.map(p => p.id);
      const created = await createBoard(newBoardName.trim(), newBoardFormat, ids, 'private');
      const newBoard = {
        id: created.board?.id || created.id,
        name: newBoardName.trim(),
        format: newBoardFormat,
        player_ids: ids,
        players: defaultPlayers,
        visibility: 'private',
      };
      setAllBoards(prev => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
      setNewBoardName('');
      setShowNewBoard(false);
      showToast('Board created!');
    } catch { showToast('Failed to create board'); }
  };

  const handleRenameBoard = async (boardId, name) => {
    if (!name.trim()) return;
    try {
      await updateBoard(boardId, { name: name.trim() });
      setAllBoards(prev => prev.map(b => b.id === boardId ? { ...b, name: name.trim() } : b));
      setRenamingBoardId(null);
    } catch { showToast('Failed to rename'); }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Delete this board?')) return;
    try {
      await deleteBoard(boardId);
      setAllBoards(prev => prev.filter(b => b.id !== boardId));
      if (activeBoardId === boardId) {
        const remaining = allBoards.filter(b => b.id !== boardId);
        setActiveBoardId(remaining[0]?.id || null);
      }
      showToast('Board deleted');
    } catch { showToast('Failed to delete'); }
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current);
    shareCopiedTimer.current = setTimeout(() => setShareCopied(false), 2000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentBoard.findIndex(p => String(p.id) === active.id);
    const newIndex = currentBoard.findIndex(p => String(p.id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentBoard, oldIndex, newIndex);
    setAllBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, players: reordered } : b));
    persist(activeBoardId, reordered);
  };

  const exportBoard = () => {
    const lines = currentBoard.map((p, i) =>
      `${i + 1}. ${p.name} (${p.position})${p.college ? ` - ${p.college}` : ''}${p.draftRound ? ` | ${getDraftRangeLabel(p.draftRound, p.draftPick) || 'TBD'}` : ''}${hasInjuryRisk(p) ? ' ⚠️ INJURY' : ''}`
    );
    const header = `=== ${(activeBoard?.name || 'MY BOARD').toUpperCase()} ===`;
    return `${header}\n${'='.repeat(header.length)}\n${lines.join('\n')}\n\nGenerated by Dynasty Rookie Scout`;
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportBoard());
    setShowExport(false);
  };

  const handleExportImage = async () => {
    if (!boardListRef.current) return;
    try {
      const canvas = await html2canvas(boardListRef.current, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f172a',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `dynasty-board-${(activeBoard?.name || 'board').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[MyBoard] Image export failed:', err);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 36, marginBottom: 12, marginTop: 40 }}>⚠️</div>
        <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          Failed to load board
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 16 }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            padding: '8px 20px',
            border: '1px solid var(--warning)',
            borderRadius: 4,
            background: 'var(--warning-light)',
            color: 'var(--warning)',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="myboard-root" style={{ padding: '20px 24px' }}>
      {/* Tab bar */}
      <div className="myboard-tab-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div className="myboard-tabs" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {allBoards.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoardId(board.id)}
              onDoubleClick={() => { setRenamingBoardId(board.id); setRenameValue(board.name); }}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 1,
                textTransform: 'uppercase', padding: '6px 14px',
                border: '1px solid',
                borderColor: board.id === activeBoardId ? 'var(--warning)' : 'var(--border-primary)',
                borderRadius: 4, cursor: 'pointer',
                background: board.id === activeBoardId ? 'var(--warning-light)' : 'transparent',
                color: board.id === activeBoardId ? 'var(--warning)' : 'var(--text-tertiary)',
                transition: 'all 0.15s', maxWidth: 180,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              title={`${board.name} (${board.format === 'SF' || board.format === 'superflex' ? 'SF' : '1QB'})`}
            >
              {board.name}
            </button>
          ))}
          {user && (
            <button
              onClick={() => setShowNewBoard(!showNewBoard)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 1,
                padding: '6px 10px', border: '1px dashed var(--border-primary)',
                borderRadius: 4, cursor: 'pointer',
                background: 'transparent', color: 'var(--text-tertiary)',
              }}
            >
              +
            </button>
          )}
        </div>

        {/* Board actions — icon buttons for share/export */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {user && (
            <button
              onClick={handleShareBoard}
              title="Share link"
              style={{
                background: 'none', border: '1px solid var(--border-primary)',
                borderRadius: 4, padding: '6px 8px', cursor: 'pointer',
                color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowExport(true)}
            title="Export / Download"
            style={{
              background: 'none', border: '1px solid var(--border-primary)',
              borderRadius: 4, padding: '6px 8px', cursor: 'pointer',
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* New board form */}
      {showNewBoard && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 12, padding: '8px 12px',
          background: 'var(--bg-tertiary)', borderRadius: 6,
          border: '1px solid var(--border-primary)',
        }}>
          <input
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            placeholder="Board name..."
            autoFocus
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 4,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontFamily: "'Inter', sans-serif", fontSize: 12, outline: 'none',
            }}
          />
          <select
            value={newBoardFormat}
            onChange={e => setNewBoardFormat(e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: 4,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            }}
          >
            <option value="oneQB">1QB</option>
            <option value="superflex">SF</option>
          </select>
          <button
            onClick={handleCreateBoard}
            disabled={!newBoardName.trim()}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 12, padding: '6px 12px',
              border: 'none', borderRadius: 4,
              background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              opacity: newBoardName.trim() ? 1 : 0.5,
            }}
          >
            Create
          </button>
          <button onClick={() => setShowNewBoard(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', fontSize: 16,
          }}>×</button>
        </div>
      )}

      {/* Rename inline */}
      {renamingBoardId && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 12, padding: '8px 12px',
          background: 'var(--bg-tertiary)', borderRadius: 6,
          border: '1px solid var(--warning)',
        }}>
          <input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRenameBoard(renamingBoardId, renameValue)}
            autoFocus
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 4,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontFamily: "'Inter', sans-serif", fontSize: 12, outline: 'none',
            }}
          />
          <button onClick={() => handleRenameBoard(renamingBoardId, renameValue)} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 4, border: 'none',
            background: 'var(--warning)', color: '#fff', cursor: 'pointer',
          }}>Save</button>
          {allBoards.length > 1 && (
            <button onClick={() => handleDeleteBoard(renamingBoardId)} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 4,
              border: '1px solid var(--danger)', background: 'transparent',
              color: 'var(--danger)', cursor: 'pointer',
            }}>Delete</button>
          )}
          <button onClick={() => setRenamingBoardId(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', fontSize: 16,
          }}>×</button>
        </div>
      )}

      {/* Share URL display + publish toggle */}
      {shareUrl && (
        <div style={{
          marginBottom: 12, padding: '10px 12px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              }}
            />
            <button
              onClick={handleCopyShareUrl}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 12, padding: '4px 12px',
                border: '1px solid var(--warning)', borderRadius: 4,
                background: 'var(--warning-light)', color: 'var(--warning)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {shareCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 8, borderTop: '1px solid var(--border-primary)',
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12,
              color: 'var(--text-tertiary)',
            }}>
              {isPublished ? 'Visible on Community Boards' : 'Only accessible via link'}
            </span>
            <button
              onClick={async () => {
                const boardId = activeBoardId;
                if (!boardId) return;
                const newVisibility = isPublished ? 'shared' : 'public';
                try {
                  await updateBoard(boardId, { visibility: newVisibility });
                  setIsPublished(!isPublished);
                  showToast(isPublished ? 'Removed from Community Boards' : 'Published to Community Boards!');
                } catch { showToast('Failed to update'); }
              }}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '4px 12px', borderRadius: 4,
                border: `1px solid ${isPublished ? 'var(--success)' : 'var(--accent)'}`,
                background: isPublished ? 'var(--success-light)' : 'var(--accent-light)',
                color: isPublished ? 'var(--success)' : 'var(--accent-text)',
                cursor: 'pointer',
              }}
            >
              {isPublished ? '✓ Published' : 'Publish to Community'}
            </button>
          </div>
        </div>
      )}

      {/* Sleeper sync */}
      {user && <SleeperSync onSynced={(result) => {
        // Auto-switch to a board matching the league format
        const targetFormat = result.format === 'SF' ? 'superflex' : 'oneQB';
        try { localStorage.setItem('drs_league_format', result.format === 'SF' ? 'SF' : '1QB'); } catch {}
        const matchingBoard = allBoards.find(b =>
          b.format === targetFormat || b.format === (result.format === 'SF' ? 'SF' : '1QB')
        );
        if (matchingBoard) setActiveBoardId(matchingBoard.id);
        // Store picks for board markers
        const picks = Array.isArray(result.draft_picks) ? result.draft_picks : [];
        setSleeperPicks(picks);
        setSleeperLeagueCount(result.total_rosters || 12);
      }} />}

      {/* Quick links */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 12,
        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
      }}>
        <button
          onClick={() => navigate('/draft')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--warning)', padding: 0,
            fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          Draft Room →
        </button>
        <button
          onClick={() => navigate('/boards')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent-text)', padding: 0,
            fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
          }}
        >
          Browse Community Boards →
        </button>
      </div>

      {/* Drag-and-drop list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentBoard.map(p => String(p.id))}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={boardListRef}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              padding: 8,
              minHeight: 200,
            }}
          >
            {currentBoard.map((player, index) => {
              // Check if this board position matches one of the user's draft picks
              const pickLabel = getPickLabel(index + 1, sleeperPicks, sleeperLeagueCount);
              return (
                <SortableRow
                  key={String(player.id)}
                  player={player}
                  index={index}
                  activeFormat={activeFormat}
                  pickLabel={pickLabel}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Export modal */}
      {showExport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 200,
          }}
          onClick={() => setShowExport(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 12,
              border: '1px solid var(--border-primary)',
              padding: 24,
              width: '100%',
              maxWidth: 600,
            }}
          >
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--warning)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 0,
              marginBottom: 12,
            }}>Export Board</h3>
            <textarea
              readOnly
              value={exportBoard()}
              style={{
                width: '100%',
                height: 300,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 6,
                padding: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExport(false)}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  padding: '8px 16px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleExportImage}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700, padding: '8px 16px',
                  border: '1px solid var(--accent)', borderRadius: 4,
                  background: 'var(--accent-light)', color: 'var(--accent-text)',
                  cursor: 'pointer',
                }}
              >
                Save as Image
              </button>
              <button
                onClick={handleCopyExport}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  padding: '8px 16px',
                  border: '1px solid var(--warning)',
                  borderRadius: 4,
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  cursor: 'pointer',
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
          borderRadius: 10, padding: '12px 24px', boxShadow: 'var(--shadow-lg)',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
          color: 'var(--text-primary)', zIndex: 300,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default MyBoard;
