import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerHeroCard from './PlayerHeroCard';
import VerticalFeed from './VerticalFeed';
import DesktopSplitView from './DesktopSplitView';
import BottomSheet from './BottomSheet';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
import LeagueProfileSettings from './LeagueProfileSettings';
import { sortPlayers, filterPlayers } from '../utils/helpers';
import { buildPersonalizedRankings } from '../utils/personalizedRank';
import { useLeagueProfile } from '../contexts/LeagueProfileContext';

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
  const [showLeagueSettings, setShowLeagueSettings] = useState(false);
  const isMobile = useIsMobile();

  // League profile drives both the format and any personalized re-ranking.
  const { profile: leagueProfile, isCustom } = useLeagueProfile();
  const leagueFormat = leagueProfile.format;

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const personalizedRankings = useMemo(
    () => buildPersonalizedRankings(filtered, leagueProfile),
    [filtered, leagueProfile]
  );
  const sorted = useMemo(
    () => sortPlayers(filtered, sortBy, leagueFormat, perspective, personalizedRankings),
    [filtered, sortBy, leagueFormat, perspective, personalizedRankings]
  );

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
        {/* Floating controls: Filter + League toggle */}
        <div style={{
          position: 'fixed',
          top: 50,
          left: 12,
          right: 12,
          zIndex: 'var(--z-overlay)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
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
            pointerEvents: 'auto',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
          </svg>
          Filter
          {hasActiveFilters && <span style={{ marginLeft: 2 }}>({sorted.length})</span>}
        </button>

        {/* Rankings chip — compact, with a format badge + truncated label */}
        <button
          onClick={() => setShowLeagueSettings(true)}
          title={isCustom ? (leagueProfile.leagueName || 'My League') : 'Change league / rankings'}
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            maxWidth: 180,
            padding: '4px 4px 4px 4px',
            borderRadius: 20,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-header)',
            color: 'var(--text-secondary)',
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
        >
          <span style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 28,
            height: 22,
            padding: '0 8px',
            borderRadius: 12,
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}>
            {leagueFormat === 'superflex' ? 'SF' : '1QB'}
          </span>
          <span style={{
            minWidth: 0,
            flexShrink: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            fontWeight: 600,
            paddingRight: 2,
          }}>
            {isCustom ? (leagueProfile.leagueName || 'My League') : 'Rankings'}
          </span>
          <span style={{ fontSize: 10, opacity: 0.6, flexShrink: 0, paddingRight: 6 }}>▾</span>
        </button>
        </div>

        <LeagueProfileSettings open={showLeagueSettings} onClose={() => setShowLeagueSettings(false)} />

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
            {sorted.map((player, i) => {
              const personalized = personalizedRankings.get(player.id);
              const displayRank = sortBy === 'adp'
                ? (player.dynastyADP?.[leagueFormat] ?? player.rank?.[leagueFormat])
                : (personalized?.personalizedRank ?? player.rank?.[leagueFormat]);
              return (
                <PlayerHeroCard
                  key={player.id}
                  player={player}
                  allPlayers={players}
                  displayRank={displayRank}
                  rankDelta={sortBy === 'adp' ? 0 : (personalized?.delta ?? 0)}
                  rankReasons={personalized?.reasons ?? []}
                  onViewProfile={onSelectPlayer}
                  onDiscuss={(id) => navigate(`/player/${id}/discuss`)}
                  isStudied={studiedPlayers.has(player.id)}
                />
              );
            })}
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
