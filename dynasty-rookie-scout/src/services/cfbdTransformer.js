// Enriches QB/RB/TE players with college stats.
// WR stats come exclusively from receivingData.js — this module skips WRs entirely.
//
// Data source priority:
//   1. Static 2025 stats (collegeStats2025.js) — zero API calls, instant
//   2. ESPN API (espnApi.js) — free, no auth, no quota
//   3. CFBD API (cfbdApi.js) — requires key, 1000 calls/month limit

import { getStaticCollegeStats } from './collegeStats2025';
import { fetchBulkPlayerStatsESPN } from './espnApi';
import {
  fetchAllSeasonStats,
  fetchPPAForTeams,
  fetchUsageForTeams,
} from './cfbdApi';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Normalise a player name for fuzzy matching ("J. Michael Sturdivant" → "j michael sturdivant") */
const norm = (n) =>
  n
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Group an array of CFBD stat rows by player name.
 * Each row has { player, team, statType, stat } (v2 shape).
 */
const groupByPlayer = (rows) => {
  const map = {};
  for (const row of rows) {
    const key = norm(row.player || row.playerName || '');
    if (!key) continue;
    if (!map[key]) map[key] = {};
    map[key][row.statType || row.category || row.stat] = Number(row.stat ?? row.value ?? 0);
    // store team for cross-reference
    map[key]._team = row.team;
  }
  return map;
};

/** Try several key shapes the CFBD API might return */
const val = (obj, ...keys) => {
  if (!obj) return 0;
  for (const k of keys) {
    if (obj[k] !== undefined) return Number(obj[k]);
  }
  return 0;
};

// ── stat builders (QB/RB/TE only) ────────────────────────────────────────────

const buildQBStats = (passing, rushing) => ({
  passingYards: val(passing, 'YDS', 'PASS_YDS', 'NET_PASS_YDS'),
  passingTDs: val(passing, 'TD', 'PASS_TD'),
  interceptions: val(passing, 'INT', 'PASS_INT'),
  completionPct:
    val(passing, 'COMPLETIONS', 'C') && val(passing, 'ATT', 'PASS_ATT')
      ? +((val(passing, 'COMPLETIONS', 'C') / val(passing, 'ATT', 'PASS_ATT')) * 100).toFixed(1)
      : 0,
  rushingYards: val(rushing, 'YDS', 'RUSH_YDS'),
  rushingTDs: val(rushing, 'TD', 'RUSH_TD'),
  epa: null, // filled from PPA endpoint
  cpoe: null,
});

const buildRBStats = (rushing, receiving) => ({
  rushingYards: val(rushing, 'YDS', 'RUSH_YDS'),
  rushingTDs: val(rushing, 'TD', 'RUSH_TD'),
  yardsPerCarry:
    val(rushing, 'CAR', 'ATT', 'RUSH_ATT') > 0
      ? +(val(rushing, 'YDS', 'RUSH_YDS') / val(rushing, 'CAR', 'ATT', 'RUSH_ATT')).toFixed(1)
      : 0,
  receptions: val(receiving, 'REC', 'RECEPTIONS'),
  receivingYards: val(receiving, 'YDS', 'REC_YDS'),
  receivingTDs: val(receiving, 'TD', 'REC_TD'),
  epa: null,
});

const buildTEStats = (receiving) => ({
  receptions: val(receiving, 'REC', 'RECEPTIONS'),
  receivingYards: val(receiving, 'YDS', 'REC_YDS'),
  receivingTDs: val(receiving, 'TD', 'REC_TD'),
  targets: val(receiving, 'TARGETS', 'TGT'),
  epa: null,
});

// ── dominator / target-share calculators ─────────────────────────────────────

const calcDominatorRating = (playerRec, teamRecTotal) => {
  if (!playerRec || !teamRecTotal || teamRecTotal === 0) return 0;
  return +((playerRec / teamRecTotal) * 100).toFixed(1);
};

const calcTargetShare = (playerTargets, teamTargetsTotal) => {
  if (!playerTargets || !teamTargetsTotal || teamTargetsTotal === 0) return null;
  return +((playerTargets / teamTargetsTotal) * 100).toFixed(1);
};

// ── static stats enrichment (no API calls) ───────────────────────────────────

/**
 * Enrich a single player using static 2025 college stats.
 * Returns the enriched player or null if no static data available.
 */
const enrichFromStatic = (player) => {
  const staticData = getStaticCollegeStats(player.name);
  if (!staticData) return null;

  const { passing, rushing, receiving, ppa, teamRecYdsTotal, teamTargetsTotal } = staticData;

  // Position-specific stat builder
  let stats;
  switch (player.position) {
    case 'QB':
      stats = buildQBStats(passing, rushing);
      break;
    case 'RB':
      stats = buildRBStats(rushing, receiving);
      break;
    case 'TE':
      stats = buildTEStats(receiving);
      break;
    default:
      stats = {};
  }

  // EPA from PPA data
  if (ppa) {
    const epaVal = ppa.averagePPA?.all ?? null;
    if (epaVal != null) stats.epa = +Number(epaVal).toFixed(2);
  }

  // Dominator rating + target share
  let dominatorRating = player.dominatorRating || 0;
  let targetShare = player.targetShare;
  let yprr = player.yprr;
  let yacPerRR = player.yacPerRR;

  if (player.position === 'TE' && receiving) {
    const recYds = val(receiving, 'YDS', 'REC_YDS');
    const targets = val(receiving, 'TARGETS', 'TGT');
    dominatorRating = calcDominatorRating(recYds, teamRecYdsTotal || 1);
    if (targets > 0) {
      targetShare = calcTargetShare(targets, teamTargetsTotal || 1);
    }
    if (targets > 0) {
      yprr = +(recYds / targets).toFixed(2);
    }
  }

  if (player.position === 'RB') {
    const rushYds = val(rushing, 'YDS', 'RUSH_YDS');
    const recYds = val(receiving, 'YDS', 'REC_YDS');
    const teamTotal = (teamRecYdsTotal || 0) + rushYds;
    dominatorRating = teamTotal > 0
      ? +(((rushYds + recYds) / teamTotal) * 100).toFixed(1)
      : 0;
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (targets > 0) {
      targetShare = calcTargetShare(targets, teamTargetsTotal || 1);
    }
  }

  // Prefer hardcoded advanced stats (PFF-sourced) if available
  const prospect = player._prospect;
  if (prospect?.advancedStats) {
    if (prospect.advancedStats.yprr != null) yprr = prospect.advancedStats.yprr;
    if (prospect.advancedStats.targetShare != null) targetShare = prospect.advancedStats.targetShare;
  }

  return {
    ...player,
    stats,
    dominatorRating,
    targetShare,
    yprr,
    yacPerRR,
    yardsAfterContact: staticData.yardsAfterContact ?? player.yardsAfterContact,
    avoidedTackles: staticData.avoidedTackles ?? player.avoidedTackles,
    ycoPerAttempt: staticData.ycoPerAttempt ?? player.ycoPerAttempt,
    explosiveRuns: staticData.explosiveRuns ?? player.explosiveRuns,
    _liveData: true,
    _dataSource: 'static',
  };
};

// ── ESPN enrichment fallback ─────────────────────────────────────────────────

/**
 * Enrich a single player using ESPN API data.
 * espnStats is the CFBD-compatible shape from espnApi.js.
 */
const enrichFromESPN = (player, espnStats) => {
  if (!espnStats) return null;

  const { passing, rushing, receiving } = espnStats;
  const matched = !!(passing || rushing || receiving);
  if (!matched) return null;

  let stats;
  switch (player.position) {
    case 'QB':
      stats = buildQBStats(passing, rushing);
      break;
    case 'RB':
      stats = buildRBStats(rushing, receiving);
      break;
    case 'TE':
      stats = buildTEStats(receiving);
      break;
    default:
      stats = {};
  }

  // ESPN doesn't provide PPA/EPA, so leave as null
  let dominatorRating = player.dominatorRating || 0;
  let targetShare = player.targetShare;
  let yprr = player.yprr;
  let yacPerRR = player.yacPerRR;

  // Prefer hardcoded advanced stats
  const prospect = player._prospect;
  if (prospect?.advancedStats) {
    if (prospect.advancedStats.yprr != null) yprr = prospect.advancedStats.yprr;
    if (prospect.advancedStats.targetShare != null) targetShare = prospect.advancedStats.targetShare;
  }

  return {
    ...player,
    stats,
    dominatorRating,
    targetShare,
    yprr,
    yacPerRR,
    _liveData: true,
    _dataSource: 'espn',
  };
};

// ── fill dominator for players with inline stats ────────────────────────────

const fillFromStaticData = (players) => {
  for (const player of players) {
    if (player.position === 'WR' || !player.stats) continue;
    const staticData = getStaticCollegeStats(player.name);
    if (!staticData) continue;
    const { rushing, receiving, teamRecYdsTotal, teamTargetsTotal } = staticData;

    // Fill advanced rushing metrics from static PFF data
    if (player.yardsAfterContact == null && staticData.yardsAfterContact != null) player.yardsAfterContact = staticData.yardsAfterContact;
    if (player.avoidedTackles == null && staticData.avoidedTackles != null) player.avoidedTackles = staticData.avoidedTackles;
    if (player.ycoPerAttempt == null && staticData.ycoPerAttempt != null) player.ycoPerAttempt = staticData.ycoPerAttempt;
    if (player.explosiveRuns == null && staticData.explosiveRuns != null) player.explosiveRuns = staticData.explosiveRuns;

    // Fill dominator rating
    if (player.dominatorRating == null) {
      if (player.position === 'RB') {
        const rushYds = val(rushing, 'YDS', 'RUSH_YDS');
        const recYds = val(receiving, 'YDS', 'REC_YDS');
        const teamTotal = (teamRecYdsTotal || 0) + rushYds;
        if (teamTotal > 0) {
          player.dominatorRating = +(((rushYds + recYds) / teamTotal) * 100).toFixed(1);
        }
        const targets = val(receiving, 'TARGETS', 'TGT');
        if (targets > 0 && player.targetShare == null) {
          player.targetShare = calcTargetShare(targets, teamTargetsTotal || 1);
        }
      }
      if (player.position === 'TE' && receiving) {
        const recYds = val(receiving, 'YDS', 'REC_YDS');
        const targets = val(receiving, 'TARGETS', 'TGT');
        player.dominatorRating = calcDominatorRating(recYds, teamRecYdsTotal || 1);
        if (targets > 0 && player.targetShare == null) {
          player.targetShare = calcTargetShare(targets, teamTargetsTotal || 1);
        }
      }
    }
  }
};

// ── main enrichment function ────────────────────────────────────────────────

/**
 * Enrich QB/RB/TE players with college stats.
 * Priority: static data → ESPN API → CFBD API.
 * WR players in the array are returned unchanged.
 */
export const enrichNonWRStats = async (players) => {
  // Fill dominator/targetShare/advanced metrics for players that already have inline stats
  fillFromStaticData(players);

  // Only enrich players that have a cfbdLookup, are not WR, and don't already have stats
  const nonWR = players.filter((p) => p.position !== 'WR' && p._cfbdLookup && !p.stats);
  if (nonWR.length === 0) {
    const alreadyHaveStats = players.filter((p) => p.position !== 'WR' && p.stats).length;
    console.info(`[Enrichment] ${alreadyHaveStats} non-WR players already have inline stats — skipping enrichment`);
    return players;
  }

  console.info(`[Enrichment] Enriching ${nonWR.length} non-WR players (others have inline stats)`);

  // ── Phase 1: Static data (instant, no API calls) ──────────────────────
  const staticResults = new Map();
  const needsAPI = [];

  for (const player of nonWR) {
    const enriched = enrichFromStatic(player);
    if (enriched) {
      staticResults.set(player.id, enriched);
      console.info(`[Static] ✅ ${player.name} (${player.position})`);
    } else {
      needsAPI.push(player);
    }
  }

  console.info(`[Enrichment] Static: ${staticResults.size}/${nonWR.length} matched, ${needsAPI.length} need API`);

  // ── Phase 2: ESPN API for remaining players ───────────────────────────
  const espnResults = new Map();
  let espnErrors = [];

  if (needsAPI.length > 0) {
    try {
      const playerNames = needsAPI.map((p) => p.name);
      console.info(`[ESPN] Attempting to fetch ${playerNames.length} players...`);
      const { results, errors } = await fetchBulkPlayerStatsESPN(playerNames);
      espnErrors = errors;

      for (const player of needsAPI) {
        const key = norm(player.name);
        const espnStats = results.get(key);
        if (espnStats) {
          const enriched = enrichFromESPN(player, espnStats);
          if (enriched) {
            espnResults.set(player.id, enriched);
            console.info(`[ESPN] ✅ ${player.name} (${player.position})`);
          }
        }
      }
    } catch (err) {
      console.warn('[ESPN] Bulk fetch failed:', err.message);
      espnErrors.push(`bulk: ${err.message}`);
    }
  }

  const stillNeedsAPI = needsAPI.filter(
    (p) => !espnResults.has(p.id)
  );

  console.info(`[Enrichment] ESPN: ${espnResults.size}/${needsAPI.length} matched, ${stillNeedsAPI.length} need CFBD`);

  // ── Phase 3: CFBD API as last resort ──────────────────────────────────
  const cfbdMatchCount = { matched: 0, missed: 0 };
  const cfbdErrors = [];
  let cfbdResults = new Map();

  const hasCfbdKey = !!process.env.REACT_APP_CFBD_API_KEY;

  if (stillNeedsAPI.length > 0 && hasCfbdKey) {
    const teams = [...new Set(stillNeedsAPI.map((p) => p._cfbdLookup.team))];
    const year = 2025;

    console.info(`[CFBD] Attempting ${stillNeedsAPI.length} players from ${teams.length} teams`);

    const [allStats, ppaData, usageData] = await Promise.all([
      fetchAllSeasonStats(year).catch((err) => {
        console.error('[CFBD] fetchAllSeasonStats failed:', err.message);
        cfbdErrors.push(`stats: ${err.message}`);
        return { passing: [], rushing: [], receiving: [] };
      }),
      fetchPPAForTeams(year, teams).catch((err) => {
        console.error('[CFBD] fetchPPAForTeams failed:', err.message);
        cfbdErrors.push(`ppa: ${err.message}`);
        return [];
      }),
      fetchUsageForTeams(year, teams).catch((err) => {
        console.error('[CFBD] fetchUsageForTeams failed:', err.message);
        cfbdErrors.push(`usage: ${err.message}`);
        return [];
      }),
    ]);

    const passingByPlayer = groupByPlayer(allStats.passing || []);
    const rushingByPlayer = groupByPlayer(allStats.rushing || []);
    const receivingByPlayer = groupByPlayer(allStats.receiving || []);

    const ppaByPlayer = {};
    for (const row of ppaData) {
      const key = norm(row.player || row.name || '');
      if (key) ppaByPlayer[key] = row;
    }

    const usageByPlayer = {};
    for (const row of usageData) {
      const key = norm(row.player || row.name || '');
      if (key) usageByPlayer[key] = row;
    }

    // Team totals for dominator / target share
    const teamRecYdsTotals = {};
    const teamTargetTotals = {};
    for (const row of allStats.receiving) {
      const team = row.team;
      if (!team) continue;
      const st = row.statType || row.category || '';
      if (st === 'YDS' || st === 'REC_YDS') {
        teamRecYdsTotals[team] = (teamRecYdsTotals[team] || 0) + val(row, 'stat', 'value');
      }
      if (st === 'TARGETS' || st === 'TGT') {
        teamTargetTotals[team] = (teamTargetTotals[team] || 0) + val(row, 'stat', 'value');
      }
    }
    if (Object.keys(teamTargetTotals).length === 0) {
      for (const row of allStats.receiving) {
        const team = row.team;
        if (!team) continue;
        const st = row.statType || row.category || '';
        if (st === 'REC' || st === 'RECEPTIONS') {
          teamTargetTotals[team] = (teamTargetTotals[team] || 0) + val(row, 'stat', 'value');
        }
      }
    }

    for (const player of stillNeedsAPI) {
      const key = norm(player.name);
      const passing = passingByPlayer[key];
      const rushing = rushingByPlayer[key];
      const receiving = receivingByPlayer[key];
      const ppa = ppaByPlayer[key];
      const usageRow = usageByPlayer[key];
      const team = player._cfbdLookup.team;

      const matched = !!(passing || rushing || receiving);
      if (!matched) {
        cfbdMatchCount.missed++;
        console.warn(`[CFBD] ❌ No match for "${player.name}" (${player.position})`);
        continue;
      }

      cfbdMatchCount.matched++;

      let stats;
      switch (player.position) {
        case 'QB': stats = buildQBStats(passing, rushing); break;
        case 'RB': stats = buildRBStats(rushing, receiving); break;
        case 'TE': stats = buildTEStats(receiving); break;
        default: stats = {};
      }

      if (ppa) {
        const epaVal = ppa.averagePPA?.all ?? ppa.totalPPA?.all ?? ppa.countablePPA ?? null;
        if (epaVal != null) stats.epa = +Number(epaVal).toFixed(2);
      }

      let dominatorRating = player.dominatorRating || 0;
      let targetShare = player.targetShare;
      let yprr = player.yprr;
      let yacPerRR = player.yacPerRR;

      if (player.position === 'TE' && receiving) {
        const recYds = val(receiving, 'YDS', 'REC_YDS');
        const targets = val(receiving, 'TARGETS', 'TGT');
        dominatorRating = calcDominatorRating(recYds, teamRecYdsTotals[team] || 1);
        if (targets > 0) {
          targetShare = calcTargetShare(targets, teamTargetTotals[team] || 1);
        } else if (usageRow?.usage?.pass != null) {
          targetShare = +(usageRow.usage.pass * 100).toFixed(1);
        }
        if (usageRow?.usage?.pass != null && usageRow.usage.pass > 0) {
          const teamPassAtts = val(passingByPlayer[norm(team)] || {}, 'ATT', 'PASS_ATT');
          if (teamPassAtts > 0) {
            const estRoutes = teamPassAtts * usageRow.usage.pass;
            yprr = +(recYds / estRoutes).toFixed(2);
          } else if (targets > 0) {
            yprr = +(recYds / targets).toFixed(2);
          }
        } else if (targets > 0) {
          yprr = +(recYds / targets).toFixed(2);
        }
      }

      if (player.position === 'RB') {
        const rushYds = val(rushing, 'YDS', 'RUSH_YDS');
        const recYds = val(receiving, 'YDS', 'REC_YDS');
        const teamTotal = (teamRecYdsTotals[team] || 0) + rushYds;
        dominatorRating = teamTotal > 0 ? +(((rushYds + recYds) / teamTotal) * 100).toFixed(1) : 0;
        const targets = val(receiving, 'TARGETS', 'TGT');
        if (targets > 0) {
          targetShare = calcTargetShare(targets, teamTargetTotals[team] || 1);
        } else if (usageRow?.usage?.pass != null) {
          targetShare = +(usageRow.usage.pass * 100).toFixed(1);
        }
      }

      const prospect = player._prospect;
      if (prospect?.advancedStats) {
        if (prospect.advancedStats.yprr != null) yprr = prospect.advancedStats.yprr;
        if (prospect.advancedStats.targetShare != null) targetShare = prospect.advancedStats.targetShare;
      }

      cfbdResults.set(player.id, {
        ...player,
        stats,
        dominatorRating,
        targetShare,
        yprr,
        yacPerRR,
        _liveData: true,
        _dataSource: 'cfbd',
      });
    }
  }

  // ── Merge results ─────────────────────────────────────────────────────
  const enriched = players.map((player) => {
    if (player.position === 'WR' || !player._cfbdLookup) return player;
    const result = staticResults.get(player.id)
      || espnResults.get(player.id)
      || cfbdResults.get(player.id)
      || player;

    return result;
  });

  const totalMatched = staticResults.size + espnResults.size + cfbdMatchCount.matched;
  const totalMissed = nonWR.length - totalMatched;

  console.info(`[Enrichment] Final: ${totalMatched}/${nonWR.length} enriched (static: ${staticResults.size}, ESPN: ${espnResults.size}, CFBD: ${cfbdMatchCount.matched}, missed: ${totalMissed})`);

  // Expose enrichment status so the UI can display it
  enriched._cfbdStatus = {
    attempted: nonWR.length,
    matched: totalMatched,
    missed: totalMissed,
    sources: {
      static: staticResults.size,
      espn: espnResults.size,
      cfbd: cfbdMatchCount.matched,
    },
    apiRows: {
      passing: 0,
      rushing: 0,
      receiving: 0,
      ppa: 0,
      usage: 0,
    },
    debug: {
      errors: [...espnErrors, ...cfbdErrors].length > 0 ? [...espnErrors, ...cfbdErrors] : null,
      sampleRowFields: [],
      sampleRow: null,
      apiBase: 'static + espn + cfbd (tiered)',
      cfbdNames: [],
      searchedNames: nonWR.map((p) => norm(p.name)).slice(0, 5),
      groupedCounts: { passing: 0, rushing: 0, receiving: 0 },
    },
  };

  return enriched;
};
