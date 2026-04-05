const pool = require('../db/pool');

const SLEEPER_BASE = 'https://api.sleeper.app/v1';
const CACHE_KEY = 'sleeper_players';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch all NFL players from Sleeper, cache in PostgreSQL.
 */
const fetchSleeperPlayers = async () => {
  // Check cache first
  const cached = await pool.query(
    `SELECT data_json, fetched_at FROM player_cache WHERE cache_key = $1`,
    [CACHE_KEY]
  );

  if (cached.rows.length > 0) {
    const { data_json, fetched_at } = cached.rows[0];
    if (Date.now() - new Date(fetched_at).getTime() < CACHE_TTL_MS) {
      return data_json;
    }
  }

  // Fetch from Sleeper (with 15s timeout)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(`${SLEEPER_BASE}/players/nfl`, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) {
    throw new Error(`Sleeper /players/nfl → ${res.status}`);
  }
  const raw = await res.json();

  // Filter to fantasy-relevant offensive players
  const players = {};
  for (const [id, p] of Object.entries(raw)) {
    if (!p || !['QB', 'RB', 'WR', 'TE'].includes(p.position)) continue;
    const name = (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`).trim();
    if (!name) continue;

    players[id] = {
      sleeperId: id,
      name,
      position: p.position,
      team: p.team,
      college: p.college,
      yearsExp: p.years_exp,
      status: p.status,
      active: p.active,
      age: p.age,
    };
  }

  // Upsert into cache
  await pool.query(
    `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
     VALUES ($1, $2, 'sleeper', NOW())
     ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
    [CACHE_KEY, JSON.stringify(players)]
  );

  console.info(`[SleeperProxy] Cached ${Object.keys(players).length} players`);
  return players;
};

/**
 * Get only rookies (years_exp === 0) from cached Sleeper data.
 */
const fetchSleeperRookies = async () => {
  const all = await fetchSleeperPlayers();
  return Object.values(typeof all === 'string' ? JSON.parse(all) : all).filter((p) => {
    if (p.yearsExp !== 0) return false;
    if (p.active === false) return false;
    if (!p.name || /^player\s+invalid$/i.test(p.name.trim())) return false;
    if (p.age != null && p.age > 27) return false;
    return true;
  });
};

module.exports = { fetchSleeperPlayers, fetchSleeperRookies };
