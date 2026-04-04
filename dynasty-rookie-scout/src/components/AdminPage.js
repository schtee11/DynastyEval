import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers } from '../services/dataService';
import apiFetch from '../services/apiClient';

const AdminPage = ({ players: propPlayers }) => {
  const { user } = useAuth();
  const [localPlayers, setLocalPlayers] = useState([]);
  const [manualStats, setManualStats] = useState({});
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [form, setForm] = useState({ yprr: '', target_share: '', adot: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);

  // Use prop players if available, otherwise fetch directly
  const players = (propPlayers && propPlayers.length > 0) ? propPlayers : localPlayers;

  useEffect(() => {
    if (!propPlayers || propPlayers.length === 0) {
      getPlayers().then(data => setLocalPlayers(data)).catch(() => {});
    }
  }, [propPlayers]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch('/api/admin/manual-stats');
      const map = {};
      for (const s of data.stats) {
        map[s.player_name] = s;
      }
      setManualStats(map);
    } catch (err) {
      console.warn('Failed to load manual stats:', err.message);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleEdit = (playerName) => {
    const existing = manualStats[playerName];
    setEditingPlayer(playerName);
    setForm({
      yprr: existing?.yprr ?? '',
      target_share: existing?.target_share ?? '',
      adot: existing?.adot ?? '',
      notes: existing?.notes ?? '',
    });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editingPlayer) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/manual-stats/${encodeURIComponent(editingPlayer)}`, {
        method: 'PUT',
        body: JSON.stringify({
          yprr: form.yprr ? parseFloat(form.yprr) : null,
          target_share: form.target_share ? parseFloat(form.target_share) : null,
          adot: form.adot ? parseFloat(form.adot) : null,
          notes: form.notes || null,
        }),
      });
      setMessage({ type: 'success', text: `Saved ${editingPlayer}` });
      setEditingPlayer(null);
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Sign in to access admin panel
      </div>
    );
  }

  const allWrTe = (players || [])
    .filter(p => ['WR', 'TE'].includes(p.position))
    .sort((a, b) => (a.rank?.oneQB || 999) - (b.rank?.oneQB || 999));

  const wrTe = allWrTe
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSeedFromStatic = async () => {
    const toSeed = allWrTe
      .filter(p => p.advancedStats?.yprr)
      .map(p => ({
        name: p.name,
        yprr: p.advancedStats.yprr,
      }));

    if (toSeed.length === 0) {
      setMessage({ type: 'error', text: 'No static YPRR data to seed' });
      return;
    }

    try {
      const result = await apiFetch('/api/admin/manual-stats/seed', {
        method: 'POST',
        body: JSON.stringify({ players: toSeed }),
      });
      setMessage({ type: 'success', text: `Seeded ${result.inserted} players from static data` });
      loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28,
        fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4,
      }}>
        Admin — Manual Stats
      </h1>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 8,
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 13,
          color: 'var(--text-tertiary)', margin: 0,
        }}>
          Override YPRR, target share, ADOT for WR/TE prospects. DB values take priority over static data.
        </p>
        {Object.keys(manualStats).length === 0 && (
          <button onClick={handleSeedFromStatic} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: "'Inter', sans-serif",
          }}>
            Seed from static data
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: '8px 14px', borderRadius: 6, marginBottom: 16,
          background: message.type === 'success' ? 'var(--success-light)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? 'var(--success)' : '#ef4444',
          fontSize: 13, fontWeight: 600,
        }}>
          {message.text}
        </div>
      )}

      {/* Edit modal */}
      {editingPlayer && (
        <>
          <div onClick={() => setEditingPlayer(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 210,
            background: 'var(--bg-primary)', borderRadius: 12,
            border: '1px solid var(--border-primary)',
            padding: 24, width: 400, maxWidth: '90vw',
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
              fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16,
            }}>
              {editingPlayer}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={labelStyle}>
                YPRR
                <input type="number" step="0.01" value={form.yprr}
                  onChange={e => setForm(f => ({ ...f, yprr: e.target.value }))}
                  style={inputStyle} placeholder="e.g. 2.48" />
              </label>
              <label style={labelStyle}>
                Target Share %
                <input type="number" step="0.1" value={form.target_share}
                  onChange={e => setForm(f => ({ ...f, target_share: e.target.value }))}
                  style={inputStyle} placeholder="e.g. 22.5" />
              </label>
              <label style={labelStyle}>
                ADOT
                <input type="number" step="0.1" value={form.adot}
                  onChange={e => setForm(f => ({ ...f, adot: e.target.value }))}
                  style={inputStyle} placeholder="e.g. 12.9" />
              </label>
              <label style={labelStyle}>
                Notes
                <input type="text" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={inputStyle} placeholder="Source, date, etc." />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 14,
                fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingPlayer(null)} style={{
                padding: '10px 16px', borderRadius: 8,
                border: '1px solid var(--border-primary)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          fontSize: 14, marginBottom: 16, boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      {/* Player table */}
      <div style={{
        border: '1px solid var(--border-primary)', borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
          padding: '10px 14px', background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
          color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <span>Player</span>
          <span>YPRR</span>
          <span>Tgt Share</span>
          <span>ADOT</span>
          <span></span>
        </div>

        {/* Rows */}
        {wrTe.map(p => {
          const ms = manualStats[p.name];
          const staticYprr = p.advancedStats?.yprr;
          const dbYprr = ms?.yprr;

          return (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
              padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center',
            }}>
              <div>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>{p.name}</span>
                <span style={{
                  fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8,
                }}>{p.position} · {p.college}</span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: dbYprr ? 'var(--accent-text)' : staticYprr ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: 600,
              }}>
                {dbYprr ?? staticYprr ?? '—'}
                {dbYprr && <span style={{ fontSize: 9, color: 'var(--accent-text)', marginLeft: 3 }}>DB</span>}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: ms?.target_share ? 'var(--accent-text)' : 'var(--text-tertiary)',
              }}>
                {ms?.target_share ? `${ms.target_share}%` : '—'}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: ms?.adot ? 'var(--accent-text)' : 'var(--text-tertiary)',
              }}>
                {ms?.adot ?? '—'}
              </span>
              <button onClick={() => handleEdit(p.name)} style={{
                padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--border-primary)',
                background: 'transparent', color: 'var(--accent-text)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}>
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const labelStyle = {
  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
  color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4,
};

const inputStyle = {
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-input)', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none',
};

export default AdminPage;
