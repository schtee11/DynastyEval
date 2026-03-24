// Data service — Sleeper-first architecture
// 1. Fetch rookies from Sleeper API (source of truth for valid rookies)
// 2. Cross-reference with prospect metadata for scouting data
// 3. WR stats come from receivingData.js (no API calls)
// 4. QB/RB/TE stats enriched via static data or ESPN API

import { buildRookiePlayersFromSleeper } from './sleeperApi';
import { enrichNonWRStats } from './cfbdTransformer';
import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';
import { applyFantasyCalcRankings } from './fantasyCalcRankings';
import { getDraftPicks, getNameAliases } from './draftData';

// Cache live data so we only fetch once per session
let playersCache = null;

// Exposed to UI for data source status banner
let dataSourceStatus = { sleeper: null, source: 'loading' };

export const getDataSourceStatus = () => dataSourceStatus;

/**
 * Map a raw prospect (from rookieProspects2026.js) into the UI player shape.
 * Used as static fallback when Sleeper is unavailable.
 */
const mapProspectToPlayer = (p) => ({
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
  stats: p.stats || {},
  breakoutAge: p.breakoutAge,
  dominatorRating: p.dominatorRating ?? null,
  targetShare: p.advancedStats?.targetShare ?? null,
  yprr: p.advancedStats?.yprr ?? null,
  yacPerRR: p.yacPerRR ?? null,
  injuries: p.injuries,
  dynastyADP: p.dynastyADP,
  rank: p.rank,
  playerComps: p.playerComps,
  receivingByPerspective: p.position === 'WR' ? (p.receivingByPerspective || null) : null,
  _prospect: p,
});

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

export const getPlayers = async () => {
  if (playersCache) return playersCache;

  try {
    // Step 1: Build rookie list from Sleeper (source of truth)
    let players;
    try {
      players = await buildRookiePlayersFromSleeper();
      dataSourceStatus.sleeper = players?.length > 0
        ? { ok: true, count: players.length }
        : { ok: false, reason: 'No rookies returned (pre-draft?)' };
    } catch (err) {
      console.warn('[DataService] Sleeper fetch failed, using static data:', err.message);
      dataSourceStatus.sleeper = { ok: false, reason: err.message };
      players = [];
    }

    // Pre-draft or empty result: fall back to static prospect data
    if (!players || players.length === 0) {
      console.info('[DataService] No Sleeper rookies found (likely pre-draft) — using static prospect data');
      players = getStaticPlayers();
      dataSourceStatus.source = 'static';
    } else {
      dataSourceStatus.source = 'sleeper';
    }

    // Step 1b: Overlay latest draft projections from draftData.js
    players = applyDraftData(players);

    // Step 2: Enrich QB/RB/TE with college stats (static data → ESPN API)
    try {
      players = await enrichNonWRStats(players);
      console.info('[DataService] Enrichment complete');
    } catch (err) {
      console.error('[DataService] Enrichment failed:', err);
    }

    // Step 3: Apply live FantasyCalc dynasty rookie rankings
    try {
      players = await applyFantasyCalcRankings(players);
      console.info('[DataService] FantasyCalc rankings applied');
    } catch (err) {
      console.warn('[DataService] FantasyCalc rankings failed, using static ranks:', err.message);
    }

    // Clean up internal fields before exposing to UI
    players = players.map(({ _prospect, ...player }) => player);

    playersCache = players;
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
