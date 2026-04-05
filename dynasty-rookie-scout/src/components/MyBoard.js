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
import { fetchMyBoards, createBoard, updateBoard, shareBoard } from '../services/apiClient';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk } from '../utils/helpers';
import SleeperSync from './SleeperSync';

const STORAGE_KEY_1QB = 'dynasty_myboard_1qb';
const STORAGE_KEY_SF = 'dynasty_myboard_sf';

/**
 * Check if a board position falls within a round the user owns a pick in.
 * Returns a label like "RD 1 PICK" or "RD 2 PICK", or null.
 * Since exact draft slot isn't known pre-draft, we show the round range.
 */
function getPickLabel(position, picks, totalTeams) {
  if (!picks || picks.length === 0 || !totalTeams) return null;
  const round = Math.ceil(position / totalTeams);
  const startOfRound = (round - 1) * totalTeams + 1;
  const endOfRound = round * totalTeams;

  // Count how many picks the user has in this round
  const picksInRound = picks.filter(p => p.round === round);
  if (picksInRound.length === 0) return null;

  // Show markers at evenly-spaced positions within the round range
  // E.g. 1 pick in 12-team round → mark the middle position
  // E.g. 2 picks in 12-team round → mark positions at 1/3 and 2/3
  const roundSize = endOfRound - startOfRound + 1;
  const posInRound = position - startOfRound; // 0-indexed within round
  const spacing = Math.floor(roundSize / (picksInRound.length + 1));

  for (let i = 0; i < picksInRound.length; i++) {
    const markerPos = spacing * (i + 1);
    if (posInRound === markerPos) {
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
          {[player.college, player.draftRound ? `${capital.emoji} ${getDraftRangeLabel(player.draftRound, player.draftPick) || 'TBD'}` : null].filter(Boolean).join(' · ') || 'TBD'}
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 9, textTransform: 'uppercase' }}>
            {activeFormat === 'oneQB' ? '1QB' : 'SF'} ADP
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {player.dynastyADP?.[activeFormat] != null ? `#${player.dynastyADP[activeFormat]}` : '—'}
          </div>
        </div>
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
  const [activeFormat, setActiveFormat] = useState('oneQB');
  const [board1QB, setBoard1QB] = useState([]);
  const [boardSF, setBoardSF] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // eslint-disable-line no-unused-vars
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState(null);
  const [boardId1QB, setBoardId1QB] = useState(null);
  const [boardIdSF, setBoardIdSF] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopiedTimer = useRef(null);
  const [sleeperPicks, setSleeperPicks] = useState([]); // [{round, roster_id, ...}]
  const [sleeperLeagueCount, setSleeperLeagueCount] = useState(null); // total teams in league

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
      const defaultSF = [...data].sort((a, b) => safeAdp(a, 'superflex') - safeAdp(b, 'superflex'));

      const boardFromIds = (ids) => ids.map(id => data.find(p => p.id === id)).filter(Boolean);

      // If logged in, try fetching from API first
      if (user) {
        try {
          const boardsRes = await fetchMyBoards();
          const boards = boardsRes.boards || boardsRes || [];
          const api1QB = boards.find(b => b.format === '1QB') || boards.find(b => b.format === 'oneQB');
          const apiSF = boards.find(b => b.format === 'SF') || boards.find(b => b.format === 'superflex');

          if (api1QB) {
            setBoardId1QB(api1QB.id);
            setBoard1QB(boardFromIds(api1QB.player_ids));
            localStorage.setItem(STORAGE_KEY_1QB, JSON.stringify(api1QB.player_ids));
          } else {
            const ids1QB = default1QB.map(p => p.id);
            const created1QB = await createBoard('My 1QB Board', 'oneQB', ids1QB, 'private');
            setBoardId1QB(created1QB.board?.id || created1QB.id);
            setBoard1QB(default1QB);
            localStorage.setItem(STORAGE_KEY_1QB, JSON.stringify(ids1QB));
          }

          if (apiSF) {
            setBoardIdSF(apiSF.id);
            setBoardSF(boardFromIds(apiSF.player_ids));
            localStorage.setItem(STORAGE_KEY_SF, JSON.stringify(apiSF.player_ids));
          } else {
            const idsSF = defaultSF.map(p => p.id);
            const createdSF = await createBoard('My SF Board', 'superflex', idsSF, 'private');
            setBoardIdSF(createdSF.board?.id || createdSF.id);
            setBoardSF(defaultSF);
            localStorage.setItem(STORAGE_KEY_SF, JSON.stringify(idsSF));
          }
          return;
        } catch (err) {
          console.warn('[MyBoard] API board fetch failed, falling back to localStorage:', err.message);
        }
      }

      // Anonymous or API fallback: load from localStorage or default to rank order
      let saved1QB, savedSF;
      try { saved1QB = localStorage.getItem(STORAGE_KEY_1QB); } catch { /* ignore */ }
      try { savedSF = localStorage.getItem(STORAGE_KEY_SF); } catch { /* ignore */ }

      if (saved1QB) {
        try {
          const ids = JSON.parse(saved1QB);
          setBoard1QB(boardFromIds(ids));
        } catch (err) {
          console.warn('[MyBoard] Corrupted 1QB board in localStorage, resetting:', err.message);
          localStorage.removeItem(STORAGE_KEY_1QB);
          setBoard1QB(default1QB);
        }
      } else {
        setBoard1QB(default1QB);
      }

      if (savedSF) {
        try {
          const ids = JSON.parse(savedSF);
          setBoardSF(boardFromIds(ids));
        } catch (err) {
          console.warn('[MyBoard] Corrupted SF board in localStorage, resetting:', err.message);
          localStorage.removeItem(STORAGE_KEY_SF);
          setBoardSF(defaultSF);
        }
      } else {
        setBoardSF(defaultSF);
      }
    };
    loadPlayers();
  }, [user]);

  const persist = useCallback((format, board) => {
    const key = format === 'oneQB' ? STORAGE_KEY_1QB : STORAGE_KEY_SF;
    const ids = board.map(p => p.id);
    localStorage.setItem(key, JSON.stringify(ids));

    // Sync to API when logged in
    const boardId = format === 'oneQB' ? boardId1QB : boardIdSF;
    if (user && boardId) {
      updateBoard(boardId, { player_ids: ids }).catch(err =>
        console.warn('[MyBoard] API persist failed:', err.message)
      );
    }
  }, [user, boardId1QB, boardIdSF]);

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleShareBoard = async () => {
    let boardId = activeFormat === 'oneQB' ? boardId1QB : boardIdSF;

    // Auto-create board if it doesn't exist yet
    if (!boardId && user) {
      try {
        const ids = currentBoard.map(p => p.id);
        const name = activeFormat === 'oneQB' ? 'My 1QB Board' : 'My SF Board';
        const format = activeFormat === 'oneQB' ? 'oneQB' : 'superflex';
        const created = await createBoard(name, format, ids, 'shared');
        boardId = created.board?.id || created.id;
        if (activeFormat === 'oneQB') setBoardId1QB(boardId);
        else setBoardIdSF(boardId);
      } catch (err) {
        showToast('Failed to create board');
        return;
      }
    }

    if (!boardId) {
      showToast('Sign in to share your board');
      return;
    }

    try {
      const result = await shareBoard(boardId);
      const token = result.shareToken || result.share_token;
      if (!token) { showToast('Failed to generate share link'); return; }
      const url = `${window.location.origin}/board/shared/${token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).then(() => showToast('Share link copied!'));
    } catch (err) {
      showToast('Failed to share board');
      console.error('[MyBoard] Share failed:', err.message);
    }
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    if (shareCopiedTimer.current) clearTimeout(shareCopiedTimer.current);
    shareCopiedTimer.current = setTimeout(() => setShareCopied(false), 2000);
  };

  const currentBoard = activeFormat === 'oneQB' ? board1QB : boardSF;

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

    if (activeFormat === 'oneQB') {
      setBoard1QB(reordered);
    } else {
      setBoardSF(reordered);
    }
    persist(activeFormat, reordered);
  };

  const exportBoard = () => {
    const lines = currentBoard.map((p, i) =>
      `${i + 1}. ${p.name} (${p.position})${p.college ? ` - ${p.college}` : ''}${p.draftRound ? ` | ${getDraftRangeLabel(p.draftRound, p.draftPick) || 'TBD'}` : ''}${hasInjuryRisk(p) ? ' ⚠️ INJURY' : ''}`
    );
    const header = activeFormat === 'oneQB' ? '=== MY 1QB ROOKIE BOARD ===' : '=== MY SUPERFLEX ROOKIE BOARD ===';
    return `${header}\n${'='.repeat(header.length)}\n${lines.join('\n')}\n\nGenerated by Dynasty Rookie Scout`;
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportBoard());
    setShowExport(false);
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
        <div className="myboard-tabs" style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'oneQB', label: '1QB BOARD' },
            { id: 'superflex', label: 'SUPERFLEX BOARD' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFormat(tab.id)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                padding: '8px 20px',
                border: '1px solid',
                borderColor: activeFormat === tab.id ? 'var(--warning)' : 'var(--border-primary)',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeFormat === tab.id ? 'var(--warning-light)' : 'transparent',
                color: activeFormat === tab.id ? 'var(--warning)' : 'var(--text-tertiary)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user && (
            <button
              onClick={handleShareBoard}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
                padding: '8px 16px',
                border: '1px solid var(--border-primary)',
                borderRadius: 4,
                cursor: 'pointer',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-tertiary)',
                transition: 'all 0.15s',
              }}
            >
              Share Board
            </button>
          )}
          <button
            onClick={() => setShowExport(true)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '8px 16px',
              border: '1px solid var(--border-primary)',
              borderRadius: 4,
              cursor: 'pointer',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              transition: 'all 0.15s',
            }}
          >
            Export Board
          </button>
        </div>
      </div>

      {/* Share URL display */}
      {shareUrl && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 6,
        }}>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
          />
          <button
            onClick={handleCopyShareUrl}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              padding: '4px 12px',
              border: '1px solid var(--warning)',
              borderRadius: 4,
              background: 'var(--warning-light)',
              color: 'var(--warning)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {shareCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Sleeper sync */}
      {user && <SleeperSync onSynced={(result) => {
        // Auto-switch format to match synced league
        if (result.format === 'SF') {
          setActiveFormat('superflex');
          try { localStorage.setItem('drs_league_format', 'SF'); } catch {}
        } else {
          setActiveFormat('oneQB');
          try { localStorage.setItem('drs_league_format', '1QB'); } catch {}
        }
        // Store picks for board markers
        const picks = Array.isArray(result.draft_picks) ? result.draft_picks : [];
        setSleeperPicks(picks);
        // Determine total teams from roster positions or default
        const totalTeams = result.total_rosters || 12;
        setSleeperLeagueCount(totalTeams);
      }} />}

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
