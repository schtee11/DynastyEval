const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Simple admin check — first registered user is admin
// In production, add a proper role system
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0 || result.rows[0].id !== req.user.id) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Auth check failed' });
  }
};

// GET /api/admin/manual-stats — list all manual stat overrides
router.get('/manual-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM manual_stats ORDER BY player_name ASC'
    );
    res.json({ stats: result.rows });
  } catch (err) {
    console.error('[Admin] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch manual stats' });
  }
});

// PUT /api/admin/manual-stats/:name — upsert manual stats for a player
router.put('/manual-stats/:name', requireAuth, requireAdmin, async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.name);
    const { yprr, target_share, adot, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO manual_stats (player_name, yprr, target_share, adot, notes, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (player_name) DO UPDATE SET
         yprr = COALESCE($2, manual_stats.yprr),
         target_share = COALESCE($3, manual_stats.target_share),
         adot = COALESCE($4, manual_stats.adot),
         notes = COALESCE($5, manual_stats.notes),
         updated_at = NOW(),
         updated_by = $6
       RETURNING *`,
      [playerName, yprr ?? null, target_share ?? null, adot ?? null, notes ?? null, req.user.id]
    );

    res.json({ stat: result.rows[0] });
  } catch (err) {
    console.error('[Admin] Upsert error:', err.message);
    res.status(500).json({ error: 'Failed to save manual stats' });
  }
});

// DELETE /api/admin/manual-stats/:name — remove manual stats for a player
router.delete('/manual-stats/:name', requireAuth, requireAdmin, async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.name);
    await pool.query('DELETE FROM manual_stats WHERE player_name = $1', [playerName]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// GET /api/admin/manual-stats/export — get all manual stats as a map (used by frontend)
router.get('/manual-stats/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM manual_stats');
    const map = {};
    for (const row of result.rows) {
      map[row.player_name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()] = {
        yprr: row.yprr ? parseFloat(row.yprr) : null,
        targetShare: row.target_share ? parseFloat(row.target_share) : null,
        adot: row.adot ? parseFloat(row.adot) : null,
        notes: row.notes,
      };
    }
    res.json({ manualStats: map });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

module.exports = router;
