// Attaches college stats from collegeStats2025.js (generated from PFF CSVs)
// directly onto player objects. No API calls, no async, no enrichment pipeline.

import { getStaticCollegeStats } from './collegeStats2025';

// ── helpers ──────────────────────────────────────────────────────────────────

const v = (obj, ...keys) => {
  if (!obj) return 0;
  for (const k of keys) {
    if (obj[k] !== undefined) return Number(obj[k]);
  }
  return 0;
};

const pct = (num, denom) =>
  denom > 0 ? +((num / denom) * 100).toFixed(1) : null;

// ── position-specific stat builders ──────────────────────────────────────────

const buildQBStats = (sd) => ({
  passingYards: v(sd.passing, 'YDS'),
  passingTDs: v(sd.passing, 'TD'),
  interceptions: v(sd.passing, 'INT'),
  completionPct: v(sd.passing, 'PCT') || pct(v(sd.passing, 'COMP'), v(sd.passing, 'ATT')),
  rushingYards: v(sd.rushing, 'YDS'),
  rushingTDs: v(sd.rushing, 'TD'),
});

const buildRBStats = (sd) => {
  const car = v(sd.rushing, 'CAR');
  const yds = v(sd.rushing, 'YDS');
  return {
    rushingYards: yds,
    rushingTDs: v(sd.rushing, 'TD'),
    yardsPerCarry: car > 0 ? +(yds / car).toFixed(1) : 0,
    receptions: v(sd.receiving, 'REC'),
    receivingYards: v(sd.receiving, 'YDS'),
    receivingTDs: v(sd.receiving, 'TD'),
  };
};

const buildRecStats = (sd) => ({
  receptions: v(sd.receiving, 'REC'),
  receivingYards: v(sd.receiving, 'YDS'),
  receivingTDs: v(sd.receiving, 'TD'),
  targets: v(sd.receiving, 'TARGETS'),
});

// ── main function ────────────────────────────────────────────────────────────

/**
 * Attach static college stats to a player object.
 * Called once per player at init time — no async, no API calls.
 * Returns the extra fields to spread onto the player.
 */
export const attachCollegeStats = (playerName, position, prospect) => {
  const sd = getStaticCollegeStats(playerName);
  if (!sd) return {};

  // Position-specific basic stats
  let stats;
  switch (position) {
    case 'QB': stats = buildQBStats(sd); break;
    case 'RB': stats = buildRBStats(sd); break;
    case 'WR':
    case 'TE': stats = buildRecStats(sd); break;
    default:   stats = {};
  }

  // Target share (WR / TE / RB)
  const targets = v(sd.receiving, 'TARGETS');
  const teamTgts = sd.teamTargetsTotal;
  let targetShare = pct(targets, teamTgts);

  // YPRR + route-based metrics
  const yprr = sd.pffYprr ?? null;
  const routesRun = sd.routesRun ?? null;
  const tgtPerRR = routesRun > 0 && targets > 0 ? pct(targets, routesRun) : null;
  const firstDownTDPerRR = routesRun > 0
    ? +(((sd.firstDowns || 0) + v(sd.receiving, 'TD')) / routesRun).toFixed(2)
    : null;

  // Prospect advancedStats take priority (hand-curated)
  const adv = prospect?.advancedStats;
  if (adv?.targetShare != null) targetShare = adv.targetShare;

  return {
    stats,
    targetShare,
    yprr: adv?.yprr ?? yprr,
    routesRun,
    tgtPerRR,
    firstDownTDPerRR,
    recGrade: sd.recGrade ?? null,
    // Receiving metrics (WR / TE)
    yardsAfterCatch: sd.yardsAfterCatch ?? null,
    yardsAfterCatchPerRec: sd.yardsAfterCatchPerRec ?? null,
    slotRate: sd.slotRate ?? null,
    wideRate: sd.wideRate ?? null,
    inlineRate: sd.inlineRate ?? null,
    contestedCatchRate: sd.contestedCatchRate ?? null,
    contestedReceptions: sd.contestedReceptions ?? null,
    // Rushing metrics (RB)
    yardsAfterContact: sd.yardsAfterContact ?? null,
    avoidedTackles: sd.avoidedTackles ?? null,
    ycoPerAttempt: sd.ycoPerAttempt ?? null,
    explosiveRuns: sd.explosiveRuns ?? null,
    gamesPlayed: sd.gamesPlayed ?? null,
    _dataSource: 'static',
  };
};
