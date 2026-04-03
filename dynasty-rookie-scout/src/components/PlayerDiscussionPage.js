import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiscussionFeed from './DiscussionFeed';
import DiscussionThread from './DiscussionThread';

/**
 * Standalone page for a player's discussions.
 * Shows feed view or single thread view.
 */
const PlayerDiscussionPage = ({ players }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeThreadId, setActiveThreadId] = useState(null);
  const playerId = Number(id);
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Player not found
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {player.name}
        </button>
      </div>

      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24, fontWeight: 800,
        color: 'var(--text-primary)', margin: '0 0 20px',
      }}>
        Discussions
      </h2>

      {activeThreadId ? (
        <DiscussionThread
          discussionId={activeThreadId}
          onBack={() => setActiveThreadId(null)}
        />
      ) : (
        <DiscussionFeed
          playerId={playerId}
          onOpenThread={(threadId) => setActiveThreadId(threadId)}
        />
      )}
    </div>
  );
};

export default PlayerDiscussionPage;
