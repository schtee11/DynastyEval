// Transforms raw CFBD API data into the player shape used by components.
// Merges live college stats with prospect metadata (draft projections, dynasty ranks, etc.)

import { getProspects } from './rookieProspects2026';
import {
  fetchAllSeasonStats,
  fetchPPAForTeams,
  fetchUsageForTeams,
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

  // Fetch all stat categories + PPA + usage in parallel
  const [allStats, ppaData, usageData, draftPicks] = await Promise.all([
    fetchAllSeasonStats(year),
    fetchPPAForTeams(year, teams).catch(() => []),
    fetchUsageForTeams(year, teams).catch(() => []),
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

  // Group usage by normalised player name
  // Usage endpoint returns { player, team, position, usage: { overall, pass, rush, ... } }
  const usageByPlayer = {};
  for (const row of usageData) {
    const key = norm(row.player || row.name || '');
    if (key) usageByPlayer[key] = row;
  }

  // Team receiving totals for dominator (yards) and target share
  const teamRecYdsTotals = {};  // sum of receiving yards per team
  const teamTargetTotals = {};  // sum of targets per team (fallback to receptions)
  for (const row of allStats.receiving) {
    const team = row.team;
    if (!team) continue;
    const st = row.statType || row.category || '';
    if (st === 'YDS' || st === 'REC_YDS') {
      teamRecYdsTotals[team] =
        (teamRecYdsTotals[team] || 0) + val(row, 'stat', 'value');
    }
    // Prefer targets for target share; if unavailable the API won't return these rows
    if (st === 'TARGETS' || st === 'TGT') {
      teamTargetTotals[team] =
        (teamTargetTotals[team] || 0) + val(row, 'stat', 'value');
    }
  }
  // If no target data was found, estimate from team pass attempts via usage
  // or fall back to receptions as a rough proxy
  if (Object.keys(teamTargetTotals).length === 0) {
    for (const row of allStats.receiving) {
      const team = row.team;
      if (!team) continue;
      const st = row.statType || row.category || '';
      if (st === 'REC' || st === 'RECEPTIONS') {
        teamTargetTotals[team] =
          (teamTargetTotals[team] || 0) + val(row, 'stat', 'value');
      }
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

    // Usage endpoint provides pass/overall usage rates
    const usageRow = usageByPlayer[key];

    if (['WR', 'TE'].includes(prospect.position) && receiving) {
      const recYds = val(receiving, 'YDS', 'REC_YDS');
      const targets = val(receiving, 'TARGETS', 'TGT');

      dominatorRating = calcDominatorRating(
        recYds,
        teamRecYdsTotals[team] || 1
      );

      // Target share: use actual targets if API provides them,
      // otherwise derive from usage endpoint's pass usage rate
      if (targets > 0) {
        targetShare = calcTargetShare(targets, teamTargetTotals[team] || 1);
      } else if (usageRow?.usage?.pass != null) {
        // Pass usage rate is already a proportion of team passing involvement
        targetShare = +(usageRow.usage.pass * 100).toFixed(1);
      }

      // YPRR: yards / routes run. Without route data, approximate from
      // usage rate: routes ≈ team pass plays × pass usage rate
      if (usageRow?.usage?.pass != null && usageRow.usage.pass > 0) {
        // Estimate routes run from team pass attempts and player's pass usage
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

      const yac = val(receiving, 'YAC', 'YARDS_AFTER_CATCH');
      if (yac > 0 && yprr != null) {
        // Scale YAC by same route estimate
        yacPerRR = +(yac * (yprr / recYds)).toFixed(2);
      }
    }

    if (prospect.position === 'RB') {
      const rushYds = val(rushing, 'YDS', 'RUSH_YDS');
      const recYds = val(receiving, 'YDS', 'REC_YDS');
      const teamTotal = (teamRecYdsTotals[team] || 0) + rushYds;
      dominatorRating = teamTotal > 0
        ? +((( rushYds + recYds) / teamTotal) * 100).toFixed(1)
        : 0;
      const targets = val(receiving, 'TARGETS', 'TGT');
      if (targets > 0) {
        targetShare = calcTargetShare(targets, teamTargetTotals[team] || 1);
      } else if (usageRow?.usage?.pass != null) {
        targetShare = +(usageRow.usage.pass * 100).toFixed(1);
      }
    }

    // Prefer hardcoded advanced stats from prospect data (PFF-sourced)
    // over any calculated/estimated values from the CFBD API
    if (prospect.advancedStats) {
      if (prospect.advancedStats.yprr != null) yprr = prospect.advancedStats.yprr;
      if (prospect.advancedStats.targetShare != null) targetShare = prospect.advancedStats.targetShare;
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
      // Only attach perspective data for WRs
      receivingByPerspective: prospect.position === 'WR' ? (prospect.receivingByPerspective || null) : null,
      _liveData: !!(passing || rushing || receiving),
    };
  });
};
