// 2026 NFL Draft data service
// Projected first-round order as of March 2026
// Update with actual picks after the draft (April 23–25, 2026 in Pittsburgh)

const draftPicks = [
  { pick: 1, round: 1, team: "LV", name: "Fernando Mendoza", position: "QB", college: "Indiana" },
  { pick: 2, round: 1, team: "NYJ", name: "Arvell Reese", position: "EDGE", college: "Ohio State" },
  { pick: 3, round: 1, team: "ARI", name: "Spencer Fano", position: "OT", college: "BYU" },
  { pick: 4, round: 1, team: "TEN", name: "Jeremiyah Love", position: "RB", college: "Notre Dame" },
  { pick: 5, round: 1, team: "NYG", name: "Jeremiah Smith", position: "WR", college: "Ohio State" },
  { pick: 6, round: 1, team: "CLE", name: "Monroe Freeling", position: "OT", college: "Georgia" },
  { pick: 7, round: 1, team: "WAS", name: "Sonny Styles", position: "LB", college: "Ohio State" },
  { pick: 8, round: 1, team: "NO", name: "Caleb Downs", position: "S", college: "Ohio State" },
  { pick: 9, round: 1, team: "KC", name: "Francis Mauigoa", position: "OT", college: "Miami (FL)" },
  { pick: 10, round: 1, team: "CIN", name: "Carnell Tate", position: "WR", college: "Ohio State" },
  { pick: 11, round: 1, team: "MIA", name: "Jordyn Tyson", position: "WR", college: "Arizona State" },
  { pick: 12, round: 1, team: "DAL", name: "Tetairoa McMillan", position: "WR", college: "Arizona" },
  { pick: 13, round: 1, team: "LAR", name: "Mansoor Delane", position: "CB", college: "LSU" },
  { pick: 14, round: 1, team: "BAL", name: "Kenyon Sadiq", position: "TE", college: "Oregon" },
  { pick: 15, round: 1, team: "TB", name: "Makai Lemon", position: "WR", college: "USC" },
  { pick: 16, round: 1, team: "NYJ", name: "David Bailey", position: "EDGE", college: "Texas Tech" },
  { pick: 17, round: 1, team: "DET", name: "J. Michael Sturdivant", position: "WR", college: "Florida" },
  { pick: 18, round: 1, team: "MIN", name: "Ty Simpson", position: "QB", college: "Alabama" },
  { pick: 19, round: 1, team: "CAR", name: "Kadyn Proctor", position: "OT", college: "Alabama" },
  { pick: 20, round: 1, team: "DAL", name: "Luther Burden III", position: "WR", college: "Missouri" },
  { pick: 21, round: 1, team: "PIT", name: "Denzel Boston", position: "WR", college: "Washington" },
  { pick: 22, round: 1, team: "LAC", name: "KC Concepcion", position: "WR", college: "Texas A&M" },
  { pick: 23, round: 1, team: "PHI", name: "Mykel Williams", position: "EDGE", college: "Georgia" },
  { pick: 24, round: 1, team: "CLE", name: "Garrett Nussmeier", position: "QB", college: "LSU" },
  { pick: 25, round: 1, team: "CHI", name: "Cole Payton", position: "QB", college: "North Dakota State" },
  { pick: 26, round: 1, team: "BUF", name: "Elic Ayomanor", position: "WR", college: "Stanford" },
  { pick: 27, round: 1, team: "SF", name: "Max Klare", position: "TE", college: "Ohio State" },
  { pick: 28, round: 1, team: "HOU", name: "Savion Williams", position: "WR", college: "TCU" },
  { pick: 29, round: 1, team: "KC", name: "Travis Hunter", position: "CB", college: "Colorado" },
  { pick: 30, round: 1, team: "MIA", name: "Omar Cooper Jr.", position: "WR", college: "Indiana" },
  { pick: 31, round: 1, team: "NE", name: "Carson Beck", position: "QB", college: "Miami (FL)" },
  { pick: 32, round: 1, team: "SEA", name: "Drew Allar", position: "QB", college: "Penn State" },
  { pick: 33, round: 2, team: "LV", name: "Nicholas Singleton", position: "RB", college: "Penn State" },
  { pick: 36, round: 2, team: "NYJ", name: "Taylen Green", position: "QB", college: "Arkansas" },
  { pick: 38, round: 2, team: "NYG", name: "Mike Washington Jr.", position: "RB", college: "Arkansas" },
  { pick: 40, round: 2, team: "CLE", name: "Jonah Coleman", position: "RB", college: "Washington" },
  { pick: 42, round: 2, team: "NO", name: "Isaiah Horton", position: "WR", college: "Miami (FL)" },
  { pick: 44, round: 2, team: "DET", name: "Eli Stowers", position: "TE", college: "Vanderbilt" },
  { pick: 48, round: 2, team: "PIT", name: "Emmett Johnson", position: "RB", college: "Nebraska" },
  { pick: 50, round: 2, team: "DAL", name: "Cade Klubnik", position: "QB", college: "Clemson" },
  { pick: 52, round: 2, team: "KC", name: "Kevin Coleman Jr.", position: "WR", college: "Florida State" },
  { pick: 56, round: 2, team: "SF", name: "Cam Skattebo", position: "RB", college: "Arizona State" },
  { pick: 60, round: 2, team: "IND", name: "Tre Harris", position: "WR", college: "Ole Miss" },
  { pick: 68, round: 3, team: "DEN", name: "Jadarian Price", position: "RB", college: "Notre Dame" },
  { pick: 72, round: 3, team: "GB", name: "Justin Joly", position: "TE", college: "NC State" },
  { pick: 78, round: 3, team: "BUF", name: "Devin Neal", position: "RB", college: "Kansas" },
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
