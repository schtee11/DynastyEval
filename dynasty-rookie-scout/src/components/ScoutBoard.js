import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import PlayerCard from './PlayerCard';
import PlayerTableView from './PlayerTableView';
import FilterBar from './FilterBar';
import { getPlayers, isUsingLiveData } from '../services/dataService';
import { sortPlayers, filterPlayers } from '../utils/helpers';

const PlayerDetailModal = lazy(() => import('./PlayerDetailModal'));

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

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, 'oneQB', perspective), [filtered, sortBy, perspective]);

  const showTiers = sortBy === 'draftCapital';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = windowWidth >= 1025;
  const isTabletLandscape = windowWidth >= 1025 && windowWidth <= 1400;
  const panelOpen = !!selectedPlayer && isDesktop;
  const panelMargin = panelOpen ? (isTabletLandscape ? 430 : 570) : 0;

  return (
    <div className="scout-board-root" style={{
      padding: '20px 24px 20px 12px',
      maxWidth: 1400,
      margin: '0 auto',
      marginRight: panelMargin,
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
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {sorted.length} prospect{sorted.length !== 1 ? 's' : ''}
          {isUsingLiveData() && (
            <span style={{
              background: 'var(--success-light)',
              color: 'var(--success)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 10,
              fontWeight: 600,
            }}>
              LIVE
            </span>
          )}
        </span>

        {/* View toggle */}
        <div style={{
          display: 'flex',
          gap: 0,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 12,
        }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '5px 14px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
              background: viewMode === 'table' ? 'var(--accent-light)' : 'transparent',
              color: viewMode === 'table' ? 'var(--accent-text)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '5px 14px',
              border: '1px solid var(--border-primary)',
              borderLeft: 'none',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              background: viewMode === 'cards' ? 'var(--accent-light)' : 'transparent',
              color: viewMode === 'cards' ? 'var(--accent-text)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cards
          </button>
        </div>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: 'var(--text-tertiary)',
        }}>
          Loading prospects...
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            Failed to load prospects
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, maxWidth: 500, margin: '0 auto 16px' }}>
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              padding: '8px 20px',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent-text)',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )}

      {!loading && viewMode === 'table' && sorted.length > 0 && (
        <PlayerTableView
          players={sorted}
          perspective={perspective}
          onPlayerClick={setSelectedPlayer}
          showTiers={showTiers}
          compact={panelOpen}
        />
      )}

      {!loading && viewMode === 'cards' && sorted.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
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
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: 'var(--text-tertiary)',
        }}>
          No prospects match your filters
        </div>
      )}

      {selectedPlayer && (
        <Suspense fallback={null}>
          <PlayerDetailModal
            player={selectedPlayer}
            allPlayers={players}
            perspective={perspective}
            onClose={() => setSelectedPlayer(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ScoutBoard;
