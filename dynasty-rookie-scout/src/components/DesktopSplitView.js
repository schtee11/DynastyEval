import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerListItem from './PlayerListItem';
import DesktopDetailPanel from './DesktopDetailPanel';
import FilterBar from './FilterBar';
import SearchInput from './SearchInput';
import { sortPlayers, filterPlayers } from '../utils/helpers';
import { isUsingLiveData } from '../services/dataService';

/**
 * Desktop layout: scrollable player list on the left,
 * detail card on the right for the selected player.
 */
const DesktopSplitView = ({ players, loading, error, studiedPlayers, onSelectPlayer, onCompare }) => {
  const navigate = useNavigate();
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

  const filtered = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const sorted = useMemo(() => sortPlayers(filtered, sortBy, 'oneQB', perspective), [filtered, sortBy, perspective]);

  // Auto-select first player if none selected
  const selectedPlayer = useMemo(() => {
    if (selectedPlayerId) {
      const found = sorted.find(p => p.id === selectedPlayerId);
      if (found) return found;
    }
    return sorted[0] || null;
  }, [sorted, selectedPlayerId]);

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

        {/* Count bar */}
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
          {isUsingLiveData() && (
            <span style={{
              background: 'var(--success-light)', color: 'var(--success)',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              fontSize: 9, fontWeight: 700,
            }}>LIVE</span>
          )}
        </div>

        {/* Player list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {sorted.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center',
              color: 'var(--text-tertiary)', fontSize: 13,
              fontFamily: "'Inter', sans-serif",
            }}>
              No prospects match filters
            </div>
          ) : (
            sorted.map(player => (
              <PlayerListItem
                key={player.id}
                player={player}
                allPlayers={players}
                isSelected={selectedPlayer?.id === player.id}
                isStudied={studiedPlayers.has(player.id)}
                onClick={(id) => setSelectedPlayerId(id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Player Detail ── */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {selectedPlayer ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <DesktopDetailPanel
              player={selectedPlayer}
              allPlayers={players}
              onViewProfile={(id) => onSelectPlayer(id)}
              onDiscuss={(id) => navigate(`/player/${id}/discuss`)}
              isStudied={studiedPlayers.has(selectedPlayer.id)}
            />
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}>
            Select a prospect from the list
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopSplitView;
