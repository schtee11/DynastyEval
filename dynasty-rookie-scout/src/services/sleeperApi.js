// Sleeper API service — validates prospects against Sleeper's NFL player database.
// Sleeper API is free, requires no auth key.
// Docs: https://docs.sleeper.com
//
// Primary use: after the 2026 NFL Draft (April 23-25), cross-reference our
// prospect list to ensure we only show actual rookies, not players drafted in
// prior years or still in college.

const SLEEPER_BASE = 'https://api.sleeper.app/v1';

// ── Cache layer ──────────────────────────────────────────────────────────────
const CACHE_KEY = 'sleeper_players';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours — player data updates infrequently

const getFromCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full or unavailable — non-fatal
  }
};

// ── API ──────────────────────────────────────────────────────────────────────

/**
 * Fetch ALL NFL players from Sleeper (~10k entries, ~15 MB).
 * Returns a Map keyed by normalised "firstname lastname" → player object.
 * Cached in localStorage for 12 hours.
 */
export const fetchSleeperPlayers = async () => {
  const cached = getFromCache();
  if (cached) return cached;

  const res = await fetch(`${SLEEPER_BASE}/players/nfl`);
  if (!res.ok) {
    throw new Error(`Sleeper /players/nfl → ${res.status}`);
  }
  const raw = await res.json(); // { "player_id": { ... }, ... }

  // Build a lookup of fantasy-relevant offensive players
  const players = {};
  for (const [id, p] of Object.entries(raw)) {
    if (!p || !['QB', 'RB', 'WR', 'TE'].includes(p.position)) continue;
    const name = (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`).trim();
    if (!name) continue;

    players[id] = {
      sleeperId: id,
      name,
      position: p.position,
      team: p.team, // NFL team abbreviation or null
      college: p.college,
      yearsExp: p.years_exp, // 0 = rookie
      status: p.status, // "Active", "Inactive", etc.
      age: p.age,
      searchRank: p.search_rank,
    };
  }

  setCache(players);
  return players;
};

/**
 * Get only 2026 rookies from Sleeper (years_exp === 0 at time of query).
 * Pre-draft this returns an empty array — that's expected.
 */
export const fetchSleeperRookies = async (draftYear = 2026) => {
  const all = await fetchSleeperPlayers();
  // years_exp === 0 means current-year rookie.
  // We also check search_rank to filter out deep practice-squad players.
  return Object.values(all).filter(
    (p) => p.yearsExp === 0 && p.searchRank != null
  );
};

// ── Matching utilities ───────────────────────────────────────────────────────

/** Normalise name for fuzzy matching */
const normName = (n) =>
  n
    .toLowerCase()
    .replace(/jr\.?$|sr\.?$|iii$|ii$|iv$/i, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Match a prospect from our list to a Sleeper player.
 * Returns the matched Sleeper player or null.
 */
export const matchProspectToSleeper = (prospect, sleeperPlayers) => {
  const target = normName(prospect.name);
  const targetParts = target.split(' ');

  for (const sp of Object.values(sleeperPlayers)) {
    const cand = normName(sp.name);

    // Exact match
    if (cand === target) return sp;

    // Last-name + position match (handles "J. Michael" vs "J Michael" etc.)
    const candParts = cand.split(' ');
    if (
      candParts[candParts.length - 1] === targetParts[targetParts.length - 1] &&
      sp.position === prospect.position &&
      sp.college?.toLowerCase() === prospect.college?.toLowerCase()
    ) {
      return sp;
    }
  }
  return null;
};

/**
 * Validate a full prospect list against Sleeper's database.
 * Returns an array of { prospect, sleeperMatch, status } where status is:
 *   - "confirmed_rookie"  → Sleeper has them as years_exp=0
 *   - "wrong_year"        → Sleeper has them but years_exp > 0 (drafted in prior year)
 *   - "not_found"         → Not in Sleeper yet (pre-draft or undrafted)
 */
export const validateProspects = async (prospects) => {
  let sleeperPlayers;
  try {
    sleeperPlayers = await fetchSleeperPlayers();
  } catch (err) {
    console.warn('Sleeper API unavailable — skipping validation:', err.message);
    return prospects.map((p) => ({
      prospect: p,
      sleeperMatch: null,
      status: 'not_found',
    }));
  }

  return prospects.map((prospect) => {
    const match = matchProspectToSleeper(prospect, sleeperPlayers);
    if (!match) {
      return { prospect, sleeperMatch: null, status: 'not_found' };
    }
    if (match.yearsExp === 0) {
      return { prospect, sleeperMatch: match, status: 'confirmed_rookie' };
    }
    return { prospect, sleeperMatch: match, status: 'wrong_year' };
  });
};

const sleeperApi = {
  fetchSleeperPlayers,
  fetchSleeperRookies,
  matchProspectToSleeper,
  validateProspects,
};

export default sleeperApi;
