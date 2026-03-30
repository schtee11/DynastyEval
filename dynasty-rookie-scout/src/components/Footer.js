import React, { useState } from 'react';

const Footer = () => {
  const [activePage, setActivePage] = useState(null);

  if (activePage) {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => setActivePage(null)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              padding: '8px 16px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            \u2190 Back
          </button>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--accent-text)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            {activePage === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          </h1>

          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}>
            {activePage === 'terms' ? (
              <>
                <p style={{ marginBottom: 16 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Effective Date:</strong> 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  Dynasty Rookie Scout is a fantasy football scouting tool. By using this site, you agree to the following terms.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: 'var(--accent-text)', marginBottom: 8, marginTop: 24 }}>
                  Use of Data
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Statistical data displayed on this site is sourced from licensed third-party providers including Pro Football Focus (PFF), NFL Mock Draft Database, and FantasyCalc. This data is provided for personal, non-commercial scouting use only.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: 'var(--accent-text)', marginBottom: 8, marginTop: 24 }}>
                  Disclaimer
                </h2>
                <p style={{ marginBottom: 16 }}>
                  We make no guarantees about the accuracy or completeness of player projections or draft data.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: 16 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Effective Date:</strong> 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  Dynasty Rookie Scout respects your privacy. This policy describes how we handle information.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: 'var(--accent-text)', marginBottom: 8, marginTop: 24 }}>
                  Data Collection
                </h2>
                <p style={{ marginBottom: 16 }}>
                  We store your custom board rankings in your browser's local storage. We do not collect personal information, require account creation, or use tracking cookies.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: 'var(--accent-text)', marginBottom: 8, marginTop: 24 }}>
                  Third-Party Services
                </h2>
                <p style={{ marginBottom: 16 }}>
                  This site fetches data from third-party APIs (Sleeper, FantasyCalc) to display player information. These services have their own privacy policies.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <footer className="footer-root" style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      padding: '24px 24px 20px',
      marginTop: 40,
      transition: 'background 0.2s ease',
    }}>
      <div className="footer-inner" style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
      }}>
        <div style={{ minWidth: 180 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: 'var(--accent-text)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Dynasty Rookie Scout
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: 'var(--text-tertiary)',
          }}>
            2026 Class Scouting Tool
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            {['terms', 'privacy'].map(page => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                {page === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: 'var(--text-tertiary)',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Data Sources
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>PFF</strong> \u2014 Statistical data provided by Pro Football Focus.</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>nflmockdraftdatabase.com</strong> \u2014 Draft projections.</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>FantasyCalc</strong> \u2014 Dynasty value data.</div>
          </div>
        </div>

        <div className="footer-right" style={{ textAlign: 'right', minWidth: 160 }}>
          <a
            href="mailto:partnerships@dynastyrookiescout.com"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: 'var(--accent-text)',
              textDecoration: 'none',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 16px',
              display: 'inline-block',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Advertise / Partner
          </a>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: 'var(--text-tertiary)',
            marginTop: 8,
          }}>
            partnerships@dynastyrookiescout.com
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 20,
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        color: 'var(--text-tertiary)',
      }}>
        \u00A9 {new Date().getFullYear()} Dynasty Rookie Scout. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
