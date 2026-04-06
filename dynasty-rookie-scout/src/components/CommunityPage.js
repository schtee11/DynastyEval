import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllDiscussions, fetchDiscussions, voteDiscussion } from '../services/apiClient';
import VoteButton from './VoteButton';
import DiscussionThread from './DiscussionThread';
import CreateDiscussion from './CreateDiscussion';

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
};

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CommunityPage = ({ players = [] }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [discussions, setDiscussions] = useState([]);
  const [sort, setSort] = useState('hot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [filterPlayerId, setFilterPlayerId] = useState(() => {
    const p = searchParams.get('player');
    return p ? Number(p) : null;
  });
  const [showCreate, setShowCreate] = useState(false);

  // Build player lookup for names
  const playerMap = React.useMemo(() => {
    const map = {};
    for (const p of players) {
      map[String(p.id)] = p;
      if (p.sleeperId) map[p.sleeperId] = p;
    }
    return map;
  }, [players]);

  const filteredPlayer = filterPlayerId ? playerMap[String(filterPlayerId)] : null;

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (filterPlayerId) {
        const result = await fetchDiscussions(String(filterPlayerId), sort);
        data = result.discussions || [];
      } else {
        const result = await fetchAllDiscussions(sort, 50, 0);
        data = result.discussions || [];
      }
      setDiscussions(data);
    } catch (err) {
      setError(err.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [sort, filterPlayerId]);

  useEffect(() => { loadDiscussions(); }, [loadDiscussions]);

  const handleVote = async (id, direction) => {
    if (!user) return;
    try {
      const { upvote_count, vote } = await voteDiscussion(id, direction);
      setDiscussions(prev => prev.map(d =>
        d.id === id ? { ...d, upvote_count, userVote: vote } : d
      ));
    } catch { /* ignore */ }
  };

  const handleCreated = (newDiscussion) => {
    setDiscussions(prev => [{ ...newDiscussion, username: user?.username, userVote: 0 }, ...prev]);
    setShowCreate(false);
  };

  const sortTabs = [
    { key: 'hot', label: 'Hot' },
    { key: 'new', label: 'New' },
    { key: 'top', label: 'Top' },
  ];

  // Thread view
  if (activeThreadId) {
    const activeThread = discussions.find(d => d.id === activeThreadId);
    const threadPlayer = activeThread ? playerMap[String(activeThread.player_id)] : null;
    return (
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '16px 16px 80px',
      }}>
        {/* Back to feed */}
        <button
          onClick={() => setActiveThreadId(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20, fontWeight: 800,
            color: 'var(--accent-text)',
            padding: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 16,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Community
        </button>

        {/* Player context */}
        {threadPlayer && (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: 'var(--text-tertiary)',
            textTransform: 'uppercase', letterSpacing: 0.5,
            marginBottom: 12,
          }}>
            {threadPlayer.position} — {threadPlayer.name}
          </div>
        )}

        <DiscussionThread
          discussionId={activeThreadId}
          onBack={() => setActiveThreadId(null)}
        />
      </div>
    );
  }

  // Feed view
  return (
    <div style={{
      maxWidth: 680,
      margin: '0 auto',
      padding: '16px 16px 80px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Community
        </h1>
        {user && filterPlayerId && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + New Thread
          </button>
        )}
      </div>

      {/* Player filter badge */}
      {filteredPlayer && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 12,
          padding: '8px 12px',
          background: 'var(--accent-light)',
          borderRadius: 6,
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13, fontWeight: 600,
            color: 'var(--accent-text)',
            flex: 1,
          }}>
            {filteredPlayer.position} — {filteredPlayer.name}
          </span>
          <button
            onClick={() => { setFilterPlayerId(null); setSearchParams({}); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 18,
              color: 'var(--accent-text)', padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Create thread form (player-filtered only) */}
      {showCreate && filterPlayerId && (
        <div style={{ marginBottom: 16 }}>
          <CreateDiscussion
            playerId={filterPlayerId}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Sort tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
      }}>
        {sortTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '6px 16px',
              border: '1px solid',
              borderColor: sort === tab.key ? 'var(--accent)' : 'var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              background: sort === tab.key ? 'var(--accent-light)' : 'transparent',
              color: sort === tab.key ? 'var(--accent-text)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div style={{
          padding: 20, textAlign: 'center',
          color: 'var(--danger)', fontSize: 14,
          fontFamily: "'Inter', sans-serif",
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && discussions.length === 0 && (
        <div style={{
          padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontFamily: "'Inter', sans-serif", fontSize: 14,
        }}>
          No discussions yet. Be the first to start a conversation!
        </div>
      )}

      {/* Discussion list */}
      {!loading && discussions.map(d => {
        const player = playerMap[String(d.player_id)];
        return (
          <div
            key={d.id}
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid var(--border-primary)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveThreadId(d.id)}
          >
            {/* Vote */}
            <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <VoteButton
                upvoteCount={d.upvote_count}
                userVote={d.userVote}
                onVote={(dir) => handleVote(d.id, dir)}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Player badge (hide when filtered to one player) */}
              {player && !filterPlayerId && (
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: 'var(--accent-text)',
                  background: 'var(--accent-light)',
                  padding: '2px 8px',
                  borderRadius: 3,
                  marginRight: 8,
                }}>
                  {player.position} — {player.name}
                </span>
              )}

              {/* Title */}
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: player && !filterPlayerId ? 6 : 0,
                lineHeight: 1.3,
              }}>
                {d.title}
              </div>

              {/* Preview */}
              {d.content && (
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: 'var(--text-tertiary)',
                  marginTop: 4,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {d.content}
                </div>
              )}

              {/* Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text-tertiary)',
              }}>
                <span>{d.username || 'Anonymous'}</span>
                <span>{timeAgo(d.created_at)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CommentIcon /> {d.comment_count}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommunityPage;
