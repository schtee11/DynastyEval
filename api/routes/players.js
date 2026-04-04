const express = require('express');
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

    res.json({
      players: rookies,
      careerStats: careerStats || {},
      source: 'sleeper+cfbd',
    });
  } catch (err) {
    console.error('[Players] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// GET /api/players/debug/stat-types — show what CFBD actually returns
router.get('/debug/stat-types', async (req, res) => {
  try {
    const data = await fetchAllPlayerStats(2025);
    if (!data) return res.json({ error: 'No data', statTypes: {} });

    // Collect all unique keys across all players per category
    const sample = {};
    let count = 0;
    for (const [name, stats] of Object.entries(data)) {
      if (count >= 3) break;
      sample[name] = {
        passing: stats.passing ? Object.keys(stats.passing) : null,
        rushing: stats.rushing ? Object.keys(stats.rushing) : null,
        receiving: stats.receiving ? Object.keys(stats.receiving) : null,
        ppa: stats.ppa ? Object.keys(stats.ppa) : null,
      };
      count++;
    }

    res.json({ totalPlayers: Object.keys(data).length, sample });
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
