import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';
import FilterBar from './FilterBar';
import { getPlayers } from '../services/dataService';
import { sortPlayers, filterPlayers } from '../utils/helpers';

const ScoutBoard = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filters, setFilters] = useState({
    position: 'ALL',
    draftDay: '',
    hideInjured: false,
    breakoutMax: null,
  });
  const [sortBy, setSortBy] = useState('rank');

  useEffect(() => {
    const loadPlayers = async () => {
      const data = await getPlayers();
      setPlayers(data);
    };
    loadPlayers();
  }, []);

  const filtered = filterPlayers(players, filters);
  const sorted = sortPlayers(filtered, sortBy);

  return (
    <div style={{ padding: '20px 24px' }}>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
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
        }}>
          {sorted.length} prospect{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {sorted.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={setSelectedPlayer}
          />
        ))}
      </div>

      {sorted.length === 0 && (
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
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default ScoutBoard;
