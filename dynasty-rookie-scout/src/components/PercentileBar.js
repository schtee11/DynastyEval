import React, { memo } from 'react';
import { computePercentile, getPercentileColor } from '../utils/helpers';

/**
 * Inline percentile bar — shows where a stat falls relative to peers.
 * Renders: [LABEL] [========----] [VALUE]
 *
 * Props:
 *   - label: stat label (e.g. "YPRR")
 *   - value: raw numeric value for this player
 *   - allValues: array of all peer values (for percentile calc)
 *   - format: optional formatter (e.g. v => v.toFixed(2))
 *   - compact: if true, hide the label (for tight spaces)
 */
const PercentileBar = memo(({ label, value, allValues, format, compact = false }) => {
  const pct = computePercentile(value, allValues);
  const color = getPercentileColor(pct);
  const displayValue = value == null ? 'N/A' : format ? format(value) : value;
  const isNA = value == null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 6 : 8,
      minWidth: 0,
    }}>
      {!compact && (
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          width: 56,
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
        height: 5,
        background: 'var(--bar-track)',
        borderRadius: 3,
        overflow: 'hidden',
        minWidth: 40,
        position: 'relative',
      }}>
        {pct != null && (
          <div style={{
            width: `${Math.max(pct, 3)}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        )}
      </div>

      {/* Value */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        color: isNA ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: compact ? 32 : 40,
        textAlign: 'right',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        {displayValue}
      </span>

      {/* Percentile badge */}
      {pct != null && !compact && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: color,
          minWidth: 24,
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
