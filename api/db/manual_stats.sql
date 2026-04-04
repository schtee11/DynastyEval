-- Manual stats overrides (admin-editable via UI)
-- These take priority over API-sourced data
CREATE TABLE IF NOT EXISTS manual_stats (
  player_name VARCHAR(255) PRIMARY KEY,
  yprr DECIMAL(5,2),
  target_share DECIMAL(5,1),
  adot DECIMAL(5,1),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_manual_stats_name ON manual_stats(player_name);
