// 2026 NFL Draft data service
// Source: NFL Mock Draft Database — Consensus Big Board (2026-03-24)
// https://www.nflmockdraftdatabase.com/big-boards/2026/consensus-big-board-2026
// Board rank ≈ projected overall pick. Round derived from pick ranges.
// Update with actual picks after the draft (April 23–25, 2026 in Pittsburgh)
//
// Only fantasy-relevant positions (QB, RB, WR, TE) are included below.
// Non-skill positions are omitted since this app only tracks dynasty prospects.

const draftPicks = [
  { pick: 1, round: 1, name: "Fernando Mendoza", position: "QB", college: "Indiana" },
  { pick: 4, round: 1, name: "Jeremiyah Love", position: "RB", college: "Notre Dame" },
  { pick: 8, round: 1, name: "Carnell Tate", position: "WR", college: "Ohio State" },
  { pick: 13, round: 1, name: "Makai Lemon", position: "WR", college: "USC" },
  { pick: 14, round: 1, name: "Jordyn Tyson", position: "WR", college: "Arizona State" },
  { pick: 16, round: 1, name: "Kenyon Sadiq", position: "TE", college: "Oregon" },
  { pick: 26, round: 1, name: "Omar Cooper Jr.", position: "WR", college: "Indiana" },
  { pick: 29, round: 1, name: "Denzel Boston", position: "WR", college: "Washington" },
  { pick: 30, round: 1, name: "Kevin Concepcion", position: "WR", college: "Texas A&M" },
  { pick: 35, round: 2, name: "Ty Simpson", position: "QB", college: "Alabama" },
  { pick: 46, round: 2, name: "Jadarian Price", position: "RB", college: "Notre Dame" },
  { pick: 50, round: 2, name: "Chris Brazzell", position: "WR", college: "Tennessee" },
  { pick: 51, round: 2, name: "Chris Bell", position: "WR", college: "Louisville" },
  { pick: 54, round: 2, name: "Eli Stowers", position: "TE", college: "Vanderbilt" },
  { pick: 56, round: 2, name: "Germie Bernard", position: "WR", college: "Alabama" },
  { pick: 61, round: 2, name: "Zachariah Branch", position: "WR", college: "Georgia" },
  { pick: 64, round: 2, name: "Malachi Fields", position: "WR", college: "Notre Dame" },
  { pick: 65, round: 3, name: "Mike Washington Jr.", position: "RB", college: "Arkansas" },
  { pick: 69, round: 3, name: "Antonio Williams", position: "WR", college: "Clemson" },
  { pick: 75, round: 3, name: "Max Klare", position: "TE", college: "Ohio State" },
  { pick: 77, round: 3, name: "Elijah Sarratt", position: "WR", college: "Indiana" },
  { pick: 79, round: 3, name: "Garrett Nussmeier", position: "QB", college: "LSU" },
  { pick: 84, round: 3, name: "Skyler Bell", position: "WR", college: "UConn" },
  { pick: 88, round: 3, name: "Ted Hurst", position: "WR", college: "Georgia State" },
  { pick: 92, round: 3, name: "Jonah Coleman", position: "RB", college: "Washington" },
  { pick: 99, round: 3, name: "Sam Roush", position: "TE", college: "Stanford" },
  { pick: 105, round: 4, name: "Oscar Delp", position: "TE", college: "Georgia" },
  { pick: 108, round: 4, name: "Michael Trigg", position: "TE", college: "Baylor" },
  { pick: 109, round: 4, name: "Ja'Kobi Lane", position: "WR", college: "USC" },
  { pick: 111, round: 4, name: "Emmett Johnson", position: "RB", college: "Nebraska" },
  { pick: 116, round: 4, name: "Drew Allar", position: "QB", college: "Penn State" },
  { pick: 117, round: 4, name: "Justin Joly", position: "TE", college: "NC State" },
  { pick: 118, round: 4, name: "Carson Beck", position: "QB", college: "Miami (FL)" },
  { pick: 121, round: 4, name: "Brenen Thompson", position: "WR", college: "Mississippi State" },
  { pick: 123, round: 4, name: "Nick Singleton", position: "RB", college: "Penn State" },
  { pick: 136, round: 5, name: "Taylen Green", position: "QB", college: "Arkansas" },
  { pick: 139, round: 5, name: "Cole Payton", position: "QB", college: "North Dakota State" },
  { pick: 150, round: 5, name: "Kaytron Allen", position: "RB", college: "Penn State" },
  { pick: 152, round: 5, name: "De'Zhaun Stribling", position: "WR", college: "Mississippi" },
  { pick: 165, round: 5, name: "Demond Claiborne", position: "RB", college: "Wake Forest" },
  { pick: 167, round: 5, name: "Kevin Coleman Jr.", position: "WR", college: "Missouri" },
  { pick: 168, round: 5, name: "Eric McAlister", position: "WR", college: "TCU" },
  { pick: 170, round: 5, name: "Jeff Caldwell", position: "WR", college: "Cincinnati" },
  { pick: 179, round: 6, name: "C.J. Daniels", position: "WR", college: "Miami (FL)" },
  { pick: 183, round: 6, name: "Cade Klubnik", position: "QB", college: "Clemson" },
  { pick: 197, round: 6, name: "Cyrus Allen", position: "WR", college: "Cincinnati" },
  { pick: 203, round: 6, name: "Aaron Anderson", position: "WR", college: "LSU" },
  { pick: 216, round: 6, name: "J'Mari Taylor", position: "RB", college: "Virginia" },
  { pick: 218, round: 6, name: "Adam Randall", position: "RB", college: "Clemson" },
  { pick: 219, round: 6, name: "Eric Rivers", position: "WR", college: "Georgia Tech" },
  { pick: 225, round: 7, name: "Desmond Reid", position: "RB", college: "Pittsburgh" },
  { pick: 233, round: 7, name: "Le'Veon Moss", position: "RB", college: "Texas A&M" },
  { pick: 237, round: 7, name: "Chase Roberts", position: "WR", college: "BYU" },
  { pick: 247, round: 7, name: "Barion Brown", position: "WR", college: "LSU" },
  { pick: 272, round: 7, name: "Lewis Bond", position: "WR", college: "Boston College" },
  { pick: 281, round: 7, name: "Devin Voisin", position: "WR", college: "South Alabama" },
  { pick: 302, round: 7, name: "Dean Connors", position: "RB", college: "Houston" },
  { pick: 321, round: 7, name: "Kentrel Bullock", position: "RB", college: "South Alabama" },
  { pick: 340, round: 7, name: "J.Michael Sturdivant", position: "WR", college: "Florida" },
  { pick: 342, round: 7, name: "Kejon Owens", position: "RB", college: "Florida International" },
  { pick: 352, round: 7, name: "Jordan Hudson", position: "WR", college: "SMU" },
  { pick: 357, round: 7, name: "Emmanuel Henderson", position: "WR", college: "Kansas" },
  { pick: 366, round: 7, name: "Caullin Lacy", position: "WR", college: "Louisville" },
  { pick: 375, round: 7, name: "Chip Trayanum", position: "RB", college: "Toledo" },
  { pick: 377, round: 7, name: "C.J. Donaldson", position: "RB", college: "Ohio State" },
  { pick: 387, round: 7, name: "Rahsul Faison", position: "RB", college: "South Carolina" },
  { pick: 476, round: 7, name: "Kobe Prentice", position: "WR", college: "Baylor" },
  { pick: 516, round: 7, name: "Squirrel White", position: "WR", college: "Florida State" },
  { pick: 577, round: 7, name: "Christian Leary", position: "WR", college: "Western Michigan" },
  { pick: 600, round: 7, name: "Rara Thomas", position: "WR", college: "Troy" },
  { pick: 609, round: 7, name: "Jared Brown", position: "WR", college: "South Carolina" },
];

// Name aliases: consensus board name → prospect database name
// Handles cases where the big board uses a different name format
const nameAliases = {
  'kevin concepcion': 'kc concepcion',
  'nick singleton': 'nicholas singleton',
  'chris brazzell': 'chris brazzell ii',
  'jmichael sturdivant': 'j michael sturdivant',
  'cj daniels': 'cj daniels',
  'cj donaldson': 'cj donaldson',
};

export const getNameAliases = () => nameAliases;

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
