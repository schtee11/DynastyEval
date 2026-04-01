import React from 'react';
import PlayerRowCard from './PlayerRowCard';
import { getTierForPlayer } from '../utils/helpers';

const TIER_ORDER = ['Elite', 'Day 1', 'Day 2', 'Day 3', 'Undrafted / TBD'];

const TIER_COLORS = {
  Elite: 'var(--warning)',
  'Day 1': 'var(--success)',
  'Day 2': 'var(--accent-text)',
  'Day 3': 'var(--text-tertiary)',
  'Undrafted / TBD': 'var(--text-tertiary)',
};

const groupByTier = (players) => {
  const groups = {};
  for (const player of players) {
    const tier = getTierForPlayer(player);
    if (!groups[tier]) groups[tier] = [];
    groups[tier].push(player);
  }
  return TIER_ORDER.filter((t) => groups[t]?.length > 0).map((tier) => ({
    tier,
    players: groups[tier],
  }));
};

const TierDivider = ({ tier, count }) => (
  <div style={{
    padding: '14px 16px 6px',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: TIER_COLORS[tier],
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderBottom: '2px solid var(--border-primary)',
  }}>
    {tier}
    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 8 }}>
      {count}
    </span>
  </div>
);

/** Sticky column header matching the four-zone flex layout */
const ListHeader = () => (
  <div className="player-list-header" style={{
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: 10,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderLeft: '3px solid transparent',
  }}>
    <div style={{ width: 40, flexShrink: 0, textAlign: 'center', padding: '0 4px' }}>#</div>
    <div style={{ flex: 1, padding: '0 12px 0 6px' }}>Player</div>
    <div className="row-stats" style={{ width: 200, flexShrink: 0, padding: '0 8px' }}>Key Stats</div>
    <div className="row-ranks" style={{ width: 80, flexShrink: 0, padding: '0 8px', textAlign: 'right' }}>Ranks</div>
  </div>
);

const PlayerListView = ({ players, perspective, onPlayerClick, showTiers, allPlayers, studiedPlayers }) => {
  const tierGroups = showTiers ? groupByTier(players) : null;

  return (
    <div>
      <ListHeader />
      {showTiers ? (
        tierGroups.map(({ tier, players: group }) => (
          <div key={tier}>
            <TierDivider tier={tier} count={group.length} />
            {group.map((player, i) => (
              <PlayerRowCard
                key={player.id}
                player={player}
                perspective={perspective}
                onClick={onPlayerClick}
                isOdd={i % 2 === 1}
                allPlayers={allPlayers}
                isStudied={studiedPlayers?.has(player.id)}
              />
            ))}
          </div>
        ))
      ) : (
        players.map((player, i) => (
          <PlayerRowCard
            key={player.id}
            player={player}
            perspective={perspective}
            onClick={onPlayerClick}
            isOdd={i % 2 === 1}
            allPlayers={allPlayers}
            isStudied={studiedPlayers?.has(player.id)}
          />
        ))
      )}
    </div>
  );
};

export default PlayerListView;
