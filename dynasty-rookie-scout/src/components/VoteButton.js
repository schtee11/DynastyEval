import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UpArrow = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const DownArrow = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Reddit-style upvote/downvote button pair.
 */
const VoteButton = ({ upvoteCount = 0, userVote = 0, onVote }) => {
  const { user } = useAuth();

  const handleVote = (direction) => {
    if (!user) return;
    if (onVote) onVote(direction);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
    }}>
      <button
        onClick={() => handleVote(1)}
        disabled={!user}
        style={{
          background: 'none',
          border: 'none',
          cursor: user ? 'pointer' : 'default',
          color: userVote === 1 ? 'var(--accent)' : 'var(--text-tertiary)',
          padding: '2px 4px',
          borderRadius: 4,
          transition: 'color 0.15s',
          opacity: user ? 1 : 0.5,
        }}
        title={user ? 'Upvote' : 'Sign in to vote'}
      >
        <UpArrow filled={userVote === 1} />
      </button>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 700,
        color: userVote === 1 ? 'var(--accent)' : userVote === -1 ? 'var(--danger)' : 'var(--text-secondary)',
        minWidth: 20,
        textAlign: 'center',
      }}>
        {upvoteCount}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={!user}
        style={{
          background: 'none',
          border: 'none',
          cursor: user ? 'pointer' : 'default',
          color: userVote === -1 ? 'var(--danger)' : 'var(--text-tertiary)',
          padding: '2px 4px',
          borderRadius: 4,
          transition: 'color 0.15s',
          opacity: user ? 1 : 0.5,
        }}
        title={user ? 'Downvote' : 'Sign in to vote'}
      >
        <DownArrow filled={userVote === -1} />
      </button>
    </div>
  );
};

export default VoteButton;
