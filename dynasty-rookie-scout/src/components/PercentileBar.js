import React, { memo } from 'react';
import { computePercentile, getPercentileColor } from '../utils/helpers';

/**
 * Inline percentile bar showing where a stat falls vs peers.
 *
 * Props:
 *   - label: stat label (e.g. "YPRR")
 *   - value: raw numeric value
 *   - allValues: array of peer values (for percentile calc)
 *   - format: optional formatter
 *   - compact: hide label (tight spaces)
 *   - showPct: show percentile badge (cards/modal)
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
          fontSize: 9,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.2,
          width: 46,
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
        minWidth: 36,
      }}>
        {pct != null && (
          <div style={{
            width: `${Math.max(pct, 3)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        )}
      </div>

      {/* Value + optional percentile */}
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
        {showPct && pct != null && (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            color: color,
            verticalAlign: 'super',
            marginLeft: 1,
          }}>
            {pct}
          </span>
        )}
      </span>
    </div>
  );
});

export default PercentileBar;
