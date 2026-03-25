// Manual overrides for fields not available in PFF CSVs.
// Edit this file to update team names and team totals.
//
// These are merged on top of CSV-generated data (overrides always win).
// Players with _fullEntry: true are used as-is (not found in any CSV).
//
// NOTE: teamTargetsTotal is now auto-computed from the receiving CSV in
// generateStats.js. Only add overrides here if the CSV value is wrong
// or the player's team is missing from the CSV.

module.exports = {
  // QB team overrides (for players whose CSV team_name doesn't match)
  "fernando mendoza": { team: "Indiana" },
  "ty simpson": { team: "Alabama" },
  "garrett nussmeier": { team: "LSU" },
  "carson beck": { team: "Miami" },
  "drew allar": { team: "Penn State" },
  "cade klubnik": { team: "Clemson" },
  "taylen green": { team: "Arkansas" },

  // RB team overrides
  "jeremiyah love": { team: "Notre Dame" },
  "nicholas singleton": { team: "Penn State" },
  "mike washington jr": { team: "Arkansas" },
  "jonah coleman": { team: "Washington" },
  "jadarian price": { team: "Notre Dame" },
  "emmett johnson": { team: "Nebraska" },
  "caleb hawkins": { team: "North Texas" },
  "ahmad hardy": { team: "Missouri" },
  "jai'den thomas": { team: "Unlv" },
  "kentrel bullock": { team: "South Alabama" },
  "nate frazier": { team: "Georgia" },
  "kaytron allen": { team: "Penn State" },
  "nate sheppard": { team: "Duke" },
  "jordon davison": { team: "Oregon" },
  "antwan raymond": { team: "Rutgers" },
  "j'koby williams": { team: "Texas Tech" },
  "jordan marshall": { team: "Michigan" },
  "jadan baugh": { team: "Florida" },
  "braylon mcreynolds": { team: "Louisiana-Monroe" },
  "bo jackson": { team: "Ohio State" },
  "kewan lacy": { team: "Ole Miss" },
  "keyjuan brown": { team: "Louisville" },
  "mark fletcher jr.": { team: "Miami" },
  "desean bishop": { team: "Tennessee" },
  "cam edwards": { team: "Uconn" },
  "greg burrell": { team: "Texas State" },
  "lj martin": { team: "Byu" },
  "sire gaines": { team: "Boise State" },
  "oj arnold": { team: "Georgia Southern" },
  "marcellous hawkins": { team: "Virginia Tech" },
  "adam mohammed": { team: "Washington" },
  "trequan jones": { team: "Dominion" },
  "cam cook": { team: "Jacksonville State" },
  "lucky sutton": { team: "San Diego State" },
  "will henderson iii": { team: "Utsa" },
  "tawee walker": { team: "Cincinnati" },
  "le'veon moss": { team: "Texas A&M" },
  "adam randall": { team: "Clemson" },
  "dean connors": { team: "Houston" },
  "cj donaldson": { team: "West Virginia" },
  "hollywood smothers": { team: "NC State" },
  "kejon owens": { team: "Florida International" },
  "rahsul faison": { team: "South Carolina" },
  "desmond reid": { team: "Pittsburgh" },
  "anthony hankerson": { team: "Oregon State" },
  "davon booth": { team: "Mississippi State" },
  "demond claiborne": { team: "Wake Forest" },
  "j'mari taylor": { team: "Virginia" },
  "lincoln pare": { team: "Texas State" },
  "jam miller": { team: "Alabama" },

  // TE team overrides
  "kenyon sadiq": { team: "Oregon" },
  "eli stowers": { team: "Vanderbilt" },
  "max klare": { team: "Ohio State" },
  "justin joly": { team: "NC State" },
  "sam roush": { team: "Stanford" },
  "oscar delp": { team: "Georgia" },
  "michael trigg": { team: "Baylor" },
  "jack endries": { team: "Texas" },
  "joe royer": { team: "Cincinnati" },
  "eli raridon": { team: "Notre Dame" },
  "nate boerkircher": { team: "Texas A&M" },
  "tanner koziol": { team: "Houston" },
  "will kacmarek": { team: "Ohio State" },
  "dae'quan wright": { team: "Mississippi" },
  "dallen bentley": { team: "Utah" },
  "marlin klein": { team: "Michigan" },
  "john michael gyllenborg": { team: "Wyoming" },
  "riley nowakowski": { team: "Indiana" },
  "josh cuevas": { team: "Alabama" },
  "dj rogers": { team: "TCU" },
  "matthew hibner": { team: "SMU" },
  "lake mcree": { team: "USC" },
  "bauer sharp": { team: "LSU" },
  "dan villari": { team: "Syracuse" },
  "miles kitselman": { team: "Tennessee" },
  "r.j. maryland": { team: "SMU" },
  "lance mason": { team: "Wisconsin" },
  "khalil dinkins": { team: "Penn State" },
  "seydou traore": { team: "Mississippi State" },
  "jaren kanak": { team: "Oklahoma" },
  "tanner arkin": { team: "Illinois" },
  "jameson geers": { team: "Minnesota" },
  "davin stoffel": { team: "Illinois" },
  "amari niblack": { team: "Texas A&M" },
  "holden staes": { team: "Indiana" },

  // ── Full-entry overrides for small-school / non-PFF players ──────────────
  // Stats sourced from ESPN, Sports-Reference, and school athletics sites.
  // Advanced PFF metrics (YPRR, recGrade, yardsAfterContact, etc.) unavailable.

  // WRs
  "bryce lance": {
    _fullEntry: true, position: "WR",
    receiving: { REC: 75, YDS: 1071, TD: 17 },
    gamesPlayed: 16,
  },
  "tyren montgomery": {
    _fullEntry: true, position: "WR",
    receiving: { REC: 119, YDS: 1528, TD: 15 },
    gamesPlayed: 12,
  },
  "michael wortham": {
    _fullEntry: true, position: "WR",
    receiving: { REC: 85, YDS: 1224, TD: 10 },
    gamesPlayed: 13,
  },
  "jalen walthall": {
    _fullEntry: true, position: "WR",
    receiving: { REC: 75, YDS: 1290, TD: 14 },
    gamesPlayed: 13,
  },
  "braylon james": {
    _fullEntry: true, position: "WR",
    receiving: { REC: 3, YDS: 11, TD: 0 },
    gamesPlayed: 9,
  },
  "raymond cottrell": {
    _fullEntry: true, position: "WR",
    // No publicly available college stats (West Alabama DII)
  },
  "antonio gates jr": {
    _fullEntry: true, position: "WR",
    // Limited stats: 4 rec, 49 yds at Michigan State (2024); DSU stats unavailable
    receiving: { REC: 4, YDS: 49, TD: 0 },
    gamesPlayed: 2,
  },

  // RBs
  "curtis allen": {
    _fullEntry: true, position: "RB",
    rushing: { YDS: 2409, TD: 30, CAR: 297 },
    receiving: { REC: 5, YDS: 63, TD: 0 },
    gamesPlayed: 12,
  },
  "trevonte citizen": {
    _fullEntry: true, position: "RB",
    rushing: { YDS: 503, TD: 4, CAR: 85 },
    gamesPlayed: 11,
  },
};
