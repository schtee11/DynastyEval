// Enriches QB/RB/TE players with live college stats from CFBD API.
// WR stats come exclusively from receivingData.js — this module skips WRs entirely.

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

// ── main enrichment function ────────────────────────────────────────────────

/**
 * Enrich QB/RB/TE players with live college stats from CFBD API.
 * Accepts pre-built player objects (from Sleeper cross-reference).
 * Returns the same players array with stats, EPA, dominator, targetShare populated.
 * WR players in the array are returned unchanged.
 */
export const enrichNonWRStats = async (players) => {
  // Only enrich players that have a cfbdLookup and are not WR
  const nonWR = players.filter((p) => p.position !== 'WR' && p._cfbdLookup);
  if (nonWR.length === 0) {
    console.warn('[CFBD] No non-WR players with _cfbdLookup found — skipping enrichment');
    return players;
  }

  // Unique college teams for non-WR players
  const teams = [...new Set(nonWR.map((p) => p._cfbdLookup.team))];
  const year = 2025;

  console.info(`[CFBD] Enriching ${nonWR.length} non-WR players from ${teams.length} teams:`, teams);
  console.info('[CFBD] Players to enrich:', nonWR.map((p) => `${p.name} (${p.position}) → team="${p._cfbdLookup.team}"`));

  // Fetch all stat categories + PPA + usage in parallel
  const [allStats, ppaData, usageData] = await Promise.all([
    fetchAllSeasonStats(year).catch((err) => {
      console.error('[CFBD] fetchAllSeasonStats failed:', err.message);
      return { passing: [], rushing: [], receiving: [] };
    }),
    fetchPPAForTeams(year, teams).catch((err) => {
      console.error('[CFBD] fetchPPAForTeams failed:', err.message);
      return [];
    }),
    fetchUsageForTeams(year, teams).catch((err) => {
      console.error('[CFBD] fetchUsageForTeams failed:', err.message);
      return [];
    }),
  ]);

  console.info(`[CFBD] API results — passing: ${allStats.passing?.length ?? 0} rows, rushing: ${allStats.rushing?.length ?? 0} rows, receiving: ${allStats.receiving?.length ?? 0} rows, PPA: ${ppaData.length} rows, usage: ${usageData.length} rows`);

  // Group stats by normalised player name
  const passingByPlayer = groupByPlayer(allStats.passing || []);
  const rushingByPlayer = groupByPlayer(allStats.rushing || []);
  const receivingByPlayer = groupByPlayer(allStats.receiving || []);

  console.info(`[CFBD] Grouped stats — passing players: ${Object.keys(passingByPlayer).length}, rushing players: ${Object.keys(rushingByPlayer).length}, receiving players: ${Object.keys(receivingByPlayer).length}`);

  // Log a sample row to see the actual shape coming from the API
  if (allStats.passing?.length > 0) {
    console.info('[CFBD] Sample passing row shape:', JSON.stringify(allStats.passing[0]));
  }
  if (allStats.rushing?.length > 0) {
    console.info('[CFBD] Sample rushing row shape:', JSON.stringify(allStats.rushing[0]));
  }

  // Group PPA by normalised player name
  const ppaByPlayer = {};
  for (const row of ppaData) {
    const key = norm(row.player || row.name || '');
    if (key) ppaByPlayer[key] = row;
  }

  // Group usage by normalised player name
  const usageByPlayer = {};
  for (const row of usageData) {
    const key = norm(row.player || row.name || '');
    if (key) usageByPlayer[key] = row;
  }

  // Team receiving totals for dominator (yards) and target share
  const teamRecYdsTotals = {};
  const teamTargetTotals = {};
  for (const row of allStats.receiving) {
    const team = row.team;
    if (!team) continue;
    const st = row.statType || row.category || '';
    if (st === 'YDS' || st === 'REC_YDS') {
      teamRecYdsTotals[team] =
        (teamRecYdsTotals[team] || 0) + val(row, 'stat', 'value');
    }
    if (st === 'TARGETS' || st === 'TGT') {
      teamTargetTotals[team] =
        (teamTargetTotals[team] || 0) + val(row, 'stat', 'value');
    }
  }
  // Fallback: use receptions as proxy for targets
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

  // Enrich each player
  return players.map((player) => {
    if (player.position === 'WR' || !player._cfbdLookup) return player;

    const key = norm(player.name);
    const passing = passingByPlayer[key];
    const rushing = rushingByPlayer[key];
    const receiving = receivingByPlayer[key];
    const ppa = ppaByPlayer[key];
    const usageRow = usageByPlayer[key];
    const team = player._cfbdLookup.team;

    const matched = !!(passing || rushing || receiving);
    if (!matched) {
      console.warn(`[CFBD] ❌ No stat match for "${player.name}" (${player.position}) — normalized key="${key}", team="${team}"`);
    } else {
      console.info(`[CFBD] ✅ Matched "${player.name}" (${player.position}) — passing:${!!passing} rushing:${!!rushing} receiving:${!!receiving} ppa:${!!ppa}`);
    }

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

    // Overlay EPA from PPA endpoint
    if (ppa) {
      const epaVal =
        ppa.averagePPA?.all ??
        ppa.totalPPA?.all ??
        ppa.countablePPA ??
        null;
      if (epaVal != null) stats.epa = +Number(epaVal).toFixed(2);
    }

    // Dominator rating + target share for TE
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

      // Approximate YPRR
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
      dominatorRating = teamTotal > 0
        ? +(((rushYds + recYds) / teamTotal) * 100).toFixed(1)
        : 0;
      const targets = val(receiving, 'TARGETS', 'TGT');
      if (targets > 0) {
        targetShare = calcTargetShare(targets, teamTargetTotals[team] || 1);
      } else if (usageRow?.usage?.pass != null) {
        targetShare = +(usageRow.usage.pass * 100).toFixed(1);
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
      _liveData: !!(passing || rushing || receiving),
    };
  });
};
