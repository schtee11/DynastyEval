import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
 * Single comment in a discussion thread.
 * Shows author, timestamp, content, and reply button.
 */
const Comment = ({ comment, onReply, depth = 0 }) => {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const maxDepth = 3;
  const indent = Math.min(depth, maxDepth) * 20;

  return (
    <div style={{ marginLeft: indent }}>
      <div style={{
        padding: '12px 0',
        borderLeft: depth > 0 ? '2px solid var(--border-subtle)' : 'none',
        paddingLeft: depth > 0 ? 12 : 0,
      }}>
        {/* Author + time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
        }}>
          {/* Avatar placeholder */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
            fontFamily: "'Inter', sans-serif",
          }}>
            {(comment.username || '?')[0].toUpperCase()}
          </div>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {comment.username || 'Anonymous'}
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11,
            color: 'var(--text-tertiary)',
          }}>
            {timeAgo(comment.created_at)}
          </span>
        </div>

        {/* Content */}
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 14,
          color: 'var(--text-primary)', lineHeight: 1.5,
          marginBottom: 8,
        }}>
          {comment.content}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user && (
            <button
              onClick={() => setShowReply(!showReply)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                color: 'var(--text-tertiary)',
              }}
            >
              Reply
            </button>
          )}
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'var(--text-tertiary)',
          }}>
            {comment.upvote_count || 0} pts
          </span>
        </div>

        {/* Reply form */}
        {showReply && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 6,
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-input)', color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || submitting}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  opacity: !replyText.trim() || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? 'Posting...' : 'Reply'}
              </button>
              <button
                onClick={() => { setShowReply(false); setReplyText(''); }}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: '1px solid var(--border-primary)',
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
