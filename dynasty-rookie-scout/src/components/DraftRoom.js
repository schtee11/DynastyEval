import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMySleeperLeagues, fetchMyBoards, fetchDraftPlan, saveDraftPlan } from '../services/apiClient';
import { getPlayers } from '../services/dataService';
import { positionColors } from '../utils/helpers';

// Debounce save to avoid hammering the API on every reorder
let saveTimeout = null;
const debouncedSave = (leagueId, plans, livePicks) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDraftPlan(leagueId, plans, livePicks).catch(() => {});
  }, 1000);
};

const PickCard = ({ pickLabel, pickOverall, totalTeams, targets, allPlayers, onAddTarget, onRemoveTarget, onMoveTarget, takenPlayerIds }) => {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Players likely available around this pick (window of board positions near this overall pick)
  const suggestedPlayers = useMemo(() => {
    if (!pickOverall || !allPlayers.length) return [];
    const targetIds = new Set(targets.map(t => String(t)));
    // Show a window: 2 picks before to 3 picks after this pick position
    const start = Math.max(0, pickOverall - 3);
    const end = pickOverall + 3;
    return allPlayers
      .slice(start, end)
      .filter(p => !targetIds.has(String(p.id)) && !takenPlayerIds.has(String(p.id)));
  }, [pickOverall, allPlayers, targets, takenPlayerIds]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const targetIds = new Set(targets.map(t => String(t)));
    return allPlayers
      .filter(p => !targetIds.has(String(p.id)) && !takenPlayerIds.has(String(p.id)))
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, allPlayers, targets, takenPlayerIds]);

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-subtle)', overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Pick header */}
      <div style={{
        background: 'var(--warning-light)',
        borderBottom: '1px solid var(--warning)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 18, letterSpacing: 1,
          color: 'var(--warning)',
        }}>
          PICK {pickLabel}
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 4,
            border: 'none',
            background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          }}
        >
          + Add Target
        </button>
      </div>

      {/* Target list (priority order) */}
      <div style={{ padding: targets.length > 0 || showSearch ? '8px 12px' : 0 }}>
        {targets.length === 0 && !showSearch && (
          <div style={{
            padding: '16px 12px', textAlign: 'center',
            fontFamily: "'Inter', sans-serif", fontSize: 12,
            color: 'var(--text-tertiary)',
          }}>
            No targets set. Add players you'd want at this pick.
          </div>
        )}

        {targets.map((playerId, i) => {
          const p = allPlayers.find(pl => String(pl.id) === String(playerId));
          if (!p) return null;
          const posColor = positionColors[p.position] || positionColors.WR;
          const isTaken = takenPlayerIds.has(String(p.id));
          return (
            <div key={playerId} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 4px',
              borderBottom: i < targets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              opacity: isTaken ? 0.35 : 1,
            }}>
              {/* Priority number */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14, fontWeight: 700, color: i === 0 ? 'var(--success)' : 'var(--text-tertiary)',
                width: 20, textAlign: 'center',
              }}>
                {i + 1}
              </span>

              {/* Move buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <button
                  onClick={() => onMoveTarget(i, -1)}
                  disabled={i === 0}
                  style={{
                    background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer',
                    color: 'var(--text-tertiary)', fontSize: 10, padding: 0, lineHeight: 1,
                    opacity: i === 0 ? 0.3 : 1,
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => onMoveTarget(i, 1)}
                  disabled={i === targets.length - 1}
                  style={{
                    background: 'none', border: 'none', cursor: i === targets.length - 1 ? 'default' : 'pointer',
                    color: 'var(--text-tertiary)', fontSize: 10, padding: 0, lineHeight: 1,
                    opacity: i === targets.length - 1 ? 0.3 : 1,
                  }}
                >
                  ▼
                </button>
              </div>

              {/* Player info */}
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                color: isTaken ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: isTaken ? 'line-through' : 'none',
                flex: 1,
              }}>
                {p.name}
              </span>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600, fontSize: 10,
                color: posColor.text, background: posColor.bg,
                padding: '1px 5px', borderRadius: 3,
              }}>
                {p.position}
              </span>
              {isTaken && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  color: 'var(--danger)', fontWeight: 700,
                }}>
                  TAKEN
                </span>
              )}
              <button
                onClick={() => onRemoveTarget(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', fontSize: 14, padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Search to add */}
        {showSearch && (
          <div style={{ marginTop: 8 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a player..."
              autoFocus
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 6,
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-input)', color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif", fontSize: 12,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {searchResults.map(p => {
              const posColor = positionColors[p.position] || positionColors.WR;
              return (
                <div
                  key={p.id}
                  onClick={() => { onAddTarget(p.id); setSearch(''); setShowSearch(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)', flex: 1,
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600, fontSize: 10,
                    color: posColor.text, background: posColor.bg,
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {p.position}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--text-tertiary)',
                  }}>
                    ADP #{p.dynastyADP?.oneQB || '—'}
                  </span>
                </div>
              );
            })}
            {search.trim() && searchResults.length === 0 && (
              <div style={{
                padding: 8, fontFamily: "'Inter', sans-serif", fontSize: 11,
                color: 'var(--text-tertiary)',
              }}>
                No players found
              </div>
            )}
          </div>
        )}

        {/* Suggested players — who might be available at this pick */}
        {suggestedPlayers.length > 0 && !showSearch && (
          <div style={{
            borderTop: targets.length > 0 ? '1px solid var(--border-subtle)' : 'none',
            padding: '6px 4px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'var(--text-tertiary)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 4, paddingLeft: 4,
            }}>
              Likely available
            </div>
            {suggestedPlayers.map(p => {
              const posColor = positionColors[p.position] || positionColors.WR;
              const boardRank = allPlayers.indexOf(p) + 1;
              return (
                <div
                  key={p.id}
                  onClick={() => onAddTarget(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 4px', borderRadius: 4,
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
                >
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--text-tertiary)', width: 20, textAlign: 'center',
                  }}>
                    {boardRank}
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: 'var(--text-secondary)', flex: 1,
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600, fontSize: 9,
                    color: posColor.text, background: posColor.bg,
                    padding: '1px 4px', borderRadius: 2,
                  }}>
                    {p.position}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    color: 'var(--accent-text)',
                  }}>
                    + add
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DraftRoom = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [activeLeagueId, setActiveLeagueId] = useState(null);
  const [mode, setMode] = useState('plan');
  const [plans, setPlans] = useState({}); // { "1.05": [playerId, playerId, ...], "1.11": [...] }
  const [livePicks, setLivePicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveSearch, setLiveSearch] = useState('');

  // Load players, leagues, and board order
  useEffect(() => {
    const load = async () => {
      try {
        const [playerData, leagueData, boardData] = await Promise.all([
          getPlayers(),
          user ? fetchMySleeperLeagues().catch(() => ({ leagues: [] })) : { leagues: [] },
          user ? fetchMyBoards().catch(() => ({ boards: [] })) : { boards: [] },
        ]);

        // Order players by the user's board (1QB by default, match active league format)
        const boards = boardData.boards || boardData || [];
        const lg = leagueData.leagues || [];
        const savedLeague = localStorage.getItem('drs_active_league');
        const activeLg = lg.find(l => l.league_id === savedLeague) || lg[0];
        const isSF = activeLg?.format === 'SF';
        const board = boards.find(b => isSF ? (b.format === 'SF' || b.format === 'superflex') : (b.format === '1QB' || b.format === 'oneQB'))
          || boards[0];

        let orderedPlayers;
        if (board?.player_ids?.length > 0) {
          // Build lookup and order by board position
          const playerMap = {};
          for (const p of playerData) playerMap[String(p.id)] = p;
          const boardOrdered = board.player_ids.map(id => playerMap[String(id)]).filter(Boolean);
          // Add any players not on the board at the end
          const boardIdSet = new Set(board.player_ids.map(String));
          const remaining = playerData.filter(p => !boardIdSet.has(String(p.id)));
          orderedPlayers = [...boardOrdered, ...remaining];
        } else {
          // Fallback: order by ADP
          orderedPlayers = [...playerData].sort((a, b) =>
            (a.dynastyADP?.oneQB ?? 999) - (b.dynastyADP?.oneQB ?? 999)
          );
        }

        setPlayers(orderedPlayers);
        setLeagues(lg);
        if (lg.length > 0) {
          setActiveLeagueId(activeLg?.league_id || lg[0].league_id);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user]);

  // Load saved plans from API when league changes
  useEffect(() => {
    if (!activeLeagueId || !user) return;
    const load = async () => {
      try {
        const data = await fetchDraftPlan(activeLeagueId);
        setPlans(data.plans || {});
        setLivePicks(data.live_picks || []);
      } catch { /* ignore */ }
    };
    load();
  }, [activeLeagueId, user]);

  // Auto-save plans and live picks to API (debounced)
  useEffect(() => {
    if (!activeLeagueId || !user) return;
    debouncedSave(activeLeagueId, plans, livePicks);
  }, [plans, livePicks, activeLeagueId, user]);

  const activeLeague = leagues.find(l => l.league_id === activeLeagueId);
  const totalTeams = activeLeague?.total_rosters || 12;
  const picks = useMemo(() => {
    if (!activeLeague) return [];
    const dp = Array.isArray(activeLeague.draft_picks)
      ? activeLeague.draft_picks
      : JSON.parse(activeLeague.draft_picks || '[]');
    return dp.map(p => ({
      ...p,
      label: p.slot ? `${p.round}.${String(p.slot).padStart(2, '0')}` : `Rd ${p.round}`,
      overall: p.slot ? (p.round - 1) * totalTeams + p.slot : null,
    }));
  }, [activeLeague, totalTeams]);

  const takenPlayerIds = useMemo(() =>
    new Set(livePicks.map(p => String(p.playerId))),
  [livePicks]);

  // Plan handlers
  const addTarget = useCallback((pickLabel, playerId) => {
    setPlans(prev => ({
      ...prev,
      [pickLabel]: [...(prev[pickLabel] || []), String(playerId)],
    }));
  }, []);

  const removeTarget = useCallback((pickLabel, index) => {
    setPlans(prev => ({
      ...prev,
      [pickLabel]: (prev[pickLabel] || []).filter((_, i) => i !== index),
    }));
  }, []);

  const moveTarget = useCallback((pickLabel, index, direction) => {
    setPlans(prev => {
      const list = [...(prev[pickLabel] || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= list.length) return prev;
      [list[index], list[newIndex]] = [list[newIndex], list[index]];
      return { ...prev, [pickLabel]: list };
    });
  }, []);

  // Live handlers
  const addLivePick = (playerId) => {
    setLivePicks(prev => [...prev, {
      pickNumber: prev.length + 1,
      playerId: String(playerId),
    }]);
    setLiveSearch('');
  };

  const undoLastPick = () => setLivePicks(prev => prev.slice(0, -1));
  const resetLive = () => { if (window.confirm('Reset all picks?')) setLivePicks([]); };

  const currentPick = livePicks.length + 1;
  const currentRound = Math.ceil(currentPick / totalTeams);
  const currentSlot = currentPick - (currentRound - 1) * totalTeams;
  const isMyPick = picks.some(p => p.overall === currentPick);

  // Live recommendation from plans
  const recommendation = useMemo(() => {
    if (!isMyPick) return null;
    const myPick = picks.find(p => p.overall === currentPick);
    if (!myPick) return null;
    const targets = plans[myPick.label] || [];
    for (const tid of targets) {
      if (!takenPlayerIds.has(String(tid))) {
        return players.find(p => String(p.id) === String(tid));
      }
    }
    return null;
  }, [isMyPick, picks, currentPick, plans, takenPlayerIds, players]);

  // Available players for live search
  const liveSearchResults = useMemo(() => {
    if (!liveSearch.trim()) return players.filter(p => !takenPlayerIds.has(String(p.id))).slice(0, 15);
    const q = liveSearch.toLowerCase();
    return players
      .filter(p => !takenPlayerIds.has(String(p.id)) && p.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [players, takenPlayerIds, liveSearch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 22, letterSpacing: 1,
          textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0,
        }}>
          Draft Room
        </h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {['plan', 'live'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 1,
                textTransform: 'uppercase', padding: '6px 16px',
                border: '1px solid',
                borderColor: mode === m ? (m === 'live' ? 'var(--danger)' : 'var(--warning)') : 'var(--border-primary)',
                borderRadius: 4,
                background: mode === m ? (m === 'live' ? 'rgba(239,68,68,0.1)' : 'var(--warning-light)') : 'transparent',
                color: mode === m ? (m === 'live' ? 'var(--danger)' : 'var(--warning)') : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {m === 'plan' ? 'Plan' : '● Live'}
            </button>
          ))}
        </div>
      </div>

      {/* League selector */}
      {leagues.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {leagues.map(l => (
            <button
              key={l.league_id}
              onClick={() => setActiveLeagueId(l.league_id)}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '4px 10px', borderRadius: 4,
                border: `1px solid ${l.league_id === activeLeagueId ? 'var(--accent)' : 'var(--border-primary)'}`,
                background: l.league_id === activeLeagueId ? 'var(--accent-light)' : 'transparent',
                color: l.league_id === activeLeagueId ? 'var(--accent-text)' : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {l.league_name}
            </button>
          ))}
        </div>
      )}

      {/* ══ PLAN MODE ══ */}
      {mode === 'plan' && (
        <div>
          {picks.length === 0 ? (
            <div style={{
              padding: 30, textAlign: 'center',
              background: 'var(--bg-secondary)', borderRadius: 10,
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: 'var(--text-tertiary)',
            }}>
              {user ? 'Sync a Sleeper league to see your picks.' : 'Sign in and sync a Sleeper league to plan your draft.'}
            </div>
          ) : (
            <>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: 'var(--text-tertiary)', margin: '0 0 16px',
              }}>
                For each pick, add players in priority order. Your top available choice will be recommended during the live draft.
              </p>
              {picks.map(pick => (
                <PickCard
                  key={pick.label}
                  pickLabel={pick.label}
                  pickOverall={pick.overall}
                  totalTeams={totalTeams}
                  targets={plans[pick.label] || []}
                  allPlayers={players}
                  takenPlayerIds={takenPlayerIds}
                  onAddTarget={(playerId) => addTarget(pick.label, playerId)}
                  onRemoveTarget={(index) => removeTarget(pick.label, index)}
                  onMoveTarget={(index, dir) => moveTarget(pick.label, index, dir)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ══ LIVE MODE ══ */}
      {mode === 'live' && (
        <div>
          {/* Current pick banner */}
          <div style={{
            background: isMyPick ? 'var(--warning-light)' : 'var(--bg-secondary)',
            border: `2px solid ${isMyPick ? 'var(--warning)' : 'var(--border-primary)'}`,
            borderRadius: 10, padding: 20, marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              color: 'var(--text-tertiary)',
            }}>
              PICK {currentRound}.{String(currentSlot).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 28, letterSpacing: 2,
              color: isMyPick ? 'var(--warning)' : 'var(--text-primary)',
              textTransform: 'uppercase',
            }}>
              {isMyPick ? '★ YOUR PICK ★' : 'On the Clock'}
            </div>
            {recommendation && (
              <div style={{
                marginTop: 10, padding: '10px 20px',
                background: 'var(--success-light)', borderRadius: 8,
                border: '1px solid var(--success)',
                display: 'inline-block',
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: 'var(--success)', textTransform: 'uppercase', marginBottom: 2,
                }}>
                  Your Plan Says
                </div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700, fontSize: 20,
                  color: 'var(--success)',
                }}>
                  {recommendation.name} ({recommendation.position})
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: 'var(--text-tertiary)',
            }}>
              {livePicks.length} picks made
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={undoLastPick} disabled={livePicks.length === 0} style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '4px 10px', borderRadius: 4,
                border: '1px solid var(--border-primary)',
                background: 'transparent', color: 'var(--text-tertiary)',
                cursor: livePicks.length === 0 ? 'default' : 'pointer',
                opacity: livePicks.length === 0 ? 0.4 : 1,
              }}>
                Undo
              </button>
              <button onClick={resetLive} style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '4px 10px', borderRadius: 4,
                border: '1px solid var(--danger)',
                background: 'transparent', color: 'var(--danger)',
                cursor: 'pointer',
              }}>
                Reset
              </button>
            </div>
          </div>

          {/* Search + Best Available */}
          <input
            value={liveSearch}
            onChange={e => setLiveSearch(e.target.value)}
            placeholder="Search players or tap to mark as picked..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              outline: 'none', boxSizing: 'border-box', marginBottom: 8,
            }}
          />

          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 8,
            padding: 4,
          }}>
            {liveSearchResults.map((p, i) => {
              const posColor = positionColors[p.position] || positionColors.WR;
              const boardRank = players.indexOf(p) + 1;
              return (
                <div
                  key={p.id}
                  onClick={() => addLivePick(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 6,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)',
                    width: 24, textAlign: 'center', flexShrink: 0,
                  }}>
                    {boardRank}
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                    color: 'var(--text-primary)', flex: 1,
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600, fontSize: 10,
                    color: posColor.text, background: posColor.bg,
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {p.position}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--text-tertiary)',
                  }}>
                    ADP #{p.dynastyADP?.oneQB || '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pick log */}
          {livePicks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 1,
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                margin: '0 0 6px',
              }}>
                Draft Log
              </h4>
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: 8, padding: 4,
              }}>
                {livePicks.map((pick, i) => {
                  const p = players.find(pl => String(pl.id) === String(pick.playerId));
                  const round = Math.ceil(pick.pickNumber / totalTeams);
                  const slot = pick.pickNumber - (round - 1) * totalTeams;
                  const wasMyPick = picks.some(up => up.overall === pick.pickNumber);
                  const posColor = positionColors[p?.position] || positionColors.WR;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 10px', borderRadius: 4,
                      background: wasMyPick ? 'var(--warning-light)' : 'transparent',
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        color: 'var(--text-tertiary)', width: 36,
                      }}>
                        {round}.{String(slot).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                        color: 'var(--text-primary)', flex: 1,
                      }}>
                        {p?.name || 'Unknown'}
                      </span>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600, fontSize: 10,
                        color: posColor.text, background: posColor.bg,
                        padding: '1px 5px', borderRadius: 3,
                      }}>
                        {p?.position}
                      </span>
                      {wasMyPick && <span style={{ color: 'var(--warning)', fontSize: 12 }}>★</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No user */}
      {!user && picks.length === 0 && (
        <div style={{
          padding: 30, textAlign: 'center',
          background: 'var(--bg-secondary)', borderRadius: 10,
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: 'var(--text-tertiary)',
        }}>
          Sign in and sync a Sleeper league to use the Draft Room.
        </div>
      )}
    </div>
  );
};

export default DraftRoom;
