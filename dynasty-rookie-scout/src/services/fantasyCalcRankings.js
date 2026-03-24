// Fetches live dynasty rookie rankings from FantasyCalc via Google Sheets proxy
// Returns { oneQB: [...], superflex: [...] } where each entry has { name, pos, value, sleeperId }
// Rankings are sorted by value (highest first), so array index + 1 = rookie rank

const RANKINGS_URL =
  'https://script.google.com/macros/s/AKfycbw74MLi2U_OIz0KHsWftXW0EXhz_a3UZHBZKaxwF1x1M52ewvbY5uQPUsHxH_qseUIN/exec';

let cache = null;

/**
 * Normalize a player name for matching.
 * Strips suffixes (Jr., III, etc.), lowercases, trims whitespace.
 */
const normalizeName = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '')
    .replace(/[.']/g, '')
    .trim();

export const fetchFantasyCalcRankings = async () => {
  if (cache) return cache;

  try {
    // Google Apps Script returns a 302 redirect — fetch follows it by default
    const res = await fetch(RANKINGS_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[FantasyCalc] Response is not JSON:', text.substring(0, 200));
      return null;
    }

    if (!data.oneQB && !data.superflex) {
      console.warn('[FantasyCalc] Unexpected data shape:', Object.keys(data));
      return null;
    }

    // Build lookup maps keyed by sleeperId and normalized name for matching
    const buildLookup = (rows) => {
      const bySleeperId = {};
      const byName = {};
      rows.forEach((row, i) => {
        const entry = { ...row, rookieRank: i + 1 };
        if (row.sleeperId) bySleeperId[String(row.sleeperId)] = entry;
        if (row.name) byName[normalizeName(row.name)] = entry;
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
  // Fallback: normalized name match
  const nameKey = normalizeName(player.name);
  return lookup.byName[nameKey] || null;
};

/**
 * Apply FantasyCalc rankings to an array of players.
 * Updates player.rank.oneQB and player.rank.superflex with live rookie ranks.
 */
export const applyFantasyCalcRankings = async (players) => {
  const rankings = await fetchFantasyCalcRankings();
  if (!rankings) return players; // Graceful fallback — keep existing ranks

  let matched = 0;
  let unmatched = 0;

  const result = players.map((player) => {
    const oneQBMatch = findPlayer(rankings.oneQB, player);
    const sfMatch = findPlayer(rankings.superflex, player);

    if (!oneQBMatch && !sfMatch) {
      unmatched++;
      return player;
    }

    matched++;
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

  console.info(`[FantasyCalc] Matched ${matched}/${matched + unmatched} players`);
  return result;
};
