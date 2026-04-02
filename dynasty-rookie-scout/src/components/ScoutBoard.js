import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import PlayerCard from './PlayerCard';
import PlayerListView from './PlayerListView';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
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
    nameSearch: '',
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
  const panelOpen = !!selectedPlayer && isDesktop;

  // CSS Grid split-view: 1fr when no panel, 1fr + panel when open
  const gridColumns = panelOpen ? `1fr var(--panel-width)` : '1fr';

  return (
    <div
      className="scout-board-root"
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        minHeight: 'calc(100vh - var(--header-height))',
        transition: 'grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── LIST AREA (always visible, fills available space) ── */}
      <div className="scout-board-content" style={{ padding: '16px 24px', overflow: 'hidden' }}>
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          perspective={perspective}
          setPerspective={setPerspective}
        />

        {/* Search + count + view toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <SearchInput
            value={filters.nameSearch}
            onChange={(v) => setFilters(f => ({ ...f, nameSearch: v }))}
          />

          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            justifyContent: 'center',
          }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{sorted.length}</strong> prospect{sorted.length !== 1 ? 's' : ''}
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

          <div style={{
            display: 'flex',
            gap: 0,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 12,
          }}>
            {['table', 'cards'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '5px 14px',
                  border: '1px solid var(--border-primary)',
                  borderLeft: mode === 'cards' ? 'none' : undefined,
                  borderRadius: mode === 'table' ? 'var(--radius-sm) 0 0 var(--radius-sm)' : '0 var(--radius-sm) var(--radius-sm) 0',
                  background: viewMode === mode ? 'var(--accent)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {mode === 'table' ? 'List' : 'Cards'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                height: 52,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              Failed to load prospects
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
                padding: '8px 20px', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)',
                color: 'var(--accent-text)', cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'table' && sorted.length > 0 && (
          <PlayerListView
            players={sorted}
            allPlayers={players}
            perspective={perspective}
            onPlayerClick={setSelectedPlayer}
            showTiers={showTiers}
          />
        )}

        {/* Card View */}
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
                allPlayers={players}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12 }}>
              No prospects match your filters
            </div>
            {filters.nameSearch && (
              <button
                onClick={() => setFilters(f => ({ ...f, nameSearch: '' }))}
                style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12,
                  padding: '6px 14px', border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)', background: 'transparent',
                  color: 'var(--accent-text)', cursor: 'pointer',
                }}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL (grid child on desktop, fixed overlay on mobile) ── */}
      {selectedPlayer && (
        <Suspense fallback={null}>
          <PlayerDetailModal
            player={selectedPlayer}
            allPlayers={players}
            perspective={perspective}
            onClose={() => setSelectedPlayer(null)}
            isDesktopPanel={isDesktop}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ScoutBoard;
