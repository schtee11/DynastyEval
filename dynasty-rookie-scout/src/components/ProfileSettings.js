import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/apiClient';

const ProfileSettings = () => {
  const { user, updateProfile, logout } = useAuth();

  // Profile form
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Re-sync form when user data loads (e.g. after AuthContext finishes fetchMe)
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdErr, setPwdErr] = useState(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setProfileSaving(true);
    try {
      await updateProfile({ username, bio });
      setProfileMsg('Profile updated');
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);

    if (newPwd !== confirmPwd) {
      setPwdErr('Passwords do not match');
      return;
    }
    if (newPwd.length < 8) {
      setPwdErr('Password must be at least 8 characters');
      return;
    }

    setPwdSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      setPwdMsg('Password changed successfully');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdErr(err.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        fontFamily: "'Inter', sans-serif", color: 'var(--text-secondary)',
      }}>
        Sign in to manage your profile.
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 520,
      margin: '0 auto',
      padding: '24px 20px 60px',
    }}>
      {/* Header */}
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
        margin: '0 0 24px',
      }}>
        Account Settings
      </h1>

      {/* User info summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        marginBottom: 28,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 20, color: 'var(--accent-text)',
        }}>
          {user.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
            color: 'var(--text-primary)',
          }}>
            {user.username}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            color: 'var(--text-tertiary)',
          }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <Section title="Profile">
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" disabled>
            <input
              type="email"
              value={user.email}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            />
          </Field>

          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              style={inputStyle}
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us about your dynasty strategy..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
            />
            <div style={{
              fontSize: 11, color: 'var(--text-tertiary)',
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'right', marginTop: 2,
            }}>
              {bio.length}/500
            </div>
          </Field>

          {profileMsg && <Msg type="success">{profileMsg}</Msg>}
          {profileErr && <Msg type="error">{profileErr}</Msg>}

          <button type="submit" disabled={profileSaving} style={btnPrimary}>
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Password form */}
      <Section title="Change Password">
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Current Password">
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="New Password">
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
          </Field>

          <Field label="Confirm New Password">
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
          </Field>

          {pwdMsg && <Msg type="success">{pwdMsg}</Msg>}
          {pwdErr && <Msg type="error">{pwdErr}</Msg>}

          <button type="submit" disabled={pwdSaving} style={btnPrimary}>
            {pwdSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* Danger zone */}
      <Section title="Session">
        <button onClick={logout} style={btnDanger}>
          Sign Out
        </button>
      </Section>
    </div>
  );
};

/* ── Shared sub-components ── */

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      margin: '0 0 12px',
      paddingBottom: 8,
      borderBottom: '1px solid var(--border-primary)',
    }}>
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, children, disabled }) => (
  <div>
    <label style={{
      display: 'block',
      fontFamily: "'Inter', sans-serif",
      fontSize: 12,
      fontWeight: 600,
      color: disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
      marginBottom: 4,
    }}>
      {label}
    </label>
    {children}
  </div>
);

const Msg = ({ type, children }) => (
  <div style={{
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 6,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    color: type === 'error' ? 'var(--danger)' : 'var(--success)',
    background: type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
  }}>
    {children}
  </div>
);

/* ── Styles ── */

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '11px 20px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

const btnDanger = {
  padding: '11px 20px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--danger)',
  background: 'var(--danger-light)',
  color: 'var(--danger)',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  cursor: 'pointer',
  width: '100%',
};

export default ProfileSettings;
