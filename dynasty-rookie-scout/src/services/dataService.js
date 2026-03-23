// Data service abstraction layer
// Toggle between mock and live data via REACT_APP_USE_MOCK env var

import { getFantasyRelevantPlayers, getPlayerById as getMockPlayerById } from './mockData';

const useMock = process.env.REACT_APP_USE_MOCK !== 'false';

export const getPlayers = async () => {
  if (useMock) {
    return getFantasyRelevantPlayers();
  }

  // Live data path — combine CFBD + draft data
  // TODO: implement when API keys are available
  return getFantasyRelevantPlayers();
};

export const getPlayerById = async (id) => {
  if (useMock) {
    return getMockPlayerById(id);
  }
  return getMockPlayerById(id);
};

export const isUsingMockData = () => useMock;
