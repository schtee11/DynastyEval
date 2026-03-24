// Fetches live dynasty values from FantasyCalc via Google Sheets proxy.
// The sheet may contain ALL dynasty players — we match against our prospect
// database and derive rookie ranks by sorting matched players by value.

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
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Normalize a single row from the Google Sheet into a consistent shape.
 */
const normalizeRow = (row) => ({
  name: row.name || row.Name || row.player || row.Player || '',
  pos: row.pos || row.position || row.Position || row.Pos || '',
  value: Number(row.value || row.Value || row.val || 0),
  sleeperId: String(row.sleeperId || row['Sleeper ID'] || row.sleeper_id || row.SleeperID || row.sleeperID || ''),
});

/**
 * Fetch raw rows from the Google Sheet and build lookup maps.
 * Lookups store the FantasyCalc value (NOT rank) — rookie ranks are
 * computed later after matching against the prospect database.
 */
const fetchRawValues = async () => {
  if (cache) return cache;

  try {
    const res = await fetch(RANKINGS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[FantasyCalc] Response is not JSON:', text.substring(0, 300));
      return null;
    }

    // Extract the rows array from whatever shape the response has
    let rows;
    if (Array.isArray(data)) {
      rows = data;
    } else if (data.rows && Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.oneQB || data.superflex) {
      // If the sheet ever returns separate formats, handle it
      return {
        hasFormats: true,
        oneQB: buildValueLookup(data.oneQB || data.superflex || []),
        superflex: buildValueLookup(data.superflex || data.oneQB || []),
      };
    } else {
      const keys = Object.keys(data);
      const arrayKey = keys.find((k) => Array.isArray(data[k]));
      if (arrayKey) {
        rows = data[arrayKey];
      } else {
        console.error('[FantasyCalc] Cannot find data rows in response:', keys);
        return null;
      }
    }

    console.info(`[FantasyCalc] Fetched ${rows.length} players from sheet`);
    if (rows.length > 0) {
      console.info('[FantasyCalc] Sample row:', JSON.stringify(rows[0]).substring(0, 200));
    }

    cache = { hasFormats: false, values: buildValueLookup(rows) };
    return cache;
  } catch (err) {
    console.warn('[FantasyCalc] Failed to fetch:', err.message);
    return null;
  }
};

/**
 * Build lookup maps keyed by sleeperId and normalized name.
 * Stores the FantasyCalc dynasty value for each player.
 */
const buildValueLookup = (rows) => {
  const bySleeperId = {};
  const byName = {};
  for (const raw of rows) {
    const row = normalizeRow(raw);
    if (!row.name) continue;
    const entry = { name: row.name, pos: row.pos, value: row.value, sleeperId: row.sleeperId };
    if (row.sleeperId) bySleeperId[row.sleeperId] = entry;
    byName[normalizeName(row.name)] = entry;
  }
  return { bySleeperId, byName };
};

/**
 * Find a player's FantasyCalc entry by sleeperId or name.
 */
const findInLookup = (lookup, player) => {
  if (!lookup) return null;
  if (player.sleeperId) {
    const match = lookup.bySleeperId[String(player.sleeperId)];
    if (match) return match;
  }
  return lookup.byName[normalizeName(player.name)] || null;
};

/**
 * Apply FantasyCalc dynasty values and compute rookie ranks.
 *
 * 1. Match each player to a FantasyCalc entry (by sleeperId, then name)
 * 2. Attach the dynasty value
 * 3. Sort matched players by value descending → derive rookie rank
 * 4. Write rank back to each player
 */
export const applyFantasyCalcRankings = async (players) => {
  const data = await fetchRawValues();
  if (!data) return players;

  // Step 1: Match players to FantasyCalc values
  const lookup = data.hasFormats ? data.oneQB : data.values;
  const sfLookup = data.hasFormats ? data.superflex : data.values;

  const matchedEntries = []; // { index, value, sfValue }

  const enriched = players.map((player, i) => {
    const match = findInLookup(lookup, player);
    const sfMatch = data.hasFormats ? findInLookup(sfLookup, player) : match;

    if (!match && !sfMatch) return player;

    matchedEntries.push({
      index: i,
      value: match?.value ?? 0,
      sfValue: sfMatch?.value ?? 0,
    });

    return {
      ...player,
      fantasyCalcValue: {
        oneQB: match?.value ?? null,
        superflex: sfMatch?.value ?? null,
      },
    };
  });

  // Step 2: Derive rookie ranks by sorting matched players by value
  const oneQBRanked = [...matchedEntries].sort((a, b) => b.value - a.value);
  const sfRanked = [...matchedEntries].sort((a, b) => b.sfValue - a.sfValue);

  // Build index → rookie rank maps
  const oneQBRankMap = {};
  const sfRankMap = {};
  oneQBRanked.forEach((e, rank) => { oneQBRankMap[e.index] = rank + 1; });
  sfRanked.forEach((e, rank) => { sfRankMap[e.index] = rank + 1; });

  // Step 3: Write ranks back — unmatched players get 'UNR' (unranked)
  const matchedIndices = new Set(matchedEntries.map((e) => e.index));
  const result = enriched.map((player, i) => {
    if (matchedIndices.has(i)) {
      return {
        ...player,
        rank: {
          oneQB: oneQBRankMap[i] ?? player.rank?.oneQB ?? null,
          superflex: sfRankMap[i] ?? player.rank?.superflex ?? null,
        },
      };
    }
    // Unmatched — mark as UNR so they sort to the bottom but remain visible
    return {
      ...player,
      rank: {
        oneQB: 'UNR',
        superflex: 'UNR',
      },
    };
  });

  const matched = matchedEntries.length;
  const total = players.length;
  console.info(`[FantasyCalc] Matched ${matched}/${total} players, rookie ranks assigned`);
  if (matched > 0) {
    const top3 = oneQBRanked.slice(0, 3).map((e) => `${enriched[e.index].name} (${e.value})`);
    console.info('[FantasyCalc] Top 3 rookies by value:', top3.join(', '));
  }
  if (matched < total) {
    const unmatchedNames = players
      .filter((_, i) => !matchedIndices.has(i))
      .map((p) => p.name);
    console.info(`[FantasyCalc] ${unmatchedNames.length} players marked UNR (not in FantasyCalc):`, unmatchedNames.join(', '));
  }

  return result;
};
