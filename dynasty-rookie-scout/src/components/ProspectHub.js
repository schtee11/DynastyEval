import React, { useState, useMemo, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PlayerListView from './PlayerListView';
import PlayerHeroCard from './PlayerHeroCard';
import VerticalFeed from './VerticalFeed';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
import { isUsingLiveData } from '../services/dataService';
import { sortPlayers, filterPlayers, getTierForPlayer } from '../utils/helpers';

const SkeletonCard = () => (
  <div style={{
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--border-primary)',
  }}>
    <div className="skeleton-shimmer" style={{ height: 3 }} />
    <div style={{ padding: '14px 14px 12px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div className="skeleton-shimmer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton-shimmer" style={{ height: 10, width: '50%', borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton-shimmer" style={{ height: 20, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div className="skeleton-shimmer" style={{ height: 16, width: 60, borderRadius: 10 }} />
        <div className="skeleton-shimmer" style={{ height: 16, width: 50, borderRadius: 10 }} />
      </div>
      <div className="skeleton-shimmer" style={{ height: 6, borderRadius: 3, marginBottom: 6 }} />
      <div className="skeleton-shimmer" style={{ height: 6, borderRadius: 3, marginBottom: 6 }} />
      <div className="skeleton-shimmer" style={{ height: 6, borderRadius: 3 }} />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div style={{ padding: '20px 0' }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, marginBottom: 24,
    }}>
      <div className="loading-spinner" />
      <span style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
        color: 'var(--text-secondary)',
      }}>
        Loading prospects...
      </span>
    </div>
    <div className="prospect-card-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 12,
    }}>
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </div>
);

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
};

const ProspectHub = ({ players, loading, error, studiedPlayers, toggleStudied, onSelectPlayer, onCompare }) => {
  const [viewMode, setViewMode] = useState('cards');
  const [filters, setFilters] = useState({
    position: 'ALL',
    draftDay: '',
    hideInjured: false,
    breakoutMax: null,
    nameSearch: '',
  });
  const [sortBy, setSortBy] = useState('rank');
  const [perspective, setPerspective] = useState('overall');
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, 'oneQB', perspective), [filtered, sortBy, perspective]);

  // Group by tier for desktop display
  const tiers = useMemo(() => {
    const groups = {};
    for (const p of sorted) {
      const tier = getTierForPlayer(p);
      if (!groups[tier]) groups[tier] = [];
      groups[tier].push(p);
    }
    return groups;
  }, [sorted]);

  const tierOrder = ['Elite', 'Day 1', 'Day 2', 'Day 3', 'Undrafted / TBD'];
  const showTierGroups = sortBy === 'rank' || sortBy === 'draftCapital';

  const hasActiveFilters = filters.position !== 'ALL' || filters.draftDay || filters.hideInjured || filters.breakoutMax || filters.nameSearch;

  // ── Mobile: TikTok-style vertical feed ──
  if (isMobile) {
    if (loading) {
      return (
        <div style={{
          height: 'calc(100dvh - 56px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12,
        }}>
          <div className="loading-spinner" />
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>Loading prospects...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          height: 'calc(100dvh - 56px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, padding: 24,
        }}>
          <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700 }}>Failed to load</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{error}</div>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        {/* Filter toggle button (floating) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            position: 'fixed',
            top: 64,
            left: 12,
            zIndex: 60,
            padding: '6px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-primary)',
            background: hasActiveFilters ? 'var(--accent)' : 'var(--bg-header)',
            color: hasActiveFilters ? '#fff' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
          </svg>
          Filter
          {hasActiveFilters && <span style={{ marginLeft: 2 }}>({sorted.length})</span>}
        </button>

        {/* Filter bottom sheet overlay */}
        {showFilters && (
          <>
            <div
              onClick={() => setShowFilters(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                zIndex: 70,
              }}
            />
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 80,
              background: 'var(--bg-primary)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 32px',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            }}>
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'var(--border-primary)',
                margin: '0 auto 16px',
              }} />
              <SearchInput
                value={filters.nameSearch}
                onChange={(v) => setFilters(f => ({ ...f, nameSearch: v }))}
              />
              <div style={{ marginTop: 12 }}>
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  perspective={perspective}
                  setPerspective={setPerspective}
                />
              </div>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Show {sorted.length} prospect{sorted.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {/* Vertical swipe feed */}
        {sorted.length > 0 ? (
          <VerticalFeed>
            {sorted.map((player) => (
              <PlayerHeroCard
                key={player.id}
                player={player}
                allPlayers={players}
                onViewProfile={onSelectPlayer}
                onDiscuss={() => {/* Sprint 3 */}}
                isStudied={studiedPlayers.has(player.id)}
              />
            ))}
          </VerticalFeed>
        ) : (
          <div style={{
            height: 'calc(100dvh - 56px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif",
          }}>
            No prospects match your filters
          </div>
        )}
      </div>
    );
  }

  // ── Desktop: Original grid/list layout ──
  const renderCard = (player, index) => (
    <div key={player.id} className="card-animate" style={{ animationDelay: `${Math.min(index * 40, 600)}ms` }}>
      <PlayerCard
        player={player}
        perspective={perspective}
        onClick={() => onSelectPlayer(player.id)}
        allPlayers={players}
        isStudied={studiedPlayers.has(player.id)}
      />
    </div>
  );

  return (
    <div className="hub-root" style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        perspective={perspective}
        setPerspective={setPerspective}
      />

      {/* Search + count + view toggle */}
      <div className="hub-toolbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, gap: 16, flexWrap: 'wrap',
      }}>
        <SearchInput
          value={filters.nameSearch}
          onChange={(v) => setFilters(f => ({ ...f, nameSearch: v }))}
        />
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center',
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>{sorted.length}</strong> prospect{sorted.length !== 1 ? 's' : ''}
          {isUsingLiveData() && (
            <span style={{
              background: 'var(--success-light)', color: 'var(--success)',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              fontSize: 10, fontWeight: 600,
            }}>LIVE</span>
          )}
          {studiedPlayers.size > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              ({studiedPlayers.size} studied)
            </span>
          )}
        </span>
        <div className="view-toggle-desktop" style={{
          display: 'flex', gap: 0,
          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12,
        }}>
          {['cards', 'list'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 14px',
                border: '1px solid var(--border-primary)',
                borderLeft: mode === 'list' ? 'none' : undefined,
                borderRadius: mode === 'cards' ? 'var(--radius-sm) 0 0 var(--radius-sm)' : '0 var(--radius-sm) var(--radius-sm) 0',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-tertiary)',
                cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
              }}
            >{mode === 'cards' ? 'Cards' : 'List'}</button>
          ))}
        </div>
      </div>

      {loading && <LoadingSkeleton />}
      {error && (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Inter', sans-serif" }}>
          <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Failed to load prospects</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{
            fontWeight: 600, fontSize: 13, padding: '8px 20px',
            border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-light)', color: 'var(--accent-text)', cursor: 'pointer',
          }}>Reload</button>
        </div>
      )}

      {!loading && viewMode === 'cards' && sorted.length > 0 && (
        showTierGroups ? (
          tierOrder.filter(t => tiers[t]).map(tier => {
            let globalIdx = 0;
            for (const t of tierOrder) {
              if (t === tier) break;
              globalIdx += (tiers[t]?.length || 0);
            }
            return (
              <div key={tier} style={{ marginBottom: 24 }}>
                <div className="card-animate" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 12, paddingBottom: 8,
                  borderBottom: '2px solid var(--border-primary)',
                  animationDelay: `${Math.min(globalIdx * 40, 600)}ms`,
                }}>
                  <h2 style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                    fontSize: 18, color: 'var(--text-primary)', margin: 0,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{tier}</h2>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                    color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)',
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  }}>{tiers[tier].length}</span>
                </div>
                <div className="prospect-card-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 12,
                }}>
                  {tiers[tier].map((player, i) => renderCard(player, globalIdx + i))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="prospect-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12,
          }}>
            {sorted.map((player, i) => renderCard(player, i))}
          </div>
        )
      )}

      {!loading && viewMode === 'list' && sorted.length > 0 && (
        <PlayerListView
          players={sorted}
          allPlayers={players}
          perspective={perspective}
          onPlayerClick={(player) => onSelectPlayer(player.id)}
          showTiers={showTierGroups}
          studiedPlayers={studiedPlayers}
        />
      )}

      {!loading && sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12 }}>No prospects match your filters</div>
          {filters.nameSearch && (
            <button onClick={() => setFilters(f => ({ ...f, nameSearch: '' }))} style={{
              fontWeight: 600, fontSize: 12, padding: '6px 14px',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
              background: 'transparent', color: 'var(--accent-text)', cursor: 'pointer',
            }}>Clear search</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProspectHub;
