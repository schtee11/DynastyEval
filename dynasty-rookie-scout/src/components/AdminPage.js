import React, { useState, useMemo } from 'react';
import { getAllStaticStats } from '../services/collegeStats2025';
import { getProspects } from '../services/rookieProspects2026';
import { receivingPerspectiveData } from '../services/receivingData';

const norm = (n) =>
  n.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

const getReceivingData = (name) => {
  const entry = Object.entries(receivingPerspectiveData).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[1] : null;
};

/** Run the same audit logic as scripts/auditPlayerStats.js but at runtime. */
function runAudit(prospects, staticStats) {
  const positions = ['QB', 'RB', 'WR', 'TE'];
  const filtered = prospects.filter(p => positions.includes(p.position));
  const naFields = [];

  for (const p of filtered) {
    const sd = staticStats[norm(p.name)];
    const hasPerspective = !!getReceivingData(p.name);
    const noStatic = !sd;

    const na = (field, severity) => {
      naFields.push({ name: p.name, position: p.position, college: p.college, field, severity });
    };

    if (p.position === 'QB' && noStatic) {
      na('Completion %', 'critical');
      na('Passing Yards', 'critical');
      na('Passing TDs', 'critical');
    }

    if (p.position === 'RB') {
      if (noStatic) {
        na('Rushing Yards', 'critical');
        na('Rushing TDs', 'critical');
        na('YPC', 'critical');
      }
      if (sd?.yardsAfterContact == null) na('Yards After Contact', 'important');
      if (sd?.ycoPerAttempt == null) na('YAC/Attempt', 'important');
      if (sd?.avoidedTackles == null) na('Missed Tackles Forced', 'important');
      if (sd?.explosiveRuns == null) na('10+ Yard Runs', 'important');
      const advTS = p.advancedStats?.targetShare;
      const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
      if (advTS == null && !canCompute) na('Target Share (RB)', 'info');
    }

    if (p.position === 'TE') {
      if (sd?.pffYprr == null && p.advancedStats?.yprr == null) na('YPRR', 'important');
      if (sd?.recGrade == null) na('Rec Grade', 'important');
      const advTS = p.advancedStats?.targetShare;
      const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
      if (advTS == null && !canCompute) na('Target Share', 'important');
      if (sd?.yardsAfterCatch == null) na('YAC', 'info');
      if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info');
      if (sd?.slotRate == null) na('Slot Rate', 'info');
      if (sd?.wideRate == null) na('Wide Rate', 'info');
      if (sd?.inlineRate == null) na('Inline Rate', 'info');
      if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info');
      if (sd?.contestedReceptions == null) na('Contested Receptions', 'info');
    }

    if (p.position === 'WR') {
      if (hasPerspective) {
        const advTS = p.advancedStats?.targetShare;
        const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
        if (advTS == null && !canCompute) na('Target Share', 'important');
        if (sd?.yardsAfterCatch == null) na('YAC', 'info');
        if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info');
        if (sd?.slotRate == null) na('Slot Rate', 'info');
        if (sd?.wideRate == null) na('Wide Rate', 'info');
        if (sd?.inlineRate == null) na('Inline Rate', 'info');
        if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info');
        if (sd?.contestedReceptions == null) na('Contested Receptions', 'info');
      } else {
        if (sd?.pffYprr == null && p.advancedStats?.yprr == null) na('YPRR', 'important');
        if (sd?.recGrade == null) na('Rec Grade', 'important');
        const advTS = p.advancedStats?.targetShare;
        const canCompute = sd?.receiving?.TARGETS > 0 && sd?.teamTargetsTotal > 0;
        if (advTS == null && !canCompute) na('Target Share', 'important');
        if (noStatic) {
          na('Receptions', 'critical');
          na('Receiving Yards', 'critical');
          na('Receiving TDs', 'critical');
        }
        if (sd?.yardsAfterCatch == null) na('YAC', 'info');
        if (sd?.yardsAfterCatchPerRec == null) na('YAC/Rec', 'info');
        if (sd?.slotRate == null) na('Slot Rate', 'info');
        if (sd?.wideRate == null) na('Wide Rate', 'info');
        if (sd?.inlineRate == null) na('Inline Rate', 'info');
        if (sd?.contestedCatchRate == null) na('Contested Catch Rate', 'info');
        if (sd?.contestedReceptions == null) na('Contested Receptions', 'info');
        na('Receiving Perspectives', 'info');
      }
    }
  }

  return { naFields, totalProspects: filtered.length };
}

// ── Styles ──────────────────────────────────────────────────────────────────
const mono = "'JetBrains Mono', monospace";
const heading = "'Barlow Condensed', sans-serif";

const severityColors = {
  critical: '#ef4444',
  important: '#f59e0b',
  info: '#6b7280',
};

const severityLabels = {
  critical: 'CRITICAL',
  important: 'IMPORTANT',
  info: 'INFO',
};

// ── Component ───────────────────────────────────────────────────────────────
const AdminPage = () => {
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'important' | 'info'
  const [posFilter, setPosFilter] = useState('all');
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const { naFields, totalProspects, critical, important, info, byPlayer, byField, fullyPopulated } = useMemo(() => {
    const prospects = getProspects();
    const staticStats = getAllStaticStats();
    const { naFields: nf, totalProspects: tp } = runAudit(prospects, staticStats);

    const crit = nf.filter(f => f.severity === 'critical');
    const imp = nf.filter(f => f.severity === 'important');
    const inf = nf.filter(f => f.severity === 'info');

    const byP = {};
    for (const item of nf) {
      if (!byP[item.name]) byP[item.name] = { ...item, fields: [] };
      byP[item.name].fields.push(item);
    }

    const byF = {};
    for (const item of nf) {
      if (!byF[item.field]) byF[item.field] = [];
      byF[item.field].push(item);
    }

    const unique = new Set(nf.map(f => f.name)).size;

    return {
      naFields: nf, totalProspects: tp,
      critical: crit, important: imp, info: inf,
      byPlayer: byP, byField: byF,
      fullyPopulated: tp - unique,
    };
  }, []);

  const filteredByField = useMemo(() => {
    return Object.entries(byField)
      .map(([field, items]) => {
        let filtered = items;
        if (filter !== 'all') filtered = filtered.filter(i => i.severity === filter);
        if (posFilter !== 'all') filtered = filtered.filter(i => i.position === posFilter);
        return [field, filtered];
      })
      .filter(([, items]) => items.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [byField, filter, posFilter]);

  const filteredPlayers = useMemo(() => {
    return Object.values(byPlayer)
      .map(p => {
        let fields = p.fields;
        if (filter !== 'all') fields = fields.filter(f => f.severity === filter);
        if (posFilter !== 'all') fields = fields.filter(f => f.position === posFilter);
        return { ...p, fields };
      })
      .filter(p => p.fields.length > 0)
      .sort((a, b) => b.fields.length - a.fields.length);
  }, [byPlayer, filter, posFilter]);

  const coveragePct = ((fullyPopulated / totalProspects) * 100).toFixed(1);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <h2 style={{ fontFamily: heading, fontWeight: 800, fontSize: 28, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
        Data Quality Dashboard
      </h2>
      <p style={{ fontFamily: mono, fontSize: 12, color: '#6b7280', marginBottom: 24 }}>
        Audit of all stats displayed in the UI per player
      </p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Total Prospects" value={totalProspects} color="#e5e7eb" />
        <SummaryCard label="Fully Populated" value={fullyPopulated} sub={`${coveragePct}%`} color="#22c55e" />
        <SummaryCard label="Critical N/As" value={critical.length} color={severityColors.critical} />
        <SummaryCard label="Important N/As" value={important.length} color={severityColors.important} />
        <SummaryCard label="Info N/As" value={info.length} color={severityColors.info} />
        <SummaryCard label="Total N/A Instances" value={naFields.length} color="#e5e7eb" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <FilterGroup label="Severity">
          {['all', 'critical', 'important', 'info'].map(s => (
            <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}
              color={s === 'all' ? '#e5e7eb' : severityColors[s]}>
              {s === 'all' ? 'All' : severityLabels[s]}
            </FilterBtn>
          ))}
        </FilterGroup>
        <FilterGroup label="Position">
          {['all', 'QB', 'RB', 'WR', 'TE'].map(p => (
            <FilterBtn key={p} active={posFilter === p} onClick={() => setPosFilter(p)} color="#e5e7eb">
              {p === 'all' ? 'All' : p}
            </FilterBtn>
          ))}
        </FilterGroup>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By Field */}
        <div>
          <h3 style={{ fontFamily: heading, fontWeight: 700, fontSize: 16, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            N/A by Stat Field ({filteredByField.reduce((s, [, i]) => s + i.length, 0)})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredByField.map(([field, items]) => (
              <FieldCard key={field} field={field} items={items} />
            ))}
            {filteredByField.length === 0 && (
              <p style={{ fontFamily: mono, fontSize: 13, color: '#22c55e' }}>
                No N/A fields match the current filters
              </p>
            )}
          </div>
        </div>

        {/* By Player */}
        <div>
          <h3 style={{ fontFamily: heading, fontWeight: 700, fontSize: 16, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            N/A by Player ({filteredPlayers.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredPlayers.map(p => (
              <PlayerRow key={p.name} player={p} expanded={expandedPlayer === p.name}
                onToggle={() => setExpandedPlayer(expandedPlayer === p.name ? null : p.name)} />
            ))}
            {filteredPlayers.length === 0 && (
              <p style={{ fontFamily: mono, fontSize: 13, color: '#22c55e' }}>
                All players fully populated for current filters
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, sub, color }) => (
  <div style={{
    background: '#1a1d2e',
    border: '1px solid #2a2d3e',
    borderRadius: 8,
    padding: '16px 14px',
    textAlign: 'center',
  }}>
    <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
      {value}{sub && <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>{sub}</span>}
    </div>
    <div style={{ fontFamily: mono, fontSize: 11, color: '#6b7280', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </div>
  </div>
);

const FilterGroup = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontFamily: mono, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginRight: 4 }}>{label}:</span>
    {children}
  </div>
);

const FilterBtn = ({ active, onClick, color, children }) => (
  <button onClick={onClick} style={{
    fontFamily: mono,
    fontSize: 11,
    fontWeight: active ? 700 : 400,
    padding: '4px 10px',
    border: '1px solid',
    borderColor: active ? color : '#2a2d3e',
    borderRadius: 4,
    cursor: 'pointer',
    background: active ? `${color}20` : 'transparent',
    color: active ? color : '#6b7280',
    transition: 'all 0.15s',
  }}>
    {children}
  </button>
);

const FieldCard = ({ field, items }) => {
  const sev = items[0]?.severity || 'info';
  const color = severityColors[sev];
  return (
    <div style={{
      background: '#1a1d2e',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{field}</span>
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: 4 }}>
          {items.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map(item => (
          <span key={item.name} style={{
            fontFamily: mono, fontSize: 10, color: '#9ca3af',
            background: '#0f1117', padding: '2px 6px', borderRadius: 3,
          }}>
            {item.name} <span style={{ color: '#6b7280' }}>({item.position})</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const PlayerRow = ({ player, expanded, onToggle }) => {
  const critCount = player.fields.filter(f => f.severity === 'critical').length;
  const impCount = player.fields.filter(f => f.severity === 'important').length;
  const infoCount = player.fields.filter(f => f.severity === 'info').length;

  return (
    <div style={{
      background: '#1a1d2e',
      border: '1px solid #2a2d3e',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <button onClick={onToggle} style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}>
        <div>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{player.name}</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#6b7280', marginLeft: 8 }}>{player.position} — {player.college}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {critCount > 0 && <Badge count={critCount} color={severityColors.critical} />}
          {impCount > 0 && <Badge count={impCount} color={severityColors.important} />}
          {infoCount > 0 && <Badge count={infoCount} color={severityColors.info} />}
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {player.fields.map((f, i) => (
            <span key={i} style={{
              fontFamily: mono, fontSize: 10,
              color: severityColors[f.severity],
              background: `${severityColors[f.severity]}15`,
              padding: '2px 6px', borderRadius: 3,
              border: `1px solid ${severityColors[f.severity]}33`,
            }}>
              {f.field}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const Badge = ({ count, color }) => (
  <span style={{
    fontFamily: mono, fontSize: 11, fontWeight: 700,
    color, background: `${color}15`,
    padding: '2px 6px', borderRadius: 4,
    minWidth: 20, textAlign: 'center',
  }}>
    {count}
  </span>
);

export default AdminPage;
