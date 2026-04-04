import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Signup prompt overlay shown after the free preview limit.
 * Blurs the background and prompts user to create a free account.
 */
const SignupGate = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 16,
        padding: '40px 32px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 8,
          lineHeight: 1.1,
        }}>
          Keep Scouting
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Create a free account to browse all 200+ prospects, join discussions, and build your draft board.
        </p>

        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          Create Free Account
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: 10,
            border: '1px solid var(--border-primary)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
          }}
        >
          Already have an account? Sign in
        </button>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'var(--text-tertiary)',
          marginTop: 16,
        }}>
          Free forever. No credit card required.
        </p>
      </div>
    </div>
  );
};

export default SignupGate;
