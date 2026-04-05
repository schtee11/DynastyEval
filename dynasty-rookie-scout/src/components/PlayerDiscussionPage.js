import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DiscussionFeed from './DiscussionFeed';
import DiscussionThread from './DiscussionThread';

/**
 * Standalone page for a player's discussions.
 * Shows feed view or single thread view.
 */
const PlayerDiscussionPage = ({ players }) => {
  const { id } = useParams();
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
      {/* Page title with player context */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        }}>
          {player.name}
        </div>

        {activeThreadId ? (
          <button
            onClick={() => setActiveThreadId(null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 24, fontWeight: 800,
              color: 'var(--accent-text)',
              padding: 0,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Discussions
          </button>
        ) : (
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 24, fontWeight: 800,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Discussions
          </h2>
        )}
      </div>

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
