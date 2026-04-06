import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMySleeperLeagues } from '../services/apiClient';
import { getPlayers } from '../services/dataService';
import { positionColors } from '../utils/helpers';

/**
 * DraftRoom — combines Draft Scenario Planner + Draft Night Live Mode.
 *
 * Scenario Planner: Users create if/then rules for their draft picks.
 * Live Mode: Track picks in real-time, see best available, get recommendations.
 */

const STORAGE_KEY = 'drs_draft_scenarios';
const LIVE_STORAGE_KEY = 'drs_draft_live';

const DraftRoom = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [activeLeagueId, setActiveLeagueId] = useState(null);
  const [mode, setMode] = useState('plan'); // 'plan' | 'live'
  const [scenarios, setScenarios] = useState([]);
  const [livePicks, setLivePicks] = useState([]); // [{pickNumber, playerId}]
  const [loading, setLoading] = useState(true);

  // Load players and leagues
  useEffect(() => {
    const load = async () => {
      try {
        const [playerData, leagueData] = await Promise.all([
          getPlayers(),
          user ? fetchMySleeperLeagues().catch(() => ({ leagues: [] })) : { leagues: [] },
        ]);
        setPlayers(playerData);
        const lg = leagueData.leagues || [];
        setLeagues(lg);
        if (lg.length > 0) {
          const saved = localStorage.getItem('drs_active_league');
          setActiveLeagueId(saved && lg.find(l => l.league_id === saved) ? saved : lg[0].league_id);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user]);

  // Load saved scenarios and live picks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setScenarios(JSON.parse(saved));
      const savedLive = localStorage.getItem(LIVE_STORAGE_KEY);
      if (savedLive) setLivePicks(JSON.parse(savedLive));
    } catch { /* ignore */ }
  }, []);

  // Persist scenarios
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios)); } catch {}
  }, [scenarios]);

  // Persist live picks
  useEffect(() => {
    try { localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(livePicks)); } catch {}
  }, [livePicks]);

  const activeLeague = leagues.find(l => l.league_id === activeLeagueId);
  const totalTeams = activeLeague?.total_rosters || 12;
  const picks = useMemo(() => {
    if (!activeLeague) return [];
    const dp = Array.isArray(activeLeague.draft_picks) ? activeLeague.draft_picks : JSON.parse(activeLeague.draft_picks || '[]');
    return dp;
  }, [activeLeague]);

  const playerMap = useMemo(() => {
    const map = {};
    for (const p of players) map[String(p.id)] = p;
    return map;
  }, [players]);

  // Players not yet picked in live mode
  const availablePlayers = useMemo(() => {
    const pickedIds = new Set(livePicks.map(p => String(p.playerId)));
    return players.filter(p => !pickedIds.has(String(p.id)));
  }, [players, livePicks]);

  // ── Scenario Planner ──

  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now(),
      pickRound: picks[0]?.round || 1,
      ifPlayerId: null,
      thenAction: 'take', // 'take' | 'skip'
      elsePlayerId: null,
    }]);
  };

  const updateScenario = (id, updates) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeScenario = (id) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  // ── Live Mode ──

  const addLivePick = (playerId) => {
    setLivePicks(prev => [...prev, {
      pickNumber: prev.length + 1,
      playerId: String(playerId),
      timestamp: Date.now(),
    }]);
  };

  const undoLastPick = () => {
    setLivePicks(prev => prev.slice(0, -1));
  };

  const resetLive = () => {
    if (window.confirm('Reset all live picks?')) setLivePicks([]);
  };

  const currentPick = livePicks.length + 1;
  const currentRound = Math.ceil(currentPick / totalTeams);
  const currentSlot = currentPick - (currentRound - 1) * totalTeams;

  // Check if current pick is the user's
  const isMyPick = picks.some(p => {
    const pickStart = (p.round - 1) * totalTeams + (p.slot || 0);
    return pickStart === currentPick;
  });

  // Get recommendation from scenarios
  const getRecommendation = useCallback(() => {
    if (!isMyPick) return null;
    for (const s of scenarios) {
      if (s.pickRound !== currentRound) continue;
      if (s.ifPlayerId) {
        const isAvailable = availablePlayers.some(p => String(p.id) === String(s.ifPlayerId));
        if (isAvailable && s.thenAction === 'take') return playerMap[String(s.ifPlayerId)];
        if (!isAvailable && s.elsePlayerId) return playerMap[String(s.elsePlayerId)];
      }
    }
    return null;
  }, [isMyPick, scenarios, currentRound, availablePlayers, playerMap]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const recommendation = mode === 'live' ? getRecommendation() : null;

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
                borderColor: mode === m ? 'var(--warning)' : 'var(--border-primary)',
                borderRadius: 4,
                background: mode === m ? 'var(--warning-light)' : 'transparent',
                color: mode === m ? 'var(--warning)' : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {m === 'plan' ? 'Plan' : 'Live'}
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

      {/* Your picks summary */}
      {picks.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Your picks:</span>
          {picks.map((p, i) => (
            <span key={i} style={{
              padding: '2px 8px', borderRadius: 3,
              background: 'var(--warning-light)', color: 'var(--warning)',
              fontWeight: 700,
            }}>
              {p.slot ? `${p.round}.${String(p.slot).padStart(2, '0')}` : `Rd ${p.round}`}
            </span>
          ))}
        </div>
      )}

      {/* ══ PLAN MODE ══ */}
      {mode === 'plan' && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 16, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0,
            }}>
              Draft Scenarios
            </h3>
            <button
              onClick={addScenario}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
                textTransform: 'uppercase', padding: '5px 12px',
                border: 'none', borderRadius: 4,
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              }}
            >
              + Add Rule
            </button>
          </div>

          {scenarios.length === 0 && (
            <div style={{
              padding: 30, textAlign: 'center',
              color: 'var(--text-tertiary)',
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              background: 'var(--bg-secondary)', borderRadius: 8,
            }}>
              No scenarios yet. Add rules like "If Player X is available at my pick, take him."
            </div>
          )}

          {scenarios.map(scenario => (
            <div key={scenario.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 12, marginBottom: 8,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                fontFamily: "'Inter', sans-serif", fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>At Rd</span>
                <select
                  value={scenario.pickRound}
                  onChange={e => updateScenario(scenario.id, { pickRound: Number(e.target.value) })}
                  style={{
                    padding: '4px 8px', borderRadius: 4,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  }}
                >
                  {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <span style={{ color: 'var(--warning)', fontWeight: 700 }}>IF</span>
                <select
                  value={scenario.ifPlayerId || ''}
                  onChange={e => updateScenario(scenario.id, { ifPlayerId: e.target.value || null })}
                  style={{
                    padding: '4px 8px', borderRadius: 4, flex: 1, minWidth: 120,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                  }}
                >
                  <option value="">Select player...</option>
                  {players.slice(0, 50).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                  ))}
                </select>

                <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>is available →</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>TAKE</span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap',
                fontFamily: "'Inter', sans-serif", fontSize: 13,
              }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>ELSE →</span>
                <select
                  value={scenario.elsePlayerId || ''}
                  onChange={e => updateScenario(scenario.id, { elsePlayerId: e.target.value || null })}
                  style={{
                    padding: '4px 8px', borderRadius: 4, flex: 1, minWidth: 120,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                  }}
                >
                  <option value="">Best available</option>
                  {players.slice(0, 50).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                  ))}
                </select>

                <button
                  onClick={() => removeScenario(scenario.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--danger)', fontSize: 16, padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ LIVE MODE ══ */}
      {mode === 'live' && (
        <div>
          {/* Current pick status */}
          <div style={{
            background: isMyPick ? 'var(--warning-light)' : 'var(--bg-secondary)',
            border: `1px solid ${isMyPick ? 'var(--warning)' : 'var(--border-primary)'}`,
            borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
              color: 'var(--text-tertiary)',
            }}>
              Pick {currentRound}.{String(currentSlot).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 24, letterSpacing: 1,
              color: isMyPick ? 'var(--warning)' : 'var(--text-primary)',
              textTransform: 'uppercase',
            }}>
              {isMyPick ? 'YOUR PICK' : 'On the Clock'}
            </div>
            {recommendation && (
              <div style={{
                marginTop: 8, padding: '8px 16px',
                background: 'var(--success-light)', borderRadius: 6,
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                color: 'var(--success)',
              }}>
                Recommendation: {recommendation.name} ({recommendation.position})
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end',
          }}>
            <button
              onClick={undoLastPick}
              disabled={livePicks.length === 0}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '5px 12px', borderRadius: 4,
                border: '1px solid var(--border-primary)',
                background: 'transparent', color: 'var(--text-tertiary)',
                cursor: livePicks.length === 0 ? 'default' : 'pointer',
                opacity: livePicks.length === 0 ? 0.4 : 1,
              }}
            >
              Undo
            </button>
            <button
              onClick={resetLive}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                padding: '5px 12px', borderRadius: 4,
                border: '1px solid var(--danger)', background: 'transparent',
                color: 'var(--danger)', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>

          {/* Pick log */}
          {livePicks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 1,
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                margin: '0 0 8px',
              }}>
                Picks Made
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {livePicks.map((pick, i) => {
                  const p = playerMap[String(pick.playerId)];
                  const round = Math.ceil(pick.pickNumber / totalTeams);
                  const slot = pick.pickNumber - (round - 1) * totalTeams;
                  const wasMyPick = picks.some(up => {
                    const pos = (up.round - 1) * totalTeams + (up.slot || 0);
                    return pos === pick.pickNumber;
                  });
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '4px 8px', borderRadius: 4,
                      background: wasMyPick ? 'var(--warning-light)' : 'var(--bg-card)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    }}>
                      <span style={{ color: 'var(--text-tertiary)', width: 36 }}>
                        {round}.{String(slot).padStart(2, '0')}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p?.name || 'Unknown'}
                      </span>
                      <span style={{ color: (positionColors[p?.position] || {}).text || 'var(--text-tertiary)' }}>
                        {p?.position}
                      </span>
                      {wasMyPick && <span style={{ color: 'var(--warning)', fontWeight: 700 }}>★</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Best available */}
          <h4 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: 1,
            textTransform: 'uppercase', color: 'var(--text-tertiary)',
            margin: '0 0 8px',
          }}>
            Best Available
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {availablePlayers.slice(0, 20).map(p => {
              const posColor = positionColors[p.position] || positionColors.WR;
              return (
                <div
                  key={p.id}
                  onClick={() => addLivePick(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 6,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600, fontSize: 11,
                    color: posColor.text, background: posColor.bg,
                    padding: '1px 6px', borderRadius: 3,
                  }}>
                    {p.position}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--text-tertiary)',
                  }}>
                    ADP #{p.dynastyADP?.oneQB || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No leagues message */}
      {!user && (
        <div style={{
          padding: 30, textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          background: 'var(--bg-secondary)', borderRadius: 8,
        }}>
          Sign in and sync a Sleeper league to use the Draft Room.
        </div>
      )}
    </div>
  );
};

export default DraftRoom;
