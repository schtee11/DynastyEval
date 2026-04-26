const express = require('express');
const { fetchDraftPicks, clearDraftCache } = require('../services/espnDraftProxy');

const router = express.Router();

const ESPN_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// GET /api/draft/debug/espn-shape/:year — probe several ESPN URLs and return
// their actual response shapes so we can confirm/fix the parser without
// guessing. Safe to leave in place — read-only and rate-limited by Express.
router.get('/debug/espn-shape/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (!year) return res.status(400).json({ error: 'Invalid year' });

  const probes = [
    `${ESPN_BASE}/seasons/${year}/draft`,
    `${ESPN_BASE}/seasons/${year}/draft/rounds`,
    `${ESPN_BASE}/seasons/${year}/draft/rounds?limit=20`,
    `${ESPN_BASE}/seasons/${year}/draft/rounds/1`,
    `${ESPN_BASE}/seasons/${year}/draft/rounds/1/picks?limit=64`,
  ];

  const results = {};
  for (const url of probes) {
    try {
      const r = await fetch(url);
      const ct = r.headers.get('content-type') || '';
      const text = await r.text();
      let parsed = null;
      if (ct.includes('json')) {
        try { parsed = JSON.parse(text); } catch { /* leave null */ }
      }
      results[url] = {
        status: r.status,
        contentType: ct,
        topKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : null,
        itemsLen: Array.isArray(parsed?.items) ? parsed.items.length : null,
        firstItem: Array.isArray(parsed?.items) ? parsed.items[0] : null,
        body: parsed ? null : text.slice(0, 800),
      };
    } catch (err) {
      results[url] = { error: err.message };
    }
  }

  res.json(results);
});

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
