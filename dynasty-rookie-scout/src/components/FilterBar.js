import React from 'react';
import { positionColors } from '../utils/helpers';

const Divider = () => (
  <div className="filter-divider" style={{
    width: 1,
    height: 24,
    background: 'var(--border-primary)',
    flexShrink: 0,
  }} />
);

const FilterBar = ({ filters, setFilters, sortBy, setSortBy, perspective, setPerspective }) => {
  // Count active (non-default) filters
  const activeCount = [
    filters.position !== 'ALL',
    filters.draftDay !== '',
    filters.hideInjured,
    filters.nameSearch,
  ].filter(Boolean).length;
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE'];
  const perspectives = [
    { value: 'overall', label: 'Overall' },
    { value: 'deepBall', label: 'Deep Ball' },
    { value: 'redZone', label: 'Red Zone' },
    { value: 'lateDown', label: 'Late Down' },
  ];
  const draftDays = [
    { value: '', label: 'All Rounds' },
    { value: '1', label: 'Day 1' },
    { value: '2', label: 'Day 2' },
    { value: '3', label: 'Day 3' },
  ];

  const isWR = filters.position === 'WR';

  // Use position-specific color when a position is selected
  const getButtonStyle = (pos, isActive) => {
    if (!isActive) {
      return {
        borderColor: 'var(--border-primary)',
        background: 'transparent',
        color: 'var(--text-secondary)',
      };
    }
    if (pos === 'ALL') {
      return {
        borderColor: 'var(--accent)',
        background: 'var(--accent-light)',
        color: 'var(--accent-text)',
      };
    }
    const pc = positionColors[pos];
    return {
      borderColor: pc.border,
      background: pc.bg,
      color: pc.text,
    };
  };

  const selectStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 10px',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div className="filter-bar-root" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 16px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Position filter */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <span className="filter-label" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginRight: 4,
        }}>Pos</span>
        {positions.map(pos => {
          const active = filters.position === pos;
          const s = getButtonStyle(pos, active);
          return (
            <button
              key={pos}
              className="pos-btn"
              onClick={() => setFilters(f => ({ ...f, position: pos }))}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 12,
                padding: '5px 12px',
                border: `1px solid ${s.borderColor}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: s.background,
                color: s.color,
                transition: 'all 0.15s',
              }}
            >
              {pos}
            </button>
          );
        })}
      </div>

      <Divider />

      {/* Draft day */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="filter-label" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>Round</span>
        <select
          value={filters.draftDay || ''}
          onChange={e => setFilters(f => ({ ...f, draftDay: e.target.value }))}
          style={selectStyle}
        >
          {draftDays.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Perspective — WR only */}
      {isWR && (
        <>
          <Divider />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="filter-label" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>View</span>
            <select
              value={perspective}
              onChange={e => setPerspective(e.target.value)}
              style={selectStyle}
            >
              {perspectives.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <Divider />

      {/* Hide Injured */}
      <label className="injury-toggle" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        color: filters.hideInjured ? 'var(--danger)' : 'var(--text-tertiary)',
      }}>
        <input
          type="checkbox"
          checked={filters.hideInjured}
          onChange={e => setFilters(f => ({ ...f, hideInjured: e.target.checked }))}
          style={{ accentColor: 'var(--danger)' }}
        />
        Hide Injured
      </label>

      {/* Active filter count + clear */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
            color: 'var(--accent-text)', background: 'var(--accent-light)',
            padding: '2px 8px', borderRadius: 10,
          }}>
            {activeCount} active
          </span>
          <button
            onClick={() => setFilters({ position: 'ALL', draftDay: '', hideInjured: false, breakoutMax: null, nameSearch: '' })}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
              color: 'var(--text-tertiary)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sort */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="filter-label" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>Sort</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={selectStyle}
        >
          <option value="rank">Overall Rank</option>
          <option value="adp">ADP</option>
          <option value="draftCapital">Draft Capital</option>
          <option value="breakoutAge">Breakout Age</option>
          <option value="yprr">YPRR</option>
          {isWR && <option value="recGrade">Rec Grade</option>}
          {isWR && <option value="tgtPerRR">Tgt/RR</option>}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
