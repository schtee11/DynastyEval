import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 400, margin: '60px auto', padding: '32px 24px',
      background: 'var(--bg-secondary)', borderRadius: 12,
      border: '1px solid var(--border-color)',
    }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28,
        fontWeight: 700, textAlign: 'center', marginBottom: 24,
        color: 'var(--text-primary)',
      }}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        {mode === 'register' && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            style={inputStyle}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />

        {error && (
          <div style={{
            color: '#ef4444', fontSize: 13, padding: '8px 12px',
            background: 'rgba(239,68,68,0.1)', borderRadius: 6,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 15,
            fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p style={{
        textAlign: 'center', marginTop: 20, fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

const inputStyle = {
  padding: '12px 14px', borderRadius: 8, fontSize: 15,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)', color: 'var(--text-primary)',
  outline: 'none',
};

export default AuthPage;
