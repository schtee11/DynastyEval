-- Sleeper league sync data
-- Stores league settings and draft pick ownership for signed-in users

CREATE TABLE IF NOT EXISTS sleeper_leagues (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sleeper_user_id VARCHAR(64) NOT NULL,
  sleeper_username VARCHAR(100),
  league_id VARCHAR(64) NOT NULL,
  league_name VARCHAR(255),
  season VARCHAR(4) NOT NULL,
  format VARCHAR(20) DEFAULT '1QB',        -- '1QB' or 'SF'
  scoring_settings JSONB DEFAULT '{}',      -- TEP, PPR, etc.
  roster_positions JSONB DEFAULT '[]',      -- league roster slots
  draft_picks JSONB DEFAULT '[]',           -- user's owned picks [{round, pick, original_owner}]
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

CREATE INDEX IF NOT EXISTS idx_sleeper_leagues_user ON sleeper_leagues(user_id);
