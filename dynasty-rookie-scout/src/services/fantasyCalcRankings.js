// Fetches live dynasty rookie rankings from FantasyCalc via Google Sheets proxy
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

/**
 * Normalize a single row from the Google Sheet into a consistent shape.
 * The sheet may use "Name", "name", "Position", "pos", "Sleeper ID", "sleeperId", etc.
 */
const normalizeRow = (row) => ({
  name: row.name || row.Name || row.player || row.Player || '',
  pos: row.pos || row.position || row.Position || row.Pos || '',
  value: row.value || row.Value || row.val || 0,
  sleeperId: row.sleeperId || row['Sleeper ID'] || row.sleeper_id || row.SleeperID || row.sleeperID || '',
  rank: row.rank || row.Rank || null,
});

/**
 * Build lookup maps from an array of rows (keyed by sleeperId and normalized name).
 * Rows are assumed sorted by value descending — index + 1 = rookie rank.
 */
const buildLookup = (rows) => {
  const bySleeperId = {};
  const byName = {};
  rows.forEach((raw, i) => {
    const row = normalizeRow(raw);
    const entry = { ...row, rookieRank: i + 1 };
    if (row.sleeperId) bySleeperId[String(row.sleeperId)] = entry;
    if (row.name) byName[normalizeName(row.name)] = entry;
  });
  return { bySleeperId, byName };
};

export const fetchFantasyCalcRankings = async () => {
  if (cache) return cache;

  try {
    const res = await fetch(RANKINGS_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[FantasyCalc] Response is not JSON:', text.substring(0, 300));
      return null;
    }

    // Log the raw shape so we can diagnose format issues
    const isArray = Array.isArray(data);
    console.info('[FantasyCalc] Raw response shape:', isArray ? `array[${data.length}]` : Object.keys(data));
    if (!isArray && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        console.info('[FantasyCalc] First key sample:', JSON.stringify(data[firstKey][0]).substring(0, 200));
      }
    } else if (isArray && data.length > 0) {
      console.info('[FantasyCalc] First row sample:', JSON.stringify(data[0]).substring(0, 200));
    }

    let oneQBRows, sfRows;

    if (isArray) {
      // Flat array — use same rankings for both formats
      oneQBRows = data;
      sfRows = data;
    } else if (data.oneQB || data.superflex) {
      // Expected { oneQB: [...], superflex: [...] }
      oneQBRows = data.oneQB || data.superflex || [];
      sfRows = data.superflex || data.oneQB || [];
    } else {
      // Try to find array values in whatever keys exist
      const keys = Object.keys(data);
      const arrays = keys.filter((k) => Array.isArray(data[k]));
      if (arrays.length >= 2) {
        oneQBRows = data[arrays[0]];
        sfRows = data[arrays[1]];
      } else if (arrays.length === 1) {
        oneQBRows = data[arrays[0]];
        sfRows = data[arrays[0]];
      } else {
        console.error('[FantasyCalc] Cannot find ranking arrays in response:', keys);
        return null;
      }
    }

    cache = {
      oneQB: buildLookup(oneQBRows),
      superflex: buildLookup(sfRows),
    };

    console.info('[FantasyCalc] Loaded rankings:', {
      oneQB: oneQBRows.length,
      superflex: sfRows.length,
    });

    return cache;
  } catch (err) {
    console.warn('[FantasyCalc] Failed to fetch rankings:', err.message);
    return null;
  }
};

/**
 * Match a player to their FantasyCalc ranking entry.
 * Tries sleeperId first, then falls back to normalized name match.
 */
const findPlayer = (lookup, player) => {
  if (!lookup) return null;
  if (player.sleeperId) {
    const match = lookup.bySleeperId[String(player.sleeperId)];
    if (match) return match;
  }
  const nameKey = normalizeName(player.name);
  return lookup.byName[nameKey] || null;
};

/**
 * Apply FantasyCalc rankings to an array of players.
 * Updates player.rank.oneQB and player.rank.superflex with live rookie ranks.
 */
export const applyFantasyCalcRankings = async (players) => {
  const rankings = await fetchFantasyCalcRankings();
  if (!rankings) return players;

  let matched = 0;
  const unmatched = [];

  const result = players.map((player) => {
    const oneQBMatch = findPlayer(rankings.oneQB, player);
    const sfMatch = findPlayer(rankings.superflex, player);

    if (!oneQBMatch && !sfMatch) {
      unmatched.push(player.name);
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

  console.info(`[FantasyCalc] Matched ${matched}/${matched + unmatched.length} players`);
  if (unmatched.length > 0) {
    console.warn('[FantasyCalc] Unmatched players:', unmatched);
  }
  return result;
};
