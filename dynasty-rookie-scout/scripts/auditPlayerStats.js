#!/usr/bin/env node
/**
 * Audit script: finds all players that will show N/A for any stat displayed in the UI.
 * Checks against data available in collegeStats2025.js, receivingData.js, and rookieProspects2026.js.
 *
 * Usage: node scripts/auditPlayerStats.js
 *
 * Checks:
 *   - EPA: available via PPA in collegeStats2025 → stats.epa (QB/RB/TE/WR overall)
 *   - Target Share: advancedStats or computed from team targets (WR/TE/RB)
 *   - YPRR: advancedStats or pffYprr from CSV (WR/TE)
 *   - Receiving metrics: YAC, alignment, contested (WR/TE)
 *   - Rushing metrics: yardsAfterContact, avoidedTackles, ycoPerAttempt, explosiveRuns (RB)
 *   - receivingByPerspective: whether WR has perspective data from receivingData.js
 */

const path = require('path');
const fs = require('fs');

// ── Helpers ─────────────────────────────────────────────────────────────────
const norm = (n) =>
  n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

function extractJSObject(source, pattern) {
  const match = source.match(pattern);
  if (!match) return null;
  const start = match.index + match[0].length - 1;
  let depth = 0, end = start;
  const open = source[start], close = open === '{' ? '}' : ']';
  for (let i = start; i < source.length; i++) {
    if (source[i] === open) depth++;
    if (source[i] === close) depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  try { return eval('(' + source.slice(start, end) + ')'); }
  catch (e) { console.error(`Parse error for ${pattern}:`, e.message); return null; }
}

// ── Load data ───────────────────────────────────────────────────────────────
const statsFile = fs.readFileSync(path.join(__dirname, '../src/services/collegeStats2025.js'), 'utf8');
const collegeStats2025 = extractJSObject(statsFile, /const collegeStats2025\s*=\s*\{/);

const prospectsFile = fs.readFileSync(path.join(__dirname, '../src/services/rookieProspects2026.js'), 'utf8');
const prospects = extractJSObject(prospectsFile, /const prospects2026Raw\s*=\s*\[/);

const recFile = fs.readFileSync(path.join(__dirname, '../src/services/receivingData.js'), 'utf8');
const receivingPerspectiveData = extractJSObject(recFile, /export const receivingPerspectiveData\s*=\s*\{/) || {};

if (!collegeStats2025 || !prospects) {
  console.error('Failed to load data files');
  process.exit(1);
}

// Case-insensitive lookup for receiving perspective data
const getReceivingData = (name) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[1] : null;
};

// ── Audit ───────────────────────────────────────────────────────────────────
const positions = ['QB', 'RB', 'WR', 'TE'];
const filteredProspects = prospects.filter(p => positions.includes(p.position));

console.log(`\n=== PLAYER STATS AUDIT ===`);
console.log(`Total prospects: ${filteredProspects.length}`);
console.log(`Positions: ${positions.join(', ')}\n`);

const naFields = []; // { name, position, college, field, reason }

for (const p of filteredProspects) {
  const sd = collegeStats2025[norm(p.name)];
  const hasPerspective = !!getReceivingData(p.name);

  // ── EPA ──
  // Displayed for all positions (WR overall perspective now includes it)
  const epaAvailable = sd?.ppa?.averagePPA?.all != null;
  if (!epaAvailable) {
    naFields.push({
      name: p.name, position: p.position, college: p.college,
      field: 'EPA',
      reason: sd ? 'no PPA data in static entry' : 'no static college stats entry',
    });
  }

  // ── Target Share ──
  // Displayed for WR (overall perspective + fallback), TE, RB
  if (['WR', 'TE', 'RB'].includes(p.position)) {
    const advTS = p.advancedStats?.targetShare;
    const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
    if (advTS == null && !canCompute) {
      naFields.push({
        name: p.name, position: p.position, college: p.college,
        field: 'Target Share',
        reason: 'no advancedStats.targetShare and cannot compute from static data',
      });
    }
  }

  // ── YPRR ──
  if (['WR', 'TE'].includes(p.position)) {
    const advYprr = p.advancedStats?.yprr;
    const staticYprr = sd?.pffYprr;
    if (advYprr == null && staticYprr == null) {
      naFields.push({
        name: p.name, position: p.position, college: p.college,
        field: 'YPRR',
        reason: 'no advancedStats.yprr and no pffYprr in static data',
      });
    }
  }

  // ── WR receiving metrics (shown in overall perspective + fallback) ──
  if (p.position === 'WR') {
    const wrFields = [
      ['YAC', 'yardsAfterCatch'],
      ['YAC/Rec', 'yardsAfterCatchPerRec'],
      ['Slot Rate', 'slotRate'],
      ['Wide Rate', 'wideRate'],
      ['Contested Catch Rate', 'contestedCatchRate'],
      ['Contested Receptions', 'contestedReceptions'],
      ['Rec Grade', 'recGrade'],
    ];
    for (const [label, key] of wrFields) {
      if (sd?.[key] == null) {
        naFields.push({
          name: p.name, position: p.position, college: p.college,
          field: label,
          reason: sd ? `${key} is null in static entry` : 'no static college stats entry',
        });
      }
    }
  }

  // ── TE receiving metrics ──
  if (p.position === 'TE') {
    const teFields = [
      ['YAC', 'yardsAfterCatch'],
      ['YAC/Rec', 'yardsAfterCatchPerRec'],
      ['Slot Rate', 'slotRate'],
      ['Wide Rate', 'wideRate'],
      ['Inline Rate', 'inlineRate'],
      ['Contested Catch Rate', 'contestedCatchRate'],
      ['Contested Receptions', 'contestedReceptions'],
      ['Rec Grade', 'recGrade'],
    ];
    for (const [label, key] of teFields) {
      if (sd?.[key] == null) {
        naFields.push({
          name: p.name, position: p.position, college: p.college,
          field: label,
          reason: sd ? `${key} is null in static entry` : 'no static college stats entry',
        });
      }
    }
  }

  // ── RB rushing metrics ──
  if (p.position === 'RB') {
    const rbFields = [
      ['Yards After Contact', 'yardsAfterContact'],
      ['Missed Tackles Forced', 'avoidedTackles'],
      ['YAC/Attempt', 'ycoPerAttempt'],
      ['10+ Yard Runs', 'explosiveRuns'],
    ];
    for (const [label, key] of rbFields) {
      if (sd?.[key] == null) {
        naFields.push({
          name: p.name, position: p.position, college: p.college,
          field: label,
          reason: sd ? `${key} is null in static entry` : 'no static college stats entry',
        });
      }
    }
  }

  // ── WR without perspective data ──
  if (p.position === 'WR' && !hasPerspective) {
    naFields.push({
      name: p.name, position: p.position, college: p.college,
      field: 'Receiving Perspectives',
      reason: 'no entry in receivingData.js (uses fallback WR view)',
    });
  }
}

// ── Summary by field ────────────────────────────────────────────────────────
const byField = {};
for (const item of naFields) {
  if (!byField[item.field]) byField[item.field] = [];
  byField[item.field].push(item);
}

console.log(`--- N/A FIELDS SUMMARY ---\n`);
const sortedFields = Object.entries(byField).sort((a, b) => b[1].length - a[1].length);
for (const [field, items] of sortedFields) {
  console.log(`${field}: ${items.length} players showing N/A`);
  for (const item of items) {
    console.log(`  - ${item.name} (${item.position}, ${item.college}): ${item.reason}`);
  }
  console.log('');
}

// ── Players with most N/A fields ────────────────────────────────────────────
const byPlayer = {};
for (const item of naFields) {
  const key = item.name;
  if (!byPlayer[key]) byPlayer[key] = { ...item, fields: [] };
  byPlayer[key].fields.push(item.field);
}

const worstPlayers = Object.values(byPlayer).sort((a, b) => b.fields.length - a.fields.length);
console.log(`--- TOP PLAYERS WITH MOST N/A FIELDS ---\n`);
for (const p of worstPlayers.slice(0, 15)) {
  console.log(`  ${p.name} (${p.position}, ${p.college}): ${p.fields.length} N/A fields`);
  console.log(`    Fields: ${p.fields.join(', ')}`);
}

console.log(`\n--- TOTALS ---`);
console.log(`Total N/A field instances: ${naFields.length}`);
console.log(`Unique players affected: ${Object.keys(byPlayer).length}`);
console.log(`Total players audited: ${filteredProspects.length}`);
console.log(`\nDone.`);
