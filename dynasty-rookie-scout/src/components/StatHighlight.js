import React from 'react';

/**
 * Clean stat display for hero cards.
 * Shows a large number with label and optional tier indicator.
 */
const StatHighlight = ({ label, value, tier, color }) => {
  const tierColors = {
    elite: '#16a34a',
    good: '#2563eb',
    avg: '#d97706',
    poor: '#94a3b8',
  };

  const displayValue = value == null || value === '' || value === 'N/A' ? '—' : value;
  const tierColor = tierColors[tier] || tierColors.avg;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      minWidth: 0,
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        fontWeight: 700,
        color: color || tierColor,
        lineHeight: 1,
        letterSpacing: -0.5,
      }}>
        {displayValue}
      </span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        {label}
      </span>
      {tier && (
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: tierColor,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontFamily: "'Inter', sans-serif",
        }}>
          {tier}
        </span>
      )}
    </div>
  );
};

export default StatHighlight;
