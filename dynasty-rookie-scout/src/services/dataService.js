// Data service — sources all player data from rookieProspects2026.js
// (prospect metadata + receiving perspective data converted from PFF images).
// No mock data, no CFBD API dependency.

import { getProspects, getProspectById as getRawProspectById } from './rookieProspects2026';

/**
 * Map raw prospect metadata into the shape the UI expects.
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
  stats: p.stats || null,
  breakoutAge: p.breakoutAge,
  dominatorRating: p.dominatorRating ?? null,
  targetShare: p.advancedStats?.targetShare ?? null,
  yprr: p.advancedStats?.yprr ?? null,
  yacPerRR: p.yacPerRR ?? null,
  injuries: p.injuries,
  dynastyADP: p.dynastyADP,
  rank: p.rank,
  playerComps: p.playerComps,
  receivingByPerspective: p.receivingByPerspective || null,
});

export const getPlayers = async () =>
  getProspects()
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .map(mapProspectToPlayer);

export const getPlayerById = async (id) => {
  const p = getRawProspectById(id);
  return p ? mapProspectToPlayer(p) : undefined;
};
