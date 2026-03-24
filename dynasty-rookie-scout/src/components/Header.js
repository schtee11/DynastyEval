import React from 'react';

const Header = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'scout', label: 'SCOUT BOARD' },
    { id: 'myboard', label: 'MY BOARD' },
    { id: 'admin', label: 'ADMIN' },
  ];

  return (
    <header className="header-root" style={{
      background: 'linear-gradient(180deg, #1a1d2e 0%, #0f1117 100%)',
      borderBottom: '2px solid #f59e0b',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 className="header-logo" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: 2,
          color: '#f59e0b',
          margin: 0,
          textTransform: 'uppercase',
        }}>
          Dynasty Rookie Scout
        </h1>
        <span className="header-class-badge" style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#6b7280',
          background: '#1e2133',
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          2026 CLASS
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="header-nav-btn"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              padding: '8px 20px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeTab === tab.id ? '#f59e0b' : 'transparent',
              color: activeTab === tab.id ? '#0f1117' : '#9ca3af',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;
