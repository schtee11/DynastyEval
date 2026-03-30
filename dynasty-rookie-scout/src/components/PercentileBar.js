import React, { memo } from 'react';
import { computePercentile, getPercentileColor } from '../utils/helpers';

/**
 * Inline percentile bar — shows where a stat falls relative to peers.
 *
 * Props:
 *   - label: stat label (e.g. "YPRR")
 *   - value: raw numeric value
 *   - allValues: array of peer values (for percentile calc)
 *   - format: optional formatter (e.g. v => v.toFixed(2))
 *   - compact: hide label (for tight spaces)
 *   - showPct: show percentile badge (default false — use in cards/modal)
 */
const PercentileBar = memo(({ label, value, allValues, format, compact = false, showPct = false }) => {
  const pct = computePercentile(value, allValues);
  const color = getPercentileColor(pct);
  const displayValue = value == null ? '\u2014' : format ? format(value) : value;
  const isNA = value == null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      minWidth: 0,
      lineHeight: 1,
    }}>
      {!compact && label && (
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 8.5,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.2,
          width: 44,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </span>
      )}

      {/* Bar track */}
      <div style={{
        flex: 1,
        height: 4,
        background: 'var(--bar-track)',
        borderRadius: 2,
        overflow: 'hidden',
        minWidth: 36,
      }}>
        {pct != null && (
          <div style={{
            width: `${Math.max(pct, 3)}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        )}
      </div>

      {/* Value */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        fontWeight: 600,
        color: isNA ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: 32,
        textAlign: 'right',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        {displayValue}
      </span>

      {/* Percentile badge — only when showPct is true */}
      {showPct && pct != null && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8.5,
          fontWeight: 700,
          color: color,
          minWidth: 22,
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {pct}th
        </span>
      )}
    </div>
  );
});

export default PercentileBar;
