import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';
import FilterBar from './FilterBar';
import { getPlayers, isUsingLiveData, getDataSourceStatus } from '../services/dataService';
import { sortPlayers, filterPlayers } from '../utils/helpers';

const ScoutBoard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [filters, setFilters] = useState({
    position: 'ALL',
    draftDay: '',
    hideInjured: false,
    breakoutMax: null,
  });
  const [sortBy, setSortBy] = useState('rank');
  const [perspective, setPerspective] = useState('overall');

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlayers();
        setPlayers(data);
      } catch (err) {
        console.error('[ScoutBoard] Failed to load players:', err);
        setError(err.message || 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  const filtered = filterPlayers(players, filters);
  const sorted = sortPlayers(filtered, sortBy, 'oneQB', perspective);

  return (
    <div style={{ padding: '20px 24px' }}>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        perspective={perspective}
        setPerspective={setPerspective}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {sorted.length} prospect{sorted.length !== 1 ? 's' : ''}
          {isUsingLiveData() && (
            <span style={{
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              LIVE — 2026 CLASS
            </span>
          )}
          {!isUsingLiveData() && (
            <span style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              2026 CLASS
            </span>
          )}
          {(() => {
            const status = getDataSourceStatus();
            const cfbd = status.cfbd;
            if (!cfbd) return null;
            const badgeStyle = {
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: 'pointer',
            };
            if (cfbd.ok) {
              return (
                <span onClick={() => setShowDebug(!showDebug)} style={{
                  ...badgeStyle,
                  background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e',
                }}>
                  CFBD {cfbd.matched}/{cfbd.attempted}
                </span>
              );
            }
            return (
              <span onClick={() => setShowDebug(!showDebug)} style={{
                ...badgeStyle,
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
              }}>
                CFBD {cfbd.reason ? '✗' : `0/${cfbd.attempted}`} — TAP FOR DEBUG
              </span>
            );
          })()}
        </span>
      </div>

      {showDebug && (() => {
        const status = getDataSourceStatus();
        const cfbd = status.cfbd || {};
        const debug = cfbd.debug || {};
        return (
          <div style={{
            background: '#1a1d2e',
            border: '1px solid #2a2d3e',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#d1d5db',
            lineHeight: 1.6,
          }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 12 }}>
              CFBD DEBUG INFO
              <span onClick={() => setShowDebug(false)} style={{ float: 'right', cursor: 'pointer', color: '#6b7280' }}>✕</span>
            </div>
            <div>Source: <span style={{ color: '#22c55e' }}>{status.source}</span></div>
            <div>Sleeper: {status.sleeper?.ok ? `✅ ${status.sleeper.count} rookies` : `❌ ${status.sleeper?.reason}`}</div>
            <div>API base: <span style={{ color: '#60a5fa' }}>{debug.apiBase || '?'}</span></div>
            <div>CFBD matched: <span style={{ color: cfbd.matched > 0 ? '#22c55e' : '#ef4444' }}>{cfbd.matched ?? '?'}/{cfbd.attempted ?? '?'}</span></div>
            <div>API rows → pass: {cfbd.apiRows?.passing ?? '?'}, rush: {cfbd.apiRows?.rushing ?? '?'}, rec: {cfbd.apiRows?.receiving ?? '?'}</div>
            <div>Grouped → pass: {debug.groupedCounts?.passing ?? '?'}, rush: {debug.groupedCounts?.rushing ?? '?'}, rec: {debug.groupedCounts?.receiving ?? '?'}</div>
            <div style={{ marginTop: 8, color: '#f59e0b' }}>Sample CFBD row fields:</div>
            <div style={{ wordBreak: 'break-all' }}>{debug.sampleRowFields?.join(', ') || 'none'}</div>
            <div style={{ marginTop: 4, color: '#f59e0b' }}>Sample CFBD row:</div>
            <div style={{ wordBreak: 'break-all', fontSize: 10 }}>{debug.sampleRow || 'none'}</div>
            <div style={{ marginTop: 8, color: '#f59e0b' }}>CFBD grouped names (first 5):</div>
            <div>{debug.cfbdNames?.join(', ') || 'none (0 grouped)'}</div>
            <div style={{ marginTop: 4, color: '#f59e0b' }}>Searched names (first 5):</div>
            <div>{debug.searchedNames?.join(', ') || 'none'}</div>
          </div>
        );
      })()}

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 18,
          color: '#6b7280',
        }}>
          {isUsingLiveData() ? 'Loading live stats from CFBD...' : 'Loading prospects...'}
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#ef4444', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            Failed to load prospects
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16, maxWidth: 500, margin: '0 auto 16px' }}>
            {error}
          </div>
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
      )}

      {!loading && <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {sorted.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            perspective={perspective}
            onClick={setSelectedPlayer}
          />
        ))}
      </div>}

      {!loading && sorted.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 18,
          color: '#6b7280',
        }}>
          No prospects match your filters
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          perspective={perspective}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default ScoutBoard;
