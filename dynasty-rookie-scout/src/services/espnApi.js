// ESPN College Football API service — free, no authentication required.
// Alternative to CFBD API which has a 1,000 call/month quota.
//
// ESPN endpoints used:
//   - Player search: site.api.espn.com/apis/search/v2
//   - Player stats:  site.api.espn.com/apis/common/v3/sports/football/college-football/athletes/{id}/stats
//   - Team roster:   site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{id}/roster

const ESPN_SEARCH_URL = 'https://site.api.espn.com/apis/search/v2';
const ESPN_STATS_BASE = 'https://site.api.espn.com/apis/common/v3/sports/football/college-football/athletes';
const ESPN_SITE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

// ── In-memory + localStorage cache (same pattern as cfbdApi.js) ──────────

const CACHE_VERSION = 'espn_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const memCache = {};

const lsKey = (key) => `${CACHE_VERSION}_${key}`;

const readLocalStorage = (key) => {
  try {
    const raw = localStorage.getItem(lsKey(key));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(lsKey(key));
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const writeLocalStorage = (key, data) => {
  try {
    localStorage.setItem(lsKey(key), JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
};

const cachedFetch = async (key, fetcher) => {
  if (memCache[key]) return memCache[key];

  const stored = readLocalStorage(key);
  if (stored) {
    memCache[key] = stored;
    return stored;
  }

  const data = await fetcher();
  if (data != null) {
    memCache[key] = data;
    writeLocalStorage(key, data);
  }
  return data;
};

// ── ESPN API calls ──────────────────────────────────────────────────────────

/**
 * Search ESPN for a college football player by name.
 * Returns the ESPN athlete ID if found, or null.
 */
const searchPlayerESPN = async (playerName) => {
  const url = `${ESPN_SEARCH_URL}?query=${encodeURIComponent(playerName)}&type=player&sport=football&league=college-football&limit=5`;

  console.info(`[ESPN] Searching for: ${playerName}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[ESPN] Search failed for "${playerName}": ${res.status}`);
    return null;
  }

  const data = await res.json();

  // ESPN search returns results in various structures
  const items = data?.results?.[0]?.items || data?.items || [];
  if (items.length === 0) {
    // Try alternate result path
    const athletes = data?.athletes?.items || data?.results?.athletes?.items || [];
    if (athletes.length > 0) {
      return athletes[0]?.id || athletes[0]?.$ref?.match(/athletes\/(\d+)/)?.[1] || null;
    }
    console.warn(`[ESPN] No results for "${playerName}"`);
    return null;
  }

  // Extract athlete ID from the first match
  const first = items[0];
  const id = first?.id || first?.athleteId || first?.$ref?.match(/athletes\/(\d+)/)?.[1] || null;
  return id;
};

/**
 * Fetch season stats for an ESPN athlete by ID.
 */
const fetchAthleteStats = async (athleteId) => {
  const url = `${ESPN_STATS_BASE}/${athleteId}/stats`;

  console.info(`[ESPN] Fetching stats for athlete ID: ${athleteId}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[ESPN] Stats fetch failed for athlete ${athleteId}: ${res.status}`);
    return null;
  }

  return res.json();
};

// ── Stat parsers (ESPN → CFBD-compatible shape) ──────────────────────────

/**
 * Parse ESPN stat categories into the same { passing, rushing, receiving }
 * shape that cfbdTransformer expects.
 */
const parseESPNStats = (espnData) => {
  const result = { passing: null, rushing: null, receiving: null, ppa: null };

  // ESPN returns stats grouped by category
  const categories = espnData?.categories || espnData?.splits?.categories || [];

  for (const cat of categories) {
    const catName = (cat.name || cat.displayName || '').toLowerCase();
    const stats = {};

    // Each category has labels and corresponding values
    const labels = cat.labels || [];
    const values = cat.stats?.[0]?.stats || cat.values || [];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const value = values[i];
      if (value != null) stats[label] = Number(value);
    }

    if (catName.includes('passing') || catName === 'passing') {
      result.passing = {
        YDS: stats.YDS || stats.passingYards || 0,
        TD: stats.TD || stats.passingTouchdowns || 0,
        INT: stats.INT || stats.interceptions || 0,
        COMPLETIONS: stats.CMP || stats.completions || 0,
        ATT: stats.ATT || stats.attempts || 0,
      };
    } else if (catName.includes('rushing') || catName === 'rushing') {
      result.rushing = {
        YDS: stats.YDS || stats.rushingYards || 0,
        TD: stats.TD || stats.rushingTouchdowns || 0,
        CAR: stats.CAR || stats.ATT || stats.carries || 0,
      };
    } else if (catName.includes('receiving') || catName === 'receiving') {
      result.receiving = {
        REC: stats.REC || stats.receptions || 0,
        YDS: stats.YDS || stats.receivingYards || 0,
        TD: stats.TD || stats.receivingTouchdowns || 0,
        TARGETS: stats.TAR || stats.targets || 0,
      };
    }
  }

  return result;
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch college stats for a single player from ESPN.
 * Returns CFBD-compatible stat shape or null if not found.
 */
export const fetchPlayerStatsESPN = async (playerName) => {
  return cachedFetch(`espn-player-${playerName.toLowerCase().replace(/\s+/g, '-')}`, async () => {
    const athleteId = await searchPlayerESPN(playerName);
    if (!athleteId) return null;

    const rawStats = await fetchAthleteStats(athleteId);
    if (!rawStats) return null;

    return parseESPNStats(rawStats);
  });
};

/**
 * Fetch stats for multiple players in parallel.
 * Returns a Map of normalised name → CFBD-compatible stats.
 */
export const fetchBulkPlayerStatsESPN = async (playerNames) => {
  const results = new Map();
  const errors = [];

  // Fetch in batches of 5 to avoid hammering ESPN
  const batchSize = 5;
  for (let i = 0; i < playerNames.length; i += batchSize) {
    const batch = playerNames.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (name) => {
        try {
          const stats = await fetchPlayerStatsESPN(name);
          return { name, stats };
        } catch (err) {
          console.warn(`[ESPN] Failed to fetch ${name}:`, err.message);
          errors.push(`${name}: ${err.message}`);
          return { name, stats: null };
        }
      })
    );

    for (const { name, stats } of batchResults) {
      if (stats) {
        const key = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
        results.set(key, stats);
      }
    }
  }

  console.info(`[ESPN] Bulk fetch complete: ${results.size}/${playerNames.length} found, ${errors.length} errors`);
  return { results, errors };
};

export const clearESPNCache = () => {
  Object.keys(memCache).forEach((k) => delete memCache[k]);
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${CACHE_VERSION}_`))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage unavailable
  }
};
