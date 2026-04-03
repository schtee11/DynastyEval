import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createDiscussion } from '../services/apiClient';

/**
 * Form to create a new discussion thread for a player.
 */
const CreateDiscussion = ({ playerId, onCreated, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await createDiscussion(
        String(playerId),
        title.trim(),
        content.trim() || null,
        url.trim() || null
      );
      if (onCreated) onCreated(result.discussion);
      setTitle('');
      setContent('');
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: 16,
      background: 'var(--bg-card)',
      borderRadius: 10,
      border: '1px solid var(--border-primary)',
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16,
        fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12,
      }}>
        New Thread
      </div>

      <input
        type="text"
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={300}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 6,
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          fontFamily: "'Inter', sans-serif", fontSize: 14,
          outline: 'none', marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />

      <textarea
        placeholder="What's on your mind? (optional)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 6,
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          resize: 'vertical', outline: 'none', marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />

      <input
        type="url"
        placeholder="Link (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 6,
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          outline: 'none', marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      {error && (
        <div style={{
          color: '#ef4444', fontSize: 12, marginBottom: 8,
          padding: '6px 10px', background: 'rgba(239,68,68,0.1)',
          borderRadius: 6,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            opacity: !title.trim() || submitting ? 0.5 : 1,
          }}
        >
          {submitting ? 'Posting...' : 'Post Thread'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 20px', borderRadius: 6,
              border: '1px solid var(--border-primary)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CreateDiscussion;
