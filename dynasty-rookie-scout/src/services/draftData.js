// 2025 NFL Draft data service
// Hardcoded top picks — update post-draft or scrape from pro-football-reference.com

const draftPicks = [
  { pick: 1, round: 1, team: "TEN", name: "Cam Ward", position: "QB", college: "Miami (FL)" },
  { pick: 2, round: 1, team: "JAX", name: "Travis Hunter", position: "WR", college: "Colorado" },
  { pick: 3, round: 1, team: "NYJ", name: "Mason Graham", position: "DT", college: "Michigan" },
  { pick: 4, round: 1, team: "NE", name: "Tyler Warren", position: "TE", college: "Penn State" },
  { pick: 5, round: 1, team: "CLE", name: "Shedeur Sanders", position: "QB", college: "Colorado" },
  { pick: 6, round: 1, team: "LV", name: "Donovan Ezeiruaku", position: "EDGE", college: "Boston College" },
  { pick: 7, round: 1, team: "NYG", name: "Ashton Jeanty", position: "RB", college: "Boise State" },
  { pick: 8, round: 1, team: "CAR", name: "Tetairoa McMillan", position: "WR", college: "Arizona" },
  { pick: 10, round: 1, team: "NO", name: "Tyleik Williams", position: "DT", college: "Ohio State" },
  { pick: 12, round: 1, team: "DAL", name: "Deontae Lawson", position: "LB", college: "Alabama" },
  { pick: 14, round: 1, team: "IND", name: "Luther Burden III", position: "WR", college: "Missouri" },
  { pick: 16, round: 1, team: "MIN", name: "Jalen Milroe", position: "QB", college: "Alabama" },
  { pick: 18, round: 1, team: "CIN", name: "Emeka Egbuka", position: "WR", college: "Ohio State" },
  { pick: 22, round: 1, team: "PIT", name: "Isaiah Bond", position: "WR", college: "Texas" },
  { pick: 24, round: 1, team: "GB", name: "Omarion Hampton", position: "RB", college: "North Carolina" },
  { pick: 26, round: 1, team: "HOU", name: "Elic Ayomanor", position: "WR", college: "Stanford" },
  { pick: 28, round: 1, team: "DEN", name: "Tre Harris", position: "WR", college: "Ole Miss" },
  { pick: 30, round: 1, team: "BUF", name: "Colston Loveland", position: "TE", college: "Michigan" },
  { pick: 35, round: 2, team: "NYG", name: "Quinn Ewers", position: "QB", college: "Texas" },
  { pick: 38, round: 2, team: "LAC", name: "Kaleb Johnson", position: "RB", college: "Iowa" },
  { pick: 40, round: 2, team: "TB", name: "Matthew Golden", position: "WR", college: "Texas" },
  { pick: 42, round: 2, team: "MIA", name: "Jayden Higgins", position: "WR", college: "Iowa State" },
  { pick: 44, round: 2, team: "ATL", name: "RJ Harvey", position: "RB", college: "UCF" },
  { pick: 46, round: 2, team: "DET", name: "Terrance Ferguson", position: "TE", college: "Oregon" },
  { pick: 48, round: 2, team: "SF", name: "Jaylin Noel", position: "WR", college: "Iowa State" },
  { pick: 50, round: 2, team: "ARI", name: "Nick Singleton", position: "RB", college: "Penn State" },
  { pick: 52, round: 2, team: "KC", name: "Quinshon Judkins", position: "RB", college: "Ohio State" },
  { pick: 54, round: 2, team: "PHI", name: "Cam Skattebo", position: "RB", college: "Arizona State" },
  { pick: 56, round: 2, team: "PIT", name: "Deuce Knight", position: "QB", college: "Ole Miss" },
  { pick: 68, round: 3, team: "LV", name: "Conner Weigman", position: "QB", college: "Texas A&M" },
  { pick: 72, round: 3, team: "SEA", name: "Kezerian Mims Jr", position: "WR", college: "South Florida" },
  { pick: 78, round: 3, team: "LAR", name: "Mitchell Evans", position: "TE", college: "Notre Dame" },
  { pick: 82, round: 3, team: "SEA", name: "Jaxson Dart", position: "QB", college: "Ole Miss" },
  { pick: 85, round: 3, team: "CHI", name: "Darien Porter", position: "WR", college: "Iowa State" },
  { pick: 88, round: 3, team: "BAL", name: "Bhayshul Tuten", position: "RB", college: "Virginia Tech" }
];

export const getDraftPicks = () => draftPicks;

export const getDraftPickByName = (name) => draftPicks.find(p => p.name === name);

export const getDraftCapitalLabel = (pick) => {
  if (pick <= 10) return 'Elite';
  if (pick <= 32) return 'Day 1';
  if (pick <= 64) return 'Day 2';
  return 'Day 3';
};

export const getDraftRoundFromPick = (pick) => {
  if (pick <= 32) return 1;
  if (pick <= 64) return 2;
  if (pick <= 100) return 3;
  if (pick <= 135) return 4;
  if (pick <= 176) return 5;
  if (pick <= 220) return 6;
  return 7;
};

export default draftPicks;
