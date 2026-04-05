require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const discussionRoutes = require('./routes/discussions');
const adminRoutes = require('./routes/admin');
const boardRoutes = require('./routes/boards');
const subscriptionRoutes = require('./routes/subscriptions');

// Environment validation
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required in production');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'https://dynastyeval.netlify.app'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

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

// Debug endpoints (dev only)
if (process.env.NODE_ENV !== 'production') {
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
}

// Player image proxy — searches ESPN for player, caches ESPN athlete ID, serves headshot
const imgCache = {};
app.get('/api/img/player/:name.png', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    let athleteId = imgCache[name]?.id || null;

    if (!athleteId) {
      const searchUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=1&type=player&sport=football&league=college-football`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const data = await searchRes.json();
        const contents = data?.results?.[0]?.contents || [];
        if (contents.length > 0) {
          const webLink = contents[0].link?.web || '';
          const match = webLink.match(/id\/(\d+)/);
          athleteId = match ? match[1] : null;
          if (contents[0].image?.default) {
            imgCache[name] = { id: athleteId, imgUrl: contents[0].image.default };
          }
        }
      }
      if (athleteId && !imgCache[name]?.imgUrl) {
        imgCache[name] = { id: athleteId, imgUrl: `https://a.espncdn.com/i/headshots/college-football/players/full/${athleteId}.png` };
      }
    }

    const cached = imgCache[name];
    if (!cached?.imgUrl) return res.status(404).end();

    const imgRes = await fetch(cached.imgUrl);
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
