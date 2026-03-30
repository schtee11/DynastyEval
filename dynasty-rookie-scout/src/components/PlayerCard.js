import React, { memo } from 'react';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk, getTopStats } from '../utils/helpers';

const PlayerCard = memo(({ player, perspective = 'overall', onClick }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);
  const topStats = getTopStats(player, perspective);

  return (
    <div
      onClick={() => onClick(player)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${posColor.border}`,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 170,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-secondary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-primary)';
      }}
    >
      {/* Injury badge */}
      {injured && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'var(--danger)',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          letterSpacing: 0.5,
        }}>
          INJ
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}>
            {player.name}
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: 'var(--text-tertiary)',
            marginTop: 2,
          }}>
            {player.college || 'TBD'}
          </div>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: posColor.text,
          background: posColor.bg,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
        }}>
          {player.position}
        </span>
      </div>

      {/* Draft */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: capital.color,
        }}>
          {player.draftTeam
            ? `R${player.draftRound} #${player.draftPick}`
            : getDraftRangeLabel(player.draftRound, player.draftPick) || 'Draft TBD'}
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: capital.color,
          background: 'var(--bg-tertiary)',
          padding: '1px 6px',
          borderRadius: 3,
        }}>
          {capital.label}
        </span>
        {player.draftIsProjected && (
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            background: 'var(--bg-tertiary)',
            padding: '1px 5px',
            borderRadius: 3,
          }}>
            PROJ
          </span>
        )}
      </div>

      {/* Top 3 stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 10,
      }}>
        {topStats.map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Ranks */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 8,
      }}>
        {player.rank && (
          <div style={{
            display: 'flex',
            gap: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}>
            <span style={{ color: player.rank.oneQB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)' }}>
              1QB: {player.rank.oneQB === 'UNR' ? 'UNR' : `#${player.rank.oneQB}`}
            </span>
            <span style={{ color: player.rank.superflex === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)' }}>
              SF: {player.rank.superflex === 'UNR' ? 'UNR' : `#${player.rank.superflex}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default PlayerCard;
