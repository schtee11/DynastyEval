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

export const getTopStats = (player) => {
  const { position, stats } = player;
  switch (position) {
    case 'QB':
      return [
        { label: 'EPA', value: stats.epa?.toFixed(2) },
        { label: 'CPOE', value: stats.cpoe ? `${stats.cpoe > 0 ? '+' : ''}${stats.cpoe}` : 'N/A' },
        { label: 'Pass YDs', value: stats.passingYards?.toLocaleString() },
      ];
    case 'RB':
      return [
        { label: 'EPA', value: stats.epa?.toFixed(2) },
        { label: 'Rush YDs', value: stats.rushingYards?.toLocaleString() },
        { label: 'YPC', value: stats.yardsPerCarry?.toFixed(1) },
      ];
    case 'WR':
      return [
        { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
        { label: 'DOM %', value: player.dominatorRating ? `${player.dominatorRating}%` : 'N/A' },
        { label: 'TGT SHARE', value: player.targetShare != null ? `${player.targetShare}%` : 'N/A' },
      ];
    case 'TE':
      return [
        { label: 'YPRR', value: player.yprr?.toFixed(2) || 'N/A' },
        { label: 'DOM %', value: player.dominatorRating ? `${player.dominatorRating}%` : 'N/A' },
        { label: 'Rec YDs', value: stats.receivingYards?.toLocaleString() || 'N/A' },
      ];
    default:
      return [{ label: 'EPA', value: stats.epa?.toFixed(2) }];
  }
};

export const sortPlayers = (players, sortBy, leagueType = 'oneQB') => {
  const sorted = [...players];
  switch (sortBy) {
    case 'rank':
      return sorted.sort((a, b) => a.rank[leagueType] - b.rank[leagueType]);
    case 'adp':
      return sorted.sort((a, b) => a.dynastyADP[leagueType] - b.dynastyADP[leagueType]);
    case 'draftCapital':
      return sorted.sort((a, b) => a.draftPick - b.draftPick);
    case 'breakoutAge':
      return sorted.sort((a, b) => (a.breakoutAge || 99) - (b.breakoutAge || 99));
    case 'yprr':
      return sorted.sort((a, b) => (b.yprr || 0) - (a.yprr || 0));
    case 'dominator':
      return sorted.sort((a, b) => b.dominatorRating - a.dominatorRating);
    default:
      return sorted.sort((a, b) => a.rank[leagueType] - b.rank[leagueType]);
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
