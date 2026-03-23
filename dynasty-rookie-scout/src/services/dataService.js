// Data service abstraction layer
// Pulls live 2025 college stats from CFBD API when a key is configured,
// otherwise falls back to mock data.
// Post-draft: validates prospects against Sleeper API to filter out non-2026 rookies.

import { getFantasyRelevantPlayers, getPlayerById as getMockPlayerById } from './mockData';
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

export const getPlayers = async () => {
  if (!useLive) {
    return getFantasyRelevantPlayers();
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
    console.error('Live data fetch failed, falling back to mock:', err);
    return getFantasyRelevantPlayers();
  }
};

export const getPlayerById = async (id) => {
  if (!useLive) {
    return getMockPlayerById(id);
  }

  const players = await getPlayers();
  return players.find((p) => p.id === id) || getMockPlayerById(id);
};

export const isUsingMockData = () => !useLive;
export const isUsingLiveData = () => useLive;
