import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-root" style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      padding: '20px 24px 16px',
      transition: 'background 0.2s ease',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 13,
          color: 'var(--accent-text)',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Dynasty Rookie Scout
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}>
          &copy; {new Date().getFullYear()} Dynasty Rookie Scout
        </div>
      </div>
    </footer>
  );
};

export default Footer;
