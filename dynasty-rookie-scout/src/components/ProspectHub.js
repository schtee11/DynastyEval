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
  const { profile: leagueProfile, setPreset1QB, setPresetSF, isCustom } = useLeagueProfile();
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

        {/* 1QB / SF toggle + custom league settings */}
        <div style={{
          display: 'flex',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'auto',
        }}>
          {['oneQB', 'superflex'].map(lt => (
            <button
              key={lt}
              onClick={() => lt === 'oneQB' ? setPreset1QB() : setPresetSF()}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRight: '1px solid var(--border-primary)',
                background: !isCustom && leagueFormat === lt ? 'var(--accent)' : 'var(--bg-header)',
                color: !isCustom && leagueFormat === lt ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
              }}
            >
              {lt === 'oneQB' ? '1QB' : 'SF'}
            </button>
          ))}
          <button
            onClick={() => setShowLeagueSettings(true)}
            title="Personalize rankings to your league"
            style={{
              padding: '6px 12px',
              border: 'none',
              background: isCustom ? 'var(--accent)' : 'var(--bg-header)',
              color: isCustom ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {isCustom ? 'My League' : 'League'}
          </button>
        </div>
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
