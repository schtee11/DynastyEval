import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllDiscussions, voteDiscussion } from '../services/apiClient';
import VoteButton from './VoteButton';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [sort, setSort] = useState('hot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build player lookup for names
  const playerMap = React.useMemo(() => {
    const map = {};
    for (const p of players) {
      map[String(p.id)] = p;
      if (p.sleeperId) map[p.sleeperId] = p;
    }
    return map;
  }, [players]);

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { discussions: data } = await fetchAllDiscussions(sort, 50, 0);
      setDiscussions(data);
    } catch (err) {
      setError(err.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [sort]);

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

  const sortTabs = [
    { key: 'hot', label: 'Hot' },
    { key: 'new', label: 'New' },
    { key: 'top', label: 'Top' },
  ];

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
      </div>

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
        <div style={{
          display: 'flex', justifyContent: 'center', padding: 40,
        }}>
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
            onClick={() => navigate(`/player/${d.player_id}/discuss`)}
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
              {/* Player badge */}
              {player && (
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
                marginTop: player ? 6 : 0,
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
