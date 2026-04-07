const express = require('express');
const { fetchSleeperRookies } = require('../services/sleeperProxy');
const { fetchCareerStats } = require('../services/cfbdProxy');

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

// GET /api/players/:id/stats — individual player career stats
router.get('/:id/stats', async (req, res) => {
  try {
    const careerStats = await fetchCareerStats([2022, 2023, 2024, 2025]);
    if (!careerStats) {
      return res.json({ stats: null });
    }

    // Search by normalized name (id here is the player name, URL-encoded)
    const name = decodeURIComponent(req.params.id).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    const stats = careerStats[name] || null;

    res.json({ stats });
  } catch (err) {
    console.error('[Players] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

module.exports = router;
