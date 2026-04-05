import React, { useState, useEffect } from 'react';
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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Sleeper league sync flow.
 * Steps: enter username → pick league → synced (shows picks).
 */
const SleeperSync = ({ onSynced }) => {
  // Synced leagues
  const [syncedLeagues, setSyncedLeagues] = useState([]);
  const [loadingSynced, setLoadingSynced] = useState(true);

  // Link flow state
  const [step, setStep] = useState('idle'); // idle | username | leagues | syncing
  const [username, setUsername] = useState('');
  const [sleeperUser, setSleeperUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load already-synced leagues
  useEffect(() => {
    const load = async () => {
      try {
        const { leagues: data } = await fetchMySleeperLeagues();
        setSyncedLeagues(data || []);
      } catch { /* ignore */ }
      finally { setLoadingSynced(false); }
    };
    load();
  }, []);

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
      setSyncedLeagues(prev => {
        const filtered = prev.filter(l => l.league_id !== league.league_id);
        return [{ ...result, league_id: league.league_id, league_name: result.league_name, synced_at: new Date().toISOString() }, ...filtered];
      });
      setStep('idle');
      if (onSynced) onSynced(result);
    } catch (err) {
      setError(err.message || 'Sync failed');
      setStep('leagues');
    }
  };

  const handleUnlink = async (leagueId) => {
    try {
      await unlinkSleeperLeague(leagueId);
      setSyncedLeagues(prev => prev.filter(l => l.league_id !== leagueId));
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
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: syncedLeagues.length > 0 || step !== 'idle' ? 12 : 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 13, letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>
          <SleeperIcon />
          Sleeper Sync
        </div>

        {step === 'idle' && (
          <button
            onClick={() => setStep('username')}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
              textTransform: 'uppercase',
              padding: '5px 12px',
              border: '1px solid var(--accent)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--accent-text)',
              cursor: 'pointer',
            }}
          >
            {syncedLeagues.length > 0 ? '+ Add League' : 'Link Sleeper'}
          </button>
        )}
      </div>

      {/* Synced leagues */}
      {syncedLeagues.map(league => (
        <div key={league.league_id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          borderRadius: 6,
          marginBottom: 6,
          border: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {league.league_name}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: 'var(--text-tertiary)',
              display: 'flex', gap: 8, marginTop: 2,
            }}>
              <span>{league.format === 'SF' ? 'Superflex' : '1QB'}</span>
              {league.draft_picks && (
                <span>
                  {(Array.isArray(league.draft_picks) ? league.draft_picks : JSON.parse(league.draft_picks || '[]')).length} picks
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--success)' }}>
                <CheckIcon /> Synced
              </span>
            </div>
          </div>
          <button
            onClick={() => handleUnlink(league.league_id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              color: 'var(--text-tertiary)',
            }}
          >
            Unlink
          </button>
        </div>
      ))}

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
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              color: 'var(--text-tertiary)',
            }}
          >
            ← Back
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
