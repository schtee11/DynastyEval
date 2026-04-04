const pool = require('../db/pool');

const ESPN_SEARCH = 'https://site.api.espn.com/apis/search/v2';
const ESPN_STATS = 'https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/athletes';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (targets don't change after season)

const norm = (n) =>
  (n || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Search ESPN for a college football player by name.
 * Returns ESPN athlete ID or null.
 */
const searchPlayer = async (name) => {
  try {
    const url = `${ESPN_SEARCH}?query=${encodeURIComponent(name)}&limit=5&type=player&sport=football&league=college-football`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.items?.[0]?.items || data?.results?.[0]?.items || [];

    // Find best match by name
    const target = norm(name);
    for (const item of items) {
      const displayName = norm(item.displayName || item.name || '');
      if (displayName === target || displayName.includes(target) || target.includes(displayName)) {
        return item.id || item.$ref?.match(/athletes\/(\d+)/)?.[1] || null;
      }
    }

    // Fallback: take first result
    if (items.length > 0) {
      return items[0].id || items[0].$ref?.match(/athletes\/(\d+)/)?.[1] || null;
    }

    return null;
  } catch (err) {
    console.warn(`[ESPN] Search failed for "${name}":`, err.message);
    return null;
  }
};

/**
 * Fetch career stats from ESPN for an athlete ID.
 * Returns { targets, receptions, ... } or null.
 */
const fetchPlayerStats = async (athleteId) => {
  try {
    const url = `${ESPN_STATS}/${athleteId}/stats`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    // ESPN returns stats in categories (passing, rushing, receiving)
    // Each category has labels[] and statistics[] arrays
    const result = {};

    const categories = data?.categories || data?.splits?.categories || [];
    for (const cat of categories) {
      const catName = (cat.name || cat.displayName || '').toLowerCase();
      if (!['receiving', 'rushing', 'passing'].includes(catName)) continue;

      const labels = (cat.labels || []).map(l => l.toLowerCase());
      // Career totals are typically the last row in statistics
      const stats = cat.statistics || [];
      const careerRow = stats.length > 0 ? stats[stats.length - 1] : null;

      if (careerRow && Array.isArray(careerRow)) {
        for (let i = 0; i < labels.length; i++) {
          const label = labels[i];
          const val = parseFloat(careerRow[i]);
          if (!isNaN(val)) {
            result[`${catName}_${label}`] = val;
          }
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.warn(`[ESPN] Stats fetch failed for athlete ${athleteId}:`, err.message);
    return null;
  }
};

/**
 * Get targets for a player by name.
 * Searches ESPN, fetches career stats, extracts targets.
 * Caches results in PostgreSQL.
 */
const getPlayerTargets = async (name) => {
  const cacheKey = `espn_targets_${norm(name)}`;

  // Check cache
  try {
    const cached = await pool.query(
      'SELECT data_json, fetched_at FROM player_cache WHERE cache_key = $1',
      [cacheKey]
    );
    if (cached.rows.length > 0) {
      const { data_json, fetched_at } = cached.rows[0];
      if (Date.now() - new Date(fetched_at).getTime() < CACHE_TTL_MS) {
        return typeof data_json === 'string' ? JSON.parse(data_json) : data_json;
      }
    }
  } catch {}

  // Search for player
  const athleteId = await searchPlayer(name);
  if (!athleteId) {
    console.warn(`[ESPN] Player not found: "${name}"`);
    return null;
  }

  // Fetch stats
  const stats = await fetchPlayerStats(athleteId);
  if (!stats) return null;

  // Extract targets (ESPN label could be 'tar', 'targets', or 'tgt')
  const targets = stats.receiving_tar ?? stats.receiving_targets ?? stats.receiving_tgt ?? null;

  const result = { athleteId, targets, raw: stats };

  // Cache
  try {
    await pool.query(
      `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
       VALUES ($1, $2, 'espn', NOW())
       ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
      [cacheKey, JSON.stringify(result)]
    );
  } catch {}

  return result;
};

/**
 * Batch fetch targets for multiple players.
 * Processes in batches of 3 to avoid hammering ESPN.
 */
const batchGetTargets = async (playerNames) => {
  const results = {};
  const batchSize = 3;

  for (let i = 0; i < playerNames.length; i += batchSize) {
    const batch = playerNames.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (name) => {
        const data = await getPlayerTargets(name);
        return { name: norm(name), data };
      })
    );
    for (const { name, data } of batchResults) {
      if (data?.targets != null) {
        results[name] = data.targets;
      }
    }
  }

  return results;
};

module.exports = { searchPlayer, fetchPlayerStats, getPlayerTargets, batchGetTargets };
