// Attaches college stats to player objects.
//
// Data source priority:
//  1. CFBD direct (if REACT_APP_CFBD_API_KEY is set in the frontend env)
//  2. Backend /api/players (the server holds the CFBD key in production)
// All proprietary data sources (PFF, RAS) have been removed.

import { fetchCareerStats, isCFBDAvailable } from './cfbdApi';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ── CFBD data cache (loaded once, shared across all players) ────────────────

let cfbdStatsMap = null;
let cfbdLoadPromise = null;

const fetchCareerFromBackend = async () => {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/players`);
    if (!res.ok) {
      console.warn(`[CFBDTransformer] backend /api/players → ${res.status}`);
      return null;
    }
    const body = await res.json();
    return body?.careerStats && Object.keys(body.careerStats).length > 0
      ? body.careerStats
      : null;
  } catch (err) {
    console.warn('[CFBDTransformer] backend stats fetch failed:', err.message);
    return null;
  }
};

/**
 * Pre-load college stats. Call once before attaching stats to players.
 * Safe to call multiple times — only fetches once.
 */
export const preloadCFBDStats = async (_year = 2025) => {
  if (cfbdStatsMap) return cfbdStatsMap;
  if (cfbdLoadPromise) return cfbdLoadPromise;

  cfbdLoadPromise = (async () => {
    // Try direct CFBD first if a key is present in the frontend env.
    if (isCFBDAvailable()) {
      try {
        const data = await fetchCareerStats([2022, 2023, 2024, 2025]);
        if (data && Object.keys(data).length > 0) {
          cfbdStatsMap = data;
          console.info(`[CFBDTransformer] CFBD direct: ${Object.keys(data).length} players`);
          return data;
        }
      } catch (err) {
        console.warn('[CFBDTransformer] CFBD direct failed, trying backend:', err.message);
      }
    }

    // Fall back to backend (which holds the CFBD key server-side).
    const backend = await fetchCareerFromBackend();
    if (backend) {
      cfbdStatsMap = backend;
      console.info(`[CFBDTransformer] backend stats: ${Object.keys(backend).length} players`);
      return backend;
    }

    console.info('[CFBDTransformer] No stats source available');
    return null;
  })();

  return cfbdLoadPromise;
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

const buildQBStats = (live) => {
  const pass = live?.passing;
  const rush = live?.rushing;
  return {
    passingYards: v(pass, 'YDS'),
    passingTDs: v(pass, 'TD'),
    interceptions: v(pass, 'INT'),
    completionPct: v(pass, 'PCT') || pct(v(pass, 'COMP'), v(pass, 'ATT')),
    rushingYards: v(rush, 'YDS'),
    rushingTDs: v(rush, 'TD'),
  };
};

const buildRBStats = (live) => {
  const rush = live?.rushing;
  const recv = live?.receiving;
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

const buildRecStats = (live) => {
  const recv = live?.receiving;
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
 * Uses CFBD live data only (all proprietary sources removed).
 * Call preloadCFBDStats() before using this function.
 */
export const attachCollegeStats = (playerName, position, prospect) => {
  const live = getCFBDStats(playerName)
    || (prospect?.name && prospect.name !== playerName ? getCFBDStats(prospect.name) : null);

  if (!live) return {};

  // Position-specific basic stats from CFBD
  let stats;
  switch (position) {
    case 'QB': stats = buildQBStats(live); break;
    case 'RB': stats = buildRBStats(live); break;
    case 'WR':
    case 'TE': stats = buildRecStats(live); break;
    default:   stats = {};
  }

  // PPA from CFBD
  const ppa = live?.ppa?.avgPPA ?? null;

  return {
    stats,
    ppa,
    gamesPlayed: null,
    _dataSource: 'cfbd',
  };
};
