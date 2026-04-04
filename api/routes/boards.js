const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/boards — list user's boards
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM boards WHERE owner_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ boards: result.rows });
  } catch (err) {
    console.error('[Boards] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// GET /api/boards/public — list public boards
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.username FROM boards b
       LEFT JOIN users u ON b.owner_id = u.id
       WHERE b.visibility = 'public'
       ORDER BY b.likes_count DESC, b.updated_at DESC
       LIMIT 50`
    );
    res.json({ boards: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public boards' });
  }
});

// POST /api/boards — create a board
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, format, player_ids, visibility } = req.body;

    // Normalize format to match DB constraint ('1QB' or 'SF')
    const dbFormat = format === 'oneQB' ? '1QB' : format === 'superflex' ? 'SF' : (format || '1QB');

    const result = await pool.query(
      `INSERT INTO boards (owner_id, name, format, player_ids, visibility)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        req.user.id,
        name || 'My Board',
        dbFormat,
        JSON.stringify(player_ids || []),
        visibility || 'private',
      ]
    );

    res.status(201).json({ board: result.rows[0] });
  } catch (err) {
    console.error('[Boards] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// GET /api/boards/:id — get a board (owner or public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.username FROM boards b
       LEFT JOIN users u ON b.owner_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const board = result.rows[0];
    if (board.visibility === 'private' && (!req.user || req.user.id !== board.owner_id)) {
      return res.status(403).json({ error: 'Private board' });
    }

    res.json({ board });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// PATCH /api/boards/:id — update a board
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { name, player_ids, visibility } = req.body;

    const existing = await pool.query(
      'SELECT owner_id FROM boards WHERE id = $1',
      [req.params.id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your board' });

    const result = await pool.query(
      `UPDATE boards SET
        name = COALESCE($1, name),
        player_ids = COALESCE($2, player_ids),
        visibility = COALESCE($3, visibility),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name ?? null, player_ids ? JSON.stringify(player_ids) : null, visibility ?? null, req.params.id]
    );

    res.json({ board: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// POST /api/boards/:id/share — generate share link
router.post('/:id/share', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT owner_id, share_token FROM boards WHERE id = $1',
      [req.params.id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not your board' });

    let token = existing.rows[0].share_token;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      await pool.query(
        `UPDATE boards SET share_token = $1, visibility = 'shared' WHERE id = $2`,
        [token, req.params.id]
      );
    }

    res.json({ shareToken: token });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// GET /api/boards/shared/:token — view shared board
router.get('/shared/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.username FROM boards b
       LEFT JOIN users u ON b.owner_id = u.id
       WHERE b.share_token = $1`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ board: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shared board' });
  }
});

// POST /api/boards/:id/fork — copy someone's board
router.post('/:id/fork', requireAuth, async (req, res) => {
  try {
    const source = await pool.query('SELECT * FROM boards WHERE id = $1', [req.params.id]);
    if (source.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const board = source.rows[0];
    if (board.visibility === 'private' && board.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot fork private board' });
    }

    const result = await pool.query(
      `INSERT INTO boards (owner_id, name, format, player_ids, visibility)
       VALUES ($1, $2, $3, $4, 'private') RETURNING *`,
      [req.user.id, `${board.name} (copy)`, board.format, board.player_ids]
    );

    res.status(201).json({ board: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fork board' });
  }
});

// DELETE /api/boards/:id — delete a board
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM boards WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

module.exports = router;
