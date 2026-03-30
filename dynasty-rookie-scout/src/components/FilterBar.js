import React from 'react';

const FilterBar = ({ filters, setFilters, sortBy, setSortBy, perspective, setPerspective }) => {
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

  return (
    <div className="filter-bar-root" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
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
          marginRight: 6,
        }}>Pos</span>
        {positions.map(pos => (
          <button
            key={pos}
            className="pos-btn"
            onClick={() => setFilters(f => ({ ...f, position: pos }))}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              padding: '5px 12px',
              border: '1px solid',
              borderColor: filters.position === pos ? 'var(--accent)' : 'var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: filters.position === pos ? 'var(--accent-light)' : 'transparent',
              color: filters.position === pos ? 'var(--accent-text)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {pos}
          </button>
        ))}
      </div>

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
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {draftDays.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Perspective — WR only */}
      {isWR && (
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
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 10px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {perspectives.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

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
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            cursor: 'pointer',
            outline: 'none',
          }}
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
