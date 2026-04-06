import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  lookupSleeperUser,
  fetchSleeperLeagues,
  syncSleeperLeague,
  fetchMySleeperLeagues,
  unlinkSleeperLeague,
} from '../services/apiClient';

const SleeperIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" />
    <path d="M12 2v10l4.24 4.24" />
  </svg>
);

/**
 * Sleeper league sync flow.
 * Steps: enter username → pick league → synced (shows picks).
 */
const SleeperSync = ({ onSynced }) => {
  const { user: authUser } = useAuth();

  // Synced leagues
  const [syncedLeagues, setSyncedLeagues] = useState([]);
  const [loadingSynced, setLoadingSynced] = useState(true);
  const [activeLeagueId, setActiveLeagueId] = useState(() => {
    try { return localStorage.getItem('drs_active_league') || null; } catch { return null; }
  });

  // Link flow state
  const [step, setStep] = useState('idle'); // idle | username | leagues | syncing
  const [username, setUsername] = useState('');
  const [sleeperUser, setSleeperUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const notifyParent = (league) => {
    if (!onSynced || !league) return;
    const picks = Array.isArray(league.draft_picks)
      ? league.draft_picks
      : JSON.parse(league.draft_picks || '[]');
    onSynced({
      format: league.format,
      draft_picks: picks,
      league_name: league.league_name,
      league_id: league.league_id,
      total_rosters: league.total_rosters || 12,
    });
  };

  const selectActiveLeague = (leagueId) => {
    setActiveLeagueId(leagueId);
    try { localStorage.setItem('drs_active_league', leagueId); } catch {}
    const league = syncedLeagues.find(l => l.league_id === leagueId);
    notifyParent(league);
  };

  // Load already-synced leagues and notify parent with active league
  useEffect(() => {
    const load = async () => {
      try {
        const { leagues: data } = await fetchMySleeperLeagues();
        setSyncedLeagues(data || []);
        if (data && data.length > 0) {
          // Use saved active league, or default to first
          const savedId = activeLeagueId;
          const active = data.find(l => l.league_id === savedId) || data[0];
          setActiveLeagueId(active.league_id);
          try { localStorage.setItem('drs_active_league', active.league_id); } catch {}
          notifyParent(active);
        }
      } catch { /* ignore */ }
      finally { setLoadingSynced(false); }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLookup = async () => {
    if (!username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const user = await lookupSleeperUser(username.trim());
      setSleeperUser(user);
      // Fetch their dynasty leagues
      const { leagues: found } = await fetchSleeperLeagues(user.sleeper_user_id);
      setLeagues(found);
      setStep('leagues');
    } catch (err) {
      setError(err.message || 'User not found on Sleeper');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (league) => {
    setStep('syncing');
    setError(null);
    try {
      const result = await syncSleeperLeague({
        sleeper_user_id: sleeperUser.sleeper_user_id,
        sleeper_username: sleeperUser.username,
        league_id: league.league_id,
        season: league.season,
      });
      const newLeague = { ...result, league_id: league.league_id, league_name: result.league_name, synced_at: new Date().toISOString() };
      setSyncedLeagues(prev => {
        const filtered = prev.filter(l => l.league_id !== league.league_id);
        return [newLeague, ...filtered];
      });
      setActiveLeagueId(league.league_id);
      try { localStorage.setItem('drs_active_league', league.league_id); } catch {}
      setStep('leagues'); // Stay on league list so user can sync more
      notifyParent(newLeague);
    } catch (err) {
      setError(err.message || 'Sync failed');
      setStep('leagues');
    }
  };

  const handleUnlink = async (leagueId) => {
    try {
      await unlinkSleeperLeague(leagueId);
      const remaining = syncedLeagues.filter(l => l.league_id !== leagueId);
      setSyncedLeagues(remaining);
      // If we unlinked the active league, switch to next or clear
      if (leagueId === activeLeagueId) {
        if (remaining.length > 0) {
          selectActiveLeague(remaining[0].league_id);
        } else {
          setActiveLeagueId(null);
          try { localStorage.removeItem('drs_active_league'); } catch {}
          if (onSynced) onSynced({ format: '1QB', draft_picks: [], league_name: null, total_rosters: 12 });
        }
      }
    } catch { /* ignore */ }
  };

  const reset = () => {
    setStep('idle');
    setUsername('');
    setSleeperUser(null);
    setLeagues([]);
    setError(null);
  };

  if (loadingSynced) return null;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 16,
    }}>
      {/* Header — collapsed: shows active league inline; expanded: shows all */}
      {(() => {
        const activeLeague = syncedLeagues.find(l => l.league_id === activeLeagueId);
        const activePicks = activeLeague ? (Array.isArray(activeLeague.draft_picks) ? activeLeague.draft_picks : JSON.parse(activeLeague.draft_picks || '[]')) : [];
        const activeByRound = {};
        for (const p of activePicks) { activeByRound[p.round] = (activeByRound[p.round] || 0) + 1; }
        const activePickLabel = Object.entries(activeByRound).sort(([a],[b]) => a - b).map(([rd, cnt]) => `${cnt}×Rd${rd}`).join(', ');

        return (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: expanded || step !== 'idle' ? 12 : 0,
            }}>
              {/* Left: icon + active league or label */}
              <div
                onClick={() => syncedLeagues.length > 0 && setExpanded(!expanded)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: syncedLeagues.length > 0 ? 'pointer' : 'default',
                  flex: 1, minWidth: 0,
                }}
              >
                <SleeperIcon />
                {activeLeague ? (
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>
                      {activeLeague.league_name}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      color: 'var(--text-tertiary)', marginLeft: 8,
                    }}>
                      {activeLeague.format === 'SF' ? 'SF' : '1QB'}
                      {activePickLabel ? ` · ${activePickLabel}` : ''}
                    </span>
                    {syncedLeagues.length > 1 && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: 'var(--text-tertiary)', marginLeft: 6,
                      }}>
                        {expanded ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}>
                    Sleeper Sync
                  </span>
                )}
              </div>

              {/* Right: add league button */}
              {step === 'idle' && (
                <button
                  onClick={async () => {
                    // If sleeper_username is saved in profile, skip straight to league selection
                    const savedUsername = authUser?.sleeper_username;
                    if (savedUsername) {
                      setLoading(true);
                      setError(null);
                      try {
                        const slUser = await lookupSleeperUser(savedUsername);
                        setSleeperUser(slUser);
                        setUsername(savedUsername);
                        const { leagues: found } = await fetchSleeperLeagues(slUser.sleeper_user_id);
                        setLeagues(found);
                        setStep('leagues');
                      } catch (err) {
                        setError(err.message || 'Failed to look up saved Sleeper username');
                        setStep('username');
                      } finally {
                        setLoading(false);
                      }
                    } else {
                      setStep('username');
                    }
                  }}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
                    textTransform: 'uppercase', padding: '5px 12px',
                    border: '1px solid var(--accent)', borderRadius: 4,
                    background: 'transparent', color: 'var(--accent-text)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {syncedLeagues.length > 0 ? '+ Add' : 'Link Sleeper'}
                </button>
              )}
            </div>

            {/* Expanded league list */}
            {expanded && syncedLeagues.map(league => {
              const isActive = league.league_id === activeLeagueId;
              const picks = Array.isArray(league.draft_picks) ? league.draft_picks : JSON.parse(league.draft_picks || '[]');
              const byRound = {};
              for (const p of picks) { byRound[p.round] = (byRound[p.round] || 0) + 1; }
              const pickLabel = Object.entries(byRound).sort(([a],[b]) => a - b).map(([rd, cnt]) => `${cnt}×Rd${rd}`).join(', ');

              return (
                <div
                  key={league.league_id}
                  onClick={() => { selectActiveLeague(league.league_id); setExpanded(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: isActive ? 'var(--warning-light)' : 'var(--bg-card)',
                    borderRadius: 6, marginBottom: 4,
                    border: `1px solid ${isActive ? 'var(--warning)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: isActive ? 'var(--warning)' : 'var(--border-primary)',
                    }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {league.league_name}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {league.format === 'SF' ? 'SF' : '1QB'}{pickLabel ? ` · ${pickLabel}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnlink(league.league_id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Unlink
                  </button>
                </div>
              );
            })}
          </>
        );
      })()}

      {/* Username entry */}
      {step === 'username' && (
        <div>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="Sleeper username"
              autoFocus
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={handleLookup}
              disabled={loading || !username.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                textTransform: 'uppercase',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !username.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Looking up...' : 'Find'}
            </button>
            <button
              onClick={reset}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', fontSize: 18, padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: 8, fontSize: 12, color: 'var(--danger)',
              fontFamily: "'Inter', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* League selection */}
      {step === 'leagues' && (
        <div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, color: 'var(--text-tertiary)',
            marginBottom: 8,
          }}>
            Found {leagues.length} dynasty league{leagues.length !== 1 ? 's' : ''} for <strong>{sleeperUser?.username}</strong>
          </div>
          {leagues.length === 0 && (
            <div style={{
              padding: 16, textAlign: 'center',
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: 'var(--text-tertiary)',
            }}>
              No dynasty leagues found for 2025. Try a different username.
            </div>
          )}
          {leagues.map(l => {
            const alreadySynced = syncedLeagues.some(s => s.league_id === l.league_id);
            return (
              <button
                key={l.league_id}
                onClick={() => !alreadySynced && handleSync(l)}
                disabled={alreadySynced}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  background: alreadySynced ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                  borderRadius: 6,
                  marginBottom: 4,
                  border: '1px solid var(--border-subtle)',
                  cursor: alreadySynced ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: alreadySynced ? 0.6 : 1,
                }}
              >
                <div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13, fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {l.name}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, color: 'var(--text-tertiary)',
                  }}>
                    {l.format === 'SF' ? 'Superflex' : '1QB'} · {l.total_rosters} teams
                  </div>
                </div>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: alreadySynced ? 'var(--success)' : 'var(--accent-text)',
                }}>
                  {alreadySynced ? 'Linked' : 'Sync →'}
                </span>
              </button>
            );
          })}
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
          {error && (
            <div style={{
              marginTop: 8, fontSize: 12, color: 'var(--danger)',
              fontFamily: "'Inter', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Syncing state */}
      {step === 'syncing' && (
        <div style={{
          padding: 20, textAlign: 'center',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: 'var(--text-tertiary)',
        }}>
          <div className="loading-spinner" style={{ margin: '0 auto 8px' }} />
          Syncing league data...
        </div>
      )}
    </div>
  );
};

export default SleeperSync;
