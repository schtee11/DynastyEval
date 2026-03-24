// Manual overrides for fields not available in PFF CSVs.
// Edit this file to update PPA/EPA values, team names, and team totals.
//
// These are merged on top of CSV-generated data (overrides always win).
// Players with _fullEntry: true are used as-is (not found in any CSV).

module.exports = {
  "fernando mendoza": {
    team: "Indiana",
    ppa: { averagePPA: { all: 0.3 } }
  },
  "ty simpson": {
    team: "Alabama",
    ppa: { averagePPA: { all: 0.27 } }
  },
  "garrett nussmeier": {
    team: "LSU",
    ppa: { averagePPA: { all: 0.25 } }
  },
  "carson beck": {
    team: "Miami",
    ppa: { averagePPA: { all: 0.25 } }
  },
  "drew allar": {
    team: "Penn State",
    ppa: { averagePPA: { all: 0.22 } }
  },
  "cade klubnik": {
    team: "Clemson",
    ppa: { averagePPA: { all: 0.26 } }
  },
  "taylen green": {
    team: "Arkansas",
    ppa: { averagePPA: { all: 0.22 } }
  },
  "jeremiyah love": {
    team: "Notre Dame",
    ppa: { averagePPA: { all: 0.25 } },
    teamRecYdsTotal: 2815,
    teamTargetsTotal: 340
  },
  "nicholas singleton": {
    team: "Penn State",
    ppa: { averagePPA: { all: 0.18 } }
  },
  "mike washington jr": {
    team: "Arkansas",
    ppa: { averagePPA: { all: 0.14 } }
  },
  "jonah coleman": {
    team: "Washington",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "jadarian price": {
    team: "Notre Dame",
    ppa: { averagePPA: { all: 0.12 } }
  },
  "emmett johnson": {
    team: "Nebraska",
    ppa: { averagePPA: { all: 0.16 } }
  },
  "caleb hawkins": {
    team: "North Texas",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "ahmad hardy": {
    team: "Missouri",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "jai'den thomas": {
    team: "Unlv",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "kentrel bullock": {
    team: "South Alabama",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "nate frazier": {
    team: "Georgia",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "kaytron allen": {
    team: "Penn State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "nate sheppard": {
    team: "Duke",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "jordon davison": {
    team: "Oregon",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "antwan raymond": {
    team: "Rutgers",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "j'koby williams": {
    team: "Texas Tech",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "jordan marshall": {
    team: "Michigan",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "jadan baugh": {
    team: "Florida",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "braylon mcreynolds": {
    team: "Louisiana-Monroe",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "bo jackson": {
    team: "Ohio State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "kewan lacy": {
    team: "Ole Miss",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "keyjuan brown": {
    team: "Louisville",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "mark fletcher jr.": {
    team: "Miami",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "desean bishop": {
    team: "Tennessee",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "cam edwards": {
    team: "Uconn",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "greg burrell": {
    team: "Texas State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "lj martin": {
    team: "Byu",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "sire gaines": {
    team: "Boise State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "oj arnold": {
    team: "Georgia Southern",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "marcellous hawkins": {
    team: "Virginia Tech",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "adam mohammed": {
    team: "Washington",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "trequan jones": {
    team: "Dominion",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "cam cook": {
    team: "Jacksonville State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "lucky sutton": {
    team: "San Diego State",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "will henderson iii": {
    team: "Utsa",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "tawee walker": {
    team: "Cincinnati",
    ppa: { averagePPA: { all: 0.15 } }
  },
  "le'veon moss": {
    team: "Texas A&M",
    ppa: { averagePPA: { all: 0.10 } }
  },
  "adam randall": {
    team: "Clemson",
    ppa: { averagePPA: { all: 0.12 } }
  },
  "dean connors": {
    team: "Houston",
    ppa: { averagePPA: { all: 0.10 } }
  },
  "sone ntoh": {
    position: "RB",
    team: "Monmouth",
    rushing: { YDS: 487, TD: 25, CAR: 109 },
    receiving: { REC: 5, YDS: 30, TD: 0, TARGETS: 7 },
    ppa: { averagePPA: { all: 0.10 } },
    pffGrade: 72.0,
    pffRunGrade: 74.0,
    elusiveRating: 65.0,
    yardsAfterContact: 300,
    avoidedTackles: 20,
    longest: 40,
    gamesPlayed: 11,
    _fullEntry: true,
  },
  "cj donaldson": {
    team: "West Virginia",
    ppa: { averagePPA: { all: 0.14 } }
  },
  "hollywood smothers": {
    team: "NC State",
    ppa: { averagePPA: { all: 0.12 } }
  },
  "dylan devezin": {
    position: "RB",
    team: "Notre Dame",
    rushing: { YDS: 0, TD: 0, CAR: 0 },
    receiving: { REC: 0, YDS: 0, TD: 0, TARGETS: 0 },
    ppa: { averagePPA: { all: null } },
    pffGrade: null,
    pffRunGrade: null,
    elusiveRating: null,
    yardsAfterContact: 0,
    avoidedTackles: 0,
    longest: 0,
    gamesPlayed: 0,
    _fullEntry: true,
  },
  "kejon owens": {
    team: "Florida International",
    ppa: { averagePPA: { all: 0.14 } }
  },
  "rahsul faison": {
    team: "South Carolina",
    ppa: { averagePPA: { all: 0.10 } }
  },
  "desmond reid": {
    team: "Pittsburgh",
    ppa: { averagePPA: { all: 0.14 } }
  },
  "anthony hankerson": {
    team: "Oregon State",
    ppa: { averagePPA: { all: 0.11 } }
  },
  "davon booth": {
    team: "Mississippi State",
    ppa: { averagePPA: { all: 0.09 } }
  },
  "demond claiborne": {
    team: "Wake Forest",
    ppa: { averagePPA: { all: 0.14 } }
  },
  "j'mari taylor": {
    team: "Virginia",
    ppa: { averagePPA: { all: 0.13 } }
  },
  "lincoln pare": {
    team: "Texas State",
    ppa: { averagePPA: { all: 0.13 } }
  },
  "jam miller": {
    team: "Alabama",
    ppa: { averagePPA: { all: 0.10 } }
  },
  "kenyon sadiq": {
    team: "Oregon",
    ppa: { averagePPA: { all: 0.22 } },
    teamRecYdsTotal: 3250,
    teamTargetsTotal: 380
  },
  "eli stowers": {
    team: "Vanderbilt",
    ppa: { averagePPA: { all: 0.28 } },
    teamRecYdsTotal: 2180,
    teamTargetsTotal: 275
  },
  "max klare": {
    team: "Ohio State",
    ppa: { averagePPA: { all: 0.16 } },
    teamRecYdsTotal: 3350,
    teamTargetsTotal: 395
  },
  "justin joly": {
    team: "NC State",
    ppa: { averagePPA: { all: 0.18 } },
    teamRecYdsTotal: 2120,
    teamTargetsTotal: 270
  },
};
