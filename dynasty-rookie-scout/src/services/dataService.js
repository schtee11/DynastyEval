// Data service abstraction layer
// Pulls live college stats from CFBD API when a key is configured,
// otherwise falls back to static rookieProspects2026 data.
// WR receiving perspective data (from PFF images) is always merged in.
// Post-draft: validates prospects against Sleeper API to filter out non-2026 rookies.

import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';
import { buildPlayersFromAPI } from './cfbdTransformer';
import { validateProspects } from './sleeperApi';

const hasCfbdKey = !!process.env.REACT_APP_CFBD_API_KEY;
const forceMock = process.env.REACT_APP_USE_MOCK === 'true';
const useLive = hasCfbdKey && !forceMock;

// Cache live data so we only fetch once per session
let livePlayersCache = null;

/**
 * Filter players through Sleeper API validation.
 * Removes any prospect that Sleeper identifies as a prior-year draft pick
 * (years_exp > 0). Keeps prospects not yet in Sleeper (pre-draft) and
 * confirmed 2026 rookies.
 */
const filterWithSleeperValidation = async (players) => {
  try {
    const results = await validateProspects(players);
    const filtered = [];
    for (const { prospect, sleeperMatch, status } of results) {
      if (status === 'wrong_year') {
        console.warn(
          `[Sleeper] Removing ${prospect.name} — already drafted (years_exp=${sleeperMatch.yearsExp}, team=${sleeperMatch.team})`
        );
        continue;
      }
      // Keep confirmed rookies and not-yet-in-Sleeper prospects
      filtered.push(prospect);
    }
    return filtered;
  } catch (err) {
    console.warn('[Sleeper] Validation failed, returning unfiltered list:', err.message);
    return players;
  }
};

/**
 * Map raw prospect metadata into the shape the UI expects.
 * Used as fallback when CFBD API is unavailable.
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
  // Only attach perspective data for WRs
  receivingByPerspective: p.position === 'WR' ? (p.receivingByPerspective || null) : null,
});

const getStaticPlayers = () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

export const getPlayers = async () => {
  if (!useLive) {
    return getStaticPlayers();
  }

  // Live path — fetch from CFBD API + merge with prospect metadata
  if (livePlayersCache) return livePlayersCache;

  try {
    let players = await buildPlayersFromAPI();
    // Validate against Sleeper to remove any prior-year picks
    players = await filterWithSleeperValidation(players);
    livePlayersCache = players;
    return players;
  } catch (err) {
    console.error('Live data fetch failed, falling back to static data:', err);
    return getStaticPlayers();
  }
};

export const getPlayerById = async (id) => {
  if (!useLive) {
    const p = getRawProspectById(id);
    return p ? mapProspectToPlayer(p) : undefined;
  }

  const players = await getPlayers();
  const found = players.find((p) => p.id === id);
  if (found) return found;
  // Fallback to static data
  const p = getRawProspectById(id);
  return p ? mapProspectToPlayer(p) : undefined;
};

export const isUsingMockData = () => !useLive;
export const isUsingLiveData = () => useLive;
