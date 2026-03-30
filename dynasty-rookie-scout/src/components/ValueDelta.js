import React, { memo } from 'react';

/**
 * Shows rank vs ADP difference as a colored arrow badge.
 * Green ↑N = undervalued (ranked higher than ADP)
 * Red ↓N = overvalued (ranked lower than ADP)
 * Nothing if delta < 3 (fair value).
 *
 * Props:
 *   - rank: number (1QB rank)
 *   - adp: number (1QB ADP)
 */
const ValueDelta = memo(({ rank, adp }) => {
  if (rank == null || adp == null || rank === 'UNR' || adp === 'UNR') return null;

  const delta = adp - rank; // positive = undervalued (rank better than ADP)
  if (Math.abs(delta) < 3) return null;

  const isUndervalued = delta > 0;

  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      fontWeight: 700,
      color: isUndervalued ? 'var(--success)' : 'var(--danger)',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      {isUndervalued ? '\u2191' : '\u2193'}{Math.abs(delta)}
    </span>
  );
});

export default ValueDelta;
