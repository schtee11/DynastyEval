// Data service abstraction layer
// Pulls live 2025 college stats from CFBD API when a key is configured,
// otherwise falls back to mock data.

import { getFantasyRelevantPlayers, getPlayerById as getMockPlayerById } from './mockData';
import { buildPlayersFromAPI } from './cfbdTransformer';

const hasCfbdKey = !!process.env.REACT_APP_CFBD_API_KEY;
const forceMock = process.env.REACT_APP_USE_MOCK === 'true';
const useLive = hasCfbdKey && !forceMock;

// Cache live data so we only fetch once per session
let livePlayersCache = null;

export const getPlayers = async () => {
  if (!useLive) {
    return getFantasyRelevantPlayers();
  }

  // Live path — fetch from CFBD API + merge with prospect metadata
  if (livePlayersCache) return livePlayersCache;

  try {
    const players = await buildPlayersFromAPI();
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
