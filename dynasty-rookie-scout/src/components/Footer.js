import React, { useState } from 'react';

const Footer = () => {
  const [activePage, setActivePage] = useState(null);

  if (activePage) {
    return (
      <div style={{
        background: '#0a0c12',
        minHeight: '100vh',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: 720,
          margin: '0 auto',
        }}>
          <button
            onClick={() => setActivePage(null)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '8px 16px',
              border: '1px solid #2a2d3e',
              borderRadius: 4,
              background: 'transparent',
              color: '#9ca3af',
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            &larr; Back
          </button>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: '#f59e0b',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            {activePage === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          </h1>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 1.8,
            color: '#d1d5db',
          }}>
            {activePage === 'terms' ? (
              <>
                <p style={{ marginBottom: 16 }}>
                  <strong style={{ color: '#f1f5f9' }}>Effective Date:</strong> 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  Dynasty Rookie Scout is a fantasy football scouting tool. By using this site, you agree to the following terms.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: '#f59e0b', marginBottom: 8, marginTop: 24 }}>
                  Use of Data
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Statistical data displayed on this site is sourced from licensed third-party providers including Pro Football Focus (PFF), NFL Mock Draft Database, and FantasyCalc. This data is provided for personal, non-commercial scouting use only. You may not scrape, redistribute, or commercially exploit the data without authorization.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: '#f59e0b', marginBottom: 8, marginTop: 24 }}>
                  Disclaimer
                </h2>
                <p style={{ marginBottom: 16 }}>
                  Dynasty Rookie Scout provides scouting opinions and data aggregation for fantasy football purposes. We make no guarantees about the accuracy or completeness of player projections or draft data.
                </p>
                <p style={{ color: '#6b7280', marginTop: 32 }}>
                  Full terms of use coming soon. For questions, contact us via the partner link in the footer.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: 16 }}>
                  <strong style={{ color: '#f1f5f9' }}>Effective Date:</strong> 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  Dynasty Rookie Scout respects your privacy. This policy describes how we handle information when you use our site.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: '#f59e0b', marginBottom: 8, marginTop: 24 }}>
                  Data Collection
                </h2>
                <p style={{ marginBottom: 16 }}>
                  We store your custom board rankings in your browser's local storage. We do not collect personal information, require account creation, or use tracking cookies.
                </p>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: '#f59e0b', marginBottom: 8, marginTop: 24 }}>
                  Third-Party Services
                </h2>
                <p style={{ marginBottom: 16 }}>
                  This site fetches data from third-party APIs (Sleeper, FantasyCalc) to display player information. These services have their own privacy policies.
                </p>
                <p style={{ color: '#6b7280', marginTop: 32 }}>
                  Full privacy policy coming soon. For questions, contact us via the partner link in the footer.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #0f1117 0%, #0a0c12 100%)',
      borderTop: '1px solid #1e2133',
      padding: '24px 24px 20px',
      marginTop: 40,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
      }}>
        {/* Left: Site name / logo mark */}
        <div style={{ minWidth: 180 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            color: '#f59e0b',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Dynasty Rookie Scout
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#4b5563',
          }}>
            2026 Class Scouting Tool
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <button
              onClick={() => setActivePage('terms')}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Terms of Use
            </button>
            <button
              onClick={() => setActivePage('privacy')}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Center: Data credits */}
        <div style={{
          flex: 1,
          minWidth: 280,
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: '#6b7280',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Data Sources
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            lineHeight: 1.8,
            color: '#9ca3af',
          }}>
            <div>
              <strong style={{ color: '#d1d5db' }}>PFF</strong> — Statistical data provided by Pro Football Focus (PFF). Used under license.
            </div>
            <div>
              <strong style={{ color: '#d1d5db' }}>nflmockdraftdatabase.com</strong> — Draft projection data provided by NFL Mock Draft Database. Used under license.
            </div>
            <div>
              <strong style={{ color: '#d1d5db' }}>FantasyCalc</strong> — Dynasty value data sourced from FantasyCalc.
            </div>
          </div>
        </div>

        {/* Right: Partner link */}
        <div style={{
          textAlign: 'right',
          minWidth: 160,
        }}>
          <a
            href="mailto:partnerships@dynastyrookiescout.com"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: '#f59e0b',
              textDecoration: 'none',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 4,
              padding: '8px 16px',
              display: 'inline-block',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
            }}
          >
            Advertise / Partner
          </a>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: '#4b5563',
            marginTop: 8,
          }}>
            partnerships@dynastyrookiescout.com
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div style={{
        textAlign: 'center',
        marginTop: 20,
        paddingTop: 12,
        borderTop: '1px solid #1a1d2e',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: '#4b5563',
      }}>
        &copy; {new Date().getFullYear()} Dynasty Rookie Scout. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
