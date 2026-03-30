import React, { memo } from 'react';

/**
 * Visual draft capital badge.
 * Shows round + pick as a colored pill with visual weight
 * proportional to draft capital tier.
 */
const DraftBadge = memo(({ round, pick, team, isProjected }) => {
  if (!pick && !round) {
    return (
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        color: 'var(--text-tertiary)',
      }}>
        TBD
      </span>
    );
  }

  const tier = pick <= 10 ? 'elite' : pick <= 32 ? 'day1' : pick <= 64 ? 'day2' : 'day3';

  const tierStyles = {
    elite: {
      bg: 'var(--warning-light)',
      border: 'var(--warning)',
      text: 'var(--warning)',
    },
    day1: {
      bg: 'var(--success-light)',
      border: 'var(--success)',
      text: 'var(--success)',
    },
    day2: {
      bg: 'var(--accent-light)',
      border: 'var(--accent)',
      text: 'var(--accent-text)',
    },
    day3: {
      bg: 'var(--bg-tertiary)',
      border: 'var(--border-primary)',
      text: 'var(--text-tertiary)',
    },
  };

  const s = tierStyles[tier];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0,
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: `1px solid ${s.border}`,
      borderStyle: isProjected ? 'dashed' : 'solid',
      lineHeight: 1,
    }}>
      {/* Round */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        color: s.text,
        background: s.bg,
        padding: '3px 6px',
      }}>
        R{round}
      </span>
      {/* Pick */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        padding: '3px 6px',
        borderLeft: `1px solid ${s.border}`,
        borderLeftStyle: isProjected ? 'dashed' : 'solid',
      }}>
        #{pick}
      </span>
      {/* Team */}
      {team && (
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          padding: '3px 5px',
          borderLeft: `1px solid ${s.border}`,
          borderLeftStyle: isProjected ? 'dashed' : 'solid',
          textTransform: 'uppercase',
        }}>
          {team}
        </span>
      )}
    </span>
  );
});

export default DraftBadge;
