#!/usr/bin/env node
/**
 * Audit script: finds all players that will show N/A for any stat displayed
 * in the PlayerDetailModal UI.
 *
 * Usage:
 *   node scripts/auditPlayerStats.js            # full report
 *   node scripts/auditPlayerStats.js --summary  # totals only (for CI)
 *   node scripts/auditPlayerStats.js --ci       # exit 1 if critical N/As found
 *
 * Checks the exact same stats rendered via StatRow in PlayerDetailModal.js.
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

const getReceivingData = (name) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[1] : null;
};

// ── Parse CLI flags ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const ciMode = args.includes('--ci');

// ── Audit ───────────────────────────────────────────────────────────────────
const positions = ['QB', 'RB', 'WR', 'TE'];
const filteredProspects = prospects.filter(p => positions.includes(p.position));

console.log(`\n=== PLAYER STATS AUDIT ===`);
console.log(`Total prospects: ${filteredProspects.length}`);
console.log(`Positions: ${positions.join(', ')}\n`);

const naFields = []; // { name, position, college, field, severity, reason }

// Severity levels:
//   'critical' = core stat row showing N/A (basic receiving/rushing/passing stats)
//   'important' = advanced metric showing N/A (YPRR, target share, YAC, etc.)
//   'info' = nice-to-have data missing (perspective data, alignment rates)

for (const p of filteredProspects) {
  const sd = collegeStats2025[norm(p.name)];
  const hasPerspective = !!getReceivingData(p.name);
  const noStatic = !sd;
  const reason = (field) => noStatic
    ? 'no static college stats entry (not in CSV)'
    : `${field} is null/missing in static entry`;

  const na = (field, severity, staticKey) => {
    naFields.push({
      name: p.name, position: p.position, college: p.college,
      field, severity,
      reason: reason(staticKey || field),
    });
  };

  // ── QB stats ──
  if (p.position === 'QB') {
    if (noStatic) {
      na('Completion %', 'critical', 'passing');
      na('Passing Yards', 'critical', 'passing');
      na('Passing TDs', 'critical', 'passing');
    }
  }

  // ── RB stats ──
  if (p.position === 'RB') {
    if (noStatic) {
      na('Rushing Yards', 'critical', 'rushing');
      na('Rushing TDs', 'critical', 'rushing');
      na('YPC', 'critical', 'rushing');
    }
    if (sd?.yardsAfterContact == null) na('Yards After Contact', 'important', 'yardsAfterContact');
    if (sd?.ycoPerAttempt == null) na('YAC/Attempt', 'important', 'ycoPerAttempt');
    if (sd?.avoidedTackles == null) na('Missed Tackles Forced', 'important', 'avoidedTackles');
    if (sd?.explosiveRuns == null) na('10+ Yard Runs', 'important', 'explosiveRuns');

    // RB target share (shown in radar chart)
    const advTS = p.advancedStats?.targetShare;
    const recTargets = sd?.receiving?.TARGETS;
    const canCompute = recTargets > 0 && sd?.teamTargetsTotal > 0;
    if (advTS == null && !canCompute) {
      na('Target Share (RB)', 'info', 'teamTargetsTotal');
    }
  }

  // ── TE stats ──
  if (p.position === 'TE') {
    if (sd?.pffYprr == null && p.advancedStats?.yprr == null) na('YPRR', 'important', 'pffYprr');
    if (sd?.recGrade == null) na('Rec Grade', 'important', 'recGrade');

    const advTS = p.advancedStats?.targetShare;
    const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
    if (advTS == null && !canCompute) na('Target Share', 'important', 'teamTargetsTotal');

    if (sd?.yardsAfterCatch == null) na('YAC', 'info', 'yardsAfterCatch');
    if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info', 'yardsAfterCatchPerRec');
    if (sd?.slotRate == null) na('Slot Rate', 'info', 'slotRate');
    if (sd?.wideRate == null) na('Wide Rate', 'info', 'wideRate');
    if (sd?.inlineRate == null) na('Inline Rate', 'info', 'inlineRate');
    if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info', 'contestedCatchRate');
    if (sd?.contestedReceptions == null) na('Contested Receptions', 'info', 'contestedReceptions');
  }

  // ── WR stats ──
  if (p.position === 'WR') {
    if (hasPerspective) {
      // WR with perspective data: overall view shows target share + static metrics
      const advTS = p.advancedStats?.targetShare;
      const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
      if (advTS == null && !canCompute) na('Target Share', 'important', 'teamTargetsTotal');

      if (sd?.yardsAfterCatch == null) na('YAC', 'info', 'yardsAfterCatch');
      if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info', 'yardsAfterCatchPerRec');
      if (sd?.slotRate == null) na('Slot Rate', 'info', 'slotRate');
      if (sd?.wideRate == null) na('Wide Rate', 'info', 'wideRate');
      if (sd?.inlineRate == null) na('Inline Rate', 'info', 'inlineRate');
      if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info', 'contestedCatchRate');
      if (sd?.contestedReceptions == null) na('Contested Receptions', 'info', 'contestedReceptions');
    } else {
      // WR fallback view
      if (sd?.pffYprr == null && p.advancedStats?.yprr == null) na('YPRR', 'important', 'pffYprr');
      if (sd?.recGrade == null) na('Rec Grade', 'important', 'recGrade');

      const advTS = p.advancedStats?.targetShare;
      const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
      if (advTS == null && !canCompute) na('Target Share', 'important', 'teamTargetsTotal');

      if (noStatic) {
        na('Receptions', 'critical', 'receiving');
        na('Receiving Yards', 'critical', 'receiving');
        na('Receiving TDs', 'critical', 'receiving');
      }

      if (sd?.yardsAfterCatch == null) na('YAC', 'info', 'yardsAfterCatch');
      if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info', 'yardsAfterCatchPerRec');
      if (sd?.slotRate == null) na('Slot Rate', 'info', 'slotRate');
      if (sd?.wideRate == null) na('Wide Rate', 'info', 'wideRate');
      if (sd?.inlineRate == null) na('Inline Rate', 'info', 'inlineRate');
      if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info', 'contestedCatchRate');
      if (sd?.contestedReceptions == null) na('Contested Receptions', 'info', 'contestedReceptions');

      na('Receiving Perspectives', 'info', 'receivingByPerspective');
    }
  }
}

// ── Summary by severity ─────────────────────────────────────────────────────
const critical = naFields.filter(f => f.severity === 'critical');
const important = naFields.filter(f => f.severity === 'important');
const info = naFields.filter(f => f.severity === 'info');

console.log(`--- N/A SUMMARY BY SEVERITY ---\n`);
console.log(`  CRITICAL (core stats missing):    ${critical.length}`);
console.log(`  IMPORTANT (advanced metrics):     ${important.length}`);
console.log(`  INFO (nice-to-have):              ${info.length}`);
console.log(`  TOTAL:                            ${naFields.length}`);
console.log('');

// ── Summary by field ────────────────────────────────────────────────────────
if (!summaryOnly) {
  const byField = {};
  for (const item of naFields) {
    if (!byField[item.field]) byField[item.field] = [];
    byField[item.field].push(item);
  }

  const sortedFields = Object.entries(byField).sort((a, b) => b[1].length - a[1].length);
  for (const [field, items] of sortedFields) {
    const sev = items[0].severity;
    const icon = sev === 'critical' ? '!!' : sev === 'important' ? ' !' : '  ';
    console.log(`${icon} ${field}: ${items.length} players`);
    for (const item of items) {
      console.log(`     - ${item.name} (${item.position}, ${item.college})`);
    }
    console.log('');
  }

  // ── Players with most N/A fields ──────────────────────────────────────────
  const byPlayer = {};
  for (const item of naFields) {
    const key = item.name;
    if (!byPlayer[key]) byPlayer[key] = { ...item, fields: [], criticalCount: 0 };
    byPlayer[key].fields.push(`${item.field} [${item.severity}]`);
    if (item.severity === 'critical') byPlayer[key].criticalCount++;
  }

  const worstPlayers = Object.values(byPlayer).sort((a, b) => b.fields.length - a.fields.length);
  console.log(`--- TOP PLAYERS WITH MOST N/A FIELDS ---\n`);
  for (const p of worstPlayers.slice(0, 15)) {
    console.log(`  ${p.name} (${p.position}, ${p.college}): ${p.fields.length} N/A fields (${p.criticalCount} critical)`);
    console.log(`    ${p.fields.join(', ')}`);
  }
}

// ── Totals ──────────────────────────────────────────────────────────────────
const uniquePlayers = new Set(naFields.map(f => f.name)).size;
console.log(`\n--- TOTALS ---`);
console.log(`Total N/A field instances: ${naFields.length}`);
console.log(`Unique players affected:   ${uniquePlayers}`);
console.log(`Total players audited:     ${filteredProspects.length}`);
console.log(`Players fully populated:   ${filteredProspects.length - uniquePlayers}`);

// ── CI mode: fail if critical N/As exist ────────────────────────────────────
if (ciMode && critical.length > 0) {
  console.error(`\n✗ AUDIT FAILED: ${critical.length} critical N/A fields found`);
  process.exit(1);
} else if (ciMode) {
  console.log(`\n✓ AUDIT PASSED: no critical N/A fields`);
}

console.log(`\nDone.`);
