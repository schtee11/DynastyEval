import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignupGate from './SignupGate';
import PlayerListItem from './PlayerListItem';
import DesktopDetailPanel from './DesktopDetailPanel';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
import { sortPlayers, filterPlayers } from '../utils/helpers';
import { isUsingLiveData } from '../services/dataService';

/**
 * Desktop layout: scrollable player list on the left,
 * TikTok-style scroll-snap detail feed on the right.
 * Arrow keys navigate between players.
 */
const FREE_PREVIEW_LIMIT = 5;

const DesktopSplitView = ({ players, loading, error, studiedPlayers, onSelectPlayer, onCompare }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [filters, setFilters] = useState({
    position: 'ALL',
    draftDay: '',
    hideInjured: false,
    breakoutMax: null,
    nameSearch: '',
  });
  const [sortBy, setSortBy] = useState('rank');
  const [perspective, setPerspective] = useState('overall');
  const rightPanelRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, 'oneQB', perspective), [filtered, sortBy, perspective]);

  // Current index in the sorted list
  const selectedIndex = useMemo(() => {
    if (!selectedPlayerId) return 0;
    const idx = sorted.findIndex(p => p.id === selectedPlayerId);
    return idx >= 0 ? idx : 0;
  }, [sorted, selectedPlayerId]);

  const selectedPlayer = sorted[selectedIndex] || null;
  const showGate = !user && selectedIndex >= FREE_PREVIEW_LIMIT;

  // Navigate to a player by index
  const goToIndex = useCallback((index) => {
    if (index < 0 || index >= sorted.length) return;
    const player = sorted[index];
    setSelectedPlayerId(player.id);

    // Scroll right panel to exact card position (avoids scrollIntoView fighting scroll-snap)
    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
      const cardHeight = rightPanel.clientHeight;
      rightPanel.scrollTo({ top: index * cardHeight, behavior: 'smooth' });
    }

    // Scroll left list to keep selected visible
    const listEl = listRef.current;
    if (listEl) {
      const row = listEl.querySelector(`[data-list-id="${player.id}"]`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [sorted]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToIndex(selectedIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToIndex(selectedIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, goToIndex]);

  // Sync right panel scroll-snap with selected player
  useEffect(() => {
    const rightPanel = rightPanelRef.current;
    if (!rightPanel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Number(entry.target.dataset.playerIndex);
            if (!isNaN(idx) && sorted[idx]) {
              setSelectedPlayerId(sorted[idx].id);
              // Scroll left list to match
              const listEl = listRef.current;
              if (listEl) {
                const row = listEl.querySelector(`[data-list-id="${sorted[idx].id}"]`);
                if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }
        }
      },
      { root: rightPanel, threshold: 0.5 }
    );

    const cards = rightPanel.querySelectorAll('[data-player-index]');
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [sorted]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 56px)', gap: 12,
      }}>
        <div className="loading-spinner" />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Loading prospects...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 56px)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 700 }}>Failed to load prospects</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 56px)',
      overflow: 'hidden',
    }}>
      {/* ── Left Panel: Player List ── */}
      <div style={{
        width: 420,
        minWidth: 360,
        maxWidth: 480,
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
      }}>
        {/* Filters */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
        }}>
          <SearchInput
            value={filters.nameSearch}
            onChange={(v) => setFilters(f => ({ ...f, nameSearch: v }))}
          />
          <div style={{ marginTop: 8 }}>
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              perspective={perspective}
              setPerspective={setPerspective}
            />
          </div>
        </div>

        {/* Count bar + keyboard hint */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-primary)',
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--text-tertiary)',
          }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{sorted.length}</strong> prospects
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isUsingLiveData() && (
              <span style={{
                background: 'var(--success-light)', color: 'var(--success)',
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                fontSize: 9, fontWeight: 700,
              }}>LIVE</span>
            )}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'var(--text-tertiary)', opacity: 0.6,
            }}>
              ↑↓ navigate
            </span>
          </div>
        </div>

        {/* Player list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center',
              color: 'var(--text-tertiary)', fontSize: 13,
              fontFamily: "'Inter', sans-serif",
            }}>
              No prospects match filters
            </div>
          ) : (
            sorted.map((player, i) => (
              <div key={player.id} data-list-id={player.id}>
                <PlayerListItem
                  player={player}
                  allPlayers={players}
                  isSelected={selectedPlayer?.id === player.id}
                  isStudied={studiedPlayers.has(player.id)}
                  onClick={() => goToIndex(i)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Scroll-snap player feed ── */}
      <div
        ref={rightPanelRef}
        style={{
          flex: 1,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          background: 'var(--bg-primary)',
        }}
        className="vertical-feed"
      >
        {sorted.map((player, i) => (
          <div
            key={player.id}
            data-player-index={i}
            style={{
              height: 'calc(100vh - 56px)',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              overflowY: 'auto',
            }}
          >
            <DesktopDetailPanel
              player={player}
              allPlayers={players}
              onViewProfile={(id) => onSelectPlayer(id)}
              onDiscuss={(id) => navigate(`/player/${id}/discuss`)}
              isStudied={studiedPlayers.has(player.id)}
            />
          </div>
        ))}
      </div>

      {/* Signup gate after free preview */}
      {showGate && <SignupGate />}
    </div>
  );
};

export default DesktopSplitView;
