import React, { memo } from 'react';

/**
 * Renders player comparison names as styled pills.
 * Props:
 *   - comps: string[] of comparable player names
 *   - max: number of comps to show (default 1)
 */
const PlayerCompChip = memo(({ comps, max = 1 }) => {
  if (!comps || comps.length === 0) return null;

  const visible = comps.slice(0, max);

  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {visible.map((comp, i) => (
        <span key={i} style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9.5,
          fontWeight: 500,
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          padding: '1px 7px',
          borderRadius: 10,
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {comp}
        </span>
      ))}
      {comps.length > max && (
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: 'var(--text-tertiary)',
        }}>
          +{comps.length - max}
        </span>
      )}
    </span>
  );
});

export default PlayerCompChip;
