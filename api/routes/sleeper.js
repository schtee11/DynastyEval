const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SLEEPER_BASE = 'https://api.sleeper.app/v1';

// NFL season: current year, but before March use previous year
function getCurrentNflSeason() {
  const now = new Date();
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  return String(year);
}

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
    // Add total_rosters column if missing (for existing tables)
    await pool.query(`
      ALTER TABLE sleeper_leagues ADD COLUMN IF NOT EXISTS total_rosters INTEGER DEFAULT 12
    `);
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

// Derive a leagueProfile object from raw Sleeper data. This is the shape
// the frontend expects in localStorage under 'drs_league_profile'. Keeps
// the frontend free of Sleeper-specific parsing.
function deriveLeagueProfile({ leagueName, rosterPositions, scoringSettings, totalRosters }) {
  const positions = Array.isArray(rosterPositions) ? rosterPositions : [];
  const count = (needle) => positions.filter(p => p === needle).length;

  const starters = {
    qb: count('QB'),
    rb: count('RB'),
    wr: count('WR'),
    te: count('TE'),
    flex: count('FLEX') + count('REC_FLEX') + count('WRRB_FLEX') + count('WRTE_FLEX'),
    superflex: count('SUPER_FLEX'),
  };

  const bench = count('BN');
  const taxi = count('TAXI');

  const s = scoringSettings || {};
  const recVal = Number(s.rec || 0);
  const ppr = recVal >= 0.9 ? 1 : recVal >= 0.4 ? 0.5 : 0;
  const tePremium = Number(s.bonus_rec_te || 0);

  const format = starters.superflex > 0 || starters.qb >= 2 ? 'superflex' : 'oneQB';

  return {
    source: 'sleeper',
    leagueName: leagueName || null,
    format,
    teams: Number(totalRosters) || 12,
    ppr,
    tePremium,
    starters,
    bench,
    taxi,
  };
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

    const yr = season || getCurrentNflSeason();

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
        const tradedPicks = await sleeperFetch(`/league/${league_id}/traded_picks`);

        // Try to get draft order for exact slot positions
        const drafts = await sleeperFetch(`/league/${league_id}/drafts`);
        const currentDraft = (drafts || []).find(d => d.season === yr && d.status !== 'complete')
          || (drafts || []).find(d => d.season === yr)
          || (drafts || [])[0];

        // Build roster_id → draft slot mapping
        const rosterToSlot = {};
        const slotToRoster = currentDraft?.slot_to_roster_id || {};
        if (Object.keys(slotToRoster).length > 0) {
          for (const [slot, rosterId] of Object.entries(slotToRoster)) {
            rosterToSlot[rosterId] = Number(slot);
          }
        } else if (currentDraft?.draft_order) {
          // draft_order maps user_id → slot; combine with rosters for roster_id → slot
          const draftOrder = currentDraft.draft_order;
          for (const roster of rosters) {
            if (roster.owner_id && draftOrder[roster.owner_id] !== undefined) {
              rosterToSlot[roster.roster_id] = draftOrder[roster.owner_id];
            }
          }
        }
        const hasSlotInfo = Object.keys(rosterToSlot).length > 0;

        const totalRounds = league.settings?.draft_rounds || 4;

        // Build ownership map for all picks: key = "round-roster_id" → current owner
        const pickOwnership = {};
        for (const roster of rosters) {
          for (let round = 1; round <= totalRounds; round++) {
            pickOwnership[`${round}-${roster.roster_id}`] = roster.roster_id;
          }
        }

        // Apply trades to reassign ownership
        for (const trade of (tradedPicks || [])) {
          if (trade.season !== yr) continue;
          pickOwnership[`${trade.round}-${trade.roster_id}`] = trade.owner_id;
        }

        // Filter to picks owned by the user
        const ownedPicks = [];
        for (const [key, ownerId] of Object.entries(pickOwnership)) {
          if (ownerId === userRoster.roster_id) {
            const [round, originalRosterId] = key.split('-').map(Number);
            const pick = { round, original_owner_id: originalRosterId, season: yr };
            // Add exact slot if draft order is known
            if (hasSlotInfo && rosterToSlot[originalRosterId]) {
              pick.slot = rosterToSlot[originalRosterId];
            }
            ownedPicks.push(pick);
          }
        }

        draftPicks = ownedPicks.sort((a, b) => a.round - b.round || (a.slot || 99) - (b.slot || 99));
        console.log('[Sleeper] User roster_id:', userRoster.roster_id, 'hasSlotInfo:', hasSlotInfo, 'picks:', draftPicks.map(p => p.slot ? `${p.round}.${String(p.slot).padStart(2, '0')}` : `Rd${p.round}`));
      } catch (err) {
        console.error('[Sleeper] Draft picks error:', err.message);
      }
    }

    // Upsert into database
    const totalRosters = league.total_rosters || rosters.length || 12;

    await pool.query(
      `INSERT INTO sleeper_leagues
        (user_id, sleeper_user_id, sleeper_username, league_id, league_name, season, format, scoring_settings, roster_positions, draft_picks, total_rosters, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (user_id, league_id) DO UPDATE SET
        sleeper_username = $3,
        league_name = $5,
        season = $6,
        format = $7,
        scoring_settings = $8,
        roster_positions = $9,
        draft_picks = $10,
        total_rosters = $11,
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
        totalRosters,
      ]
    );

    const leagueProfile = deriveLeagueProfile({
      leagueName: league.name,
      rosterPositions: league.roster_positions,
      scoringSettings: league.scoring_settings,
      totalRosters,
    });

    res.json({
      league_id,
      league_name: league.name,
      format,
      draft_picks: draftPicks,
      roster_positions: league.roster_positions,
      total_rosters: league.total_rosters || rosters.length || 12,
      league_profile: leagueProfile,
    });
  } catch (err) {
    console.error('[Sleeper] Sync error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to sync league: ' + err.message });
  }
});

// DEBUG: GET /api/sleeper/debug/:leagueId/:sleeperUserId — show raw pick calculation
router.get('/debug/:leagueId/:sleeperUserId', requireAuth, async (req, res) => {
  try {
    const { leagueId, sleeperUserId } = req.params;
    const yr = getCurrentNflSeason();

    const league = await sleeperFetch(`/league/${leagueId}`);
    const rosters = await sleeperFetch(`/league/${leagueId}/rosters`);
    const tradedPicks = await sleeperFetch(`/league/${leagueId}/traded_picks`);
    const drafts = await sleeperFetch(`/league/${leagueId}/drafts`);

    const userRoster = rosters.find(r => r.owner_id === sleeperUserId);

    const currentDraft = (drafts || []).find(d => d.season === yr) || (drafts || [])[0];
    const slotToRoster = currentDraft?.slot_to_roster_id || {};

    const rosterToSlot = {};
    for (const [slot, rosterId] of Object.entries(slotToRoster)) {
      rosterToSlot[rosterId] = Number(slot);
    }

    // Filter traded picks for this season
    const seasonTrades = (tradedPicks || []).filter(t => t.season === yr);

    res.json({
      user_roster_id: userRoster?.roster_id,
      total_rosters: league.total_rosters,
      draft_rounds: league.settings?.draft_rounds,
      slot_to_roster: slotToRoster,
      roster_to_slot: rosterToSlot,
      traded_picks_this_season: seasonTrades,
      all_roster_owner_ids: rosters.map(r => ({ roster_id: r.roster_id, owner_id: r.owner_id })),
      draft_info: {
        draft_id: currentDraft?.draft_id,
        season: currentDraft?.season,
        status: currentDraft?.status,
        type: currentDraft?.type,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sleeper/my-leagues — get current user's synced leagues
router.get('/my-leagues', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT league_id, league_name, season, format, draft_picks, roster_positions, scoring_settings, sleeper_username, synced_at, total_rosters
       FROM sleeper_leagues WHERE user_id = $1 ORDER BY synced_at DESC`,
      [req.user.id]
    );
    // Enrich with derived league profile for each row so the frontend
    // can personalize rankings without re-syncing.
    const leagues = result.rows.map((row) => ({
      ...row,
      league_profile: deriveLeagueProfile({
        leagueName: row.league_name,
        rosterPositions: row.roster_positions,
        scoringSettings: row.scoring_settings,
        totalRosters: row.total_rosters,
      }),
    }));
    res.json({ leagues });
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
