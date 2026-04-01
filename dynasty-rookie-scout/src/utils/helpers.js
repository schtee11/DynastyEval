// Position colors — using CSS variables for theme support
export const positionColors = {
  QB: { border: 'var(--pos-qb-border)', bg: 'var(--pos-qb-bg)', text: 'var(--pos-qb-text)' },
  RB: { border: 'var(--pos-rb-border)', bg: 'var(--pos-rb-bg)', text: 'var(--pos-rb-text)' },
  WR: { border: 'var(--pos-wr-border)', bg: 'var(--pos-wr-bg)', text: 'var(--pos-wr-text)' },
  TE: { border: 'var(--pos-te-border)', bg: 'var(--pos-te-bg)', text: 'var(--pos-te-text)' },
};

// Static hex colors for chart fills (Recharts doesn't support CSS vars)
export const positionChartColors = {
  QB: '#dc2626',
  RB: '#0891b2',
  WR: '#7c3aed',
  TE: '#059669',
};

export const getBreakoutIndicator = (breakoutAge) => {
  if (!breakoutAge) return { label: 'N/A', color: 'var(--text-tertiary)', emoji: '' };
  if (breakoutAge <= 20) return { label: 'Elite', color: 'var(--warning)', emoji: '' };
  if (breakoutAge <= 21) return { label: 'Good', color: 'var(--success)', emoji: '' };
  return { label: 'Late', color: 'var(--text-tertiary)', emoji: '' };
};

export const getDraftCapitalInfo = (pick) => {
  if (pick <= 10) return { label: 'Elite', color: 'var(--warning)', emoji: '' };
  if (pick <= 32) return { label: 'Day 1', color: 'var(--success)', emoji: '' };
  if (pick <= 64) return { label: 'Day 2', color: 'var(--accent-text)', emoji: '' };
  return { label: 'Day 3', color: 'var(--text-tertiary)', emoji: '' };
};

export const getDraftRangeLabel = (round, pick) => {
  if (!round && !pick) return null;
  if (round && pick) return `Rd ${round} (#${pick})`;
  if (round) return `Rd ${round}`;
  return null;
};

export const hasInjuryRisk = (player) => player.injuries && player.injuries.length > 0;

export const getTierForPlayer = (player) => {
  const pick = player.draftPick;
  if (!pick) return 'Undrafted / TBD';
  if (pick <= 10) return 'Elite';
  if (pick <= 32) return 'Day 1';
  if (pick <= 100) return 'Day 2';
  return 'Day 3';
};

export const getTopStats = (player, perspective = 'overall') => {
  const { position, stats } = player;

  if (position === 'WR') {
    const pData = player.receivingByPerspective?.[perspective];
    if (pData) {
      if (perspective === 'deepBall') {
        return [
          { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
          { label: '1D+TD/RR', value: pData.firstDownTDPerRR?.toFixed(2) || 'N/A' },
          { label: 'CONT %', value: pData.contestedCatchRate != null ? `${pData.contestedCatchRate}%` : 'N/A' },
        ];
      }
      return [
        { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
        { label: '1D+TD/RR', value: pData.firstDownTDPerRR?.toFixed(2) || 'N/A' },
        { label: 'TGT/RR', value: pData.tgtPerRR != null ? `${pData.tgtPerRR}%` : 'N/A' },
      ];
    }
    return [
      { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
      { label: 'TGT SHARE', value: player.targetShare != null ? `${player.targetShare}%` : 'N/A' },
      { label: 'Rec YDs', value: stats?.receivingYards?.toLocaleString() || 'N/A' },
    ];
  }

  if (position === 'QB') {
    return [
      { label: 'COMP %', value: stats?.completionPct != null ? `${stats.completionPct}%` : 'N/A' },
      { label: 'Pass YDs', value: stats?.passingYards?.toLocaleString() },
      { label: 'Rush YDs', value: stats?.rushingYards?.toLocaleString() || 'N/A' },
    ];
  }

  if (position === 'RB') {
    return [
      { label: 'Rush YDs', value: stats?.rushingYards?.toLocaleString() },
      { label: 'YPC', value: stats?.yardsPerCarry?.toFixed(1) },
      { label: 'Rush TDs', value: stats?.rushingTDs },
    ];
  }

  if (position === 'TE') {
    return [
      { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
      { label: 'TGT SHARE', value: player.targetShare != null ? `${player.targetShare}%` : 'N/A' },
      { label: 'Rec YDs', value: stats?.receivingYards?.toLocaleString() || 'N/A' },
    ];
  }

  return [{ label: 'Stats', value: 'N/A' }];
};

export const sortPlayers = (players, sortBy, leagueType = 'oneQB', perspective = 'overall') => {
  const sorted = [...players];
  const getRank = (p) => { const r = p.rank?.[leagueType]; return (r == null || r === 'UNR') ? 999 : r; };
  const getAdp = (p) => p.dynastyADP?.[leagueType] ?? 999;
  const getYprr = (p) => p.receivingByPerspective?.[perspective]?.yprr ?? p.yprr ?? 0;
  const getRecGrade = (p) => p.receivingByPerspective?.[perspective]?.recGrade ?? 0;
  const getTgtPerRR = (p) => p.receivingByPerspective?.[perspective]?.tgtPerRR ?? 0;
  const tiebreak = (a, b) => (getRank(a) - getRank(b)) || (a.id - b.id);
  const stableSort = (compareFn) => sorted.sort((a, b) => compareFn(a, b) || tiebreak(a, b));
  switch (sortBy) {
    case 'rank':
      return stableSort((a, b) => getRank(a) - getRank(b));
    case 'adp':
      return stableSort((a, b) => getAdp(a) - getAdp(b));
    case 'draftCapital':
      return stableSort((a, b) => (a.draftPick || 999) - (b.draftPick || 999));
    case 'breakoutAge':
      return stableSort((a, b) => (a.breakoutAge || 99) - (b.breakoutAge || 99));
    case 'yprr':
      return stableSort((a, b) => getYprr(b) - getYprr(a));
    case 'dominator':
      return stableSort((a, b) => (b.targetShare || 0) - (a.targetShare || 0));
    case 'recGrade':
      return stableSort((a, b) => getRecGrade(b) - getRecGrade(a));
    case 'tgtPerRR':
      return stableSort((a, b) => getTgtPerRR(b) - getTgtPerRR(a));
    default:
      return stableSort((a, b) => getRank(a) - getRank(b));
  }
};

export const filterPlayers = (players, filters) => {
  return players.filter(player => {
    if (filters.nameSearch && !player.name.toLowerCase().includes(filters.nameSearch.toLowerCase())) return false;
    if (filters.position && filters.position !== 'ALL' && player.position !== filters.position) return false;
    if (filters.draftDay) {
      const round = player.draftRound;
      if (!round) return false;
      if (filters.draftDay === '1' && round !== 1) return false;
      if (filters.draftDay === '2' && (round < 2 || round > 3)) return false;
      if (filters.draftDay === '3' && round <= 3) return false;
    }
    if (filters.hideInjured && player.injuries.length > 0) return false;
    if (filters.breakoutMax && player.breakoutAge && player.breakoutAge > filters.breakoutMax) return false;
    return true;
  });
};

// ── Percentile utilities ────────────────────────────────────────────────────

/**
 * Compute rank-based percentile for a value within a list of values.
 * Returns 0–100 (what % of values this one is >= to).
 */
export const computePercentile = (playerValue, allValues) => {
  const valid = allValues.filter(v => v != null && !isNaN(v) && v > 0);
  if (valid.length === 0 || playerValue == null || isNaN(playerValue)) return null;
  const below = valid.filter(v => v < playerValue).length;
  return Math.round((below / valid.length) * 100);
};

/** Return a hex color for a percentile value (for charts/bars). */
export const getPercentileColor = (pct) => {
  if (pct == null) return '#94a3b8';
  if (pct >= 75) return '#16a34a';
  if (pct >= 50) return '#2563eb';
  if (pct >= 25) return '#d97706';
  return '#94a3b8';
};

/**
 * Get the raw numeric stat accessors for a position.
 * Returns array of { label, getValue(player, perspective) } objects.
 * Used by PercentileBar to compute where a player sits in the class.
 */
/**
 * Compute a headline score (0-99) summarizing a prospect's value.
 * Weighted average of stat percentiles + draft capital bonus.
 */
export const computeHeadlineScore = (player, allPlayers) => {
  const peers = allPlayers.filter(p => p.position === player.position);
  const accessors = getStatAccessors(player.position);
  const percentiles = accessors.map(acc => {
    const val = acc.getValue(player);
    const allVals = peers.map(p => acc.getValue(p));
    return computePercentile(val, allVals);
  }).filter(p => p != null);

  if (percentiles.length === 0) return null;

  let score = Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length);
  if (player.draftPick && player.draftPick <= 10) score = Math.min(99, score + 5);
  else if (player.draftPick && player.draftPick <= 32) score = Math.min(99, score + 3);

  return score;
};

// ── Strengths / Concerns / Outlook generators ─────────────────────────────

const strengthStatDefs = {
  QB: [
    { label: 'Completion %', key: 'completionPct', unit: '%', getValue: p => p.stats?.completionPct, desc: 'completion accuracy' },
    { label: 'Passing TDs', key: 'passingTDs', unit: '', getValue: p => p.stats?.passingTDs, desc: 'touchdown production' },
    { label: 'Passing Yards', key: 'passingYards', unit: '', getValue: p => p.stats?.passingYards, desc: 'passing volume' },
    { label: 'Rushing Yards', key: 'rushingYards', unit: '', getValue: p => p.stats?.rushingYards, desc: 'rushing production' },
    { label: 'Rushing TDs', key: 'rushingTDs', unit: '', getValue: p => p.stats?.rushingTDs, desc: 'rushing touchdowns' },
    { label: 'BTT Rate', key: 'bttRate', unit: '%', getValue: p => p.stats?.bttRate, desc: 'big-time throw rate' },
    { label: 'Y/A', key: 'yardsPerAttempt', unit: '', getValue: p => p.stats?.yardsPerAttempt, desc: 'yards per attempt' },
    { label: 'PFF Pass Grade', key: 'pffPassGrade', unit: '', getValue: p => p.stats?.pffPassGrade, desc: 'PFF passing grade' },
    { label: 'QB Rating', key: 'qbRating', unit: '', getValue: p => p.stats?.qbRating, desc: 'passer rating' },
  ],
  RB: [
    { label: 'Rushing Yards', key: 'rushingYards', unit: '', getValue: p => p.stats?.rushingYards, desc: 'rushing volume' },
    { label: 'YPC', key: 'yardsPerCarry', unit: '', getValue: p => p.stats?.yardsPerCarry, desc: 'yards per carry' },
    { label: 'Rushing TDs', key: 'rushingTDs', unit: '', getValue: p => p.stats?.rushingTDs, desc: 'touchdown production' },
    { label: 'Receptions', key: 'receptions', unit: '', getValue: p => p.stats?.receptions, desc: 'receiving involvement' },
    { label: 'Receiving Yards', key: 'receivingYards', unit: '', getValue: p => p.stats?.receivingYards, desc: 'receiving production' },
    { label: 'Elusive Rating', key: 'elusiveRating', unit: '', getValue: p => p.stats?.elusiveRating, desc: 'elusiveness' },
    { label: 'PFF Grade', key: 'pffGrade', unit: '', getValue: p => p.stats?.pffGrade, desc: 'overall PFF grade' },
  ],
  WR: [
    { label: 'YPRR', key: 'yprr', unit: '', getValue: p => p.yprr || p.advancedStats?.yprr, desc: 'route efficiency (YPRR)' },
    { label: 'Target Share', key: 'targetShare', unit: '%', getValue: p => p.targetShare || p.advancedStats?.targetShare, desc: 'target share' },
    { label: 'YAC/Rec', key: 'yac', unit: '', getValue: p => p.yardsAfterCatchPerRec, desc: 'yards after catch' },
    { label: 'Contested Catch %', key: 'contested', unit: '%', getValue: p => p.contestedCatchRate, desc: 'contested catch ability' },
    { label: 'Receiving Yards', key: 'recYds', unit: '', getValue: p => p.stats?.receivingYards, desc: 'receiving production' },
  ],
  TE: [
    { label: 'YPRR', key: 'yprr', unit: '', getValue: p => p.yprr || p.advancedStats?.yprr, desc: 'route efficiency (YPRR)' },
    { label: 'Target Share', key: 'targetShare', unit: '%', getValue: p => p.targetShare || p.advancedStats?.targetShare, desc: 'target share' },
    { label: 'Receiving Yards', key: 'recYds', unit: '', getValue: p => p.stats?.receivingYards, desc: 'receiving production' },
    { label: 'Receiving TDs', key: 'recTDs', unit: '', getValue: p => p.stats?.receivingTDs, desc: 'touchdown production' },
  ],
};

const concernStatDefs = {
  QB: [
    { label: 'TWP Rate', key: 'twpRate', unit: '%', getValue: p => p.stats?.twpRate, desc: 'turnover-worthy play rate', invert: true },
    { label: 'Sacks', key: 'sacks', unit: '', getValue: p => p.stats?.sacks, desc: 'sack tendency', invert: true },
    { label: 'INTs', key: 'INT', unit: '', getValue: p => p.stats?.INT, desc: 'interception count', invert: true },
    { label: 'Completion %', key: 'completionPct', unit: '%', getValue: p => p.stats?.completionPct, desc: 'completion accuracy' },
    { label: 'Rushing Yards', key: 'rushingYards', unit: '', getValue: p => p.stats?.rushingYards, desc: 'rushing production' },
  ],
  RB: [
    { label: 'Receiving Yards', key: 'receivingYards', unit: '', getValue: p => p.stats?.receivingYards, desc: 'receiving production' },
    { label: 'YPC', key: 'yardsPerCarry', unit: '', getValue: p => p.stats?.yardsPerCarry, desc: 'yards per carry' },
    { label: 'Rushing Yards', key: 'rushingYards', unit: '', getValue: p => p.stats?.rushingYards, desc: 'rushing volume' },
  ],
  WR: [
    { label: 'Contested Catch %', key: 'contested', unit: '%', getValue: p => p.contestedCatchRate, desc: 'contested catch ability' },
    { label: 'YPRR', key: 'yprr', unit: '', getValue: p => p.yprr || p.advancedStats?.yprr, desc: 'route efficiency (YPRR)' },
    { label: 'Target Share', key: 'targetShare', unit: '%', getValue: p => p.targetShare || p.advancedStats?.targetShare, desc: 'target volume' },
  ],
  TE: [
    { label: 'YPRR', key: 'yprr', unit: '', getValue: p => p.yprr || p.advancedStats?.yprr, desc: 'route efficiency (YPRR)' },
    { label: 'Target Share', key: 'targetShare', unit: '%', getValue: p => p.targetShare || p.advancedStats?.targetShare, desc: 'target volume' },
  ],
};

export const generateStrengths = (player, allPlayers) => {
  const peers = allPlayers.filter(p => p.position === player.position);
  const defs = strengthStatDefs[player.position] || [];
  const strengths = [];

  for (const def of defs) {
    const val = def.getValue(player);
    if (val == null || isNaN(val)) continue;
    const allVals = peers.map(def.getValue).filter(v => v != null && !isNaN(v) && v > 0);
    const pct = computePercentile(val, allVals);
    if (pct != null && pct >= 75) {
      const display = def.unit === '%' ? `${val}%` : typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val.toLocaleString();
      strengths.push({
        label: def.label,
        percentile: pct,
        text: `${pct >= 90 ? 'Elite' : 'Strong'} ${def.desc} (${display}) — ${ordinal(pct)} percentile among ${player.position}s`,
      });
    }
  }

  // Draft capital
  const pick = player.draftPick;
  if (pick && pick <= 10) {
    strengths.unshift({ label: 'Draft Capital', percentile: 99, text: `Elite draft capital (Pick #${pick}) — strong NFL investment and opportunity` });
  } else if (pick && pick <= 32) {
    strengths.unshift({ label: 'Draft Capital', percentile: 85, text: `Day 1 draft capital (Pick #${pick}) — solid NFL investment` });
  }

  // Breakout age
  const ba = player.breakoutAge;
  if (ba && ba <= 19) {
    strengths.push({ label: 'Breakout Age', percentile: 99, text: `Elite breakout age (${ba}) — historically correlates with NFL success` });
  } else if (ba && ba <= 20) {
    strengths.push({ label: 'Breakout Age', percentile: 85, text: `Young breakout age (${ba}) — positive developmental indicator` });
  }

  // Age advantage
  if (player.age && player.age <= 20) {
    strengths.push({ label: 'Age', percentile: 90, text: `Just ${player.age} years old — significant age advantage for dynasty` });
  }

  return strengths.sort((a, b) => b.percentile - a.percentile).slice(0, 4);
};

export const generateConcerns = (player, allPlayers) => {
  const peers = allPlayers.filter(p => p.position === player.position);
  const defs = concernStatDefs[player.position] || [];
  const concerns = [];

  for (const def of defs) {
    const val = def.getValue(player);
    if (val == null || isNaN(val)) continue;
    const allVals = peers.map(def.getValue).filter(v => v != null && !isNaN(v) && v > 0);
    const pct = computePercentile(val, allVals);
    if (pct == null) continue;

    // For inverted stats (high = bad), flag if ABOVE 75th percentile
    if (def.invert && pct >= 75) {
      const display = def.unit === '%' ? `${val}%` : val;
      concerns.push({
        label: def.label,
        severity: pct >= 90 ? 'high' : 'medium',
        text: `High ${def.desc} (${display}) — ${ordinal(pct)} percentile (worse than peers)`,
      });
    }
    // For normal stats, flag if BELOW 30th percentile
    if (!def.invert && pct <= 30) {
      const display = def.unit === '%' ? `${val}%` : typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val;
      concerns.push({
        label: def.label,
        severity: pct <= 15 ? 'high' : 'medium',
        text: `Below-average ${def.desc} (${display}) — ${ordinal(pct)} percentile among ${player.position}s`,
      });
    }
  }

  // Injuries
  if (player.injuries && player.injuries.length > 0) {
    for (const inj of player.injuries) {
      const sevLabel = inj.severity === 'Severe' ? 'Significant' : inj.severity;
      concerns.unshift({
        label: 'Injury',
        severity: inj.severity === 'Severe' ? 'high' : 'medium',
        text: `${sevLabel} ${inj.type} injury (${inj.date}) — monitor recovery and long-term impact`,
      });
    }
  }

  // Late breakout
  if (player.breakoutAge && player.breakoutAge >= 22) {
    concerns.push({
      label: 'Breakout Age',
      severity: 'medium',
      text: `Late breakout age (${player.breakoutAge}) — historically correlates with lower NFL ceiling`,
    });
  }

  // Day 3 capital
  const pick = player.draftPick;
  if (pick && pick > 100) {
    concerns.push({
      label: 'Draft Capital',
      severity: 'medium',
      text: `Day 3 draft capital (Pick #${pick}) — limited early NFL opportunity expected`,
    });
  }

  // Older age
  if (player.age && player.age >= 23) {
    concerns.push({
      label: 'Age',
      severity: 'medium',
      text: `Age ${player.age} — older for the class, less dynasty upside runway`,
    });
  }

  return concerns.slice(0, 3);
};

export const generateOutlook = (player, allPlayers) => {
  const pos = player.position;
  const pick = player.draftPick;
  const rank1QB = player.rank?.oneQB;
  const ba = player.breakoutAge;

  let outlook = '';

  // Opening based on draft capital + position
  if (pick && pick <= 10) {
    outlook += `${player.name} is an elite-capital ${pos} prospect with top-10 draft pedigree. `;
  } else if (pick && pick <= 32) {
    outlook += `${player.name} is a Day 1 ${pos} with first-round draft capital. `;
  } else if (pick && pick <= 64) {
    outlook += `${player.name} is a Day 2 ${pos} who offers potential value. `;
  } else {
    outlook += `${player.name} is a developmental ${pos} prospect. `;
  }

  // Dynasty value context
  if (rank1QB && rank1QB !== 'UNR' && rank1QB <= 5) {
    outlook += `Ranked as a top-5 dynasty rookie (1QB #${rank1QB}), `;
  } else if (rank1QB && rank1QB !== 'UNR' && rank1QB <= 15) {
    outlook += `A solid top-15 dynasty rookie (1QB #${rank1QB}), `;
  } else if (rank1QB && rank1QB !== 'UNR') {
    outlook += `Currently ranked 1QB #${rank1QB}, `;
  }

  // Upside or ceiling note
  if (ba && ba <= 20) {
    outlook += `with an elite breakout profile and long-term ceiling. `;
  } else if (ba && ba <= 21) {
    outlook += `with a solid developmental trajectory. `;
  } else {
    outlook += `though the age profile limits the dynasty ceiling somewhat. `;
  }

  return outlook.trim();
};

const ordinal = (n) => {
  if (n == null) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getStatAccessors = (position, perspective = 'overall') => {
  if (position === 'QB') {
    return [
      { label: 'COMP %', getValue: p => p.stats?.completionPct },
      { label: 'PASS YDS', getValue: p => p.stats?.passingYards },
      { label: 'RUSH YDS', getValue: p => p.stats?.rushingYards },
    ];
  }
  if (position === 'RB') {
    return [
      { label: 'RUSH YDS', getValue: p => p.stats?.rushingYards },
      { label: 'YPC', getValue: p => p.stats?.yardsPerCarry },
      { label: 'RUSH TDS', getValue: p => p.stats?.rushingTDs },
    ];
  }
  if (position === 'WR') {
    const pData = (p) => p.receivingByPerspective?.[perspective];
    return [
      { label: 'YPRR', getValue: p => pData(p)?.yprr ?? p.yprr },
      { label: '1D+TD/RR', getValue: p => pData(p)?.firstDownTDPerRR ?? p.firstDownTDPerRR },
      { label: 'TGT/RR', getValue: p => pData(p)?.tgtPerRR ?? p.tgtPerRR },
    ];
  }
  if (position === 'TE') {
    return [
      { label: 'YPRR', getValue: p => p.yprr },
      { label: 'TGT SHARE', getValue: p => p.targetShare },
      { label: 'REC YDS', getValue: p => p.stats?.receivingYards },
    ];
  }
  return [];
};
