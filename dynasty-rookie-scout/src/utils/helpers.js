// Position colors for card borders and badges
export const positionColors = {
  QB: { border: '#ef4444', bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  RB: { border: '#22d3ee', bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
  WR: { border: '#a78bfa', bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  TE: { border: '#34d399', bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
};

export const getBreakoutIndicator = (breakoutAge) => {
  if (!breakoutAge) return { label: 'N/A', color: '#6b7280', emoji: '' };
  if (breakoutAge <= 20) return { label: 'Elite', color: '#f59e0b', emoji: '⚡' };
  if (breakoutAge <= 21) return { label: 'Good', color: '#22c55e', emoji: '⚡' };
  return { label: 'Late', color: '#6b7280', emoji: '' };
};

export const getDraftCapitalInfo = (pick) => {
  if (pick <= 10) return { label: 'Elite', color: '#f59e0b', emoji: '🏆' };
  if (pick <= 32) return { label: 'Day 1', color: '#22c55e', emoji: '🏆' };
  if (pick <= 64) return { label: 'Day 2', color: '#60a5fa', emoji: '' };
  return { label: 'Day 3', color: '#6b7280', emoji: '' };
};

export const hasInjuryRisk = (player) => player.injuries && player.injuries.length > 0;

export const getTopStats = (player, perspective = 'overall') => {
  const { position } = player;
  const pData = player.receivingByPerspective?.[perspective];

  // WR / TE — show receiving perspective data from converted images
  if ((position === 'WR' || position === 'TE') && pData) {
    if (perspective === 'deepBall') {
      return [
        { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
        { label: 'REC GRADE', value: pData.recGrade?.toFixed(1) || 'N/A' },
        { label: 'CONT %', value: pData.contestedCatchRate != null ? `${pData.contestedCatchRate}%` : 'N/A' },
      ];
    }
    return [
      { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
      { label: 'REC GRADE', value: pData.recGrade?.toFixed(1) || 'N/A' },
      { label: 'TGT/RR', value: pData.tgtPerRR != null ? `${pData.tgtPerRR}%` : 'N/A' },
    ];
  }

  // WR / TE fallback — advancedStats only (no perspective data for this player)
  if (position === 'WR' || position === 'TE') {
    return [
      { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
      { label: 'TGT SHARE', value: player.targetShare != null ? `${player.targetShare}%` : 'N/A' },
      { label: 'BO AGE', value: player.breakoutAge || 'N/A' },
    ];
  }

  // QB — profile-based (no CFBD stats)
  if (position === 'QB') {
    return [
      { label: 'PICK', value: player.draftPick ? `#${player.draftPick}` : 'N/A' },
      { label: 'BO AGE', value: player.breakoutAge || 'N/A' },
      { label: 'SF RANK', value: player.rank?.superflex ? `#${player.rank.superflex}` : 'N/A' },
    ];
  }

  // RB — profile-based (no CFBD stats)
  if (position === 'RB') {
    return [
      { label: 'PICK', value: player.draftPick ? `#${player.draftPick}` : 'N/A' },
      { label: 'BO AGE', value: player.breakoutAge || 'N/A' },
      { label: '1QB RANK', value: player.rank?.oneQB ? `#${player.rank.oneQB}` : 'N/A' },
    ];
  }

  return [
    { label: 'PICK', value: player.draftPick ? `#${player.draftPick}` : 'N/A' },
    { label: 'BO AGE', value: player.breakoutAge || 'N/A' },
    { label: 'RANK', value: player.rank?.oneQB ? `#${player.rank.oneQB}` : 'N/A' },
  ];
};

export const sortPlayers = (players, sortBy, leagueType = 'oneQB', perspective = 'overall') => {
  const sorted = [...players];
  const getRank = (p) => p.rank?.[leagueType] ?? 999;
  const getAdp = (p) => p.dynastyADP?.[leagueType] ?? 999;
  const getYprr = (p) => p.receivingByPerspective?.[perspective]?.yprr ?? p.yprr ?? 0;
  const getRecGrade = (p) => p.receivingByPerspective?.[perspective]?.recGrade ?? 0;
  const getTgtPerRR = (p) => p.receivingByPerspective?.[perspective]?.tgtPerRR ?? 0;
  switch (sortBy) {
    case 'rank':
      return sorted.sort((a, b) => getRank(a) - getRank(b));
    case 'adp':
      return sorted.sort((a, b) => getAdp(a) - getAdp(b));
    case 'draftCapital':
      return sorted.sort((a, b) => (a.draftPick || 999) - (b.draftPick || 999));
    case 'breakoutAge':
      return sorted.sort((a, b) => (a.breakoutAge || 99) - (b.breakoutAge || 99));
    case 'yprr':
      return sorted.sort((a, b) => getYprr(b) - getYprr(a));
    case 'recGrade':
      return sorted.sort((a, b) => getRecGrade(b) - getRecGrade(a));
    case 'tgtPerRR':
      return sorted.sort((a, b) => getTgtPerRR(b) - getTgtPerRR(a));
    default:
      return sorted.sort((a, b) => getRank(a) - getRank(b));
  }
};

export const filterPlayers = (players, filters) => {
  return players.filter(player => {
    if (filters.position && filters.position !== 'ALL' && player.position !== filters.position) return false;
    if (filters.draftDay) {
      if (filters.draftDay === '1' && player.draftRound !== 1) return false;
      if (filters.draftDay === '2' && player.draftRound !== 2) return false;
      if (filters.draftDay === '3' && player.draftRound > 2) return false;
    }
    if (filters.hideInjured && player.injuries.length > 0) return false;
    if (filters.breakoutMax && player.breakoutAge && player.breakoutAge > filters.breakoutMax) return false;
    return true;
  });
};
