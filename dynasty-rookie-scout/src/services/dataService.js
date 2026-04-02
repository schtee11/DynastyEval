// Data service — Sleeper-first architecture
// 1. Fetch rookies from Sleeper API (source of truth for valid rookies)
// 2. Cross-reference with prospect metadata for scouting data
// 3. All college stats attached from collegeStats2025.js (built from PFF CSVs)

import { buildRookiePlayersFromSleeper } from './sleeperApi';
import { attachCollegeStats, preloadCFBDStats } from './cfbdTransformer';
import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';
import { applyFantasyCalcRankings, prefetchFantasyCalc } from './fantasyCalcRankings';
import { getDraftPicks, getNameAliases } from './draftData';

// Cache live data so we only fetch once per session
let playersCache = null;

// Exposed to UI for data source status banner
let dataSourceStatus = { sleeper: null, cfbd: null, source: 'loading' };

export const getDataSourceStatus = () => dataSourceStatus;

/**
 * Map a raw prospect (from rookieProspects2026.js) into the UI player shape.
 * Used as static fallback when Sleeper is unavailable.
 */
const mapProspectToPlayer = (p) => {
  // Attach all college stats from the CSV-generated static data
  const csvStats = attachCollegeStats(p.name, p.position, p);

  return {
    id: p.id,
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
    receivingByPerspective: p.position === 'WR' ? (p.receivingByPerspective || null) : null,
    _prospect: p,
    // CSV stats (target share, yprr, YAC, slot rate, etc.) — all from receiving_summary.csv
    ...csvStats,
  };
};

const getStaticPlayers = () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

/**
 * Overlay draft projections from draftData.js onto the player list.
 * draftData.js is the most up-to-date mock draft — it takes priority
 * over the older projections in rookieProspects2026.js.
 */
const normDraft = (n) => (n || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

const applyDraftData = (players) => {
  const picks = getDraftPicks();
  const aliases = getNameAliases();

  // Build lookup: normalized name → draft pick entry
  // Also index by alias targets so prospect names can match
  const pickByName = {};
  for (const dp of picks) {
    const norm = normDraft(dp.name);
    pickByName[norm] = dp;
    // If this name has an alias, also index under the alias target
    if (aliases[norm]) {
      pickByName[aliases[norm]] = dp;
    }
  }

  let applied = 0;
  const result = players.map((player) => {
    const norm = normDraft(player.name);
    const dp = pickByName[norm] || pickByName[aliases[norm]];
    if (!dp) return player;
    applied++;
    return {
      ...player,
      draftRound: dp.round,
      draftPick: dp.pick,
      draftTeam: player.draftTeam || dp.team || null,
      draftIsProjected: !player.draftTeam,
    };
  });

  console.info(`[DataService] Draft data applied to ${applied}/${players.length} players from consensus big board`);
  return result;
};

/**
 * Two-phase loading:
 *  Phase 1 (fast): Return players from Sleeper/static + CFBD (both cached after first load)
 *  Phase 2 (deferred): Apply FantasyCalc rankings asynchronously via onUpdate callback
 *
 * This prevents the slow Google Sheets FantasyCalc endpoint (~10-30s cold start)
 * from blocking the entire UI.
 */
export const getPlayers = async (onUpdate) => {
  if (playersCache) {
    // If we have a full cache (with FC rankings), return immediately
    return playersCache;
  }

  try {
    // Launch Sleeper + CFBD in parallel (these are the fast ones)
    const cfbdPromise = preloadCFBDStats(2025).catch((err) => {
      console.warn('[DataService] CFBD preload failed:', err.message);
      return null;
    });

    const sleeperPromise = buildRookiePlayersFromSleeper().catch((err) => {
      console.warn('[DataService] Sleeper fetch failed, using static data:', err.message);
      dataSourceStatus.sleeper = { ok: false, reason: err.message };
      return [];
    });

    // Also kick off FantasyCalc fetch in parallel (but don't block on it)
    const fcPromise = prefetchFantasyCalc();

    // Wait for Sleeper + CFBD only — these are fast (cached after first load)
    const [sleeperResult, cfbdData] = await Promise.all([sleeperPromise, cfbdPromise]);

    let players = sleeperResult;
    dataSourceStatus.sleeper = players?.length > 0
      ? { ok: true, count: players.length }
      : { ok: false, reason: 'No rookies returned (pre-draft?)' };
    dataSourceStatus.cfbd = cfbdData
      ? { ok: true, count: Object.keys(cfbdData).length }
      : { ok: false, reason: 'Unavailable or no API key' };

    // Pre-draft or empty result: fall back to static prospect data
    if (!players || players.length === 0) {
      console.info('[DataService] No Sleeper rookies found (likely pre-draft) — using static prospect data');
      players = getStaticPlayers();
      dataSourceStatus.source = 'static';
    } else {
      dataSourceStatus.source = 'sleeper';
    }

    // Overlay latest draft projections (sync, fast)
    players = applyDraftData(players);

    // Clean up internal fields
    players = players.map(({ _prospect, ...player }) => player);

    // Phase 1 complete — return players immediately (with static ranks)
    // Don't cache yet — we'll update with FC rankings

    // Phase 2: Apply FantasyCalc rankings in background, then notify via callback
    fcPromise.then(async () => {
      try {
        const withFC = await applyFantasyCalcRankings(players);
        const final = withFC.map(({ _prospect, ...p }) => p);
        playersCache = final;
        console.info('[DataService] FantasyCalc rankings applied (deferred)');
        if (onUpdate) onUpdate(final);
      } catch (err) {
        console.warn('[DataService] FantasyCalc rankings failed, keeping static ranks:', err.message);
        playersCache = players;
      }
    });

    return players;
  } catch (err) {
    console.error('[DataService] Data fetch failed, falling back to static data:', err);
    dataSourceStatus = { sleeper: { ok: false, reason: err.message }, source: 'static' };
    playersCache = applyDraftData(getStaticPlayers()).map(({ _prospect, ...p }) => p);
    return playersCache;
  }
};

export const getPlayerById = async (id) => {
  const players = await getPlayers();
  const found = players.find((p) => p.id === id);
  if (found) return found;
  // Fallback to static data
  const p = getRawProspectById(id);
  return p ? mapProspectToPlayer(p) : undefined;
};

export const isUsingMockData = () => false;
export const isUsingLiveData = () => true;
