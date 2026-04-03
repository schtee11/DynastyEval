-- Dynasty Rookie Scout — Database Schema
-- Run against PostgreSQL on Railway

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Server-side API data cache (Sleeper, CFBD)
CREATE TABLE IF NOT EXISTS player_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  data_json JSONB NOT NULL,
  source VARCHAR(50) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussions (Reddit-style threads per player)
CREATE TABLE IF NOT EXISTS discussions (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(50) NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  content TEXT,
  url VARCHAR(2048),
  upvote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discussions_player ON discussions(player_id, created_at DESC);
CREATE INDEX idx_discussions_author ON discussions(author_id);

-- Comments on discussions
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  discussion_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_discussion ON comments(discussion_id, created_at);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Votes (upvotes/downvotes on discussions and comments)
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  votable_type VARCHAR(20) NOT NULL CHECK (votable_type IN ('discussion', 'comment')),
  votable_id INTEGER NOT NULL,
  direction SMALLINT NOT NULL CHECK (direction IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, votable_type, votable_id)
);

CREATE INDEX idx_votes_votable ON votes(votable_type, votable_id);

-- Bookmarks (saved players)
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

-- Draft boards
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'My Board',
  format VARCHAR(10) NOT NULL DEFAULT '1QB' CHECK (format IN ('1QB', 'SF')),
  player_ids JSONB NOT NULL DEFAULT '[]',
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_share ON boards(share_token) WHERE share_token IS NOT NULL;
