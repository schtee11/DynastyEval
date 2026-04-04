require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const discussionRoutes = require('./routes/discussions');
const adminRoutes = require('./routes/admin');
const boardRoutes = require('./routes/boards');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: true, // allow all origins (tighten in production)
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug: see raw ESPN search response
app.get('/api/debug/espn-search/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const searchUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=3&type=player&sport=football&league=college-football`;
    const searchRes = await fetch(searchUrl);
    const data = await searchRes.json();
    res.json({ status: searchRes.status, url: searchUrl, data });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Player image proxy — searches ESPN for player, caches ESPN athlete ID, serves headshot
const imgCache = {}; // in-memory: playerName -> espnAthleteId
app.get('/api/img/player/:name.png', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    let athleteId = imgCache[name];

    if (!athleteId) {
      // Search ESPN for this player
      const searchUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=3&type=player&sport=football&league=college-football`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const data = await searchRes.json();
        const items = data?.items?.[0]?.items || data?.results?.[0]?.items || [];
        if (items.length > 0) {
          const ref = items[0].$ref || items[0].href || '';
          const match = ref.match(/athletes\/(\d+)/);
          athleteId = match ? match[1] : (items[0].id || null);
        }
      }
      if (athleteId) imgCache[name] = athleteId;
    }

    if (!athleteId) return res.status(404).end();

    // Fetch ESPN headshot
    const imgUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/${athleteId}.png&w=200&h=146`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return res.status(404).end();

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=2592000'); // 30 days
    const buffer = await imgRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(404).end();
  }
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[Server] Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Dynasty Scout API running on port ${PORT}`);
});
