import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerHeroCard from './PlayerHeroCard';
import VerticalFeed from './VerticalFeed';
import DesktopSplitView from './DesktopSplitView';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
import { sortPlayers, filterPlayers } from '../utils/helpers';

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
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    position: 'ALL',
    draftDay: '',
    hideInjured: false,
    nameSearch: '',
  });
  const [sortBy, setSortBy] = useState('adp');
  const [perspective, setPerspective] = useState('overall');
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, 'oneQB', perspective), [filtered, sortBy, perspective]);

  const hasActiveFilters = filters.position !== 'ALL' || filters.draftDay || filters.hideInjured || filters.nameSearch;

  // ── Mobile: TikTok-style vertical feed ──
  if (isMobile) {
    if (loading) {
      return (
        <div style={{
          height: 'calc(100dvh - 48px - 56px)',
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
          height: 'calc(100dvh - 48px - 56px)',
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
            top: 50,
            left: 12,
            zIndex: 'var(--z-overlay)',
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
              className="sheet-overlay"
              onClick={() => setShowFilters(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowFilters(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                zIndex: 'var(--z-overlay)',
              }}
            />
            <div className="sheet-panel" style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 'var(--z-modal)',
              background: 'var(--bg-primary)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 32px',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{
                width: 48, height: 5, borderRadius: 2,
                background: 'var(--text-tertiary)',
                opacity: 0.4,
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
            {sorted.map((player, i) => (
              <PlayerHeroCard
                key={player.id}
                player={player}
                allPlayers={players}
                displayRank={i + 1}
                onViewProfile={onSelectPlayer}
                onDiscuss={(id) => navigate(`/player/${id}/discuss`)}
                isStudied={studiedPlayers.has(player.id)}
              />
            ))}
          </VerticalFeed>
        ) : (
          <div style={{
            height: 'calc(100dvh - 48px - 56px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif",
          }}>
            No prospects match your filters
          </div>
        )}
      </div>
    );
  }

  // ── Desktop/iPad: Split view (list + detail panel) ──
  return (
    <DesktopSplitView
      players={players}
      loading={loading}
      error={error}
      studiedPlayers={studiedPlayers}
      onSelectPlayer={onSelectPlayer}
      onCompare={onCompare}
    />
  );
};

export default ProspectHub;
