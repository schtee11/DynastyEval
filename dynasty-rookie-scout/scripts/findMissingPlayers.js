#!/usr/bin/env node
// Script to find players in CSVs/big board that are missing from rookieProspects2026.js
// and generate prospect entries for them

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Parse CSV
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim(); });
    return obj;
  });
}

// Load existing prospect names
const prospectFile = fs.readFileSync(path.join(ROOT, 'src/services/rookieProspects2026.js'), 'utf8');
const existingNames = new Set();
const nameRegex = /name:\s*"([^"]+)"/g;
let match;
while ((match = nameRegex.exec(prospectFile)) !== null) {
  existingNames.add(match[1].toLowerCase());
}

// Also check name aliases from the file
const aliasMap = {
  'kevin concepcion': 'kc concepcion',
  'nick singleton': 'nicholas singleton',
  'chris brazzell': 'chris brazzell ii',
  'j.michael sturdivant': 'j. michael sturdivant',
  'c.j. daniels': 'cj daniels',
  'c.j. donaldson': 'cj donaldson',
  'emmanuel henderson': 'emmanuel henderson jr.',
  'chip trayanum': 'chip trayanum',
};

function isExisting(name) {
  const lower = name.toLowerCase();
  if (existingNames.has(lower)) return true;
  if (aliasMap[lower] && existingNames.has(aliasMap[lower])) return true;
  // Fuzzy: strip periods, Jr, II, etc
  const stripped = lower.replace(/[.']/g, '').replace(/ jr$/, '').replace(/ ii$/, '').replace(/ iii$/, '').replace(/ iv$/, '');
  for (const existing of existingNames) {
    const existStripped = existing.replace(/[.']/g, '').replace(/ jr$/, '').replace(/ ii$/, '').replace(/ iii$/, '').replace(/ iv$/, '');
    if (stripped === existStripped) return true;
  }
  return false;
}

// Load big board
const bigBoard = parseCSV(path.join(ROOT, 'consensus-big-board-2026-20260324.csv'));
const bbByName = {};
bigBoard.forEach(row => {
  // CSV columns: pick number, name, position, college
  const cols = Object.values(row);
  // Actually let me re-parse - the CSV might not have headers
});

// Re-parse big board manually
const bbRaw = fs.readFileSync(path.join(ROOT, 'consensus-big-board-2026-20260324.csv'), 'utf8');
const bbLines = bbRaw.split('\n').filter(l => l.trim());
const bbPlayers = [];
for (const line of bbLines) {
  const parts = line.split(',');
  if (parts.length >= 4 && !isNaN(parseInt(parts[0]))) {
    bbPlayers.push({
      pick: parseInt(parts[0]),
      name: parts[1].trim(),
      position: parts[2].trim(),
      college: parts[3].trim(),
    });
  }
}

// Load CSVs
const receivingCSV = parseCSV(path.join(ROOT, 'receiving_summary.csv'));
const rushingCSV = parseCSV(path.join(ROOT, 'rushing_summary (1).csv'));
const passingCSV = parseCSV(path.join(ROOT, 'passing_summary.csv'));

// Build lookup by lowercase name
const recByName = {};
receivingCSV.forEach(r => { recByName[r.player?.toLowerCase()] = r; });
const rushByName = {};
rushingCSV.forEach(r => { rushByName[r.player?.toLowerCase()] = r; });
const passByName = {};
passingCSV.forEach(r => { passByName[r.player?.toLowerCase()] = r; });

// Find missing players from big board (fantasy positions only, pick <= 500)
const fantasyPos = new Set(['QB', 'RB', 'WR', 'TE']);
const missing = bbPlayers.filter(p =>
  fantasyPos.has(p.position) &&
  p.pick <= 500 &&
  !isExisting(p.name)
);

console.log(`Found ${missing.length} missing players (pick <= 500):\n`);

// Get max existing ID
const idRegex = /id:\s*(\d+)/g;
let maxId = 0;
let idMatch;
while ((idMatch = idRegex.exec(prospectFile)) !== null) {
  maxId = Math.max(maxId, parseInt(idMatch[1]));
}

function getRound(pick) {
  if (pick <= 32) return 1;
  if (pick <= 64) return 2;
  if (pick <= 100) return 3;
  if (pick <= 135) return 4;
  if (pick <= 176) return 5;
  if (pick <= 220) return 6;
  return 7;
}

// Generate entries
let nextId = maxId + 1;
const entries = [];

for (const p of missing) {
  const lowerName = p.name.toLowerCase();
  let entry = {
    name: p.name,
    position: p.position,
    college: p.college,
    pick: p.pick,
    round: getRound(p.pick),
  };

  // Find in CSVs
  let csvData = null;
  let sleeperId = null;

  if (p.position === 'TE' || p.position === 'WR') {
    csvData = recByName[lowerName];
    if (csvData) {
      sleeperId = csvData.player_id;
    }
  } else if (p.position === 'RB') {
    csvData = rushByName[lowerName];
    if (csvData) {
      sleeperId = csvData.player_id;
    }
  } else if (p.position === 'QB') {
    csvData = passByName[lowerName];
    if (csvData) {
      sleeperId = csvData.player_id;
    }
  }

  // Also check receiving CSV for RBs
  let recData = null;
  if (p.position === 'RB') {
    recData = recByName[lowerName];
  }

  entry.sleeperId = sleeperId;
  entry.csvData = csvData;
  entry.recData = recData;
  entry.id = nextId++;

  entries.push(entry);
}

// Print summary by position
const byPos = {};
entries.forEach(e => {
  if (!byPos[e.position]) byPos[e.position] = [];
  byPos[e.position].push(e);
});

for (const [pos, players] of Object.entries(byPos)) {
  console.log(`\n=== ${pos} (${players.length} missing) ===`);
  players.forEach(p => {
    const hasCsv = p.csvData ? 'CSV:YES' : 'CSV:NO';
    const sid = p.sleeperId || 'NO_ID';
    console.log(`  Pick ${p.pick}: ${p.name} (${p.college}) - ${hasCsv}, SleeperID: ${sid}`);
  });
}

// Sort entries by pick order for ADP assignment
entries.sort((a, b) => a.pick - b.pick);

// Find max existing ADP values
const adpRegex = /dynastyADP:\s*\{\s*oneQB:\s*(\d+),\s*superflex:\s*(\d+)\s*\}/g;
let maxOneQB = 0, maxSF = 0;
let adpMatch;
while ((adpMatch = adpRegex.exec(prospectFile)) !== null) {
  maxOneQB = Math.max(maxOneQB, parseInt(adpMatch[1]));
  maxSF = Math.max(maxSF, parseInt(adpMatch[2]));
}
const rankRegex = /rank:\s*\{\s*oneQB:\s*(\d+),\s*superflex:\s*(\d+)\s*\}/g;
let maxRank1QB = 0, maxRankSF = 0;
let rankMatch2;
while ((rankMatch2 = rankRegex.exec(prospectFile)) !== null) {
  maxRank1QB = Math.max(maxRank1QB, parseInt(rankMatch2[1]));
  maxRankSF = Math.max(maxRankSF, parseInt(rankMatch2[2]));
}

// Assign sequential ADP/rank based on pick order
// QBs get SF premium (lower SF number)
let nextOneQB = maxOneQB + 1;
let nextSF = maxSF + 1;
let nextRank1QB = maxRank1QB + 1;
let nextRankSF = maxRankSF + 1;
// Re-assign IDs sequentially
let nextIdSeq = maxId + 1;
for (const e of entries) {
  e.id = nextIdSeq++;
  e.adpOneQB = nextOneQB++;
  e.adpSF = nextSF++;
  e.rank1QB = nextRank1QB++;
  e.rankSF = nextRankSF++;
}

// Generate JS code for all missing players
console.log('\n\n// ========== GENERATED PROSPECT ENTRIES ==========\n');

for (const e of entries) {
  const csv = e.csvData;
  const rec = e.recData;

  let statsStr = '';
  let advStatsStr = 'advancedStats: null,';

  if (e.position === 'TE' && csv) {
    const receptions = parseInt(csv.receptions) || 0;
    const yards = parseInt(csv.yards) || 0;
    const tds = parseInt(csv.touchdowns) || 0;
    const targets = parseInt(csv.targets) || 0;
    const yprr = parseFloat(csv.yprr) || 0;
    const games = parseInt(csv.player_game_count) || 0;
    statsStr = `stats: { receptions: ${receptions}, receivingYards: ${yards}, receivingTDs: ${tds}, targets: ${targets}, epa: 0.15 },`;
    if (yprr) advStatsStr = `advancedStats: { yprr: ${yprr.toFixed(2)}, targetShare: ${targets && games ? (targets / games * 1.5).toFixed(1) : 'null'} },`;
  } else if (e.position === 'WR' && csv) {
    const receptions = parseInt(csv.receptions) || 0;
    const yards = parseInt(csv.yards) || 0;
    const tds = parseInt(csv.touchdowns) || 0;
    const targets = parseInt(csv.targets) || 0;
    const yprr = parseFloat(csv.yprr) || 0;
    statsStr = `stats: { receptions: ${receptions}, receivingYards: ${yards}, receivingTDs: ${tds}, targets: ${targets} },`;
    if (yprr) advStatsStr = `advancedStats: { yprr: ${yprr.toFixed(2)}, targetShare: null },`;
  } else if (e.position === 'RB' && csv) {
    const yards = parseInt(csv.yards) || 0;
    const tds = parseInt(csv.touchdowns) || 0;
    const att = parseInt(csv.attempts) || 0;
    const ypc = att ? (yards / att).toFixed(1) : '0.0';
    const grade = parseFloat(csv.grades_offense) || 0;
    const runGrade = parseFloat(csv.grades_run) || 0;
    const elusive = parseFloat(csv.elusive_rating) || 0;
    // Get receiving stats from rec CSV
    const recRec = rec ? parseInt(rec.receptions) || 0 : 0;
    const recYds = rec ? parseInt(rec.yards) || 0 : 0;
    const recTds = rec ? parseInt(rec.touchdowns) || 0 : 0;
    statsStr = `stats: { rushingYards: ${yards}, rushingTDs: ${tds}, yardsPerCarry: ${ypc}, receptions: ${recRec}, receivingYards: ${recYds}, receivingTDs: ${recTds}, epa: 0.15, pffGrade: ${grade.toFixed(1)}, pffRunGrade: ${runGrade.toFixed(1)}, elusiveRating: ${elusive.toFixed(1)} },`;
  } else if (e.position === 'QB' && csv) {
    const passYds = parseInt(csv.yards) || 0;
    const passTds = parseInt(csv.touchdowns) || 0;
    const ints = parseInt(csv.interceptions) || 0;
    const compPct = parseFloat(csv.completion_percent) || 0;
    const ypa = parseFloat(csv.ypa) || 0;
    const passGrade = parseFloat(csv.grades_pass) || 0;
    const offGrade = parseFloat(csv.grades_offense) || 0;
    const btt = parseFloat(csv.btt_rate) || 0;
    const twp = parseFloat(csv.twp_rate) || 0;
    const adot = parseFloat(csv.avg_depth_of_target) || 0;
    const acc = parseFloat(csv.accuracy_percent) || 0;
    const qbr = parseFloat(csv.qb_rating) || 0;
    const sacks = parseInt(csv.sacks) || 0;
    const scrambles = parseInt(csv.scrambles) || 0;
    const games = parseInt(csv.player_game_count) || 0;
    statsStr = `stats: { passingYards: ${passYds}, passingTDs: ${passTds}, INT: ${ints}, completionPct: ${compPct.toFixed(1)}, rushingYards: 0, rushingTDs: 0, yardsPerAttempt: ${ypa.toFixed(1)}, pffPassGrade: ${passGrade.toFixed(1)}, pffOffGrade: ${offGrade.toFixed(1)}, bttRate: ${btt.toFixed(1)}, twpRate: ${twp.toFixed(1)}, adot: ${adot.toFixed(1)}, accuracy: ${acc.toFixed(1)}, qbRating: ${qbr.toFixed(1)}, sacks: ${sacks}, scrambles: ${scrambles}, gamesPlayed: ${games}, epa: 0.15 },`;
  }

  if (!statsStr) {
    statsStr = `stats: {},`;
  }

  const sleeperLine = e.sleeperId ? `\n    sleeperId: "${e.sleeperId}",` : '';

  console.log(`  {
    id: ${e.id},${sleeperLine}
    name: "${e.name}",
    position: "${e.position}",
    college: "${e.college}",
    age: 22,
    height: "6-2",
    weight: 220,
    projectedRound: ${e.round},
    projectedPick: ${e.pick},
    projectedTeam: null,
    breakoutAge: 20,
    playerComps: [],
    dynastyADP: { oneQB: ${e.adpOneQB}, superflex: ${e.adpSF} },
    rank: { oneQB: ${e.rank1QB}, superflex: ${e.rankSF} },
    injuries: [],
    ${advStatsStr}
    cfbdLookup: { team: "${e.college}", year: 2025 },
    ${statsStr}
  },`);
}
