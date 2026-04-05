const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SLEEPER_BASE = 'https://api.sleeper.app/v1';

// Auto-create table on first load
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sleeper_leagues (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sleeper_user_id VARCHAR(64) NOT NULL,
        sleeper_username VARCHAR(100),
        league_id VARCHAR(64) NOT NULL,
        league_name VARCHAR(255),
        season VARCHAR(4) NOT NULL,
        format VARCHAR(20) DEFAULT '1QB',
        scoring_settings JSONB DEFAULT '{}',
        roster_positions JSONB DEFAULT '[]',
        draft_picks JSONB DEFAULT '[]',
        synced_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, league_id)
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sleeper_leagues_user ON sleeper_leagues(user_id)');
  } catch (err) {
    console.error('[Sleeper] Table init error:', err.message);
  }
})();

async function sleeperFetch(path) {
  const url = `${SLEEPER_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sleeper API ${res.status} for ${path}`);
  const text = await res.text();
  if (!text || text === 'null') return null;
  return JSON.parse(text);
}

// Determine league format from roster positions
function detectFormat(rosterPositions) {
  if (!Array.isArray(rosterPositions)) return '1QB';
  const superflexSlots = rosterPositions.filter(p => p === 'SUPER_FLEX' || p === 'QB');
  return superflexSlots.length >= 2 ? 'SF' : '1QB';
}

// GET /api/sleeper/user/:username — look up a Sleeper user
router.get('/user/:username', requireAuth, async (req, res) => {
  try {
    const data = await sleeperFetch(`/user/${encodeURIComponent(req.params.username)}`);
    if (!data || !data.user_id) {
      return res.status(404).json({ error: 'Sleeper user not found' });
    }
    res.json({
      sleeper_user_id: data.user_id,
      username: data.username,
      display_name: data.display_name,
      avatar: data.avatar,
    });
  } catch (err) {
    console.error('[Sleeper] User lookup error:', err.message);
    res.status(500).json({ error: 'Failed to look up Sleeper user: ' + err.message });
  }
});

// GET /api/sleeper/leagues/:sleeperUserId/:season — list user's leagues
router.get('/leagues/:sleeperUserId/:season', requireAuth, async (req, res) => {
  try {
    const { sleeperUserId, season } = req.params;
    const leagues = await sleeperFetch(`/user/${sleeperUserId}/leagues/nfl/${season}`);

    // Filter to dynasty leagues only
    const dynastyLeagues = (leagues || [])
      .filter(l => l.settings?.type === 2) // type 2 = dynasty
      .map(l => ({
        league_id: l.league_id,
        name: l.name,
        total_rosters: l.total_rosters,
        format: detectFormat(l.roster_positions),
        roster_positions: l.roster_positions,
        scoring_settings: l.scoring_settings,
        season: l.season,
        status: l.status,
      }));

    res.json({ leagues: dynastyLeagues });
  } catch (err) {
    console.error('[Sleeper] Leagues error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leagues: ' + err.message });
  }
});

// POST /api/sleeper/sync — sync a specific league for the current user
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { sleeper_user_id, sleeper_username, league_id, season } = req.body;

    if (!sleeper_user_id || !league_id) {
      return res.status(400).json({ error: 'sleeper_user_id and league_id are required' });
    }

    const yr = season || '2025';

    // Fetch league details
    const league = await sleeperFetch(`/league/${league_id}`);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const format = detectFormat(league.roster_positions);

    // Fetch rosters to find the user's roster_id
    const rosters = await sleeperFetch(`/league/${league_id}/rosters`);
    const userRoster = rosters.find(r => r.owner_id === sleeper_user_id);

    // Fetch traded picks for this league
    let draftPicks = [];
    if (userRoster) {
      try {
        const picks = await sleeperFetch(`/league/${league_id}/traded_picks`);
        // Build the user's pick ownership
        // Start with original picks (all rounds for their roster)
        const totalRounds = league.settings?.draft_rounds || 4;
        const ownedPicks = [];

        for (let round = 1; round <= totalRounds; round++) {
          ownedPicks.push({
            round,
            roster_id: userRoster.roster_id,
            original_owner_id: userRoster.roster_id,
            season: yr,
          });
        }

        // Apply trades: remove picks traded away, add picks traded in
        for (const trade of (picks || [])) {
          if (trade.season !== yr) continue;

          // Traded away from user
          if (trade.previous_owner_id === userRoster.roster_id) {
            const idx = ownedPicks.findIndex(
              p => p.round === trade.round && p.original_owner_id === trade.roster_id && p.season === yr
            );
            if (idx >= 0) ownedPicks.splice(idx, 1);
          }

          // Traded to user
          if (trade.owner_id === userRoster.roster_id) {
            ownedPicks.push({
              round: trade.round,
              roster_id: trade.owner_id,
              original_owner_id: trade.roster_id,
              season: yr,
            });
          }
        }

        draftPicks = ownedPicks.sort((a, b) => a.round - b.round);
      } catch (err) {
        console.error('[Sleeper] Draft picks error:', err.message);
        // Not fatal — continue without picks
      }
    }

    // Upsert into database
    await pool.query(
      `INSERT INTO sleeper_leagues
        (user_id, sleeper_user_id, sleeper_username, league_id, league_name, season, format, scoring_settings, roster_positions, draft_picks, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id, league_id) DO UPDATE SET
        sleeper_username = $3,
        league_name = $5,
        season = $6,
        format = $7,
        scoring_settings = $8,
        roster_positions = $9,
        draft_picks = $10,
        synced_at = NOW()`,
      [
        req.user.id,
        sleeper_user_id,
        sleeper_username || null,
        league_id,
        league.name,
        yr,
        format,
        JSON.stringify(league.scoring_settings || {}),
        JSON.stringify(league.roster_positions || []),
        JSON.stringify(draftPicks),
      ]
    );

    res.json({
      league_id,
      league_name: league.name,
      format,
      draft_picks: draftPicks,
      roster_positions: league.roster_positions,
    });
  } catch (err) {
    console.error('[Sleeper] Sync error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to sync league: ' + err.message });
  }
});

// GET /api/sleeper/my-leagues — get current user's synced leagues
router.get('/my-leagues', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT league_id, league_name, season, format, draft_picks, roster_positions, sleeper_username, synced_at
       FROM sleeper_leagues WHERE user_id = $1 ORDER BY synced_at DESC`,
      [req.user.id]
    );
    res.json({ leagues: result.rows });
  } catch (err) {
    console.error('[Sleeper] My leagues error:', err.message);
    res.status(500).json({ error: 'Failed to fetch synced leagues' });
  }
});

// DELETE /api/sleeper/league/:leagueId — unlink a league
router.delete('/league/:leagueId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM sleeper_leagues WHERE user_id = $1 AND league_id = $2',
      [req.user.id, req.params.leagueId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Sleeper] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to unlink league' });
  }
});

module.exports = router;
