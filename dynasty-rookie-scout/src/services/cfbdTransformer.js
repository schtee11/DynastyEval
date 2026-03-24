// Enriches QB/RB/TE players with college stats.
// WR stats come exclusively from receivingData.js — this module skips WRs entirely.
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
  epa: null,
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

// ── dominator / target-share calculators (TE only) ───────────────────────────

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

  // Dominator rating + target share (TE only — RB dominator requires team rush totals we don't have)
  let dominatorRating = player.dominatorRating || 0;
  let targetShare = player.targetShare;
  let yprr = player.yprr;
  let yacPerRR = player.yacPerRR;

  if (player.position === 'TE' && receiving) {
    const recYds = val(receiving, 'YDS', 'REC_YDS');
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (teamRecYdsTotal) {
      dominatorRating = calcDominatorRating(recYds, teamRecYdsTotal);
    }
    if (targets > 0 && teamTargetsTotal) {
      targetShare = calcTargetShare(targets, teamTargetsTotal);
    }
    if (targets > 0) {
      yprr = +(recYds / targets).toFixed(2);
    }
  }

  if (player.position === 'RB') {
    const targets = val(receiving, 'TARGETS', 'TGT');
    if (targets > 0 && teamTargetsTotal) {
      targetShare = calcTargetShare(targets, teamTargetsTotal);
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
    const { receiving, teamRecYdsTotal, teamTargetsTotal } = staticData;

    // Fill advanced rushing metrics from static PFF data
    if (player.yardsAfterContact == null && staticData.yardsAfterContact != null) player.yardsAfterContact = staticData.yardsAfterContact;
    if (player.avoidedTackles == null && staticData.avoidedTackles != null) player.avoidedTackles = staticData.avoidedTackles;
    if (player.ycoPerAttempt == null && staticData.ycoPerAttempt != null) player.ycoPerAttempt = staticData.ycoPerAttempt;
    if (player.explosiveRuns == null && staticData.explosiveRuns != null) player.explosiveRuns = staticData.explosiveRuns;

    // Fill dominator rating (TE only — RB dominator requires team rush totals we don't have)
    if (player.dominatorRating == null) {
      if (player.position === 'RB') {
        const targets = val(receiving, 'TARGETS', 'TGT');
        if (targets > 0 && player.targetShare == null && teamTargetsTotal) {
          player.targetShare = calcTargetShare(targets, teamTargetsTotal);
        }
      }
      if (player.position === 'TE' && receiving && teamRecYdsTotal) {
        const recYds = val(receiving, 'YDS', 'REC_YDS');
        const targets = val(receiving, 'TARGETS', 'TGT');
        player.dominatorRating = calcDominatorRating(recYds, teamRecYdsTotal);
        if (targets > 0 && player.targetShare == null && teamTargetsTotal) {
          player.targetShare = calcTargetShare(targets, teamTargetsTotal);
        }
      }
    }
  }
};

// ── main enrichment function ────────────────────────────────────────────────

/**
 * Enrich QB/RB/TE players with college stats.
 * Priority: static data → ESPN API.
 * WR players in the array are returned unchanged.
 */
export const enrichNonWRStats = async (players) => {
  // Fill dominator/targetShare/advanced metrics for players that already have inline stats
  fillFromStaticData(players);

  // Only enrich players that are not WR and don't already have stats
  const nonWR = players.filter((p) => p.position !== 'WR' && !p.stats);
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

  console.info(`[Enrichment] Static: ${staticResults.size}/${nonWR.length} matched, ${needsAPI.length} need ESPN`);

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
    if (player.position === 'WR') return player;
    return staticResults.get(player.id)
      || espnResults.get(player.id)
      || player;
  });

  const totalMatched = staticResults.size + espnResults.size;
  console.info(`[Enrichment] Final: ${totalMatched}/${nonWR.length} enriched (static: ${staticResults.size}, ESPN: ${espnResults.size})`);

  return enriched;
};
