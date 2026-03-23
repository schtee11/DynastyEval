// Data service — Sleeper-first architecture
// 1. Fetch rookies from Sleeper API (source of truth for valid rookies)
// 2. Cross-reference with prospect metadata for scouting data
// 3. WR stats come from receivingData.js (no API calls)
// 4. QB/RB/TE stats enriched via CFBD API with fallback to static data

import { buildRookiePlayersFromSleeper } from './sleeperApi';
import { enrichNonWRStats } from './cfbdTransformer';
import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';

// Cache live data so we only fetch once per session
let playersCache = null;

// Exposed to UI for data source status banner
let dataSourceStatus = { sleeper: null, cfbd: null, source: 'loading' };

export const getDataSourceStatus = () => dataSourceStatus;

/**
 * Map a raw prospect (from rookieProspects2026.js) into the UI player shape.
 * Used as static fallback when Sleeper/CFBD are unavailable.
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
  // Carry through for CFBD enrichment (stripped before exposing to UI)
  _cfbdLookup: p.cfbdLookup ?? null,
  _prospect: p,
});

const getStaticPlayers = () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

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

    // Step 2: Enrich QB/RB/TE with college stats
    // Priority: static 2025 data → ESPN API → CFBD API (no key required for static/ESPN)
    console.info('[DataService] Attempting QB/RB/TE enrichment (static → ESPN → CFBD)...');
    try {
      const enriched = await enrichNonWRStats(players);
      const status = enriched._cfbdStatus;
      if (status) {
        dataSourceStatus.cfbd = {
          ok: status.matched > 0,
          ...status,
        };
        delete enriched._cfbdStatus;
      }
      players = enriched;
      console.info('[DataService] Enrichment complete');
    } catch (err) {
      console.error('[DataService] Enrichment failed:', err);
      dataSourceStatus.cfbd = { ok: false, reason: err.message };
    }

    // Clean up internal fields before exposing to UI
    players = players.map(({ _cfbdLookup, _prospect, ...player }) => player);

    playersCache = players;
    return players;
  } catch (err) {
    console.error('[DataService] Data fetch failed, falling back to static data:', err);
    dataSourceStatus = { sleeper: { ok: false, reason: err.message }, cfbd: { ok: false, reason: 'skipped' }, source: 'static' };
    playersCache = getStaticPlayers().map(({ _cfbdLookup, _prospect, ...p }) => p);
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
