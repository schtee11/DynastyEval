#!/usr/bin/env node
/**
 * generateStats.js
 *
 * Reads PFF CSV files and generates src/services/collegeStats2025.js
 * for all QB/RB/TE prospects listed in rookieProspects2026.js.
 *
 * Usage:  node scripts/generateStats.js
 *
 * To add a new metric:
 *   1. Add the CSV column mapping to scripts/csvColumnMap.js
 *   2. Re-run this script
 *   3. The new field will appear in collegeStats2025.js
 */

const fs = require('fs');
const path = require('path');

const columnMap = require('./csvColumnMap');
const overrides = require('./manualOverrides');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'src', 'services', 'collegeStats2025.js');

// ── CSV parser (no external deps) ──────────────────────────────────────────

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
    return row;
  });
}

/** Parse a single CSV line, handling quoted fields. */
function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ── Name normalisation ─────────────────────────────────────────────────────

function norm(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Load prospect list from rookieProspects2026.js ─────────────────────────

function loadProspects() {
  const src = fs.readFileSync(
    path.join(ROOT, 'src', 'services', 'rookieProspects2026.js'),
    'utf-8'
  );
  const prospects = [];
  // Match name/position/college triples
  const re = /name:\s*"(.*?)"[\s\S]*?position:\s*"(.*?)"[\s\S]*?college:\s*"(.*?)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, name, position, college] = m;
    if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
      prospects.push({ name, position, college, key: norm(name) });
    }
  }
  return prospects;
}

// ── Build a lookup index from CSV rows ─────────────────────────────────────

function indexCSV(rows, positionFilter) {
  const index = {};
  for (const row of rows) {
    const pos = (row.position || '').toUpperCase();
    if (positionFilter && !positionFilter.includes(pos)) continue;
    const key = norm(row.player || '');
    if (key) index[key] = row;
  }
  return index;
}

// ── Apply column mapping to extract fields from a CSV row ──────────────────

function extractFields(row, fieldMap) {
  const result = {};
  for (const [jsKey, csvCol] of Object.entries(fieldMap)) {
    const rawVal = row[csvCol];
    if (rawVal === undefined || rawVal === '') continue;
    const num = parseFloat(rawVal);
    if (isNaN(num)) continue;

    // Handle dot-notation nesting: 'passing.YDS' → { passing: { YDS: num } }
    const parts = jsKey.split('.');
    if (parts.length === 2) {
      if (!result[parts[0]]) result[parts[0]] = {};
      result[parts[0]][parts[1]] = num;
    } else {
      result[jsKey] = num;
    }
  }
  return result;
}

// ── Deep merge (override wins) ─────────────────────────────────────────────

function deepMerge(base, override) {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof result[k] === 'object') {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ── Format a JS value for output ───────────────────────────────────────────

function formatValue(val, indent = 4) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const pad = ' '.repeat(indent);
    const entries = Object.entries(val)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${formatValue(v, indent + 2)}`);
    // Keep small objects on one line
    const oneLine = `{ ${entries.join(', ')} }`;
    if (oneLine.length < 80) return oneLine;
    return `{\n${entries.map(e => `${pad}  ${e}`).join(',\n')}\n${pad}}`;
  }
  return String(val);
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const prospects = loadProspects();
  console.log(`Found ${prospects.length} QB/RB/WR/TE prospects\n`);

  // Load and index all CSVs
  const csvCache = {};
  function getCSV(filename) {
    if (!csvCache[filename]) {
      const fp = path.join(ROOT, filename);
      if (!fs.existsSync(fp)) {
        console.warn(`  ⚠ CSV not found: ${filename}`);
        csvCache[filename] = [];
      } else {
        csvCache[filename] = parseCSV(fp);
      }
    }
    return csvCache[filename];
  }

  // ── Compute team target totals from receiving CSV ─────────────────────────
  // Sum all targets per team so we can calculate target share for WR/TE/RB.
  const recRows = getCSV('receiving_summary.csv');
  const teamTargetTotals = {};
  for (const row of recRows) {
    const team = (row.team_name || '').trim();
    const targets = parseFloat(row.targets);
    if (team && !isNaN(targets)) {
      teamTargetTotals[team] = (teamTargetTotals[team] || 0) + targets;
    }
  }
  console.log(`Computed team target totals for ${Object.keys(teamTargetTotals).length} teams\n`);

  const stats = { matched: 0, override: 0, missed: 0 };
  const byPosition = { QB: [], RB: [], WR: [], TE: [] };

  for (const prospect of prospects) {
    const posConfig = columnMap[prospect.position];
    const normKey = norm(prospect.name);
    const overrideData = overrides[prospect.key] || overrides[normKey] || {};

    // Full override entry (not in any CSV)
    if (overrideData._fullEntry) {
      const { _fullEntry, ...entry } = overrideData;
      byPosition[prospect.position].push({ key: prospect.key, entry });
      stats.override++;
      console.log(`  ✓ ${prospect.name} (${prospect.position}) — full override`);
      continue;
    }

    if (!posConfig) {
      console.warn(`  ✗ No column map for position: ${prospect.position}`);
      stats.missed++;
      continue;
    }

    // Primary CSV lookup
    const primaryRows = getCSV(posConfig.csvFile);
    const primaryIndex = indexCSV(primaryRows, posConfig.positionFilter);
    const primaryRow = primaryIndex[normKey];

    let entry = {};

    if (primaryRow) {
      entry = extractFields(primaryRow, posConfig.fields);
      stats.matched++;

      // Auto-populate teamTargetsTotal from CSV team totals
      const team = (primaryRow.team_name || '').trim();
      if (team && teamTargetTotals[team] && ['WR', 'TE', 'RB'].includes(prospect.position)) {
        entry.teamTargetsTotal = teamTargetTotals[team];
      }

      // Secondary CSV for RB receiving
      if (posConfig.receivingCsvFile && posConfig.receivingFields) {
        const rbRecRows = getCSV(posConfig.receivingCsvFile);
        const rbRecIndex = indexCSV(rbRecRows, posConfig.receivingPositionFilter);
        const recRow = rbRecIndex[normKey];
        if (recRow) {
          const recFields = extractFields(recRow, posConfig.receivingFields);
          entry = deepMerge(entry, recFields);
          // For RBs, get team from receiving CSV if not already set
          if (!entry.teamTargetsTotal) {
            const recTeam = (recRow.team_name || '').trim();
            if (recTeam && teamTargetTotals[recTeam]) {
              entry.teamTargetsTotal = teamTargetTotals[recTeam];
            }
          }
        }
      }

      console.log(`  ✓ ${prospect.name} (${prospect.position}) — CSV match`);
    } else {
      stats.missed++;
      console.warn(`  ✗ ${prospect.name} (${prospect.position}) — NOT FOUND in ${posConfig.csvFile}`);
    }

    // Always set position
    entry.position = prospect.position;

    // Merge overrides (team, ppa, team totals)
    const { _fullEntry: _, ...cleanOverride } = overrideData;
    entry = deepMerge(entry, cleanOverride);

    byPosition[prospect.position].push({ key: prospect.key, entry });
  }

  // ── Generate output file ───────────────────────────────────────────────

  const lines = [];
  lines.push('// Static 2025 college football season stats for QB/RB/WR/TE prospects.');
  lines.push('// The 2025 CFB season is complete — these numbers are final.');
  lines.push('// Sources: PFF CSVs (passing_summary, receiving_summary, rushing_summary).');
  lines.push('//');
  lines.push('// AUTO-GENERATED by scripts/generateStats.js — do not edit by hand.');
  lines.push('// To update: edit scripts/csvColumnMap.js or scripts/manualOverrides.js,');
  lines.push('// then run: node scripts/generateStats.js');
  lines.push('');
  lines.push('const collegeStats2025 = {');

  const sectionLabels = { QB: 'QBs', RB: 'RBs', WR: 'WRs', TE: 'TEs' };

  for (const pos of ['QB', 'RB', 'WR', 'TE']) {
    const entries = byPosition[pos];
    if (entries.length === 0) continue;

    lines.push(`  // ── ${sectionLabels[pos]} ${'─'.repeat(67 - sectionLabels[pos].length)}`);

    for (const { key, entry } of entries) {
      lines.push(`  "${key}": {`);

      // Determine field order per position
      const fieldOrder = getFieldOrder(pos);
      const written = new Set();

      for (const field of fieldOrder) {
        if (entry[field] !== undefined) {
          lines.push(`    ${field}: ${formatValue(entry[field])},`);
          written.add(field);
        }
      }

      // Write any remaining fields not in the order
      for (const [k, v] of Object.entries(entry)) {
        if (!written.has(k) && v !== undefined) {
          lines.push(`    ${k}: ${formatValue(v)},`);
        }
      }

      lines.push('  },');
    }
  }

  lines.push('};');
  lines.push('');
  lines.push('/**');
  lines.push(' * Normalise a player name for lookup (same logic as cfbdTransformer).');
  lines.push(' */');
  lines.push('const norm = (n) =>');
  lines.push('  n');
  lines.push("    .toLowerCase()");
  lines.push("    .replace(/[^a-z ]/g, '')");
  lines.push("    .replace(/\\s+/g, ' ')");
  lines.push("    .trim();");
  lines.push('');
  lines.push('/**');
  lines.push(' * Look up static 2025 college stats for a player by name.');
  lines.push(' * Returns null if no stats available.');
  lines.push(' */');
  lines.push('export const getStaticCollegeStats = (playerName) => {');
  lines.push('  const key = norm(playerName);');
  lines.push('  return collegeStats2025[key] || null;');
  lines.push('};');
  lines.push('');
  lines.push('/**');
  lines.push(' * Check if static stats are available for a player.');
  lines.push(' */');
  lines.push('export const hasStaticCollegeStats = (playerName) => {');
  lines.push('  return !!collegeStats2025[norm(playerName)];');
  lines.push('};');
  lines.push('');
  lines.push('/**');
  lines.push(' * Get all static stats (for debugging / status display).');
  lines.push(' */');
  lines.push('export const getAllStaticStats = () => collegeStats2025;');
  lines.push('');
  lines.push('export default collegeStats2025;');
  lines.push('');

  fs.writeFileSync(OUT_FILE, lines.join('\n'));

  console.log(`\n─── Summary ───`);
  console.log(`  CSV matches:   ${stats.matched}`);
  console.log(`  Full overrides: ${stats.override}`);
  console.log(`  Missed:        ${stats.missed}`);
  console.log(`  Total:         ${prospects.length}`);
  console.log(`\nWrote ${OUT_FILE}`);
}

/** Preferred field ordering per position for readable output. */
function getFieldOrder(pos) {
  switch (pos) {
    case 'QB':
      return [
        'position', 'team', 'passing', 'ppa',
        'pffPassGrade', 'pffOffGrade', 'pffRunGrade',
        'bttRate', 'twpRate', 'yardsPerAttempt', 'adot',
        'accuracy', 'qbRating', 'sacks', 'scrambles', 'gamesPlayed',
      ];
    case 'RB':
      return [
        'position', 'team', 'rushing', 'receiving', 'ppa',
        'teamRecYdsTotal', 'teamTargetsTotal',
        'pffGrade', 'pffRunGrade', 'elusiveRating',
        'yardsAfterContact', 'avoidedTackles', 'ycoPerAttempt', 'explosiveRuns',
        'longest', 'gamesPlayed',
      ];
    case 'WR':
      return [
        'position', 'team', 'receiving', 'ppa',
        'teamRecYdsTotal', 'teamTargetsTotal',
        'routesRun', 'firstDowns', 'pffYprr',
        'recGrade', 'routeGrade',
        'yardsAfterCatch', 'yardsAfterCatchPerRec',
        'slotRate', 'wideRate', 'inlineRate',
        'contestedCatchRate', 'contestedReceptions',
        'gamesPlayed',
      ];
    case 'TE':
      return [
        'position', 'team', 'receiving', 'ppa',
        'teamRecYdsTotal', 'teamTargetsTotal',
        'routesRun', 'firstDowns', 'pffYprr',
        'recGrade', 'routeGrade',
        'yardsAfterCatch', 'yardsAfterCatchPerRec',
        'slotRate', 'wideRate', 'inlineRate',
        'contestedCatchRate', 'contestedReceptions',
        'gamesPlayed',
      ];
    default:
      return ['position', 'team'];
  }
}

main();
