import React, { useState, useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { positionColors, computePercentile, getBreakoutIndicator } from '../utils/helpers';
import { getArchetype } from '../utils/archetypes';
import { useTheme } from '../ThemeContext';
import DraftBadge from './DraftBadge';

const COMPARE_COLORS = ['#3b82f6', '#ef4444', '#10b981'];

const CompareView = ({ players, initialPlayerIds = [], onSelectPlayer }) => {
  const { theme } = useTheme();
  const [selectedIds, setSelectedIds] = useState(initialPlayerIds.length > 0 ? initialPlayerIds : []);
  const [positionFilter, setPositionFilter] = useState('ALL');

  const filteredPlayers = useMemo(() =>
    players.filter(p => positionFilter === 'ALL' || p.position === positionFilter),
    [players, positionFilter]
  );

  const selected = useMemo(() =>
    selectedIds.map(id => players.find(p => p.id === id)).filter(Boolean),
    [selectedIds, players]
  );

  const commonPosition = selected.length > 0 ? selected[0].position : null;
  const allSamePosition = selected.every(p => p.position === commonPosition);
  const peers = allSamePosition && commonPosition
    ? players.filter(p => p.position === commonPosition)
    : players;

  const addPlayer = (id) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlayer = (id) => {
    setSelectedIds(selectedIds.filter(x => x !== id));
  };

  // Stat definitions per position for comparison
  const getCompareStats = (position) => {
    if (position === 'QB') return [
      { label: 'Comp %', getValue: p => p.stats?.completionPct, unit: '%' },
      { label: 'Pass YDs', getValue: p => p.stats?.passingYards },
      { label: 'Pass TDs', getValue: p => p.stats?.passingTDs },
      { label: 'Rush YDs', getValue: p => p.stats?.rushingYards },
      { label: 'Y/A', getValue: p => p.stats?.yardsPerAttempt },
      { label: 'PFF Grade', getValue: p => p.stats?.pffPassGrade },
      { label: 'BTT Rate', getValue: p => p.stats?.bttRate, unit: '%' },
      { label: 'TWP Rate', getValue: p => p.stats?.twpRate, unit: '%', invert: true },
      { label: 'QB Rating', getValue: p => p.stats?.qbRating },
    ];
    if (position === 'RB') return [
      { label: 'Rush YDs', getValue: p => p.stats?.rushingYards },
      { label: 'YPC', getValue: p => p.stats?.yardsPerCarry },
      { label: 'Rush TDs', getValue: p => p.stats?.rushingTDs },
      { label: 'Receptions', getValue: p => p.stats?.receptions },
      { label: 'Rec YDs', getValue: p => p.stats?.receivingYards },
      { label: 'Elusive Rating', getValue: p => p.stats?.elusiveRating },
      { label: 'PFF Grade', getValue: p => p.stats?.pffGrade },
    ];
    if (position === 'WR') return [
      { label: 'YPRR', getValue: p => p.yprr || p.advancedStats?.yprr },
      { label: 'Target Share', getValue: p => p.targetShare || p.advancedStats?.targetShare, unit: '%' },
      { label: 'Rec YDs', getValue: p => p.stats?.receivingYards },
      { label: 'YAC/Rec', getValue: p => p.yardsAfterCatchPerRec },
      { label: 'Contested %', getValue: p => p.contestedCatchRate, unit: '%' },
      { label: 'Rec Grade', getValue: p => p.recGrade },
    ];
    if (position === 'TE') return [
      { label: 'YPRR', getValue: p => p.yprr || p.advancedStats?.yprr },
      { label: 'Rec YDs', getValue: p => p.stats?.receivingYards },
      { label: 'Rec TDs', getValue: p => p.stats?.receivingTDs },
      { label: 'Target Share', getValue: p => p.targetShare || p.advancedStats?.targetShare, unit: '%' },
      { label: 'Rec Grade', getValue: p => p.recGrade },
    ];
    return [];
  };

  const getRadarStats = (position) => {
    if (position === 'QB') return [
      { stat: 'Comp %', getValue: p => p.stats?.completionPct },
      { stat: 'Pass TDs', getValue: p => p.stats?.passingTDs },
      { stat: 'Pass YDs', getValue: p => p.stats?.passingYards },
      { stat: 'Rush YDs', getValue: p => p.stats?.rushingYards },
      { stat: 'Y/A', getValue: p => p.stats?.yardsPerAttempt },
    ];
    if (position === 'RB') return [
      { stat: 'Rush YDs', getValue: p => p.stats?.rushingYards },
      { stat: 'YPC', getValue: p => p.stats?.yardsPerCarry },
      { stat: 'Rec YDs', getValue: p => p.stats?.receivingYards },
      { stat: 'Rush TDs', getValue: p => p.stats?.rushingTDs },
      { stat: 'Elusive', getValue: p => p.stats?.elusiveRating },
    ];
    if (position === 'WR') return [
      { stat: 'YPRR', getValue: p => p.yprr || p.advancedStats?.yprr },
      { stat: 'Tgt Share', getValue: p => p.targetShare || p.advancedStats?.targetShare },
      { stat: 'YAC/Rec', getValue: p => p.yardsAfterCatchPerRec },
      { stat: 'Contested', getValue: p => p.contestedCatchRate },
      { stat: 'Rec YDs', getValue: p => p.stats?.receivingYards },
    ];
    return [
      { stat: 'YPRR', getValue: p => p.yprr || p.advancedStats?.yprr },
      { stat: 'Tgt Share', getValue: p => p.targetShare || p.advancedStats?.targetShare },
      { stat: 'Rec YDs', getValue: p => p.stats?.receivingYards },
      { stat: 'Rec TDs', getValue: p => p.stats?.receivingTDs },
      { stat: 'Contested', getValue: p => p.contestedCatchRate },
    ];
  };

  const radarData = useMemo(() => {
    if (!allSamePosition || !commonPosition || selected.length === 0) return [];
    const stats = getRadarStats(commonPosition);
    return stats.map(s => {
      const row = { stat: s.stat };
      const allVals = peers.map(s.getValue).filter(v => v != null && !isNaN(v) && v > 0);
      selected.forEach((p, i) => {
        row[`p${i}`] = computePercentile(s.getValue(p), allVals) || 0;
      });
      return row;
    });
  }, [selected, allSamePosition, commonPosition, peers]);

  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const labelColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
        fontSize: 28, color: 'var(--text-primary)', margin: '0 0 20px',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        Compare Prospects
      </h1>

      {/* Player selector */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)', padding: 20, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            Filter by position:
          </span>
          {['ALL', 'QB', 'RB', 'WR', 'TE'].map(pos => (
            <button key={pos} onClick={() => setPositionFilter(pos)} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              padding: '4px 10px', border: '1px solid',
              borderColor: positionFilter === pos ? 'var(--accent)' : 'var(--border-primary)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: positionFilter === pos ? 'var(--accent)' : 'transparent',
              color: positionFilter === pos ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {pos}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            onChange={e => { if (e.target.value) addPlayer(Number(e.target.value)); e.target.value = ''; }}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)',
              flex: 1, minWidth: 200,
            }}
            disabled={selectedIds.length >= 3}
          >
            <option value="">
              {selectedIds.length >= 3 ? 'Max 3 players selected' : `Add a prospect (${selectedIds.length}/3)...`}
            </option>
            {filteredPlayers
              .filter(p => !selectedIds.includes(p.id))
              .sort((a, b) => ((a.rank?.oneQB === 'UNR' ? 999 : a.rank?.oneQB) || 999) - ((b.rank?.oneQB === 'UNR' ? 999 : b.rank?.oneQB) || 999))
              .map(p => (
                <option key={p.id} value={p.id}>
                  #{p.rank?.oneQB || 'UNR'} {p.name} ({p.position} - {p.college})
                </option>
              ))}
          </select>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {selected.map((p, i) => {
              const posColor = positionColors[p.position] || positionColors.WR;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-tertiary)',
                  border: `2px solid ${COMPARE_COLORS[i]}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: COMPARE_COLORS[i], flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700,
                    color: posColor.text, background: posColor.bg,
                    padding: '1px 5px', borderRadius: 3,
                  }}>
                    {p.position}
                  </span>
                  <button onClick={() => removePlayer(p.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: 'var(--text-tertiary)', padding: 0, lineHeight: 1,
                  }}>
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected.length < 2 && (
        <div style={{
          textAlign: 'center', padding: 60,
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-tertiary)',
        }}>
          Select at least 2 prospects to compare
        </div>
      )}

      {selected.length >= 2 && (
        <>
          {/* Overview cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
            gap: 16, marginBottom: 24,
          }}>
            {selected.map((p, i) => {
              const posColor = positionColors[p.position] || positionColors.WR;
              const archetype = getArchetype(p, peers);
              const breakout = getBreakoutIndicator(p.breakoutAge);
              return (
                <div key={p.id} style={{
                  background: 'var(--bg-secondary)',
                  border: `2px solid ${COMPARE_COLORS[i]}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 16, cursor: 'pointer',
                }} onClick={() => onSelectPlayer(p.id)}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
                    color: posColor.text, textTransform: 'uppercase', letterSpacing: 0.5,
                    marginBottom: 2,
                  }}>{archetype}</div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                    fontSize: 22, color: 'var(--text-primary)', marginBottom: 4,
                  }}>{p.name}</div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: 'var(--text-secondary)', marginBottom: 8,
                  }}>
                    {[p.college, `${p.height} / ${p.weight} lbs`, `Age ${p.age}`].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <DraftBadge round={p.draftRound} pick={p.draftPick} team={p.draftTeam} isProjected={p.draftIsProjected} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                      color: 'var(--text-secondary)', background: 'var(--bg-tertiary)',
                      padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    }}>
                      1QB #{p.rank?.oneQB || 'UNR'}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                      color: 'var(--text-secondary)', background: 'var(--bg-tertiary)',
                      padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    }}>
                      SF #{p.rank?.superflex || 'UNR'}
                    </span>
                    {breakout.label !== 'N/A' && (
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
                        color: breakout.color,
                      }}>
                        {breakout.label} {p.breakoutAge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlaid radar chart */}
          {allSamePosition && radarData.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)', padding: 24, marginBottom: 24,
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
                color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
                margin: '0 0 16px',
              }}>
                Stat Profile Overlay
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: labelColor, fontSize: 11, fontFamily: "'Inter', sans-serif" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  {selected.map((p, i) => (
                    <Radar key={p.id} name={p.name} dataKey={`p${i}`}
                      stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]}
                      fillOpacity={0.1} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!allSamePosition && selected.length >= 2 && (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)', padding: 24, marginBottom: 24,
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--text-tertiary)',
                margin: 0,
              }}>
                Select players at the same position for radar chart overlay comparison
              </p>
            </div>
          )}

          {/* Stat-by-stat comparison table */}
          {allSamePosition && commonPosition && (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)', padding: 24,
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
                color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
                margin: '0 0 16px',
              }}>
                Stat Comparison
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                      color: 'var(--text-tertiary)', textAlign: 'left', padding: '8px 12px',
                      borderBottom: '2px solid var(--border-primary)',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Stat
                    </th>
                    {selected.map((p, i) => (
                      <th key={p.id} style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                        color: COMPARE_COLORS[i], textAlign: 'center', padding: '8px 12px',
                        borderBottom: `2px solid ${COMPARE_COLORS[i]}`,
                      }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getCompareStats(commonPosition).map((stat, si) => {
                    const values = selected.map(p => stat.getValue(p));
                    const numericValues = values.map(v => (v != null && !isNaN(v)) ? Number(v) : null);
                    const validNums = numericValues.filter(v => v != null);
                    const best = stat.invert
                      ? (validNums.length > 0 ? Math.min(...validNums) : null)
                      : (validNums.length > 0 ? Math.max(...validNums) : null);

                    return (
                      <tr key={si} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{
                          fontFamily: "'Inter', sans-serif", fontSize: 12,
                          color: 'var(--text-secondary)', padding: '8px 12px',
                        }}>
                          {stat.label}
                        </td>
                        {values.map((val, vi) => {
                          const num = numericValues[vi];
                          const isBest = num != null && num === best && validNums.length > 1;
                          const display = val == null ? 'N/A' :
                            (stat.unit === '%' ? `${val}%` :
                              typeof val === 'number' && val >= 1000 ? val.toLocaleString() :
                                typeof val === 'number' && val < 10 ? val.toFixed(1) : val);
                          return (
                            <td key={vi} style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                              fontWeight: isBest ? 800 : 500,
                              color: isBest ? 'var(--success)' : val == null ? 'var(--text-tertiary)' : 'var(--text-primary)',
                              textAlign: 'center', padding: '8px 12px',
                            }}>
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompareView;
