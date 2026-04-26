// Data service — Sleeper-first architecture
// 1. Fetch career stats from backend (Railway proxies CFBD)
// 2. Fetch rookies from Sleeper API (source of truth for valid rookies)
// 3. Cross-reference with prospect metadata for scouting data
// 4. Attach college stats to each player

import { buildRookiePlayersFromSleeper } from './sleeperApi';
import { preloadCFBDStats } from './cfbdTransformer';
import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';
import { getDraftPicks, getNameAliases } from './draftData';
import { fetchEspnDraftPicks } from './espnDraftApi';

const DRAFT_YEAR = 2026;

// Cache live data so we only fetch once per session
let playersCache = null;

// Exposed to UI for data source status banner
let dataSourceStatus = { sleeper: null, cfbd: null, espn: null, source: 'loading' };

export const getDataSourceStatus = () => dataSourceStatus;

/** Force a fresh load on next getPlayers() call. */
export const invalidatePlayersCache = () => {
  playersCache = null;
};

/**
 * Map a raw prospect (from rookieProspects2026.js) into the UI player shape.
 * Used as static fallback when Sleeper is unavailable.
 */
const mapProspectToPlayer = (p) => ({
  id: p.id,
  sleeperId: p.sleeperId,
  name: p.name,
  position: p.position,
  college: p.college,
  age: p.age,
  height: p.height,
  weight: p.weight,
  draftRound: p.projectedRound,
  draftPick: p.projectedPick,
  draftTeam: p.projectedTeam,
  draftIsProjected: true,
  breakoutAge: p.breakoutAge,
  injuries: p.injuries,
  dynastyADP: p.dynastyADP,
  rank: p.rank,
  playerComps: p.playerComps,
  advancedStats: p.advancedStats,
  stats: p.stats || null,
  _prospect: p,
});

const getStaticPlayers = () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

/**
 * Overlay draft picks onto the player list.
 *
 * Priority:
 *  1. ESPN live picks (actual draft results) — `actual: true`
 *  2. Static `draftData.js` consensus board — `actual: false` (pre-draft mock)
 *
 * ESPN picks win when both are present so the UI shows real picks/teams
 * the moment the draft completes.
 */
const normDraft = (n) => (n || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

const buildPickIndex = (picks, aliases, actual) => {
  const idx = {};
  for (const dp of picks) {
    const norm = normDraft(dp.name);
    if (!norm) continue;
    idx[norm] = { ...dp, actual };
    if (aliases[norm]) idx[aliases[norm]] = { ...dp, actual };
  }
  return idx;
};

const applyDraftData = (players, espnPicks = []) => {
  const aliases = getNameAliases();
  const projectedIdx = buildPickIndex(getDraftPicks(), aliases, false);
  const actualIdx = buildPickIndex(espnPicks, aliases, true);

  let actualApplied = 0;
  let projectedApplied = 0;

  const result = players.map((player) => {
    const norm = normDraft(player.name);
    const dp = actualIdx[norm] || actualIdx[aliases[norm]]
      || projectedIdx[norm] || projectedIdx[aliases[norm]];
    if (!dp) return player;

    if (dp.actual) actualApplied++; else projectedApplied++;

    return {
      ...player,
      draftRound: dp.round ?? player.draftRound ?? null,
      draftPick: dp.pick ?? player.draftPick ?? null,
      draftTeam: dp.team || player.draftTeam || null,
      draftIsProjected: !dp.actual && !player.draftTeam,
    };
  });

  console.info(
    `[DataService] Draft applied — actual: ${actualApplied}, projected: ${projectedApplied}, total: ${players.length}`
  );
  return result;
};

/**
 * Load players:
 *  1. Preload CFBD stats from backend FIRST (so attachCollegeStats has data)
 *  2. Then build player list from Sleeper (which calls attachCollegeStats)
 *  3. Overlay draft data
 */
export const getPlayers = async (onUpdate) => {
  if (playersCache) {
    return playersCache;
  }

  try {
    // Step 1: Load CFBD stats from backend FIRST — must complete before Sleeper build.
    //         Kick off ESPN draft fetch in parallel; it can take a moment on cold cache.
    const espnPromise = fetchEspnDraftPicks(DRAFT_YEAR).catch((err) => {
      console.warn('[DataService] ESPN draft fetch failed:', err.message);
      return [];
    });

    const cfbdData = await preloadCFBDStats().catch((err) => {
      console.warn('[DataService] CFBD preload failed:', err.message);
      return null;
    });

    dataSourceStatus.cfbd = cfbdData
      ? { ok: true, count: Object.keys(cfbdData).length }
      : { ok: false, reason: 'Unavailable' };

    // Step 2: Build player list from Sleeper (attachCollegeStats now has cfbdStatsMap)
    let players;
    try {
      players = await buildRookiePlayersFromSleeper();
    } catch (err) {
      console.warn('[DataService] Sleeper fetch failed, using static data:', err.message);
      dataSourceStatus.sleeper = { ok: false, reason: err.message };
      players = [];
    }

    dataSourceStatus.sleeper = players?.length > 0
      ? { ok: true, count: players.length }
      : { ok: false, reason: 'No rookies returned (pre-draft?)' };

    // Pre-draft or empty result: fall back to static prospect data
    if (!players || players.length === 0) {
      console.info('[DataService] No Sleeper rookies found — using static prospect data');
      players = getStaticPlayers();
      dataSourceStatus.source = 'static';
    } else {
      dataSourceStatus.source = 'sleeper';
    }

    // Step 3: Wait for ESPN draft picks, then overlay actuals over static projections
    const espnPicks = await espnPromise;
    dataSourceStatus.espn = espnPicks?.length > 0
      ? { ok: true, count: espnPicks.length }
      : { ok: false, reason: 'No live picks (pre-draft or backend unavailable)' };

    players = applyDraftData(players, espnPicks);

    // Clean up internal fields
    players = players.map(({ _prospect, ...player }) => player);

    playersCache = players;
    return players;
  } catch (err) {
    console.error('[DataService] Data fetch failed, falling back to static data:', err);
    dataSourceStatus = {
      sleeper: { ok: false, reason: err.message },
      cfbd: null, espn: null, source: 'static',
    };
    playersCache = applyDraftData(getStaticPlayers(), []).map(({ _prospect, ...p }) => p);
    return playersCache;
  }
};

export const getPlayerById = async (id) => {
  const players = await getPlayers();
  const found = players.find((p) => p.id === id);
  if (found) return found;
  const p = getRawProspectById(id);
  return p ? mapProspectToPlayer(p) : undefined;
};

export const isUsingMockData = () => false;
export const isUsingLiveData = () => true;
