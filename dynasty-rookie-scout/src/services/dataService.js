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
 * Three-phase loading — instant render, progressive enrichment:
 *
 *  Phase 0 (instant, ~0ms): Return static prospect data from bundled JS.
 *    This is rookieProspects2026.js + collegeStats2025.js + draftData.js.
 *    No network calls. UI renders immediately.
 *
 *  Phase 1 (background): Fetch Sleeper + CFBD live data.
 *    When ready, merge with static data and call onUpdate().
 *
 *  Phase 2 (background): Apply FantasyCalc dynasty rankings.
 *    When ready, call onUpdate() again with final data.
 *
 * The onUpdate callback lets the UI re-render progressively
 * without ever blocking on network calls.
 */
export const getPlayers = async (onUpdate) => {
  if (playersCache) return playersCache;

  // Phase 0: Return static data IMMEDIATELY (no network, ~0ms)
  let players = getStaticPlayers();
  players = applyDraftData(players);
  players = players.map(({ _prospect, ...p }) => p);
  dataSourceStatus.source = 'static';

  // Phase 1 + 2: Enrich with live data in background
  const enrichInBackground = async () => {
    try {
      // Launch ALL network requests in parallel
      const cfbdPromise = preloadCFBDStats(2025).catch((err) => {
        console.warn('[DataService] CFBD preload failed:', err.message);
        return null;
      });
      const sleeperPromise = buildRookiePlayersFromSleeper().catch((err) => {
        console.warn('[DataService] Sleeper fetch failed:', err.message);
        dataSourceStatus.sleeper = { ok: false, reason: err.message };
        return [];
      });
      const fcPromise = prefetchFantasyCalc();

      // Wait for Sleeper + CFBD
      const [sleeperResult, cfbdData] = await Promise.all([sleeperPromise, cfbdPromise]);

      dataSourceStatus.sleeper = sleeperResult?.length > 0
        ? { ok: true, count: sleeperResult.length }
        : { ok: false, reason: 'No rookies returned (pre-draft?)' };
      dataSourceStatus.cfbd = cfbdData
        ? { ok: true, count: Object.keys(cfbdData).length }
        : { ok: false, reason: 'Unavailable or no API key' };

      // If Sleeper returned rookies, use them (better data); otherwise keep static
      let enriched;
      if (sleeperResult && sleeperResult.length > 0) {
        enriched = applyDraftData(sleeperResult);
        dataSourceStatus.source = 'sleeper';
      } else {
        enriched = applyDraftData(getStaticPlayers());
        dataSourceStatus.source = 'static';
      }
      enriched = enriched.map(({ _prospect, ...p }) => p);

      console.info(`[DataService] Phase 1 complete — ${enriched.length} players from ${dataSourceStatus.source}`);
      if (onUpdate) onUpdate(enriched);

      // Phase 2: Apply FantasyCalc rankings
      try {
        await fcPromise;
        const withFC = await applyFantasyCalcRankings(enriched);
        const final = withFC.map(({ _prospect, ...p }) => p);
        playersCache = final;
        console.info('[DataService] Phase 2 complete — FantasyCalc rankings applied');
        if (onUpdate) onUpdate(final);
      } catch (err) {
        console.warn('[DataService] FantasyCalc failed, keeping static ranks:', err.message);
        playersCache = enriched;
      }
    } catch (err) {
      console.error('[DataService] Background enrichment failed:', err);
    }
  };

  // Fire and forget — don't await
  enrichInBackground();

  return players;
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
