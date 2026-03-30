import React from 'react';
import { useTheme } from '../ThemeContext';

const Header = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();
  const tabs = [
    { id: 'scout', label: 'Scout Board' },
    { id: 'myboard', label: 'My Board' },
  ];

  return (
    <header className="header-root" style={{
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-primary)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 className="header-logo" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 1,
          color: 'var(--accent-text)',
          margin: 0,
          textTransform: 'uppercase',
        }}>
          Dynasty Rookie Scout
        </h1>
        <span className="header-class-badge" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
        }}>
          2026
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <nav style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="header-nav-btn"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                padding: '7px 16px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            lineHeight: 1,
            color: 'var(--text-secondary)',
            transition: 'all 0.15s',
            marginLeft: 4,
          }}
        >
          {theme === 'dark' ? '\u2600' : '\u263E'}
        </button>
      </div>
    </header>
  );
};

export default Header;
