// College Football Data API client (what cfbfastR wraps under the hood).
// Provides live player stats for passing, rushing, receiving, and PPA.
//
// Requires REACT_APP_CFBD_API_KEY in your .env file.
// Free tier: https://collegefootballdata.com — sign up for an API key.
//
// PFF-proprietary metrics (grades, BTT/TWP rates, elusive rating, etc.)
// are NOT available via CFBD and still come from the static CSV data.

const CFBD_BASE = 'https://apinext.collegefootballdata.com';

// ── Cache ─────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'cfbd_v2';
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

// ── API helpers ────────────────────────────────────────────────────────────

const getApiKey = () => process.env.REACT_APP_CFBD_API_KEY || '';

const cfbdFetch = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[CFBD] No API key configured (set REACT_APP_CFBD_API_KEY)');
    return null;
  }

  const url = new URL(`${CFBD_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    console.warn(`[CFBD] ${endpoint} failed: ${res.status} ${res.statusText}`);
    return null;
  }

  return res.json();
};

// ── Bulk stat fetchers (minimise API calls) ────────────────────────────────

/**
 * Fetch all player season stats for a given year and season type.
 * Returns raw CFBD response array.
 * One API call per (year, category) — much more efficient than per-player.
 */
const fetchSeasonStats = async (year, category) => {
  return cachedFetch(`stats-${year}-${category}`, () =>
    cfbdFetch('/stats/player/season', {
      year,
      category, // 'passing', 'rushing', 'receiving'
      seasonType: 'regular',
    })
  );
};

/**
 * Fetch PPA (Predicted Points Added) for all players in a season.
 */
const fetchSeasonPPA = async (year) => {
  return cachedFetch(`ppa-${year}`, () =>
    cfbdFetch('/ppa/players/season', { year })
  );
};

// ── Name normalisation (matches existing app conventions) ──────────────────

const norm = (n) =>
  (n || '')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// ── Transform CFBD response into per-player stat maps ──────────────────────

/**
 * Index an array of CFBD player stat rows by normalised player name.
 * Each row has: { playerId, player, team, conference, category, statType, stat }
 *
 * Returns: Map<normName, { statType: value, ... }>
 */
const indexStatRows = (rows) => {
  if (!rows || !Array.isArray(rows)) return new Map();

  const byPlayer = new Map();

  for (const row of rows) {
    const key = norm(row.player);
    if (!key) continue;

    if (!byPlayer.has(key)) {
      byPlayer.set(key, { team: row.team, conference: row.conference });
    }

    const entry = byPlayer.get(key);
    const statType = (row.statType || '').toUpperCase();
    const val = parseFloat(row.stat);
    if (!isNaN(val)) {
      entry[statType] = val;
    }
  }

  return byPlayer;
};

/**
 * Index PPA rows by normalised player name.
 * Each row has: { id, name, team, conference, position,
 *   averagePPA: { all, pass, rush, firstDown, secondDown, thirdDown },
 *   totalPPA: { all, pass, rush, ... }, countablePlays }
 */
const indexPPARows = (rows) => {
  if (!rows || !Array.isArray(rows)) return new Map();

  const byPlayer = new Map();
  for (const row of rows) {
    const key = norm(row.name);
    if (!key) continue;
    byPlayer.set(key, {
      totalPPA: row.totalPPA?.all ?? null,
      passPPA: row.totalPPA?.pass ?? null,
      rushPPA: row.totalPPA?.rush ?? null,
      avgPPA: row.averagePPA?.all ?? null,
      plays: row.countablePlays ?? null,
    });
  }
  return byPlayer;
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch all CFBD stats for a season and build a unified lookup.
 * Returns: Map<normName, { passing, rushing, receiving, ppa, team }>
 *
 * This makes 4 API calls total (passing + rushing + receiving + PPA),
 * regardless of how many players we have. Results are cached for 24h.
 */
export const fetchAllPlayerStats = async (year = 2025) => {
  return cachedFetch(`all-players-${year}`, async () => {
    // Fetch all categories in parallel
    const [passingRaw, rushingRaw, receivingRaw, ppaRaw] = await Promise.all([
      fetchSeasonStats(year, 'passing'),
      fetchSeasonStats(year, 'rushing'),
      fetchSeasonStats(year, 'receiving'),
      fetchSeasonPPA(year),
    ]);

    const passingIndex = indexStatRows(passingRaw);
    const rushingIndex = indexStatRows(rushingRaw);
    const receivingIndex = indexStatRows(receivingRaw);
    const ppaIndex = indexPPARows(ppaRaw);

    // Merge all into a single per-player map
    const allNames = new Set([
      ...passingIndex.keys(),
      ...rushingIndex.keys(),
      ...receivingIndex.keys(),
      ...ppaIndex.keys(),
    ]);

    const unified = {};
    for (const name of allNames) {
      const pass = passingIndex.get(name);
      const rush = rushingIndex.get(name);
      const recv = receivingIndex.get(name);
      const ppa = ppaIndex.get(name);

      unified[name] = {
        team: pass?.team || rush?.team || recv?.team || null,
        passing: pass
          ? {
              YDS: pass.YDS ?? pass.PASSING_YDS ?? 0,
              TD: pass.TD ?? pass.PASSING_TD ?? 0,
              INT: pass.INT ?? pass.INTERCEPTIONS ?? 0,
              ATT: pass.ATT ?? pass.PASSING_ATT ?? pass.COMPLETIONS != null
                ? (pass.COMPLETIONS || 0) + (pass.INCOMPLETIONS || 0)
                : 0,
              COMP: pass.COMPLETIONS ?? 0,
            }
          : null,
        rushing: rush
          ? {
              YDS: rush.YDS ?? rush.RUSHING_YDS ?? 0,
              TD: rush.TD ?? rush.RUSHING_TD ?? 0,
              CAR: rush.CAR ?? rush.ATT ?? rush.RUSHING_ATT ?? 0,
            }
          : null,
        receiving: recv
          ? {
              REC: recv.REC ?? recv.RECEPTIONS ?? 0,
              YDS: recv.YDS ?? recv.RECEIVING_YDS ?? 0,
              TD: recv.TD ?? recv.RECEIVING_TD ?? 0,
              TARGETS: recv.TARGETS ?? 0,
            }
          : null,
        ppa: ppa || null,
      };
    }

    console.info(`[CFBD] Loaded stats for ${Object.keys(unified).length} players (${year})`);
    return unified;
  });
};

/**
 * Fetch career stats across multiple seasons and aggregate into totals.
 * Reuses fetchAllPlayerStats per year (each individually cached).
 * Sums counting stats; recalculates rate stats from components.
 */
export const fetchCareerStats = async (years = [2022, 2023, 2024, 2025]) => {
  return cachedFetch(`career-${years.join('-')}`, async () => {
    const yearResults = await Promise.all(years.map(y => fetchAllPlayerStats(y)));
    const validResults = yearResults.filter(r => r != null);

    if (validResults.length === 0) return null;

    const career = {};

    for (const yearData of validResults) {
      for (const [name, stats] of Object.entries(yearData)) {
        if (!career[name]) {
          career[name] = {
            team: stats.team,
            passing: null,
            rushing: null,
            receiving: null,
            ppa: null,
          };
        }

        const c = career[name];

        // Update team to most recent
        if (stats.team) c.team = stats.team;

        // Aggregate passing
        if (stats.passing) {
          if (!c.passing) c.passing = { YDS: 0, TD: 0, INT: 0, ATT: 0, COMP: 0 };
          c.passing.YDS += stats.passing.YDS || 0;
          c.passing.TD += stats.passing.TD || 0;
          c.passing.INT += stats.passing.INT || 0;
          c.passing.ATT += stats.passing.ATT || 0;
          c.passing.COMP += stats.passing.COMP || 0;
        }

        // Aggregate rushing
        if (stats.rushing) {
          if (!c.rushing) c.rushing = { YDS: 0, TD: 0, CAR: 0 };
          c.rushing.YDS += stats.rushing.YDS || 0;
          c.rushing.TD += stats.rushing.TD || 0;
          c.rushing.CAR += stats.rushing.CAR || 0;
        }

        // Aggregate receiving
        if (stats.receiving) {
          if (!c.receiving) c.receiving = { REC: 0, YDS: 0, TD: 0, TARGETS: 0 };
          c.receiving.REC += stats.receiving.REC || 0;
          c.receiving.YDS += stats.receiving.YDS || 0;
          c.receiving.TD += stats.receiving.TD || 0;
          c.receiving.TARGETS += stats.receiving.TARGETS || 0;
        }

        // PPA: use most recent year's average (not cumulative)
        if (stats.ppa) {
          c.ppa = stats.ppa;
        }
      }
    }

    // Recalculate rate stats from aggregated components
    for (const c of Object.values(career)) {
      if (c.passing && c.passing.ATT > 0) {
        c.passing.PCT = +((c.passing.COMP / c.passing.ATT) * 100).toFixed(1);
      }
    }

    console.info(`[CFBD] Career stats aggregated for ${Object.keys(career).length} players across ${validResults.length} seasons`);
    return career;
  });
};

/**
 * Check if the CFBD API is available (has API key configured).
 */
export const isCFBDAvailable = () => !!getApiKey();

/**
 * Clear all CFBD caches.
 */
export const clearCFBDCache = () => {
  Object.keys(memCache).forEach((k) => delete memCache[k]);
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${CACHE_VERSION}_`))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage unavailable
  }
};
