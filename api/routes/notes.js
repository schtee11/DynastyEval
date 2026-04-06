const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Auto-create table on first load
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        player_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, player_id)
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_player_notes_user ON player_notes(user_id)');
  } catch (err) {
    console.error('[Notes] Table init error:', err.message);
  }
})();

// GET /api/notes — all notes for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player_notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error('[Notes] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:playerId — note for specific player
router.get('/:playerId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player_notes WHERE user_id = $1 AND player_id = $2',
      [req.user.id, req.params.playerId]
    );
    res.json({ note: result.rows[0] || null });
  } catch (err) {
    console.error('[Notes] Get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// PUT /api/notes/:playerId — upsert note
router.put('/:playerId', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: 'content is required' });
    }
    const result = await pool.query(
      `INSERT INTO player_notes (user_id, player_id, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, player_id)
       DO UPDATE SET content = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.id, req.params.playerId, content]
    );
    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error('[Notes] Upsert error:', err.message);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// DELETE /api/notes/:playerId — delete note
router.delete('/:playerId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM player_notes WHERE user_id = $1 AND player_id = $2',
      [req.user.id, req.params.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Notes] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
