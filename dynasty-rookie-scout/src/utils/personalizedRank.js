/**
 * League-aware personalized ranking engine.
 *
 * Pure, deterministic, no network calls. Given a list of players and a
 * leagueProfile, produce a personalized rank for each player that reflects
 * how their value shifts based on the user's league settings (format,
 * scoring, roster size, TE premium, etc.).
 *
 * Design:
 * 1. Start from the player's base rank (oneQB or superflex from FantasyCalc).
 * 2. Apply a position weight multiplier derived from the league profile.
 * 3. Apply a scarcity multiplier derived from roster size and starters.
 * 4. Divide base rank by the combined multiplier to get an adjusted score.
 * 5. Clamp the movement to ±15 spots so no player is wildly mis-ranked.
 * 6. Re-sort by adjusted score and re-index to integer ranks.
 *
 * When the profile is one of the STANDARD presets, the output is
 * byte-for-byte identical to the static rank lookup (no visible change).
 */

// Baseline used for scarcity comparisons: standard 12-team 1QB roster
// with 1 QB, 2 RB, 3 WR, 1 TE, 2 FLEX starters.
const BASELINE_TEAMS = 12;
const BASELINE_STARTERS = { qb: 1, rb: 2, wr: 3, te: 1, flex: 2, superflex: 0 };

// Max number of rank positions a player can move in either direction.
// Prevents a single multiplier from ejecting a top-5 player to the mid-teens.
const CLAMP_SPOTS = 15;

export const STANDARD_1QB = {
  source: 'preset',
  presetId: 'STANDARD_1QB',
  leagueName: 'Standard 1QB',
  format: 'oneQB',
  teams: 12,
  ppr: 1,
  tePremium: 0,
  starters: { qb: 1, rb: 2, wr: 3, te: 1, flex: 2, superflex: 0 },
  bench: 6,
  taxi: 0,
};

export const STANDARD_SF = {
  source: 'preset',
  presetId: 'STANDARD_SF',
  leagueName: 'Standard Superflex',
  format: 'superflex',
  teams: 12,
  ppr: 1,
  tePremium: 0,
  starters: { qb: 1, rb: 2, wr: 3, te: 1, flex: 2, superflex: 1 },
  bench: 6,
  taxi: 0,
};

const PRESET_IDS = new Set(['STANDARD_1QB', 'STANDARD_SF']);

/** Returns true when the profile is an untouched preset — skip the math. */
export const isPresetProfile = (profile) =>
  !!profile && profile.source === 'preset' && PRESET_IDS.has(profile.presetId);

/** Normalize a value from rank.[format] into a numeric rank (UNR → 999). */
const numericRank = (r) => (r == null || r === 'UNR' ? 999 : Number(r));

/**
 * Compute per-position weight and a human-readable reason list.
 * Weight > 1 means the position is more valuable in this league (ranks improve).
 * Weight < 1 means the position is less valuable (ranks worsen).
 */
const positionWeight = (position, profile) => {
  const reasons = [];
  let weight = 1;

  if (position === 'QB') {
    if (profile.format === 'superflex' || profile.starters?.superflex > 0) {
      weight *= 1.35;
      reasons.push('Superflex (+35%)');
    }
  }

  if (position === 'TE') {
    const tep = Number(profile.tePremium || 0);
    if (tep > 0) {
      const boost = Math.min(1 + tep * 0.25, 1.5);
      weight *= boost;
      reasons.push(`TE Premium ${tep > 0 ? '+' : ''}${tep}`);
    }
  }

  if (position === 'RB') {
    if (Number(profile.ppr || 0) === 0) {
      weight *= 0.95;
      reasons.push('Zero-PPR (RBs ↓5%)');
    }
  }

  if (position === 'WR') {
    const ppr = Number(profile.ppr || 0);
    if (ppr === 1) {
      weight *= 1.02;
      reasons.push('Full PPR (WRs ↑2%)');
    } else if (ppr === 0) {
      weight *= 0.97;
      reasons.push('Zero-PPR (WRs ↓3%)');
    }
  }

  return { weight, reasons };
};

/**
 * Scarcity adjustment: more startable slots × more teams = scarcer position.
 * We compare against a baseline 12-team league to stay bounded.
 */
const scarcityWeight = (position, profile) => {
  const reasons = [];
  const teams = Number(profile.teams || BASELINE_TEAMS);
  const s = profile.starters || BASELINE_STARTERS;

  // Slots per team that could feature this position.
  const slotsFor = (pos) => {
    const flex = Number(s.flex || 0);
    const sflex = Number(s.superflex || 0);
    switch (pos) {
      case 'QB':
        return Number(s.qb || 0) + sflex;
      case 'RB':
        return Number(s.rb || 0) + flex * 0.6; // RBs take ~60% of flex slots
      case 'WR':
        return Number(s.wr || 0) + flex * 0.35;
      case 'TE':
        return Number(s.te || 0) + flex * 0.05;
      default:
        return 1;
    }
  };

  const baselineSlots = (() => {
    const b = BASELINE_STARTERS;
    switch (position) {
      case 'QB': return b.qb + (b.superflex || 0);
      case 'RB': return b.rb + b.flex * 0.6;
      case 'WR': return b.wr + b.flex * 0.35;
      case 'TE': return b.te + b.flex * 0.05;
      default: return 1;
    }
  })();

  const leagueDemand = teams * slotsFor(position);
  const baselineDemand = BASELINE_TEAMS * baselineSlots;
  let weight = leagueDemand / baselineDemand;

  // Bound the scarcity effect to keep it a secondary influence.
  weight = Math.max(0.85, Math.min(weight, 1.18));

  if (teams !== BASELINE_TEAMS) {
    reasons.push(`${teams}-team ${teams > BASELINE_TEAMS ? 'scarcity' : 'compression'}`);
  }

  return { weight, reasons };
};

/**
 * Clamp the post-adjustment rank so nobody moves more than CLAMP_SPOTS.
 */
const clampMovement = (baseRank, adjustedRank) => {
  const delta = baseRank - adjustedRank;
  if (delta > CLAMP_SPOTS) return baseRank - CLAMP_SPOTS;
  if (delta < -CLAMP_SPOTS) return baseRank + CLAMP_SPOTS;
  return adjustedRank;
};

/**
 * Given one player and a profile, return an adjusted numeric score
 * (smaller = better). Used internally before re-indexing.
 */
const computeScore = (player, profile) => {
  const format = profile.format === 'superflex' ? 'superflex' : 'oneQB';
  const baseRank = numericRank(player.rank?.[format]);

  const { weight: posW, reasons: posReasons } = positionWeight(player.position, profile);
  const { weight: scarW, reasons: scarReasons } = scarcityWeight(player.position, profile);

  const combined = posW * scarW;
  const rawAdjusted = baseRank / Math.max(combined, 0.01);
  const clamped = clampMovement(baseRank, rawAdjusted);

  return {
    baseRank,
    score: clamped,
    reasons: [...posReasons, ...scarReasons],
  };
};

/**
 * Main entry point. Takes the raw player list and a leagueProfile, returns
 * a Map keyed by player id with { personalizedRank, delta, reasons, baseRank }.
 *
 * If the profile is a standard preset, we short-circuit and return the base
 * rank directly — no math, no possibility of drift.
 */
export const buildPersonalizedRankings = (players, profile) => {
  const result = new Map();
  if (!Array.isArray(players) || players.length === 0) return result;

  const format = profile?.format === 'superflex' ? 'superflex' : 'oneQB';

  // Fast path: preset profiles use the static rank directly.
  if (isPresetProfile(profile)) {
    for (const p of players) {
      const baseRank = numericRank(p.rank?.[format]);
      result.set(p.id, {
        personalizedRank: baseRank,
        baseRank,
        delta: 0,
        reasons: [],
      });
    }
    return result;
  }

  // Score every player with the multiplier engine.
  const scored = players.map((p) => ({ player: p, ...computeScore(p, profile) }));

  // Sort by adjusted score, then by base rank as a stable tiebreak.
  scored.sort((a, b) => a.score - b.score || a.baseRank - b.baseRank || a.player.id - b.player.id);

  // Re-index to integer ranks starting at 1.
  scored.forEach(({ player, baseRank, reasons }, idx) => {
    const personalizedRank = idx + 1;
    result.set(player.id, {
      personalizedRank,
      baseRank,
      delta: baseRank - personalizedRank,
      reasons,
    });
  });

  return result;
};

/**
 * Convenience helper: given a sorted list and a rankings map, return a
 * new sorted list reordered by personalized rank.
 */
export const sortByPersonalizedRank = (players, rankings) => {
  return [...players].sort((a, b) => {
    const ra = rankings.get(a.id)?.personalizedRank ?? 999;
    const rb = rankings.get(b.id)?.personalizedRank ?? 999;
    return ra - rb || (a.id - b.id);
  });
};
