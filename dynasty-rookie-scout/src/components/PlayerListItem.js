import React, { memo, useMemo } from 'react';
import { positionColors, hasInjuryRisk } from '../utils/helpers';

/**
 * Compact list row for the desktop split-view panel.
 * Shows: rank, position badge, name, college, draft info, key stat.
 */
const PlayerListItem = memo(({ player, allPlayers = [], isSelected, isStudied, onClick }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  // One headline stat per position
  const headlineStat = useMemo(() => {
    const s = player.stats;
    if (!s) return null;
    switch (player.position) {
      case 'QB': return s.completionPct ? `${s.completionPct}% Comp` : null;
      case 'RB': return s.rushingYards ? `${s.rushingYards.toLocaleString()} Rush Yds` : null;
      case 'WR': return s.receivingYards ? `${s.receivingYards.toLocaleString()} Rec Yds` : null;
      case 'TE': return s.receivingYards ? `${s.receivingYards.toLocaleString()} Rec Yds` : null;
      default: return null;
    }
  }, [player]);

  return (
    <div
      onClick={() => onClick(player.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: isSelected ? 'var(--accent-light)' : 'transparent',
        borderLeft: isSelected ? `3px solid var(--accent)` : '3px solid transparent',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Rank */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 800,
        fontSize: 14,
        color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: 28,
        textAlign: 'right',
      }}>
        {rank1QB === 'UNR' ? '—' : rank1QB ?? '—'}
      </span>

      {/* Position badge */}
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        color: posColor.text,
        background: posColor.bg,
        padding: '2px 6px',
        borderRadius: 4,
        minWidth: 28,
        textAlign: 'center',
      }}>
        {player.position}
      </span>

      {/* Name + college */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </span>
          {injured && (
            <span style={{
              fontSize: 7, fontWeight: 700, color: '#fff',
              background: 'var(--danger)', padding: '1px 4px',
              borderRadius: 3,
            }}>INJ</span>
          )}
          {isStudied && (
            <span style={{
              fontSize: 7, fontWeight: 700, color: '#fff',
              background: 'var(--success)', padding: '1px 4px',
              borderRadius: 3,
            }}>&#10003;</span>
          )}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'var(--text-tertiary)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}>
          <span>{player.college}</span>
        </div>
      </div>

      {/* Headline stat */}
      <div style={{ textAlign: 'right', minWidth: 90 }}>
        {headlineStat ? (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            {headlineStat}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>—</span>
        )}
        {player.draftRound && (
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            color: 'var(--text-tertiary)',
            marginTop: 2,
          }}>
            Rd {player.draftRound} · #{player.draftPick}
          </div>
        )}
      </div>
    </div>
  );
});

export default PlayerListItem;
