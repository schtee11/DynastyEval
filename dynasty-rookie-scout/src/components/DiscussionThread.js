import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDiscussion, addComment } from '../services/apiClient';
import Comment from './Comment';
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

/**
 * Build a tree of comments from a flat list using parent_id.
 */
const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  for (const c of comments) {
    map[c.id] = { ...c, children: [] };
  }

  for (const c of comments) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  }

  return roots;
};

/**
 * Recursive comment renderer.
 */
const CommentNode = ({ comment, depth, onReply }) => (
  <>
    <Comment comment={comment} depth={depth} onReply={onReply} />
    {comment.children && comment.children.map(child => (
      <CommentNode key={child.id} comment={child} depth={depth + 1} onReply={onReply} />
    ))}
  </>
);

/**
 * Full discussion thread view with nested comments.
 */
const DiscussionThread = ({ discussionId, onBack }) => {
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadThread = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDiscussion(discussionId);
      setDiscussion(result.discussion);
      setComments(result.comments || []);
    } catch (err) {
      console.error('[DiscussionThread] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleAddComment = async (parentId, content) => {
    const result = await addComment(discussionId, content, parentId);
    const newC = { ...result.comment, username: user?.username, children: [] };
    setComments(prev => [...prev, newC]);
  };

  const handleTopLevelComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await handleAddComment(null, newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading thread...
      </div>
    );
  }

  if (!discussion) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Thread not found
      </div>
    );
  }

  const commentTree = buildCommentTree(comments);

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
          color: 'var(--accent-text)', padding: '0 0 12px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to threads
      </button>

      {/* Thread header */}
      <div style={{
        padding: '16px 0',
        borderBottom: '1px solid var(--border-primary)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <VoteButton
            upvoteCount={discussion.upvote_count || 0}
            userVote={0}
            onVote={() => {}}
          />
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)', margin: '0 0 6px',
              lineHeight: 1.3,
            }}>
              {discussion.title}
            </h3>
            {discussion.content && (
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                color: 'var(--text-primary)', lineHeight: 1.6,
                marginBottom: 8,
              }}>
                {discussion.content}
              </div>
            )}
            {discussion.url && (
              <a
                href={discussion.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 13,
                  color: 'var(--accent-text)', fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginBottom: 8,
                }}
                onClick={e => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {new URL(discussion.url).hostname}
              </a>
            )}
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11,
              color: 'var(--text-tertiary)',
              display: 'flex', gap: 8,
            }}>
              <span style={{ fontWeight: 600 }}>{discussion.username || 'Anonymous'}</span>
              <span>{timeAgo(discussion.created_at)}</span>
              <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add comment */}
      {user ? (
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontFamily: "'Inter', sans-serif", fontSize: 14,
              resize: 'vertical', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleTopLevelComment}
            disabled={!newComment.trim() || submitting}
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 6,
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: !newComment.trim() || submitting ? 0.5 : 1,
            }}
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      ) : (
        <div style={{
          marginBottom: 20, padding: '10px 14px',
          background: 'var(--accent-light)', borderRadius: 8,
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: 'var(--accent-text)', fontWeight: 600,
          textAlign: 'center',
        }}>
          Sign in to comment
        </div>
      )}

      {/* Comments */}
      {commentTree.length === 0 ? (
        <div style={{
          padding: '20px 0', textAlign: 'center',
          color: 'var(--text-tertiary)', fontSize: 13,
        }}>
          No comments yet. Be the first!
        </div>
      ) : (
        <div>
          {commentTree.map(c => (
            <CommentNode
              key={c.id}
              comment={c}
              depth={0}
              onReply={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionThread;
