import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getPlayers } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyBoards, createBoard, updateBoard, shareBoard } from '../services/apiClient';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk } from '../utils/helpers';

const STORAGE_KEY_1QB = 'dynasty_myboard_1qb';
const STORAGE_KEY_SF = 'dynasty_myboard_sf';

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
  const [visibility, setVisibility] = useState('private');
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopiedTimer = useRef(null);

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

      const safeRank = (p, key) => { const r = p.rank?.[key]; return (r == null || r === 'UNR') ? 999 : r; };
      const default1QB = [...data].sort((a, b) => safeRank(a, 'oneQB') - safeRank(b, 'oneQB'));
      const defaultSF = [...data].sort((a, b) => safeRank(a, 'superflex') - safeRank(b, 'superflex'));

      const boardFromIds = (ids) => ids.map(id => data.find(p => p.id === id)).filter(Boolean);

      // If logged in, try fetching from API first
      if (user) {
        try {
          const boards = await fetchMyBoards();
          const api1QB = boards.find(b => b.format === 'oneQB');
          const apiSF = boards.find(b => b.format === 'superflex');

          if (api1QB) {
            setBoardId1QB(api1QB.id);
            setBoard1QB(boardFromIds(api1QB.player_ids));
            localStorage.setItem(STORAGE_KEY_1QB, JSON.stringify(api1QB.player_ids));
          } else {
            const ids1QB = default1QB.map(p => p.id);
            const created1QB = await createBoard('My 1QB Board', 'oneQB', ids1QB, 'private');
            setBoardId1QB(created1QB.id);
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
            setBoardIdSF(createdSF.id);
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

  const handleShareBoard = async () => {
    const boardId = activeFormat === 'oneQB' ? boardId1QB : boardIdSF;
    if (!boardId) return;
    try {
      const result = await shareBoard(boardId);
      const url = `${window.location.origin}/boards/shared/${result.share_token}`;
      setShareUrl(url);
    } catch (err) {
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

  const handleVisibilityToggle = async () => {
    const boardId = activeFormat === 'oneQB' ? boardId1QB : boardIdSF;
    if (!user || !boardId) return;
    const next = visibility === 'private' ? 'public' : visibility === 'public' ? 'shared' : 'private';
    try {
      await updateBoard(boardId, { visibility: next });
      setVisibility(next);
    } catch (err) {
      console.error('[MyBoard] Visibility update failed:', err.message);
    }
  };

  const currentBoard = activeFormat === 'oneQB' ? board1QB : boardSF;
  const setCurrentBoard = activeFormat === 'oneQB' ? setBoard1QB : setBoardSF;

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(currentBoard);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setCurrentBoard(items);
    persist(activeFormat, items);
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
        <div style={{ color: '#ef4444', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
          Failed to load board
        </div>
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16 }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            padding: '8px 20px',
            border: '1px solid #f59e0b',
            borderRadius: 4,
            background: 'rgba(245,158,11,0.15)',
            color: '#f59e0b',
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
                borderColor: activeFormat === tab.id ? '#f59e0b' : '#2a2d3e',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeFormat === tab.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: activeFormat === tab.id ? '#f59e0b' : '#9ca3af',
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
              onClick={handleVisibilityToggle}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
                padding: '8px 16px',
                border: '1px solid #2a2d3e',
                borderRadius: 4,
                cursor: 'pointer',
                background: visibility === 'public' ? 'rgba(34,197,94,0.15)' : '#1a1d2e',
                color: visibility === 'public' ? '#22c55e' : '#9ca3af',
                transition: 'all 0.15s',
              }}
            >
              {visibility === 'private' ? 'Private' : visibility === 'public' ? 'Public' : 'Shared'}
            </button>
          )}
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
                border: '1px solid #2a2d3e',
                borderRadius: 4,
                cursor: 'pointer',
                background: '#1a1d2e',
                color: '#9ca3af',
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
              border: '1px solid #2a2d3e',
              borderRadius: 4,
              cursor: 'pointer',
              background: '#1a1d2e',
              color: '#9ca3af',
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
          background: '#1a1d2e',
          border: '1px solid #2a2d3e',
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
              color: '#d1d5db',
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
              border: '1px solid #f59e0b',
              borderRadius: 4,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {shareCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Drag-and-drop list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="myboard">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                background: '#151825',
                borderRadius: 8,
                padding: 8,
                minHeight: 200,
              }}
            >
              {currentBoard.map((player, index) => {
                const posColor = positionColors[player.position] || positionColors.WR;
                const capital = getDraftCapitalInfo(player.draftPick);
                const injured = hasInjuryRisk(player);

                return (
                  <Draggable key={player.id} draggableId={String(player.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          background: snapshot.isDragging ? '#252842' : '#1a1d2e',
                          borderRadius: 6,
                          borderLeft: `3px solid ${posColor.border}`,
                          padding: '10px 16px',
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          transition: snapshot.isDragging ? 'none' : 'background 0.15s',
                        }}
                      >
                        {/* Rank number */}
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#4b5563',
                          width: 32,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}>
                          {index + 1}
                        </div>

                        {/* Drag handle dots */}
                        <div style={{
                          color: '#4b5563',
                          fontSize: 16,
                          cursor: 'grab',
                          flexShrink: 0,
                          lineHeight: 1,
                        }}>
                          ⋮⋮
                        </div>

                        {/* Player info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 700,
                              fontSize: 16,
                              color: '#f1f5f9',
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
                                color: '#ef4444',
                                background: 'rgba(239,68,68,0.15)',
                                padding: '1px 6px',
                                borderRadius: 3,
                              }}>
                                🚨 INJURY
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: '#6b7280',
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
                            <div style={{ color: '#9ca3af', fontSize: 9, textTransform: 'uppercase' }}>
                              {activeFormat === 'oneQB' ? '1QB' : 'SF'} ADP
                            </div>
                            <div style={{ color: '#f1f5f9', fontWeight: 700 }}>
                              {player.dynastyADP?.[activeFormat] != null ? `#${player.dynastyADP[activeFormat]}` : '—'}
                            </div>
                          </div>
                          {player.breakoutAge && (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#9ca3af', fontSize: 9, textTransform: 'uppercase' }}>BO AGE</div>
                              <div style={{
                                color: player.breakoutAge <= 20 ? '#f59e0b' : player.breakoutAge <= 21 ? '#22c55e' : '#6b7280',
                                fontWeight: 700,
                              }}>{player.breakoutAge}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
              background: '#0f1117',
              borderRadius: 12,
              border: '1px solid #2a2d3e',
              padding: 24,
              width: '100%',
              maxWidth: 600,
            }}
          >
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: '#f59e0b',
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
                background: '#1a1d2e',
                color: '#d1d5db',
                border: '1px solid #2a2d3e',
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
                  border: '1px solid #2a2d3e',
                  borderRadius: 4,
                  background: 'transparent',
                  color: '#9ca3af',
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
                  border: '1px solid #f59e0b',
                  borderRadius: 4,
                  background: 'rgba(245,158,11,0.15)',
                  color: '#f59e0b',
                  cursor: 'pointer',
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBoard;
