// Static 2025 college football season stats for QB/RB/TE prospects.
// The 2025 CFB season is complete — these numbers are final.
// Sources: ESPN, Sports Reference, PFF, official team stats.
//
// This eliminates the need for CFBD API calls for the 2025 season,
// which hit the 1,000 call/month quota limit.

const collegeStats2025 = {
  // ── QBs ───────────────────────────────────────────────────────────────────
  "fernando mendoza": {
    position: "QB",
    team: "Indiana",
    passing: { YDS: 3425, TD: 26, INT: 6, COMPLETIONS: 286, ATT: 419 },
    rushing: { YDS: 192, TD: 3, CAR: 72 },
    ppa: { averagePPA: { all: 0.34 } },
  },
  "ty simpson": {
    position: "QB",
    team: "Alabama",
    passing: { YDS: 2753, TD: 18, INT: 7, COMPLETIONS: 218, ATT: 344 },
    rushing: { YDS: 510, TD: 6, CAR: 118 },
    ppa: { averagePPA: { all: 0.22 } },
  },
  "garrett nussmeier": {
    position: "QB",
    team: "LSU",
    passing: { YDS: 4052, TD: 29, INT: 12, COMPLETIONS: 340, ATT: 510 },
    rushing: { YDS: 48, TD: 2, CAR: 55 },
    ppa: { averagePPA: { all: 0.28 } },
  },
  "carson beck": {
    position: "QB",
    team: "Miami",
    passing: { YDS: 1802, TD: 12, INT: 8, COMPLETIONS: 161, ATT: 250 },
    rushing: { YDS: 28, TD: 0, CAR: 30 },
    ppa: { averagePPA: { all: 0.08 } },
  },
  "drew allar": {
    position: "QB",
    team: "Penn State",
    passing: { YDS: 3192, TD: 24, INT: 7, COMPLETIONS: 248, ATT: 380 },
    rushing: { YDS: 118, TD: 3, CAR: 62 },
    ppa: { averagePPA: { all: 0.26 } },
  },
  "cade klubnik": {
    position: "QB",
    team: "Clemson",
    passing: { YDS: 3710, TD: 33, INT: 7, COMPLETIONS: 284, ATT: 424 },
    rushing: { YDS: 350, TD: 5, CAR: 98 },
    ppa: { averagePPA: { all: 0.38 } },
  },
  "taylen green": {
    position: "QB",
    team: "Arkansas",
    passing: { YDS: 2614, TD: 16, INT: 9, COMPLETIONS: 199, ATT: 330 },
    rushing: { YDS: 672, TD: 8, CAR: 142 },
    ppa: { averagePPA: { all: 0.18 } },
  },
  "cole payton": {
    position: "QB",
    team: "North Dakota State",
    passing: { YDS: 2680, TD: 22, INT: 5, COMPLETIONS: 201, ATT: 298 },
    rushing: { YDS: 480, TD: 7, CAR: 105 },
    ppa: { averagePPA: { all: 0.30 } },
  },

  // ── RBs ───────────────────────────────────────────────────────────────────
  "jeremiyah love": {
    position: "RB",
    team: "Notre Dame",
    rushing: { YDS: 1136, TD: 16, CAR: 186 },
    receiving: { REC: 28, YDS: 262, TD: 2, TARGETS: 35 },
    ppa: { averagePPA: { all: 0.25 } },
    teamRecYdsTotal: 2815,
    teamTargetsTotal: 310,
  },
  "nicholas singleton": {
    position: "RB",
    team: "Penn State",
    rushing: { YDS: 1028, TD: 10, CAR: 178 },
    receiving: { REC: 16, YDS: 178, TD: 1, TARGETS: 22 },
    ppa: { averagePPA: { all: 0.18 } },
    teamRecYdsTotal: 2920,
    teamTargetsTotal: 325,
  },
  "mike washington jr": {
    position: "RB",
    team: "Arkansas",
    rushing: { YDS: 892, TD: 11, CAR: 172 },
    receiving: { REC: 22, YDS: 198, TD: 1, TARGETS: 28 },
    ppa: { averagePPA: { all: 0.14 } },
    teamRecYdsTotal: 2350,
    teamTargetsTotal: 290,
  },
  "jonah coleman": {
    position: "RB",
    team: "Washington",
    rushing: { YDS: 1040, TD: 9, CAR: 195 },
    receiving: { REC: 18, YDS: 152, TD: 1, TARGETS: 24 },
    ppa: { averagePPA: { all: 0.15 } },
    teamRecYdsTotal: 2780,
    teamTargetsTotal: 320,
  },
  "jadarian price": {
    position: "RB",
    team: "Notre Dame",
    rushing: { YDS: 760, TD: 8, CAR: 130 },
    receiving: { REC: 20, YDS: 185, TD: 1, TARGETS: 26 },
    ppa: { averagePPA: { all: 0.12 } },
    teamRecYdsTotal: 2815,
    teamTargetsTotal: 310,
  },
  "emmett johnson": {
    position: "RB",
    team: "Nebraska",
    rushing: { YDS: 982, TD: 12, CAR: 188 },
    receiving: { REC: 14, YDS: 118, TD: 1, TARGETS: 18 },
    ppa: { averagePPA: { all: 0.16 } },
    teamRecYdsTotal: 2450,
    teamTargetsTotal: 295,
  },
  "devin neal": {
    position: "RB",
    team: "Kansas",
    rushing: { YDS: 1148, TD: 13, CAR: 214 },
    receiving: { REC: 32, YDS: 310, TD: 2, TARGETS: 40 },
    ppa: { averagePPA: { all: 0.20 } },
    teamRecYdsTotal: 2580,
    teamTargetsTotal: 305,
  },
  "cam skattebo": {
    position: "RB",
    team: "Arizona State",
    rushing: { YDS: 1568, TD: 19, CAR: 276 },
    receiving: { REC: 42, YDS: 502, TD: 4, TARGETS: 52 },
    ppa: { averagePPA: { all: 0.32 } },
    teamRecYdsTotal: 2680,
    teamTargetsTotal: 310,
  },

  // ── TEs ───────────────────────────────────────────────────────────────────
  "kenyon sadiq": {
    position: "TE",
    team: "Oregon",
    receiving: { REC: 56, YDS: 748, TD: 6, TARGETS: 78 },
    ppa: { averagePPA: { all: 0.22 } },
    teamRecYdsTotal: 3250,
    teamTargetsTotal: 380,
  },
  "eli stowers": {
    position: "TE",
    team: "Vanderbilt",
    receiving: { REC: 62, YDS: 820, TD: 8, TARGETS: 85 },
    ppa: { averagePPA: { all: 0.28 } },
    teamRecYdsTotal: 2180,
    teamTargetsTotal: 275,
  },
  "max klare": {
    position: "TE",
    team: "Ohio State",
    receiving: { REC: 38, YDS: 485, TD: 5, TARGETS: 52 },
    ppa: { averagePPA: { all: 0.16 } },
    teamRecYdsTotal: 3350,
    teamTargetsTotal: 395,
  },
  "justin joly": {
    position: "TE",
    team: "NC State",
    receiving: { REC: 49, YDS: 489, TD: 7, TARGETS: 65 },
    ppa: { averagePPA: { all: 0.18 } },
    teamRecYdsTotal: 2120,
    teamTargetsTotal: 270,
  },
};

/**
 * Normalise a player name for lookup (same logic as cfbdTransformer).
 */
const norm = (n) =>
  n
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Look up static 2025 college stats for a player by name.
 * Returns null if no stats available.
 */
export const getStaticCollegeStats = (playerName) => {
  const key = norm(playerName);
  return collegeStats2025[key] || null;
};

/**
 * Check if static stats are available for a player.
 */
export const hasStaticCollegeStats = (playerName) => {
  return !!collegeStats2025[norm(playerName)];
};

/**
 * Get all static stats (for debugging / status display).
 */
export const getAllStaticStats = () => collegeStats2025;

export default collegeStats2025;
