import React from 'react';

const buttonStyle = (active) => ({
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: 1,
  textTransform: 'uppercase',
  padding: '6px 14px',
  border: '1px solid',
  borderColor: active ? '#f59e0b' : '#2a2d3e',
  borderRadius: 4,
  cursor: 'pointer',
  background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
  color: active ? '#f59e0b' : '#9ca3af',
  transition: 'all 0.15s',
});

const selectStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  background: '#1a1d2e',
  color: '#e2e8f0',
  border: '1px solid #2a2d3e',
  borderRadius: 4,
  padding: '6px 12px',
  cursor: 'pointer',
  outline: 'none',
};

const FilterBar = ({ filters, setFilters, sortBy, setSortBy }) => {
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE'];
  const draftDays = [
    { value: '', label: 'All Rounds' },
    { value: '1', label: 'Day 1' },
    { value: '2', label: 'Day 2' },
    { value: '3', label: 'Day 3' },
  ];

  return (
    <div style={{
      background: '#151825',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      {/* Position filter */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          color: '#6b7280',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginRight: 8,
        }}>POS</span>
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setFilters(f => ({ ...f, position: pos }))}
            style={buttonStyle(filters.position === pos)}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Draft day filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          color: '#6b7280',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>ROUND</span>
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

      {/* Injury toggle */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: filters.hideInjured ? '#ef4444' : '#6b7280',
      }}>
        <input
          type="checkbox"
          checked={filters.hideInjured}
          onChange={e => setFilters(f => ({ ...f, hideInjured: e.target.checked }))}
          style={{ accentColor: '#ef4444' }}
        />
        Hide Injured
      </label>

      {/* Sort */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          color: '#6b7280',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>SORT</span>
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
          <option value="dominator">Dominator Rating</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
