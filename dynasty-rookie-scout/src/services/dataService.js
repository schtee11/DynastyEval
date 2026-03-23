// Data service — Sleeper-first architecture
// 1. Fetch rookies from Sleeper API (source of truth for valid rookies)
// 2. Cross-reference with prospect metadata for scouting data
// 3. WR stats come from receivingData.js (no API calls)
// 4. QB/RB/TE stats enriched via CFBD API with fallback to static data

import { buildRookiePlayersFromSleeper } from './sleeperApi';
import { enrichNonWRStats } from './cfbdTransformer';
import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';

const hasCfbdKey = !!process.env.REACT_APP_CFBD_API_KEY;

// Cache live data so we only fetch once per session
let playersCache = null;

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
});

const getStaticPlayers = () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

export const getPlayers = async () => {
  if (playersCache) return playersCache;

  try {
    // Step 1: Build rookie list from Sleeper (source of truth)
    let players = await buildRookiePlayersFromSleeper();

    // Pre-draft or empty result: fall back to static prospect data
    if (!players || players.length === 0) {
      console.info('No Sleeper rookies found (likely pre-draft) — using static prospect data');
      playersCache = getStaticPlayers();
      return playersCache;
    }

    // Step 2: Enrich QB/RB/TE with CFBD API stats (WRs are skipped)
    if (hasCfbdKey) {
      console.info('[DataService] CFBD key present — attempting QB/RB/TE enrichment...');
      try {
        players = await enrichNonWRStats(players);
        console.info('[DataService] CFBD enrichment complete');
      } catch (err) {
        console.error('[DataService] CFBD enrichment failed:', err);
        // QB/RB/TE keep whatever stats came from the prospect cross-reference
      }
    } else {
      console.warn('[DataService] No CFBD API key — skipping live stat enrichment for QB/RB/TE');
    }

    // Clean up internal fields before exposing to UI
    players = players.map(({ _cfbdLookup, _prospect, ...player }) => player);

    playersCache = players;
    return players;
  } catch (err) {
    console.error('Sleeper-first data fetch failed, falling back to static data:', err);
    playersCache = getStaticPlayers();
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
