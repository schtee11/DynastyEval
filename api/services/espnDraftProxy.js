// ESPN Public Core API — fetches actual NFL draft results.
// Reference: https://github.com/pseudo-r/Public-ESPN-API
//
// Top-level: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/draft
// Rounds collection ends in /rounds; each round's picks at /rounds/{n}/picks.
// Pick items contain $ref URLs for athlete and team that must be followed
// to resolve names and team abbreviations. We do this server-side once per
// 6 hours and cache the flat result in player_cache.

const pool = require('../db/pool');

const ESPN_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const FETCH_TIMEOUT_MS = 8000;
const REF_CONCURRENCY = 10; // parallel athlete/team ref fetches

const cacheKey = (year) => `espn_draft_${year}`;

const fetchJson = async (url) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

// Run async fn over items with bounded concurrency.
const pMap = async (items, fn, concurrency) => {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = await fn(items[i], i);
      } catch {
        results[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
};

// Fetch all picks for a single round (paginated defensively).
const fetchRoundPicks = async (roundRef) => {
  const base = roundRef.split('?')[0];
  const url = `${base}/picks?limit=64`;
  const data = await fetchJson(url).catch(() => null);
  return data?.items || [];
};

// Resolve athlete + team for a pick item.
const resolvePick = async (item) => {
  const [athlete, team] = await Promise.all([
    item.athlete?.$ref ? fetchJson(item.athlete.$ref).catch(() => null) : null,
    item.team?.$ref ? fetchJson(item.team.$ref).catch(() => null) : null,
  ]);

  const name = athlete?.fullName
    || athlete?.displayName
    || [athlete?.firstName, athlete?.lastName].filter(Boolean).join(' ')
    || null;

  return {
    pick: item.overall ?? item.pick ?? null,
    round: item.round ?? null,
    name,
    position: athlete?.position?.abbreviation || athlete?.position?.name || null,
    college: athlete?.college?.name || athlete?.collegeAthlete?.college?.name || null,
    team: team?.abbreviation || team?.shortDisplayName || team?.name || null,
  };
};

const fetchDraftLive = async (year) => {
  const roundsRes = await fetchJson(`${ESPN_BASE}/seasons/${year}/draft/rounds?limit=20`);
  const rounds = roundsRes?.items || [];
  if (rounds.length === 0) return [];

  // Each round may be a $ref or an inline object — handle both.
  const allItems = [];
  for (const round of rounds) {
    const ref = round.$ref || round.href || `${ESPN_BASE}/seasons/${year}/draft/rounds/${round.number || round.value}`;
    const picks = await fetchRoundPicks(ref);
    for (const p of picks) {
      // Make sure round number is present on the pick (ESPN sometimes omits it)
      if (p.round == null) p.round = round.number ?? round.value ?? null;
      allItems.push(p);
    }
  }

  const resolved = await pMap(allItems, resolvePick, REF_CONCURRENCY);
  return resolved.filter((p) => p && p.name && p.pick != null);
};

const fetchDraftPicks = async (year = 2026) => {
  const key = cacheKey(year);

  const cached = await pool.query(
    'SELECT data_json, fetched_at FROM player_cache WHERE cache_key = $1',
    [key]
  );

  if (cached.rows.length > 0) {
    const { data_json, fetched_at } = cached.rows[0];
    const fresh = Date.now() - new Date(fetched_at).getTime() < CACHE_TTL_MS;
    if (fresh) {
      return typeof data_json === 'string' ? JSON.parse(data_json) : data_json;
    }
  }

  const picks = await fetchDraftLive(year);

  if (picks.length > 0) {
    await pool.query(
      `INSERT INTO player_cache (cache_key, data_json, source, fetched_at)
       VALUES ($1, $2, 'espn', NOW())
       ON CONFLICT (cache_key) DO UPDATE SET data_json = $2, fetched_at = NOW()`,
      [key, JSON.stringify(picks)]
    );
    console.info(`[ESPN] Cached ${picks.length} draft picks for ${year}`);
  }

  return picks;
};

const clearDraftCache = async (year) => {
  await pool.query('DELETE FROM player_cache WHERE cache_key = $1', [cacheKey(year)]);
};

module.exports = { fetchDraftPicks, clearDraftCache };
