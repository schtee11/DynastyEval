import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerHeroCard from './PlayerHeroCard';
import VerticalFeed from './VerticalFeed';
import DesktopSplitView from './DesktopSplitView';
import BottomSheet from './BottomSheet';
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

  // Use league format from Sleeper sync if available, otherwise default to 1QB
  const leagueFormat = useMemo(() => {
    try {
      const saved = localStorage.getItem('drs_league_format');
      if (saved === 'SF') return 'superflex';
    } catch { /* ignore */ }
    return 'oneQB';
  }, []);

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, leagueFormat, perspective), [filtered, sortBy, leagueFormat, perspective]);

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
        <BottomSheet open={showFilters} onClose={() => setShowFilters(false)}>
            <div style={{ padding: '4px 16px 32px' }}>
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
          </BottomSheet>

        {/* Vertical swipe feed */}
        {sorted.length > 0 ? (
          <VerticalFeed players={sorted}>
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
