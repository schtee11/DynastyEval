// Attaches college stats to player objects.
//
// Data sources (in priority order):
//   1. CFBD API (live) — basic counting stats + PPA
//   2. Static PFF CSV data — PFF-proprietary metrics + fallback counting stats
//   3. Prospect advancedStats (hand-curated) — highest priority overrides
//
// The CFBD API provides live data for passing/rushing/receiving counting stats
// and PPA. PFF-only metrics (grades, BTT/TWP rates, elusive rating, YPRR,
// contested catch rates, slot/wide rates, etc.) always come from the static data.

import { getStaticCollegeStats as _rawLookup } from './collegeStats2025';
import { fetchCareerStats, isCFBDAvailable } from './cfbdApi';

// ── CFBD data cache (loaded once, shared across all players) ────────────────

let cfbdStatsMap = null;
let cfbdLoadPromise = null;

/**
 * Pre-load all CFBD stats. Call once before attaching stats to players.
 * Safe to call multiple times — only fetches once.
 */
export const preloadCFBDStats = async (year = 2025) => {
  if (cfbdStatsMap) return cfbdStatsMap;
  if (cfbdLoadPromise) return cfbdLoadPromise;

  if (!isCFBDAvailable()) {
    console.info('[CFBDTransformer] No CFBD API key — using static data only');
    return null;
  }

  cfbdLoadPromise = fetchCareerStats([2022, 2023, 2024, 2025])
    .then((data) => {
      cfbdStatsMap = data;
      console.info(`[CFBDTransformer] CFBD career data loaded: ${Object.keys(data || {}).length} players`);
      return data;
    })
    .catch((err) => {
      console.warn('[CFBDTransformer] CFBD fetch failed, falling back to static:', err.message);
      return null;
    });

  return cfbdLoadPromise;
};

// ── Static data lookup (unchanged from before) ─────────────────────────────

const getStaticCollegeStats = (name) => {
  const exact = _rawLookup(name);
  if (exact) return exact;
  const stripped = name.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)\s*$/i, '').trim();
  if (stripped !== name) return _rawLookup(stripped);
  for (const suf of [' Jr.', ' III', ' II', ' Sr.']) {
    const result = _rawLookup(name + suf);
    if (result) return result;
  }
  return null;
};

// ── Name normalisation ──────────────────────────────────────────────────────

const norm = (n) =>
  (n || '')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normFuzzy = (n) =>
  norm(n)
    .replace(/\b(jr|sr|ii|iii|iv)\s*$/g, '')
    .trim();

/**
 * Look up a player in the CFBD stats map with fuzzy matching.
 */
const getCFBDStats = (name) => {
  if (!cfbdStatsMap) return null;
  const key = norm(name);
  if (cfbdStatsMap[key]) return cfbdStatsMap[key];
  const fuzzy = normFuzzy(name);
  if (fuzzy !== key && cfbdStatsMap[fuzzy]) return cfbdStatsMap[fuzzy];
  return null;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const v = (obj, ...keys) => {
  if (!obj) return 0;
  for (const k of keys) {
    if (obj[k] !== undefined) return Number(obj[k]);
  }
  return 0;
};

const pct = (num, denom) =>
  denom > 0 ? +((num / denom) * 100).toFixed(1) : null;

// ── Position-specific stat builders ─────────────────────────────────────────
// These use whichever source has the data (CFBD live preferred, static fallback)

const buildQBStats = (live, sd) => {
  const pass = live?.passing || sd?.passing;
  const rush = live?.rushing || sd?.rushing;
  return {
    passingYards: v(pass, 'YDS'),
    passingTDs: v(pass, 'TD'),
    interceptions: v(pass, 'INT'),
    completionPct: v(pass, 'PCT') || pct(v(pass, 'COMP'), v(pass, 'ATT')),
    rushingYards: v(rush, 'YDS'),
    rushingTDs: v(rush, 'TD'),
  };
};

const buildRBStats = (live, sd) => {
  const rush = live?.rushing || sd?.rushing;
  const recv = live?.receiving || sd?.receiving;
  const car = v(rush, 'CAR');
  const yds = v(rush, 'YDS');
  return {
    rushingYards: yds,
    rushingTDs: v(rush, 'TD'),
    yardsPerCarry: car > 0 ? +(yds / car).toFixed(1) : 0,
    receptions: v(recv, 'REC'),
    receivingYards: v(recv, 'YDS'),
    receivingTDs: v(recv, 'TD'),
  };
};

const buildRecStats = (live, sd) => {
  const recv = live?.receiving || sd?.receiving;
  return {
    receptions: v(recv, 'REC'),
    receivingYards: v(recv, 'YDS'),
    receivingTDs: v(recv, 'TD'),
    targets: v(recv, 'TARGETS'),
  };
};

// ── Main function ───────────────────────────────────────────────────────────

/**
 * Attach college stats to a player object.
 * Merges CFBD live data (counting stats + PPA) with PFF static data
 * (proprietary metrics). Called once per player at init time.
 *
 * NOTE: Call preloadCFBDStats() before using this function to enable
 * live data. If not called or if CFBD is unavailable, falls back to
 * static data only (same behaviour as before).
 */
export const attachCollegeStats = (playerName, position, prospect) => {
  const live = getCFBDStats(playerName)
    || (prospect?.name && prospect.name !== playerName ? getCFBDStats(prospect.name) : null);

  const sd = getStaticCollegeStats(playerName)
    || (prospect?.name && prospect.name !== playerName ? getStaticCollegeStats(prospect.name) : null);

  if (!live && !sd) return {};

  // Position-specific basic stats (CFBD live preferred, static fallback)
  let stats;
  switch (position) {
    case 'QB': stats = buildQBStats(live, sd); break;
    case 'RB': stats = buildRBStats(live, sd); break;
    case 'WR':
    case 'TE': stats = buildRecStats(live, sd); break;
    default:   stats = {};
  }

  // Target share (WR / TE / RB)
  const recSource = live?.receiving || sd?.receiving;
  const targets = v(recSource, 'TARGETS');
  const teamTgts = sd?.teamTargetsTotal; // team totals still from CSV
  let targetShare = pct(targets, teamTgts);

  // PPA from CFBD (not available in PFF CSVs)
  const ppa = live?.ppa?.avgPPA ?? sd?.ppa ?? null;

  // PFF-only metrics (always from static CSV data)
  const yprr = sd?.pffYprr ?? null;
  const routesRun = sd?.routesRun ?? null;
  const tgtPerRR = routesRun > 0 && targets > 0 ? pct(targets, routesRun) : null;
  const firstDownTDPerRR = routesRun > 0
    ? +(((sd?.firstDowns || 0) + v(recSource, 'TD')) / routesRun).toFixed(2)
    : null;

  // Prospect advancedStats take priority (hand-curated)
  const adv = prospect?.advancedStats;
  if (adv?.targetShare != null) targetShare = adv.targetShare;

  // Determine data source label
  const dataSource = live ? 'cfbd' : 'static';

  return {
    stats,
    targetShare,
    ppa,
    yprr: adv?.yprr ?? yprr,
    routesRun,
    tgtPerRR,
    firstDownTDPerRR,
    // Receiving metrics (WR / TE) — PFF-only
    yardsAfterCatch: sd?.yardsAfterCatch ?? null,
    yardsAfterCatchPerRec: sd?.yardsAfterCatchPerRec ?? null,
    contestedCatchRate: sd?.contestedCatchRate ?? null,
    contestedReceptions: sd?.contestedReceptions ?? null,
    // Rushing metrics (RB) — PFF-only
    yardsAfterContact: sd?.yardsAfterContact ?? null,
    avoidedTackles: sd?.avoidedTackles ?? null,
    ycoPerAttempt: sd?.ycoPerAttempt ?? null,
    explosiveRuns: sd?.explosiveRuns ?? null,
    gamesPlayed: sd?.gamesPlayed ?? null,
    _dataSource: dataSource,
  };
};
