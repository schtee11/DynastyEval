import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const BackArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const UserMenu = ({ user, logout, navigate }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="header-nav-btn"
        style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12,
          padding: '5px 10px', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          background: open ? 'var(--accent-light)' : 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {user.username}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-menu" style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)', minWidth: 160,
          zIndex: 200, overflow: 'hidden',
          animation: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          transformOrigin: 'top right',
        }}>
          <button className="dropdown-item" onClick={() => { navigate('/profile'); setOpen(false); }} style={menuItemStyle}>
            Settings
          </button>
          <button className="dropdown-item" onClick={() => { navigate('/admin'); setOpen(false); }} style={menuItemStyle}>
            Admin
          </button>
          <div style={{ height: 1, background: 'var(--border-primary)' }} />
          <button className="dropdown-item" onClick={() => { logout(); setOpen(false); }} style={{ ...menuItemStyle, color: 'var(--danger)' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  display: 'block', width: '100%', padding: '10px 14px', border: 'none',
  background: 'transparent', color: 'var(--text-secondary)', textAlign: 'left',
  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
  cursor: 'pointer',
};

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname.startsWith('/player/');

  const tabs = [
    { path: '/', label: 'Prospects' },
    { path: '/community', label: 'Community' },
    { path: '/board', label: 'My Board' },
    { path: '/draft', label: 'Draft Room' },
  ];

  return (
    <header className="header-root" style={{
      background: theme === 'dark'
        ? 'linear-gradient(180deg, var(--bg-header) 0%, var(--bg-primary) 100%)'
        : 'var(--bg-header)',
      borderBottom: '1px solid var(--border-primary)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
      transition: 'background 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isProfile ? (
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
              color: 'var(--accent-text)', padding: '4px 0',
            }}
          >
            <BackArrow />
            <span className="header-back-label">Prospects</span>
          </button>
        ) : (
          <>
            <h1 className="header-logo" style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
              fontSize: 19, letterSpacing: 1, color: 'var(--accent-text)',
              margin: 0, textTransform: 'uppercase', cursor: 'pointer',
            }} onClick={() => navigate('/')}>
              Dynasty Rookie Scout
            </h1>
            <span className="header-class-badge" style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
              color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)',
              padding: '2px 7px', borderRadius: 'var(--radius-sm)',
            }}>
              2026
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <nav style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => {
            const active = location.pathname === tab.path || (isProfile && tab.path === '/');
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="header-nav-btn"
                style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
                  padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {user ? (
          <UserMenu user={user} logout={logout} navigate={navigate} />
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="header-nav-btn"
            style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12,
              padding: '5px 10px', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: 'transparent', color: 'var(--accent)',
            }}
          >
            Sign In
          </button>
        )}

        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="theme-toggle-btn"
          style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)', padding: '5px 7px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', transition: 'all 0.15s', marginLeft: 2,
          }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
};

export default Header;
