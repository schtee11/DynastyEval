// Enriches QB/RB/WR/TE players with college stats.
// WR perspective data comes from receivingData.js; base receiving metrics (YAC, alignment, contested) come from the CSV pipeline.
//
// Data source priority:
//   1. Static 2025 stats (collegeStats2025.js) — zero API calls, instant
//   2. ESPN API (espnApi.js) — free, no auth, no quota

import { getStaticCollegeStats } from './collegeStats2025';
import { fetchBulkPlayerStatsESPN } from './espnApi';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Normalise a player name for fuzzy matching ("J. Michael Sturdivant" → "j michael sturdivant") */
const norm = (n) =>
  n
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Try several key shapes for stat lookup */
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
});

const buildTEStats = (receiving) => ({
  receptions: val(receiving, 'REC', 'RECEPTIONS'),
  receivingYards: val(receiving, 'YDS', 'REC_YDS'),
  receivingTDs: val(receiving, 'TD', 'REC_TD'),
  targets: val(receiving, 'TARGETS', 'TGT'),
});

const buildWRStats = (receiving) => ({
  receptions: val(receiving, 'REC', 'RECEPTIONS'),
  receivingYards: val(receiving, 'YDS', 'REC_YDS'),
  receivingTDs: val(receiving, 'TD', 'REC_TD'),
  targets: val(receiving, 'TARGETS', 'TGT'),
});

// ── target-share calculator ──────────────────────────────────────────────────

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

  const { passing, rushing, receiving, teamTargetsTotal } = staticData;

  // Position-specific stat builder
  let stats;
  switch (player.position) {
    case 'QB':
      stats = buildQBStats(passing, rushing);
      break;
    case 'RB':
      stats = buildRBStats(rushing, receiving);
      break;
    case 'WR':
      stats = buildWRStats(receiving);
      break;
    case 'TE':
      stats = buildTEStats(receiving);
      break;
    default:
      stats = {};
  }

  // Target share for TE / WR / RB
  let targetShare = player.targetShare;
  let yprr = player.yprr;
  let yacPerRR = player.yacPerRR;
  let routesRun = null;
  let tgtPerRR = null;
  let firstDownTDPerRR = null;

  if ((player.position === 'TE' || player.position === 'WR') && receiving) {
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (targets > 0 && teamTargetsTotal) {
      targetShare = calcTargetShare(targets, teamTargetsTotal);
    }
  }

  if (player.position === 'RB') {
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (targets > 0 && teamTargetsTotal) {
      targetShare = calcTargetShare(targets, teamTargetsTotal);
    }
  }

  // Use PFF yprr from CSV (yards per route run, not yards per target)
  if (staticData.pffYprr != null) {
    yprr = staticData.pffYprr;
  }

  // Calculate route-based metrics from CSV data
  if (staticData.routesRun > 0) {
    routesRun = staticData.routesRun;
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (targets > 0) {
      tgtPerRR = +((targets / staticData.routesRun) * 100).toFixed(1);
    }
    const tds = val(receiving, 'TD', 'REC_TD');
    const firstDowns = staticData.firstDowns || 0;
    firstDownTDPerRR = +((firstDowns + tds) / staticData.routesRun).toFixed(2);
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
    targetShare,
    yprr,
    yacPerRR,
    routesRun,
    tgtPerRR,
    firstDownTDPerRR,
    yardsAfterContact: staticData.yardsAfterContact ?? player.yardsAfterContact,
    avoidedTackles: staticData.avoidedTackles ?? player.avoidedTackles,
    ycoPerAttempt: staticData.ycoPerAttempt ?? player.ycoPerAttempt,
    explosiveRuns: staticData.explosiveRuns ?? player.explosiveRuns,
    yardsAfterCatch: staticData.yardsAfterCatch ?? player.yardsAfterCatch,
    yardsAfterCatchPerRec: staticData.yardsAfterCatchPerRec ?? player.yardsAfterCatchPerRec,
    slotRate: staticData.slotRate ?? player.slotRate,
    wideRate: staticData.wideRate ?? player.wideRate,
    inlineRate: staticData.inlineRate ?? player.inlineRate,
    contestedCatchRate: staticData.contestedCatchRate ?? player.contestedCatchRate,
    contestedReceptions: staticData.contestedReceptions ?? player.contestedReceptions,
    recGrade: staticData.recGrade ?? player.recGrade,
    _liveData: true,
    _dataSource: 'static',
  };
};

// ── ESPN enrichment fallback ─────────────────────────────────────────────────

/**
 * Enrich a single player using ESPN API data.
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
    targetShare,
    yprr,
    yacPerRR,
    _liveData: true,
    _dataSource: 'espn',
  };
};

// ── fill target share / advanced metrics for players with inline stats ───────

const fillFromStaticData = (players) => {
  for (const player of players) {
    if (!player.stats) continue;
    const staticData = getStaticCollegeStats(player.name);
    if (!staticData) continue;
    const { receiving, teamTargetsTotal } = staticData;

    // Fill advanced rushing metrics from static PFF data
    if (player.yardsAfterContact == null && staticData.yardsAfterContact != null) player.yardsAfterContact = staticData.yardsAfterContact;
    if (player.avoidedTackles == null && staticData.avoidedTackles != null) player.avoidedTackles = staticData.avoidedTackles;
    if (player.ycoPerAttempt == null && staticData.ycoPerAttempt != null) player.ycoPerAttempt = staticData.ycoPerAttempt;
    if (player.explosiveRuns == null && staticData.explosiveRuns != null) player.explosiveRuns = staticData.explosiveRuns;

    // Fill receiving metrics from static PFF data (WR / TE)
    if (player.yardsAfterCatch == null && staticData.yardsAfterCatch != null) player.yardsAfterCatch = staticData.yardsAfterCatch;
    if (player.yardsAfterCatchPerRec == null && staticData.yardsAfterCatchPerRec != null) player.yardsAfterCatchPerRec = staticData.yardsAfterCatchPerRec;
    if (player.slotRate == null && staticData.slotRate != null) player.slotRate = staticData.slotRate;
    if (player.wideRate == null && staticData.wideRate != null) player.wideRate = staticData.wideRate;
    if (player.inlineRate == null && staticData.inlineRate != null) player.inlineRate = staticData.inlineRate;
    if (player.contestedCatchRate == null && staticData.contestedCatchRate != null) player.contestedCatchRate = staticData.contestedCatchRate;
    if (player.contestedReceptions == null && staticData.contestedReceptions != null) player.contestedReceptions = staticData.contestedReceptions;
    if (player.recGrade == null && staticData.recGrade != null) player.recGrade = staticData.recGrade;

    // Fill route-based metrics
    if (player.yprr == null && staticData.pffYprr != null) player.yprr = staticData.pffYprr;
    if (player.routesRun == null && staticData.routesRun != null) player.routesRun = staticData.routesRun;
    if (player.tgtPerRR == null && staticData.routesRun > 0) {
      const targets = val(receiving, 'TARGETS', 'TGT');
      if (targets > 0) player.tgtPerRR = +((targets / staticData.routesRun) * 100).toFixed(1);
    }
    if (player.firstDownTDPerRR == null && staticData.routesRun > 0) {
      const tds = val(receiving, 'TD', 'REC_TD');
      const firstDowns = staticData.firstDowns || 0;
      player.firstDownTDPerRR = +((firstDowns + tds) / staticData.routesRun).toFixed(2);
    }

    // Fill target share for RB / TE
    if (player.position === 'RB' && player.targetShare == null) {
      const targets = val(receiving, 'TARGETS', 'TGT');
      if (targets > 0 && teamTargetsTotal) {
        player.targetShare = calcTargetShare(targets, teamTargetsTotal);
      }
    }
    if ((player.position === 'TE' || player.position === 'WR') && player.targetShare == null && receiving) {
      const targets = val(receiving, 'TARGETS', 'TGT');
      if (targets > 0 && teamTargetsTotal) {
        player.targetShare = calcTargetShare(targets, teamTargetsTotal);
      }
    }
  }
};

// ── main enrichment function ────────────────────────────────────────────────

/**
 * Enrich QB/RB/WR/TE players with college stats.
 * Priority: static data → ESPN API.
 * WR players receive CSV-based receiving metrics (YAC, alignment, contested).
 */
export const enrichNonWRStats = async (players) => {
  // Fill targetShare/advanced metrics for players that already have inline stats
  fillFromStaticData(players);

  // Enrich players that don't already have stats
  const needsEnrichment = players.filter((p) => !p.stats);
  if (needsEnrichment.length === 0) {
    const alreadyHaveStats = players.filter((p) => p.stats).length;
    console.info(`[Enrichment] ${alreadyHaveStats} players already have inline stats — skipping enrichment`);
    return players;
  }

  console.info(`[Enrichment] Enriching ${needsEnrichment.length} players (others have inline stats)`);

  // ── Phase 1: Static data (instant, no API calls) ──────────────────────
  const staticResults = new Map();
  const needsAPI = [];

  for (const player of needsEnrichment) {
    const enriched = enrichFromStatic(player);
    if (enriched) {
      staticResults.set(player.id, enriched);
      console.info(`[Static] ✅ ${player.name} (${player.position})`);
    } else {
      needsAPI.push(player);
    }
  }

  console.info(`[Enrichment] Static: ${staticResults.size}/${needsEnrichment.length} matched, ${needsAPI.length} need ESPN`);

  // ── Phase 2: ESPN API for remaining players ───────────────────────────
  const espnResults = new Map();

  if (needsAPI.length > 0) {
    try {
      const playerNames = needsAPI.map((p) => p.name);
      console.info(`[ESPN] Attempting to fetch ${playerNames.length} players...`);
      const { results } = await fetchBulkPlayerStatsESPN(playerNames);

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
    }
  }

  // ── Merge results ─────────────────────────────────────────────────────
  const enriched = players.map((player) => {
    return staticResults.get(player.id)
      || espnResults.get(player.id)
      || player;
  });

  const totalMatched = staticResults.size + espnResults.size;
  console.info(`[Enrichment] Final: ${totalMatched}/${needsEnrichment.length} enriched (static: ${staticResults.size}, ESPN: ${espnResults.size})`);

  return enriched;
};
