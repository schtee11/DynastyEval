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

// Player image proxy — Sleeper CDN blocks direct browser requests
app.get('/api/img/player/:id.jpg', async (req, res) => {
  try {
    const id = req.params.id;
    const url = `https://sleepercdn.com/content/nfl/players/${id}.jpg`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=604800'); // 7 days
    const buffer = await response.arrayBuffer();
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
