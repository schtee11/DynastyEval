// Transforms raw CFBD API data into the player shape used by components.
// Merges live college stats with prospect metadata (draft projections, dynasty ranks, etc.)

import { getProspects } from './rookieProspects2026';
import {
  fetchAllSeasonStats,
  fetchPPAForTeams,
  fetchDraftPicksIfAvailable,
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

// ── stat builders (position-aware) ──────────────────────────────────────────

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

const buildWRStats = (receiving, rushing) => ({
  receptions: val(receiving, 'REC', 'RECEPTIONS'),
  receivingYards: val(receiving, 'YDS', 'REC_YDS'),
  receivingTDs: val(receiving, 'TD', 'REC_TD'),
  targets: val(receiving, 'TARGETS', 'TGT'),
  rushingYards: val(rushing, 'YDS', 'RUSH_YDS'),
  rushingTDs: val(rushing, 'TD', 'RUSH_TD'),
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

// ── main transformer ────────────────────────────────────────────────────────

export const buildPlayersFromAPI = async () => {
  const prospects = getProspects();

  // Unique teams we need stats for
  const teams = [...new Set(prospects.map((p) => p.cfbdLookup.team))];
  // Use the most common year (2025) but some prospects may have 2024 data
  const year = 2025;

  // Fetch all stat categories + PPA in parallel
  const [allStats, ppaData, draftPicks] = await Promise.all([
    fetchAllSeasonStats(year),
    fetchPPAForTeams(year, teams).catch(() => []),
    fetchDraftPicksIfAvailable(2026),
  ]);

  // Group stats by normalised player name
  const passingByPlayer = groupByPlayer(allStats.passing);
  const rushingByPlayer = groupByPlayer(allStats.rushing);
  const receivingByPlayer = groupByPlayer(allStats.receiving);

  // Group PPA by normalised player name
  const ppaByPlayer = {};
  for (const row of ppaData) {
    const key = norm(row.player || row.name || '');
    if (key) ppaByPlayer[key] = row;
  }

  // Team receiving totals for dominator (yards) + reception share
  const teamRecYdsTotals = {};  // sum of receiving yards per team
  const teamRecTotals = {};     // sum of receptions per team
  for (const row of allStats.receiving) {
    const team = row.team;
    if (!team) continue;
    const st = row.statType || row.category || '';
    if (st === 'YDS' || st === 'REC_YDS') {
      teamRecYdsTotals[team] =
        (teamRecYdsTotals[team] || 0) + val(row, 'stat', 'value');
    }
    if (st === 'REC' || st === 'RECEPTIONS') {
      teamRecTotals[team] =
        (teamRecTotals[team] || 0) + val(row, 'stat', 'value');
    }
  }

  // If draft has happened, build a lookup for actual picks
  const draftLookup = {};
  if (draftPicks && draftPicks.length > 0) {
    for (const pick of draftPicks) {
      const key = norm(pick.name || pick.playerName || '');
      if (key) draftLookup[key] = pick;
    }
  }

  // Build final player objects
  return prospects.map((prospect) => {
    const key = norm(prospect.name);
    const passing = passingByPlayer[key];
    const rushing = rushingByPlayer[key];
    const receiving = receivingByPlayer[key];
    const ppa = ppaByPlayer[key];

    // Position-specific stat builder
    let stats;
    switch (prospect.position) {
      case 'QB':
        stats = buildQBStats(passing, rushing);
        break;
      case 'RB':
        stats = buildRBStats(rushing, receiving);
        break;
      case 'WR':
        stats = buildWRStats(receiving, rushing);
        break;
      case 'TE':
        stats = buildTEStats(receiving);
        break;
      default:
        stats = {};
    }

    // Overlay EPA from PPA endpoint
    if (ppa) {
      const epaVal =
        ppa.averagePPA?.all ??
        ppa.totalPPA?.all ??
        ppa.countablePPA ??
        null;
      if (epaVal != null) stats.epa = +Number(epaVal).toFixed(2);
    }

    // Dominator rating + target share (WR/TE)
    const team = prospect.cfbdLookup.team;
    let dominatorRating = 0;
    let targetShare = null;
    let yprr = null;
    let yacPerRR = null;

    if (['WR', 'TE'].includes(prospect.position) && receiving) {
      const recYds = val(receiving, 'YDS', 'REC_YDS');
      const receptions = val(receiving, 'REC', 'RECEPTIONS');
      const targets = val(receiving, 'TARGETS', 'TGT');
      // Use targets when available, fall back to receptions
      const usage = targets > 0 ? targets : receptions;
      dominatorRating = calcDominatorRating(
        recYds,
        teamRecYdsTotals[team] || 1
      );
      targetShare = calcTargetShare(usage, teamRecTotals[team] || 1);
      // YPRR: use targets if available, otherwise approximate with receptions
      if (usage > 0) {
        yprr = +(recYds / usage).toFixed(2);
        const yac = val(receiving, 'YAC', 'YARDS_AFTER_CATCH');
        if (yac > 0) yacPerRR = +(yac / usage).toFixed(2);
      }
    }

    if (prospect.position === 'RB') {
      const rushYds = val(rushing, 'YDS', 'RUSH_YDS');
      const recYds = val(receiving, 'YDS', 'REC_YDS');
      const teamTotal = (teamRecYdsTotals[team] || 0) + rushYds;
      dominatorRating = teamTotal > 0
        ? +((( rushYds + recYds) / teamTotal) * 100).toFixed(1)
        : 0;
      const receptions = val(receiving, 'REC', 'RECEPTIONS');
      const targets = val(receiving, 'TARGETS', 'TGT');
      const usage = targets > 0 ? targets : receptions;
      targetShare = calcTargetShare(usage, teamRecTotals[team] || 1);
    }

    // If the draft has happened, use real data; otherwise mark as projected
    const draft = draftLookup[key];
    const draftRound = draft
      ? draft.round
      : prospect.projectedRound;
    const draftPick = draft
      ? draft.overall || draft.pick
      : prospect.projectedPick;
    const draftTeam = draft
      ? draft.nflTeam || prospect.projectedTeam
      : prospect.projectedTeam;
    const draftIsProjected = !draft;

    return {
      id: prospect.id,
      name: prospect.name,
      position: prospect.position,
      college: prospect.college,
      age: prospect.age,
      height: prospect.height,
      weight: prospect.weight,
      draftRound,
      draftPick,
      draftTeam,
      draftIsProjected,
      stats,
      breakoutAge: prospect.breakoutAge,
      dominatorRating,
      targetShare,
      yprr,
      yacPerRR,
      injuries: prospect.injuries,
      dynastyADP: prospect.dynastyADP,
      rank: prospect.rank,
      playerComps: prospect.playerComps,
      _liveData: !!(passing || rushing || receiving),
    };
  });
};
