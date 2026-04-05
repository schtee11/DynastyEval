const express = require('express');
const pool = require('../db/pool');
const { fetchSleeperRookies } = require('../services/sleeperProxy');
const { fetchCareerStats, fetchAllPlayerStats } = require('../services/cfbdProxy');

const router = express.Router();

// GET /api/players — all rookies with stats
router.get('/', async (req, res) => {
  try {
    const [rookies, careerStats] = await Promise.all([
      fetchSleeperRookies(),
      fetchCareerStats([2022, 2023, 2024, 2025]).catch(() => null),
    ]);

    const stats = careerStats || {};

    // Fetch manual stat overrides from database
    let manualStats = {};
    try {
      const msResult = await pool.query('SELECT * FROM manual_stats');
      for (const row of msResult.rows) {
        const key = row.player_name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
        manualStats[key] = {
          yprr: row.yprr ? parseFloat(row.yprr) : null,
          targetShare: row.target_share ? parseFloat(row.target_share) : null,
          adot: row.adot ? parseFloat(row.adot) : null,
        };
      }
    } catch {}

    res.json({
      players: rookies,
      careerStats: stats,
      manualStats,
      source: 'sleeper+cfbd',
    });
  } catch (err) {
    console.error('[Players] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// GET /api/players/debug/lookup/:name — look up a specific player's raw career stats
router.get('/debug/lookup/:name', async (req, res) => {
  try {
    const careerStats = await fetchCareerStats([2022, 2023, 2024, 2025]);
    if (!careerStats) return res.json({ error: 'No career data' });

    const search = req.params.name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

    // Find exact or partial match
    const matches = {};
    for (const [name, stats] of Object.entries(careerStats)) {
      if (name.includes(search)) {
        matches[name] = stats;
      }
    }

    res.json({ search, matchCount: Object.keys(matches).length, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/debug/stat-types — show what CFBD actually returns
router.get('/debug/stat-types', async (req, res) => {
  try {
    const data = await fetchAllPlayerStats(2025);
    if (!data) return res.json({ error: 'No data', statTypes: {} });

    // Collect samples per category type
    const samples = { qb: null, receiver: null, rusher: null };
    for (const [name, stats] of Object.entries(data)) {
      if (!samples.qb && stats.passing) samples.qb = { name, keys: { passing: Object.keys(stats.passing), rushing: stats.rushing ? Object.keys(stats.rushing) : null } };
      if (!samples.receiver && stats.receiving) samples.receiver = { name, keys: { receiving: Object.keys(stats.receiving) }, raw: stats.receiving };
      if (!samples.rusher && stats.rushing && !stats.passing) samples.rusher = { name, keys: { rushing: Object.keys(stats.rushing), receiving: stats.receiving ? Object.keys(stats.receiving) : null }, raw: stats.rushing };
      if (samples.qb && samples.receiver && samples.rusher) break;
    }

    res.json({ totalPlayers: Object.keys(data).length, samples });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id/stats — individual player career stats
router.get('/:id/stats', async (req, res) => {
  try {
    const careerStats = await fetchCareerStats([2022, 2023, 2024, 2025]);
    if (!careerStats) {
      return res.json({ stats: null });
    }

    const name = decodeURIComponent(req.params.id).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    const stats = careerStats[name] || null;

    res.json({ stats });
  } catch (err) {
    console.error('[Players] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

module.exports = router;
