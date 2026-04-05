// Attaches college stats to player objects.
//
// Data source: Railway backend API (proxies CFBD data server-side)
// All proprietary data sources (PFF, RAS) have been removed.

const API_BASE = process.env.REACT_APP_API_URL || '';

// ── CFBD data cache (loaded once from backend, shared across all players) ──

let cfbdStatsMap = null;
let manualStatsMap = null;
let cfbdLoadPromise = null;

/** Get manual stats map (populated after preload) */
export const getManualStats = () => manualStatsMap || {};

/**
 * Pre-load all CFBD stats + manual overrides from the backend.
 */
export const preloadCFBDStats = async () => {
  if (cfbdStatsMap) return cfbdStatsMap;
  if (cfbdLoadPromise) return cfbdLoadPromise;

  cfbdLoadPromise = fetch(`${API_BASE}/api/players`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      cfbdStatsMap = data.careerStats || {};
      manualStatsMap = data.manualStats || {};
      console.info(`[CFBDTransformer] Stats loaded: ${Object.keys(cfbdStatsMap).length} players, ${Object.keys(manualStatsMap).length} manual overrides`);
      return cfbdStatsMap;
    })
    .catch((err) => {
      console.warn('[CFBDTransformer] Backend stats fetch failed:', err.message);
      cfbdLoadPromise = null;
      return null;
    });

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

// Common nickname → full name mappings for fuzzy matching
const NICKNAMES = {
  'mike': ['michael'],
  'michael': ['mike'],
  'kc': ['kenneth', 'casey', 'k c'],
  'ty': ['tyler', 'tyrone'],
  'nick': ['nicholas'],
  'nicholas': ['nick'],
  'will': ['william'],
  'william': ['will'],
  'dan': ['daniel'],
  'daniel': ['dan'],
  'matt': ['matthew'],
  'matthew': ['matt'],
  'chris': ['christopher'],
  'christopher': ['chris'],
  'josh': ['joshua'],
  'joshua': ['josh'],
  'joe': ['joseph'],
  'joseph': ['joe'],
  'ben': ['benjamin'],
  'benjamin': ['ben'],
  'rob': ['robert'],
  'robert': ['rob'],
  'jake': ['jacob'],
  'jacob': ['jake'],
  'tony': ['antonio', 'anthony'],
  'antonio': ['tony'],
  'anthony': ['tony'],
};

/**
 * Look up a player in the CFBD stats map with multi-level fuzzy matching:
 * 1. Exact normalized name
 * 2. Without suffix (Jr, Sr, III, etc.)
 * 3. Nickname variants (Mike → Michael, KC → Kenneth, etc.)
 * 4. Last name only (if unique in the map)
 */
const getCFBDStats = (name) => {
  if (!cfbdStatsMap) return null;

  // Level 1: exact normalized
  const key = norm(name);
  if (cfbdStatsMap[key]) return cfbdStatsMap[key];

  // Level 2: without suffix
  const fuzzy = normFuzzy(name);
  if (fuzzy !== key && cfbdStatsMap[fuzzy]) return cfbdStatsMap[fuzzy];

  // Level 3: nickname variants
  const parts = fuzzy.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const rest = parts.slice(1).join(' ');
    const variants = NICKNAMES[firstName];
    if (variants) {
      for (const variant of variants) {
        const attempt = `${variant} ${rest}`;
        if (cfbdStatsMap[attempt]) return cfbdStatsMap[attempt];
      }
    }
  }

  // Level 4: last name match (find entries ending with the same last name)
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const matches = Object.keys(cfbdStatsMap).filter(k => k.endsWith(` ${lastName}`));
    if (matches.length === 1) {
      // Unique last name match — safe to use
      return cfbdStatsMap[matches[0]];
    }
  }

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
    targets: v(recv, 'TARGETS') || null, // from ESPN merge, 0 means no data
  };
};

// ── Main function ───────────────────────────────────────────────────────────

/**
 * Attach college stats to a player object.
 * Uses CFBD data fetched from the backend API.
 * Call preloadCFBDStats() before using this function.
 */
export const attachCollegeStats = (playerName, position, prospect) => {
  const live = getCFBDStats(playerName)
    || (prospect?.name && prospect.name !== playerName ? getCFBDStats(prospect.name) : null);

  if (!live) {
    // Fall back to static stats from prospect data if available
    if (prospect?.stats) {
      return {
        stats: prospect.stats,
        ppa: prospect.ppa ?? null,
        gamesPlayed: null,
        _dataSource: 'static',
      };
    }
    return {};
  }

  let stats;
  switch (position) {
    case 'QB': stats = buildQBStats(live); break;
    case 'RB': stats = buildRBStats(live); break;
    case 'WR':
    case 'TE': stats = buildRecStats(live); break;
    default:   stats = {};
  }

  const ppa = live?.ppa?.avgPPA ?? null;

  return {
    stats,
    ppa,
    gamesPlayed: null,
    _dataSource: 'cfbd',
  };
};
