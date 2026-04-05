import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDiscussions, voteDiscussion } from '../services/apiClient';
import VoteButton from './VoteButton';
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

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

/**
 * Reddit-style discussion thread list for a player.
 * Shows threads sorted by hot/new/top with vote counts.
 */
const DiscussionFeed = ({ playerId, onOpenThread }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('new');
  const [showCreate, setShowCreate] = useState(false);

  const loadDiscussions = useCallback(async () => {
    const cacheKey = `drs_disc_${playerId}_${sort}`;

    // Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 5 * 60 * 1000) {
          setDiscussions(data);
          setLoading(false);
          return;
        }
      }
    } catch {}

    setLoading(true);
    try {
      const result = await fetchDiscussions(String(playerId), sort);
      const data = result.discussions || [];
      setDiscussions(data);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
    } catch (err) {
      console.error('[DiscussionFeed] Load error:', err);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [playerId, sort]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  const handleVote = async (discussionId, direction) => {
    try {
      const result = await voteDiscussion(discussionId, direction);
      setDiscussions(prev => prev.map(d => {
        if (d.id !== discussionId) return d;
        return { ...d, upvote_count: result.upvote_count, userVote: result.vote };
      }));
      // Clear stale cache so other pages see the updated count
      try { sessionStorage.removeItem(`drs_disc_${playerId}_${sort}`); } catch {}
    } catch (err) {
      console.error('[DiscussionFeed] Vote error:', err);
    }
  };

  const handleCreated = (newDiscussion) => {
    setDiscussions(prev => [{ ...newDiscussion, username: user?.username, userVote: 0 }, ...prev]);
    setShowCreate(false);
  };

  const sortTabs = [
    { id: 'hot', label: 'Hot' },
    { id: 'new', label: 'New' },
    { id: 'top', label: 'Top' },
  ];

  return (
    <div>
      {/* Header: sort tabs + new thread button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {sortTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSort(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: sort === tab.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: sort === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {user && (
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

      {/* Create thread form */}
      {showCreate && (
        <div style={{ marginBottom: 16 }}>
          <CreateDiscussion
            playerId={playerId}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div style={{
          padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)', fontSize: 13,
        }}>
          Loading discussions...
        </div>
      ) : discussions.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 8 }}>
            No threads yet
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            {user ? 'Be the first to start a discussion!' : 'Sign in to start a discussion.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {discussions.map(d => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-card)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={() => onOpenThread && onOpenThread(d.id)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              {/* Vote column */}
              <div onClick={e => e.stopPropagation()}>
                <VoteButton
                  upvoteCount={d.upvote_count || 0}
                  userVote={d.userVote || 0}
                  onVote={(dir) => handleVote(d.id, dir)}
                />
              </div>

              {/* Thread content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  color: 'var(--text-primary)', marginBottom: 4,
                  lineHeight: 1.3,
                }}>
                  {d.title}
                  {d.url && (
                    <span style={{
                      marginLeft: 6, color: 'var(--accent-text)',
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                      <LinkIcon />
                    </span>
                  )}
                </div>
                {d.content && (
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: 'var(--text-secondary)', marginBottom: 6,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {d.content}
                  </div>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: "'Inter', sans-serif", fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}>
                  <span style={{ fontWeight: 600 }}>
                    {d.username || 'Anonymous'}
                  </span>
                  <span>{timeAgo(d.created_at)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <CommentIcon />
                    {d.comment_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign in prompt */}
      {!user && discussions.length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'var(--accent-light)', borderRadius: 8,
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: 'var(--accent-text)', fontWeight: 600,
        }}>
          Sign in to join the discussion
        </div>
      )}
    </div>
  );
};

export default DiscussionFeed;
