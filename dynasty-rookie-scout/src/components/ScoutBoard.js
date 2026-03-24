import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PlayerTableView from './PlayerTableView';
import PlayerDetailModal from './PlayerDetailModal';
import FilterBar from './FilterBar';
import { getPlayers, isUsingLiveData } from '../services/dataService';
import { sortPlayers, filterPlayers } from '../utils/helpers';

const ScoutBoard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('table');
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

  // Show tier dividers only when sorted by draft capital
  const showTiers = sortBy === 'draftCapital';

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;
  const panelOpen = !!selectedPlayer && isDesktop;

  return (
    <div style={{
      padding: '20px 24px 20px 12px',
      marginRight: panelOpen ? 570 : 0,
      transition: 'margin-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
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
        </span>

        {/* View toggle */}
        <div style={{
          display: 'flex',
          gap: 0,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 0.5,
        }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '5px 14px',
              border: '1px solid #2a2d3e',
              borderRadius: '4px 0 0 4px',
              background: viewMode === 'table' ? '#2a2d3e' : 'transparent',
              color: viewMode === 'table' ? '#f1f5f9' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            TABLE
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '5px 14px',
              border: '1px solid #2a2d3e',
              borderLeft: 'none',
              borderRadius: '0 4px 4px 0',
              background: viewMode === 'cards' ? '#2a2d3e' : 'transparent',
              color: viewMode === 'cards' ? '#f1f5f9' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            CARDS
          </button>
        </div>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 18,
          color: '#6b7280',
        }}>
          Loading prospects...
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

      {/* Table View (default) */}
      {!loading && viewMode === 'table' && sorted.length > 0 && (
        <PlayerTableView
          players={sorted}
          perspective={perspective}
          onPlayerClick={setSelectedPlayer}
          showTiers={showTiers}
          compact={panelOpen}
        />
      )}

      {/* Card View (legacy) */}
      {!loading && viewMode === 'cards' && sorted.length > 0 && (
        <div style={{
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
        </div>
      )}

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
