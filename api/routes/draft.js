const express = require('express');
const { fetchDraftPicks, clearDraftCache } = require('../services/espnDraftProxy');

const router = express.Router();

// GET /api/draft/:year — flat list of actual draft picks for the given year.
router.get('/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (!year || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }

  try {
    const picks = await fetchDraftPicks(year);
    res.json({ year, count: picks.length, picks });
  } catch (err) {
    console.error('[Draft] Fetch error:', err.message);
    res.status(502).json({ error: 'Failed to fetch draft data', detail: err.message });
  }
});

// POST /api/draft/:year/refresh — bust the server-side cache.
// Useful immediately after the draft to force a fresh ESPN pull.
router.post('/:year/refresh', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (!year) return res.status(400).json({ error: 'Invalid year' });
  try {
    await clearDraftCache(year);
    const picks = await fetchDraftPicks(year);
    res.json({ year, count: picks.length, picks });
  } catch (err) {
    console.error('[Draft] Refresh error:', err.message);
    res.status(502).json({ error: 'Failed to refresh draft data' });
  }
});

module.exports = router;
