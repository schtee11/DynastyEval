import React, { memo } from 'react';
import { positionColors, hasInjuryRisk, getTopStats, getTierForPlayer } from '../utils/helpers';

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

const TierDivider = ({ tier, count, compact }) => (
  <tr>
    <td colSpan={compact ? 6 : 7} style={{
      padding: '14px 16px 6px',
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: 12,
      color: TIER_COLORS[tier],
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      borderBottom: '1px solid var(--border-primary)',
      background: 'transparent',
    }}>
      {tier}
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 8, letterSpacing: 0 }}>
        {count} prospect{count !== 1 ? 's' : ''}
      </span>
    </td>
  </tr>
);

const PlayerRow = memo(({ player, perspective, onClick, isOdd, compact }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const topStats = getTopStats(player, perspective);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;

  return (
    <tr
      onClick={() => onClick(player)}
      style={{
        cursor: 'pointer',
        background: isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)'; }}
    >
      {/* Rank */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: rank1QB === 'UNR' ? 500 : 700,
        fontSize: rank1QB === 'UNR' ? 11 : 16,
        color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
        textAlign: 'center',
        width: 48,
        verticalAlign: 'middle',
      }}>
        {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '\u2014'}
      </td>

      {/* Name + Position */}
      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            color: posColor.text,
            background: posColor.bg,
            padding: '2px 6px',
            borderRadius: 3,
            flexShrink: 0,
          }}>
            {player.position}
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </span>
          {injured && (
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              background: 'var(--danger)',
              padding: '1px 5px',
              borderRadius: 3,
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
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        color: 'var(--text-secondary)',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}>
        {player.college || '\u2014'}
      </td>

      {/* Draft */}
      <td style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}>
        {(() => {
          if (!player.draftPick) {
            return <span style={{ color: 'var(--text-tertiary)' }}>\u2014</span>;
          }
          const rdColor = player.draftRound <= 1 ? 'var(--warning)'
            : player.draftRound <= 2 ? 'var(--success)'
            : player.draftRound <= 3 ? 'var(--accent-text)'
            : 'var(--text-tertiary)';
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: rdColor, fontWeight: 700, fontSize: 12 }}>
                Rd {player.draftRound}
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                #{player.draftPick}
              </span>
              {player.draftTeam && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 10 }}>
                  {player.draftTeam}
                </span>
              )}
            </span>
          );
        })()}
      </td>

      {/* Key Stats */}
      <td className="key-stats-cell" style={{
        padding: '10px 12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: 'var(--text-secondary)',
        verticalAlign: 'middle',
      }}>
        <div className="key-stats-row" style={{ display: 'flex', gap: 14, flexWrap: 'nowrap' }}>
          {topStats.map((stat, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3, fontFamily: "'Inter', sans-serif" }}>
                {stat.label}
              </span>{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {stat.value ?? '\u2014'}
              </span>
            </span>
          ))}
        </div>
      </td>

      {/* Ranks */}
      {!compact && (
        <td style={{
          padding: '10px 12px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}>
          {rank1QB != null && (
            <span style={{ color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)' }}>
              {rank1QB === 'UNR' ? '1QB UNR' : `1QB #${rank1QB}`}
            </span>
          )}
          {rankSF != null && (
            <span style={{ color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)', marginLeft: 8 }}>
              {rankSF === 'UNR' ? 'SF UNR' : `SF #${rankSF}`}
            </span>
          )}
        </td>
      )}
    </tr>
  );
});

const MobilePlayerRow = memo(({ player, perspective, onClick, isOdd }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const topStats = getTopStats(player, perspective);
  const rank1QB = player.rank?.oneQB;

  return (
    <div
      onClick={() => onClick(player)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: rank1QB === 'UNR' ? 500 : 700,
        fontSize: rank1QB === 'UNR' ? 10 : 16,
        color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
        width: 32,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '\u2014'}
      </div>

      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        color: posColor.text,
        background: posColor.bg,
        padding: '2px 6px',
        borderRadius: 3,
        flexShrink: 0,
      }}>
        {player.position}
      </span>

      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 14,
        color: 'var(--text-primary)',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {player.name}
      </span>

      {player.draftRound && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: player.draftRound <= 1 ? 'var(--warning)' : player.draftRound <= 2 ? 'var(--success)' : 'var(--accent-text)',
          flexShrink: 0,
        }}>
          Rd{player.draftRound}
        </span>
      )}

      {topStats[0] && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--text-secondary)',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 8, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>
            {topStats[0].label}
          </span>{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {topStats[0].value ?? '\u2014'}
          </span>
        </span>
      )}
    </div>
  );
});

const PlayerTableView = ({ players, perspective, onPlayerClick, showTiers, compact }) => {
  const tierGroups = showTiers ? groupByTier(players) : null;

  const renderRows = (playerList) =>
    playerList.map((player, i) => (
      <MobilePlayerRow
        key={player.id}
        player={player}
        perspective={perspective}
        onClick={onPlayerClick}
        isOdd={i % 2 === 1}
      />
    ));

  return (
    <div className="player-table-root">
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
              {(['#', 'Player', 'School', 'Draft', 'Key Stats'].concat(compact ? [] : ['Ranks'])).map((h) => (
                <th key={h} style={{
                  padding: '8px 12px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
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
                  <TierDivider tier={tier} count={group.length} compact={compact} />
                  {group.map((player, i) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      perspective={perspective}
                      onClick={onPlayerClick}
                      isOdd={i % 2 === 1}
                      compact={compact}
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
                  compact={compact}
                />
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
                padding: '10px 12px 4px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: TIER_COLORS[tier],
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border-primary)',
              }}>
                {tier} <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>({group.length})</span>
              </div>
              {renderRows(group)}
            </React.Fragment>
          ))
        ) : (
          renderRows(players)
        )}
      </div>
    </div>
  );
};

export default PlayerTableView;
