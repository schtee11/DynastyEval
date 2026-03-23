// College Football Data API v2 service
// Docs: https://apinext.collegefootballdata.com
// Requires REACT_APP_CFBD_API_KEY env var

const BASE_URL = 'https://api.collegefootballdata.com';

const headers = () => ({
  Authorization: `Bearer ${process.env.REACT_APP_CFBD_API_KEY}`,
  Accept: 'application/json',
});

const cfbdFetch = async (path, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null)
  ).toString();
  const url = `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`CFBD ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// ── Bulk endpoints (one call per category, returns ALL players) ──────────────

/**
 * Player season stats by category.
 * Categories: passing, rushing, receiving, fumbles, interceptions, punting, kicking, kickReturns, puntReturns
 */
export const fetchPlayerSeasonStats = (year, category) =>
  cfbdFetch('/stats/player/season', { year, category });

/**
 * Player PPA/EPA by season — includes EPA per play, per pass, per rush.
 * Can filter by team.
 */
export const fetchPlayerPPA = (year, team) =>
  cfbdFetch('/ppa/players/season', { year, team });

/**
 * Player usage metrics — overall, passing, rushing, first/second/third down, standard/passing.
 */
export const fetchPlayerUsage = (year, team) =>
  cfbdFetch('/player/usage', { year, team });

/**
 * Search for a player by name — returns athlete ID and other metadata.
 */
export const searchPlayer = (searchTerm, year) =>
  cfbdFetch('/player/search', { searchTerm, year });

/**
 * NFL Draft picks — available after the draft (late April).
 */
export const fetchDraftPicks = (year) =>
  cfbdFetch('/draft/picks', { year });

// ── In-memory cache so we only hit the API once per session ──────────────────

const cache = {};

const cachedFetch = async (key, fetcher) => {
  if (cache[key]) return cache[key];
  const data = await fetcher();
  cache[key] = data;
  return data;
};

/**
 * Fetch all stats we need for a season in parallel (3 calls).
 * Returns { passing: [...], rushing: [...], receiving: [...] }
 */
export const fetchAllSeasonStats = async (year = 2025) => {
  const [passing, rushing, receiving] = await Promise.all([
    cachedFetch(`stats-passing-${year}`, () =>
      fetchPlayerSeasonStats(year, 'passing')
    ),
    cachedFetch(`stats-rushing-${year}`, () =>
      fetchPlayerSeasonStats(year, 'rushing')
    ),
    cachedFetch(`stats-receiving-${year}`, () =>
      fetchPlayerSeasonStats(year, 'receiving')
    ),
  ]);
  return { passing, rushing, receiving };
};

/**
 * Fetch PPA for specific teams (one call per team).
 */
export const fetchPPAForTeams = async (year, teams) => {
  const results = await Promise.all(
    teams.map((team) =>
      cachedFetch(`ppa-${year}-${team}`, () => fetchPlayerPPA(year, team))
    )
  );
  return results.flat();
};

/**
 * Fetch usage stats for specific teams.
 */
export const fetchUsageForTeams = async (year, teams) => {
  const results = await Promise.all(
    teams.map((team) =>
      cachedFetch(`usage-${year}-${team}`, () =>
        fetchPlayerUsage(year, team)
      )
    )
  );
  return results.flat();
};

/**
 * Check whether draft picks are available for a year.
 */
export const fetchDraftPicksIfAvailable = async (year) => {
  try {
    return await cachedFetch(`draft-${year}`, () => fetchDraftPicks(year));
  } catch {
    return null; // draft hasn't happened yet
  }
};

export const clearCache = () => {
  Object.keys(cache).forEach((k) => delete cache[k]);
};
