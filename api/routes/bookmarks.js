const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookmarks — all bookmarks for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ bookmarks: result.rows });
  } catch (err) {
    console.error('[Bookmarks] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/bookmarks/:playerId — add bookmark
router.post('/:playerId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO bookmarks (user_id, player_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, player_id) DO NOTHING
       RETURNING *`,
      [req.user.id, req.params.playerId]
    );
    res.status(201).json({ bookmark: result.rows[0] || { user_id: req.user.id, player_id: req.params.playerId } });
  } catch (err) {
    console.error('[Bookmarks] Add error:', err.message);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// DELETE /api/bookmarks/:playerId — remove bookmark
router.delete('/:playerId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND player_id = $2',
      [req.user.id, req.params.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Bookmarks] Remove error:', err.message);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

module.exports = router;
