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
  const { position, stats } = player;
  const pData = player.receivingByPerspective?.[perspective];
  switch (position) {
    case 'QB':
      return [
        { label: 'EPA', value: stats?.epa?.toFixed(2) },
        { label: 'CPOE', value: stats?.cpoe ? `${stats.cpoe > 0 ? '+' : ''}${stats.cpoe}` : 'N/A' },
        { label: 'Pass YDs', value: stats?.passingYards?.toLocaleString() },
      ];
    case 'RB':
      return [
        { label: 'EPA', value: stats?.epa?.toFixed(2) },
        { label: 'Rush YDs', value: stats?.rushingYards?.toLocaleString() },
        { label: 'YPC', value: stats?.yardsPerCarry?.toFixed(1) },
      ];
    case 'WR':
      if (pData) {
        return [
          { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
          { label: 'REC GRADE', value: pData.recGrade?.toFixed(1) || 'N/A' },
          { label: 'TGT/RR', value: pData.tgtPerRR != null ? `${pData.tgtPerRR}%` : 'N/A' },
        ];
      }
      return [
        { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
        { label: 'DOM %', value: player.dominatorRating ? `${player.dominatorRating}%` : 'N/A' },
        { label: 'TGT SHARE', value: player.targetShare != null ? `${player.targetShare}%` : 'N/A' },
      ];
    case 'TE':
      if (pData) {
        return [
          { label: 'YPRR', value: pData.yprr?.toFixed(2) || 'N/A' },
          { label: 'REC GRADE', value: pData.recGrade?.toFixed(1) || 'N/A' },
          { label: 'TGT/RR', value: pData.tgtPerRR != null ? `${pData.tgtPerRR}%` : 'N/A' },
        ];
      }
      return [
        { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
        { label: 'DOM %', value: player.dominatorRating ? `${player.dominatorRating}%` : 'N/A' },
        { label: 'Rec YDs', value: stats?.receivingYards?.toLocaleString() || 'N/A' },
      ];
    default:
      return [{ label: 'EPA', value: stats?.epa?.toFixed(2) }];
  }
};

export const sortPlayers = (players, sortBy, leagueType = 'oneQB', perspective = 'overall') => {
  const sorted = [...players];
  const getRank = (p) => p.rank?.[leagueType] ?? 999;
  const getAdp = (p) => p.dynastyADP?.[leagueType] ?? 999;
  const getYprr = (p) => p.receivingByPerspective?.[perspective]?.yprr ?? p.yprr ?? 0;
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
    case 'dominator':
      return sorted.sort((a, b) => (b.dominatorRating || 0) - (a.dominatorRating || 0));
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
