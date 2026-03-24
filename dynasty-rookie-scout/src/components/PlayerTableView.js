import React from 'react';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk, getTopStats, getTierForPlayer } from '../utils/helpers';

const TIER_ORDER = ['Elite', 'Day 1', 'Day 2', 'Day 3', 'Undrafted / TBD'];

/** Group sorted players into tier buckets, preserving sort order within each tier */
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
      padding: '12px 16px 6px',
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      fontSize: 13,
      color: tier === 'Elite' ? '#f59e0b' : tier === 'Day 1' ? '#22c55e' : tier === 'Day 2' ? '#60a5fa' : '#6b7280',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      borderBottom: '1px solid #2a2d3e',
      background: 'transparent',
    }}>
      {tier}
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginLeft: 8, letterSpacing: 0 }}>
        {count} prospect{count !== 1 ? 's' : ''}
      </span>
    </td>
  </tr>
);

const PlayerRow = ({ player, perspective, onClick, isOdd }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);
  const topStats = getTopStats(player, perspective);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;

  return (
    <tr
      onClick={() => onClick(player)}
      style={{
        cursor: 'pointer',
        background: isOdd ? '#1a1d2e' : '#151724',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#22263a'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isOdd ? '#1a1d2e' : '#151724'; }}
    >
      {/* Rank */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: rank1QB === 'UNR' ? 600 : 800,
        fontSize: rank1QB === 'UNR' ? 13 : 22,
        color: rank1QB === 'UNR' ? '#6b7280' : '#f1f5f9',
        textAlign: 'center',
        width: 56,
        verticalAlign: 'middle',
        letterSpacing: rank1QB === 'UNR' ? 1 : 0,
      }}>
        {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '—'}
      </td>

      {/* Name + Position badge */}
      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            color: posColor.text,
            background: posColor.bg,
            padding: '2px 6px',
            borderRadius: 3,
            letterSpacing: 1,
            flexShrink: 0,
          }}>
            {player.position}
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: '#f1f5f9',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </span>
          {injured && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              background: '#ef4444',
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: 0.5,
              flexShrink: 0,
            }}>
              INJ
            </span>
          )}
        </div>
      </td>

      {/* School */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#9ca3af',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}>
        {player.college || '—'}
      </td>

      {/* Draft Range */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}>
        {(() => {
          const rangeLabel = getDraftRangeLabel(player.draftRound, player.draftPick);
          if (player.draftTeam) {
            // Post-draft: show actual pick and team
            return (
              <>
                <span style={{ color: '#d1d5db', fontWeight: 600 }}>
                  R{player.draftRound} #{player.draftPick}
                </span>
                <span style={{ color: capital.color, marginLeft: 6, fontWeight: 700, fontSize: 10 }}>
                  {player.draftTeam}
                </span>
              </>
            );
          }
          if (rangeLabel) {
            return (
              <span style={{ color: capital.color, fontWeight: 700 }}>
                {rangeLabel}
              </span>
            );
          }
          return <span style={{ color: '#6b7280' }}>TBD</span>;
        })()}
      </td>

      {/* Key Stats (2–3 position-specific) */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#d1d5db',
        verticalAlign: 'middle',
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap' }}>
          {topStats.map((stat, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#6b7280', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {stat.label}
              </span>{' '}
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                {stat.value ?? '—'}
              </span>
            </span>
          ))}
        </div>
      </td>

      {/* 1QB / SF Ranks */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}>
        {rank1QB != null && (
          <span style={{ color: rank1QB === 'UNR' ? '#6b7280' : '#60a5fa' }}>
            {rank1QB === 'UNR' ? '1QB UNR' : `1QB #${rank1QB}`}
          </span>
        )}
        {rankSF != null && (
          <span style={{ color: rankSF === 'UNR' ? '#6b7280' : '#a78bfa', marginLeft: 8 }}>
            {rankSF === 'UNR' ? 'SF UNR' : `SF #${rankSF}`}
          </span>
        )}
      </td>
    </tr>
  );
};

const PlayerTableView = ({ players, perspective, onPlayerClick, showTiers }) => {
  const tierGroups = showTiers ? groupByTier(players) : null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <thead>
          <tr style={{
            borderBottom: '2px solid #2a2d3e',
          }}>
            {['#', 'Player', 'School', 'Draft', 'Key Stats', 'Ranks (FantasyCalc)'].map((h) => (
              <th key={h} style={{
                padding: '8px 12px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: '#6b7280',
                textAlign: 'left',
                textTransform: 'uppercase',
                letterSpacing: 1,
                whiteSpace: 'nowrap',
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
                  <PlayerRow
                    key={player.id}
                    player={player}
                    perspective={perspective}
                    onClick={onPlayerClick}
                    isOdd={i % 2 === 1}
                  />
                ))}
              </React.Fragment>
            ))
          ) : (
            players.map((player, i) => (
              <PlayerRow
                key={player.id}
                player={player}
                perspective={perspective}
                onClick={onPlayerClick}
                isOdd={i % 2 === 1}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerTableView;
