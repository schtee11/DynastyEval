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
