// Sleeper API service — the source of truth for identifying valid rookies.
// Sleeper API is free, requires no auth key.
// Docs: https://docs.sleeper.com
//
// Primary use: fetch all rookies (years_exp === 0) from Sleeper, then
// cross-reference with our prospect metadata to build the full player list.

import { getProspects } from './rookieProspects2026';
import { getReceivingData } from './receivingData';

const SLEEPER_BASE = 'https://api.sleeper.app/v1';

// ── Cache layer ──────────────────────────────────────────────────────────────
const CACHE_KEY = 'sleeper_players_v3'; // v3: added active field for rookie validation
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
      active: p.active,  // boolean — false for retired/inactive players
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
 *
 * Validation filters applied:
 *  - active !== false     → exclude retired/deactivated players (e.g. Byron Leftwich)
 *  - valid name           → exclude Sleeper placeholder entries ("Player Invalid")
 *  - age <= MAX_ROOKIE_AGE → exclude players too old to be genuine rookies
 *  - status not Inactive  → exclude IR/inactive roster designations
 */
const MAX_ROOKIE_AGE = 27;
const INACTIVE_STATUSES = new Set(['Inactive', 'Suspended', 'Physically Unable to Perform']);

export const fetchSleeperRookies = async (draftYear = 2026) => {
  const all = await fetchSleeperPlayers();
  return Object.values(all).filter((p) => {
    if (p.yearsExp !== 0) return false;
    // Exclude deactivated / retired players
    if (p.active === false) return false;
    // Exclude Sleeper placeholder entries like "Player Invalid"
    if (!p.name || /^player\s+invalid$/i.test(p.name.trim())) return false;
    // Exclude players too old to plausibly be a true rookie
    if (p.age != null && p.age > MAX_ROOKIE_AGE) return false;
    // Exclude known inactive roster designations
    if (p.status && INACTIVE_STATUSES.has(p.status)) return false;
    return true;
  });
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

// ── Sleeper-first player builder ─────────────────────────────────────────────

/**
 * Build the rookie player list using Sleeper as the source of truth.
 * 1. Fetch all rookies (years_exp === 0) from Sleeper
 * 2. Cross-reference with rookieProspects2026 for scouting metadata
 * 3. Attach WR receiving perspective data from receivingData.js
 * Returns player objects in the shape the UI expects.
 */
export const buildRookiePlayersFromSleeper = async () => {
  const rookies = await fetchSleeperRookies();

  // Build a normalised-name lookup from our prospect metadata
  const prospects = getProspects();
  const prospectByNorm = {};
  for (const p of prospects) {
    prospectByNorm[normName(p.name)] = p;
  }

  // Also build a last-name + position + college lookup for fuzzy matching
  const prospectByFuzzy = {};
  for (const p of prospects) {
    const parts = normName(p.name).split(' ');
    const key = `${parts[parts.length - 1]}|${p.position}|${(p.college || '').toLowerCase()}`;
    prospectByFuzzy[key] = p;
  }

  // Only include Sleeper players that match our curated prospect list.
  // Sleeper's yearsExp===0 pool includes NFL players who haven't accrued a
  // season yet (practice squad, IR, late prior-year picks, etc.) — these are
  // NOT 2026 draft prospects and should be excluded.
  return rookies
    .map((sleeperPlayer) => {
    // Try to find a matching prospect: exact name first, then fuzzy
    const key = normName(sleeperPlayer.name);
    let prospect = prospectByNorm[key];

    if (!prospect) {
      const parts = key.split(' ');
      const fuzzyKey = `${parts[parts.length - 1]}|${sleeperPlayer.position}|${(sleeperPlayer.college || '').toLowerCase()}`;
      prospect = prospectByFuzzy[fuzzyKey];
    }

    // No match in our prospect database → skip (not a 2026 prospect)
    if (!prospect) return null;

    const id = prospect.id;

    // Base fields from Sleeper
    const player = {
      id,
      name: sleeperPlayer.name,
      position: sleeperPlayer.position,
      college: sleeperPlayer.college || prospect?.college || null,
      age: sleeperPlayer.age ?? prospect?.age ?? null,
      height: prospect?.height ?? null,
      weight: prospect?.weight ?? null,
      draftRound: prospect?.projectedRound ?? null,
      draftPick: prospect?.projectedPick ?? null,
      draftTeam: sleeperPlayer.team || prospect?.projectedTeam || null,
      draftIsProjected: !sleeperPlayer.team,
      stats: prospect?.stats || {},
      breakoutAge: prospect?.breakoutAge ?? null,
      dominatorRating: prospect?.dominatorRating ?? null,
      targetShare: prospect?.advancedStats?.targetShare ?? null,
      yprr: prospect?.advancedStats?.yprr ?? null,
      yacPerRR: prospect?.yacPerRR ?? null,
      injuries: prospect?.injuries || [],
      dynastyADP: prospect?.dynastyADP ?? null,
      rank: prospect?.rank ?? null,
      playerComps: prospect?.playerComps || [],
      receivingByPerspective: null,
      _prospect: prospect, // reference for fallback stats
    };

    // Attach WR receiving perspective data from JSON
    if (sleeperPlayer.position === 'WR') {
      player.receivingByPerspective = getReceivingData(sleeperPlayer.name)
        || (prospect ? getReceivingData(prospect.name) : null);
    }

    return player;
  })
  .filter(Boolean); // Remove nulls (unmatched Sleeper players)
};

const sleeperApi = {
  fetchSleeperPlayers,
  fetchSleeperRookies,
  matchProspectToSleeper,
  validateProspects,
  buildRookiePlayersFromSleeper,
};

export default sleeperApi;
