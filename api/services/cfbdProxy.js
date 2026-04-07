const pool = require('../db/pool');

const CFBD_BASE = 'https://apinext.collegefootballdata.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const getApiKey = () => process.env.CFBD_API_KEY || '';

const cfbdFetch = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = new URL(`${CFBD_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`[CFBD] ${endpoint} → ${res.status}`);
    return null;
  }
  return res.json();
};

const norm = (n) =>
  (n || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Fetch and cache all player stats for a season.
 */
const fetchSeasonStats = async (year, category) => {
  const cacheKey = `cfbd_stats_${year}_${category}`;

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

  const data = await cfbdFetch('/stats/player/season', {
    year,
    category,
    seasonType: 'regular',
  });

  if (data) {
    await pool.query(
      `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
       VALUES ($1, $2, 'cfbd', NOW())
       ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
      [cacheKey, JSON.stringify(data)]
    );
  }

  return data;
};

const fetchSeasonPPA = async (year) => {
  const cacheKey = `cfbd_ppa_${year}`;

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

  const data = await cfbdFetch('/ppa/players/season', { year });

  if (data) {
    await pool.query(
      `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
       VALUES ($1, $2, 'cfbd', NOW())
       ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
      [cacheKey, JSON.stringify(data)]
    );
  }

  return data;
};

/**
 * Index stat rows by normalized player name.
 */
const indexStatRows = (rows) => {
  if (!rows || !Array.isArray(rows)) return new Map();
  const byPlayer = new Map();
  for (const row of rows) {
    const key = norm(row.player);
    if (!key) continue;
    if (!byPlayer.has(key)) byPlayer.set(key, { team: row.team });
    const entry = byPlayer.get(key);
    const statType = (row.statType || '').toUpperCase();
    const val = parseFloat(row.stat);
    if (!isNaN(val)) entry[statType] = val;
  }
  return byPlayer;
};

const indexPPARows = (rows) => {
  if (!rows || !Array.isArray(rows)) return new Map();
  const byPlayer = new Map();
  for (const row of rows) {
    const key = norm(row.name);
    if (!key) continue;
    byPlayer.set(key, {
      totalPPA: row.totalPPA?.all ?? null,
      avgPPA: row.averagePPA?.all ?? null,
      plays: row.countablePlays ?? null,
    });
  }
  return byPlayer;
};

/**
 * Fetch all stats for a given year, merge into unified lookup.
 */
const fetchAllPlayerStats = async (year = 2025) => {
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
      passing: pass ? {
        YDS: pass.YDS ?? 0, TD: pass.TD ?? 0, INT: pass.INT ?? 0,
        ATT: pass.ATT ?? (pass.COMPLETIONS || 0) + (pass.INCOMPLETIONS || 0),
        COMP: pass.COMPLETIONS ?? 0,
      } : null,
      rushing: rush ? {
        YDS: rush.YDS ?? 0, TD: rush.TD ?? 0, CAR: rush.CAR ?? rush.ATT ?? 0,
      } : null,
      receiving: recv ? {
        REC: recv.REC ?? recv.RECEPTIONS ?? 0, YDS: recv.YDS ?? 0,
        TD: recv.TD ?? 0, TARGETS: recv.TARGETS ?? 0,
      } : null,
      ppa: ppa || null,
    };
  }

  return unified;
};

/**
 * Fetch career stats across multiple seasons.
 */
const fetchCareerStats = async (years = [2022, 2023, 2024, 2025]) => {
  const cacheKey = `cfbd_career_${years.join('-')}`;

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

  const yearResults = await Promise.all(years.map(y => fetchAllPlayerStats(y)));
  const validResults = yearResults.filter(r => r != null);
  if (validResults.length === 0) return null;

  const career = {};
  for (const yearData of validResults) {
    for (const [name, stats] of Object.entries(yearData)) {
      if (!career[name]) {
        career[name] = { team: stats.team, passing: null, rushing: null, receiving: null, ppa: null };
      }
      const c = career[name];
      if (stats.team) c.team = stats.team;

      if (stats.passing) {
        if (!c.passing) c.passing = { YDS: 0, TD: 0, INT: 0, ATT: 0, COMP: 0 };
        c.passing.YDS += stats.passing.YDS || 0;
        c.passing.TD += stats.passing.TD || 0;
        c.passing.INT += stats.passing.INT || 0;
        c.passing.ATT += stats.passing.ATT || 0;
        c.passing.COMP += stats.passing.COMP || 0;
      }
      if (stats.rushing) {
        if (!c.rushing) c.rushing = { YDS: 0, TD: 0, CAR: 0 };
        c.rushing.YDS += stats.rushing.YDS || 0;
        c.rushing.TD += stats.rushing.TD || 0;
        c.rushing.CAR += stats.rushing.CAR || 0;
      }
      if (stats.receiving) {
        if (!c.receiving) c.receiving = { REC: 0, YDS: 0, TD: 0, TARGETS: 0 };
        c.receiving.REC += stats.receiving.REC || 0;
        c.receiving.YDS += stats.receiving.YDS || 0;
        c.receiving.TD += stats.receiving.TD || 0;
        c.receiving.TARGETS += stats.receiving.TARGETS || 0;
      }
      if (stats.ppa) c.ppa = stats.ppa;
    }
  }

  // Recalculate rate stats
  for (const c of Object.values(career)) {
    if (c.passing && c.passing.ATT > 0) {
      c.passing.PCT = +((c.passing.COMP / c.passing.ATT) * 100).toFixed(1);
    }
  }

  // Cache the career result
  await pool.query(
    `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
     VALUES ($1, $2, 'cfbd', NOW())
     ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
    [cacheKey, JSON.stringify(career)]
  );

  console.info(`[CFBDProxy] Career stats cached for ${Object.keys(career).length} players`);
  return career;
};

module.exports = { fetchSleeperRookies: null, fetchCareerStats, fetchAllPlayerStats };
