// ESPN Public Core API — fetches actual NFL draft results.
// Reference: https://github.com/pseudo-r/Public-ESPN-API
//
// Endpoint: https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/draft/rounds
// Response shape:
//   { count, pageIndex, pageSize, pageCount, items: [Round, ...] }
//   Round = { number, displayName, picks: [Pick, ...] }
//   Pick  = { pick, overall, round, traded, tradeNote,
//             athlete: { $ref }, team: { $ref } }
//
// athlete.$ref points at /draft/athletes/{id} and team.$ref at /seasons/{year}/teams/{id}.
// Both must be followed to get displayName + team abbreviation. We do this
// server-side once per 6 hours and cache the flat result in player_cache.

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

// ESPN sometimes returns http:// in $ref URLs even though the endpoint also
// serves https. Normalize so fetch doesn't get redirected unnecessarily.
const httpsify = (url) => (typeof url === 'string' ? url.replace(/^http:\/\//, 'https://') : url);

// Resolve athlete + team for a pick item.
const resolvePick = async (item) => {
  const athleteRef = httpsify(item.athlete?.$ref);
  const teamRef = httpsify(item.team?.$ref);

  const [athlete, team] = await Promise.all([
    athleteRef ? fetchJson(athleteRef).catch(() => null) : null,
    teamRef ? fetchJson(teamRef).catch(() => null) : null,
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
    traded: !!item.traded,
  };
};

const fetchDraftLive = async (year) => {
  const roundsRes = await fetchJson(`${ESPN_BASE}/seasons/${year}/draft/rounds?limit=20`);
  const rounds = roundsRes?.items || [];
  if (rounds.length === 0) return [];

  // Each round object already has its picks inlined under round.picks[].
  // No separate /picks endpoint is needed — that was the original parser bug.
  const allItems = [];
  for (const round of rounds) {
    if (!Array.isArray(round.picks)) continue;
    for (const p of round.picks) {
      if (p.round == null) p.round = round.number ?? null;
      allItems.push(p);
    }
  }

  console.info(`[ESPN] Resolving ${allItems.length} picks across ${rounds.length} rounds for ${year}`);

  const resolved = await pMap(allItems, resolvePick, REF_CONCURRENCY);
  const filtered = resolved.filter((p) => p && p.name && p.pick != null);

  console.info(`[ESPN] Resolved ${filtered.length}/${allItems.length} picks (rest dropped: missing name/pick)`);
  return filtered;
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
