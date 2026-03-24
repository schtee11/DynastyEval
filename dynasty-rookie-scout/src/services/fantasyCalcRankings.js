// Fetches live dynasty rookie rankings from FantasyCalc via Google Sheets proxy
// Returns { oneQB: [...], superflex: [...] } where each entry has { name, pos, value, sleeperId }
// Rankings are sorted by value (highest first), so array index + 1 = rookie rank

const RANKINGS_URL =
  'https://script.google.com/macros/s/AKfycbw74MLi2U_OIz0KHsWftXW0EXhz_a3UZHBZKaxwF1x1M52ewvbY5uQPUsHxH_qseUIN/exec';

let cache = null;

export const fetchFantasyCalcRankings = async () => {
  if (cache) return cache;

  try {
    const res = await fetch(RANKINGS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Build lookup maps keyed by sleeperId for fast matching
    const buildLookup = (rows) => {
      const bySleeperId = {};
      const byName = {};
      rows.forEach((row, i) => {
        const entry = { ...row, rookieRank: i + 1 };
        if (row.sleeperId) bySleeperId[String(row.sleeperId)] = entry;
        if (row.name) byName[row.name.toLowerCase().trim()] = entry;
      });
      return { bySleeperId, byName };
    };

    cache = {
      oneQB: buildLookup(data.oneQB || []),
      superflex: buildLookup(data.superflex || []),
    };

    console.info('[FantasyCalc] Loaded rankings:', {
      oneQB: (data.oneQB || []).length,
      superflex: (data.superflex || []).length,
    });

    return cache;
  } catch (err) {
    console.warn('[FantasyCalc] Failed to fetch rankings:', err.message);
    return null;
  }
};

/**
 * Match a player to their FantasyCalc ranking entry.
 * Tries sleeperId first, then falls back to name match.
 */
const findPlayer = (lookup, player) => {
  if (!lookup) return null;
  // Try sleeperId match
  if (player.sleeperId) {
    const match = lookup.bySleeperId[String(player.sleeperId)];
    if (match) return match;
  }
  // Fallback: name match
  const nameKey = (player.name || '').toLowerCase().trim();
  return lookup.byName[nameKey] || null;
};

/**
 * Apply FantasyCalc rankings to an array of players.
 * Updates player.rank.oneQB and player.rank.superflex with live rookie ranks.
 */
export const applyFantasyCalcRankings = async (players) => {
  const rankings = await fetchFantasyCalcRankings();
  if (!rankings) return players; // Graceful fallback — keep existing ranks

  return players.map((player) => {
    const oneQBMatch = findPlayer(rankings.oneQB, player);
    const sfMatch = findPlayer(rankings.superflex, player);

    if (!oneQBMatch && !sfMatch) return player;

    return {
      ...player,
      rank: {
        oneQB: oneQBMatch?.rookieRank ?? player.rank?.oneQB ?? null,
        superflex: sfMatch?.rookieRank ?? player.rank?.superflex ?? null,
      },
      fantasyCalcValue: {
        oneQB: oneQBMatch?.value ?? null,
        superflex: sfMatch?.value ?? null,
      },
    };
  });
};
