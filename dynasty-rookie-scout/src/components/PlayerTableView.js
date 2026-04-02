import React, { memo, useMemo } from 'react';
import { positionColors, hasInjuryRisk, getStatAccessors, getTierForPlayer, getBreakoutIndicator } from '../utils/helpers';
import PercentileBar from './PercentileBar';
import DraftBadge from './DraftBadge';
import PlayerCompChip from './PlayerCompChip';
import ValueDelta from './ValueDelta';

const TIER_ORDER = ['Elite', 'Day 1', 'Day 2', 'Day 3', 'Undrafted / TBD'];

const TIER_COLORS = {
  Elite: 'var(--warning)',
  'Day 1': 'var(--success)',
  'Day 2': 'var(--accent-text)',
  'Day 3': 'var(--text-tertiary)',
  'Undrafted / TBD': 'var(--text-tertiary)',
};

const TIER_TINTS = {
  Elite: 'var(--tier-elite-tint)',
  'Day 1': 'var(--tier-day1-tint)',
  'Day 2': 'var(--tier-day2-tint)',
  'Day 3': 'var(--tier-day3-tint)',
  'Undrafted / TBD': 'transparent',
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
  <tr>
    <td colSpan={7} style={{
      padding: '16px 16px 6px',
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      fontSize: 13,
      color: TIER_COLORS[tier],
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      borderBottom: '2px solid var(--border-primary)',
      background: 'transparent',
    }}>
      {tier}
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 8 }}>
        {count}
      </span>
    </td>
  </tr>
);

const PlayerRow = memo(({ player, perspective, onClick, isOdd, allPlayers }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;
  const isTopRank = rank1QB != null && rank1QB !== 'UNR' && rank1QB <= 12;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const tier = getTierForPlayer(player);
  const tierTint = TIER_TINTS[tier];

  const accessors = useMemo(() => getStatAccessors(player.position, perspective), [player.position, perspective]);
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);

  // Row base background: alternating + tier tint overlay
  const baseBg = isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)';

  return (
    <tr
      onClick={() => onClick(player)}
      style={{
        cursor: 'pointer',
        background: tierTint !== 'transparent' ? tierTint : baseBg,
        borderLeft: `3px solid ${posColor.border}`,
        transition: 'background 0.1s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = tierTint !== 'transparent' ? tierTint : baseBg;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Rank */}
      <td style={{
        padding: '6px 6px',
        textAlign: 'center',
        width: 40,
        verticalAlign: 'middle',
      }}>
        {rank1QB === 'UNR' ? (
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.5 }}>UNR</span>
        ) : isTopRank ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11,
          }}>
            {rank1QB}
          </span>
        ) : (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            {rank1QB ?? '\u2014'}
          </span>
        )}
      </td>

      {/* Player name + comp + breakout */}
      <td style={{ padding: '5px 10px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9,
            color: posColor.text, background: posColor.bg,
            padding: '2px 5px', borderRadius: 3, flexShrink: 0,
          }}>
            {player.position}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5,
                color: 'var(--text-primary)', whiteSpace: 'nowrap',
              }}>
                {player.name}
              </span>
              {injured && (
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 700,
                  color: '#fff', background: 'var(--danger)',
                  padding: '1px 4px', borderRadius: 3, flexShrink: 0,
                }}>
                  INJ
                </span>
              )}
              <ValueDelta rank={rank1QB} adp={player.dynastyADP?.oneQB} />
            </div>
            {/* Second line: comp + breakout age */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              {player.playerComps && player.playerComps.length > 0 && (
                <PlayerCompChip comps={player.playerComps} max={1} />
              )}
              {player.breakoutAge && breakout.label !== 'N/A' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: "'Inter', sans-serif", fontSize: 9, color: breakout.color,
                  fontWeight: 500,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: breakout.color, flexShrink: 0,
                  }} />
                  {player.breakoutAge}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* School */}
      <td style={{
        padding: '6px 8px', fontFamily: "'Inter', sans-serif", fontSize: 12,
        color: 'var(--text-secondary)', verticalAlign: 'middle', whiteSpace: 'nowrap',
      }}>
        {player.college || '\u2014'}
      </td>

      {/* Draft */}
      <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
        <DraftBadge round={player.draftRound} pick={player.draftPick} team={player.draftTeam} isProjected={player.draftIsProjected} />
      </td>

      {/* Key Stats */}
      <td style={{ padding: '5px 8px', verticalAlign: 'middle', width: 260 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {accessors.map((acc, i) => {
            const val = acc.getValue(player);
            const allVals = peers.map(p => acc.getValue(p));
            const fmt = typeof val === 'number' && val < 10 ? v => v.toFixed(2) : v => typeof v === 'number' && v >= 1000 ? v.toLocaleString() : v;
            return <PercentileBar key={i} label={acc.label} value={val} allValues={allVals} format={fmt} />;
          })}
        </div>
      </td>

      {/* Ranks */}
      <td style={{ padding: '6px 8px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)',
        }}>
          {rank1QB === 'UNR' ? 'UNR' : `#${rank1QB}`}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)',
          marginLeft: 6,
        }}>
          SF {rankSF === 'UNR' ? 'UNR' : `#${rankSF}`}
        </span>
      </td>
    </tr>
  );
});

const MobilePlayerRow = memo(({ player, perspective, onClick, isOdd, allPlayers }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const rank1QB = player.rank?.oneQB;
  const accessors = useMemo(() => getStatAccessors(player.position, perspective), [player.position, perspective]);
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);

  return (
    <div
      onClick={() => onClick(player)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '10px 12px',
        background: isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${posColor.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: rank1QB === 'UNR' ? 500 : 700,
          fontSize: rank1QB === 'UNR' ? 10 : 16,
          color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
          width: 28, textAlign: 'center', flexShrink: 0,
        }}>
          {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '\u2014'}
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10,
          color: posColor.text, background: posColor.bg,
          padding: '2px 6px', borderRadius: 3, flexShrink: 0,
        }}>
          {player.position}
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14,
          color: 'var(--text-primary)', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {player.name}
        </span>
        {player.draftRound && (
          <DraftBadge round={player.draftRound} pick={player.draftPick} isProjected={player.draftIsProjected} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, paddingLeft: 36 }}>
        {accessors.slice(0, 2).map((acc, i) => {
          const val = acc.getValue(player);
          const allVals = peers.map(p => acc.getValue(p));
          return <div key={i} style={{ flex: 1 }}><PercentileBar label={acc.label} value={val} allValues={allVals} compact /></div>;
        })}
      </div>
    </div>
  );
});

const PlayerTableView = ({ players, perspective, onPlayerClick, showTiers, allPlayers }) => {
  const tierGroups = showTiers ? groupByTier(players) : null;

  const renderMobileRows = (playerList) =>
    playerList.map((player, i) => (
      <MobilePlayerRow key={player.id} player={player} perspective={perspective} onClick={onPlayerClick} isOdd={i % 2 === 1} allPlayers={allPlayers} />
    ));

  return (
    <div className="player-table-root">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
              {['#', 'Player', 'School', 'Draft', 'Key Stats', 'Ranks'].map((h) => (
                <th key={h} style={{
                  padding: '8px 12px', fontFamily: "'Inter', sans-serif",
                  fontWeight: 600, fontSize: 11, color: 'var(--text-tertiary)',
                  textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showTiers ? (
              tierGroups.map(({ tier, players: group }) => (
                <React.Fragment key={tier}>
                  <TierDivider tier={tier} count={group.length} />
                  {group.map((player, i) => (
                    <PlayerRow key={player.id} player={player} perspective={perspective} onClick={onPlayerClick} isOdd={i % 2 === 1} allPlayers={allPlayers} />
                  ))}
                </React.Fragment>
              ))
            ) : (
              players.map((player, i) => (
                <PlayerRow key={player.id} player={player} perspective={perspective} onClick={onPlayerClick} isOdd={i % 2 === 1} allPlayers={allPlayers} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="player-mobile-list">
        {showTiers ? (
          tierGroups.map(({ tier, players: group }) => (
            <React.Fragment key={tier}>
              <div style={{
                padding: '10px 12px 4px', fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: 12, color: TIER_COLORS[tier],
                letterSpacing: 0.5, textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-primary)',
              }}>
                {tier} <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>({group.length})</span>
              </div>
              {renderMobileRows(group)}
            </React.Fragment>
          ))
        ) : (
          renderMobileRows(players)
        )}
      </div>
    </div>
  );
};

export default PlayerTableView;
