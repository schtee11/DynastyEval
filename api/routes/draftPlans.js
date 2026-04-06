const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Auto-create table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS draft_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        league_id VARCHAR(64) NOT NULL,
        plans JSONB NOT NULL DEFAULT '{}',
        live_picks JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, league_id)
      )
    `);
  } catch (err) {
    console.error('[DraftPlans] Table init error:', err.message);
  }
})();

// GET /api/draft-plans/:leagueId
router.get('/:leagueId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plans, live_picks FROM draft_plans WHERE user_id = $1 AND league_id = $2',
      [req.user.id, req.params.leagueId]
    );
    if (result.rows.length === 0) {
      return res.json({ plans: {}, live_picks: [] });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/draft-plans/:leagueId
router.put('/:leagueId', requireAuth, async (req, res) => {
  try {
    const { plans, live_picks } = req.body;
    await pool.query(
      `INSERT INTO draft_plans (user_id, league_id, plans, live_picks, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, league_id) DO UPDATE SET
         plans = COALESCE($3, draft_plans.plans),
         live_picks = COALESCE($4, draft_plans.live_picks),
         updated_at = NOW()`,
      [req.user.id, req.params.leagueId, JSON.stringify(plans || {}), JSON.stringify(live_picks || [])]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
