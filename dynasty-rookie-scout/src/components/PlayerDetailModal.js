import React, { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { positionColors, getBreakoutIndicator, getDraftCapitalInfo, hasInjuryRisk } from '../utils/helpers';
import { generateScoutingSummary } from '../services/anthropicApi';

const StatRow = ({ label, value, benchmark, unit = '' }) => {
  const displayValue = value == null || value === '' ? 'N/A' : value;
  const isNA = displayValue === 'N/A';
  const isAbove = !isNA && benchmark && parseFloat(value) >= benchmark;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid #1e2133',
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: '#9ca3af',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          color: isNA ? '#6b7280' : isAbove ? '#22c55e' : '#f1f5f9',
        }}>
          {isNA ? 'N/A' : `${displayValue}${unit}`}
        </span>
        {benchmark && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#6b7280',
          }}>
            (avg: {benchmark}{unit})
          </span>
        )}
      </div>
    </div>
  );
};

const PlayerDetailModal = ({ player, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const posColor = positionColors[player.position] || positionColors.WR;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    const result = await generateScoutingSummary(player);
    setSummary(result);
    setLoadingSummary(false);
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getRadarData = () => {
    const s = player.stats;
    if (player.position === 'QB') {
      return [
        { stat: 'EPA', value: Math.min(100, (s.epa / 0.4) * 100), fullMark: 100 },
        { stat: 'CPOE', value: Math.min(100, ((s.cpoe + 5) / 10) * 100), fullMark: 100 },
        { stat: 'Pass TDs', value: Math.min(100, (s.passingTDs / 45) * 100), fullMark: 100 },
        { stat: 'Comp %', value: Math.min(100, (s.completionPct / 80) * 100), fullMark: 100 },
        { stat: 'Rush', value: Math.min(100, (s.rushingYards / 800) * 100), fullMark: 100 },
        { stat: 'Draft Cap', value: Math.min(100, ((33 - player.draftPick) / 32) * 100), fullMark: 100 },
      ];
    }
    if (player.position === 'RB') {
      return [
        { stat: 'EPA', value: Math.min(100, (s.epa / 0.4) * 100), fullMark: 100 },
        { stat: 'Rush YDs', value: Math.min(100, (s.rushingYards / 2000) * 100), fullMark: 100 },
        { stat: 'YPC', value: Math.min(100, (s.yardsPerCarry / 8) * 100), fullMark: 100 },
        { stat: 'Receiving', value: Math.min(100, (s.receivingYards / 500) * 100), fullMark: 100 },
        { stat: 'Dominator', value: Math.min(100, (player.dominatorRating / 50) * 100), fullMark: 100 },
        { stat: 'Draft Cap', value: Math.min(100, ((33 - player.draftPick) / 32) * 100), fullMark: 100 },
      ];
    }
    // WR / TE
    return [
      { stat: 'YPR', value: Math.min(100, ((player.yprr || 0) / 20) * 100), fullMark: 100 },
      { stat: 'Dominator', value: Math.min(100, (player.dominatorRating / 50) * 100), fullMark: 100 },
      { stat: 'Rec Share', value: Math.min(100, ((player.targetShare || 0) / 35) * 100), fullMark: 100 },
      { stat: 'YAC/Rec', value: Math.min(100, ((player.yacPerRR || 0) / 8) * 100), fullMark: 100 },
      { stat: 'Rec TDs', value: Math.min(100, (s.receivingTDs / 15) * 100), fullMark: 100 },
      { stat: 'Draft Cap', value: Math.min(100, ((33 - player.draftPick) / 32) * 100), fullMark: 100 },
    ];
  };

  const rankComparisonData = [
    { format: '1QB', rank: player.rank.oneQB, adp: player.dynastyADP.oneQB },
    { format: 'SF', rank: player.rank.superflex, adp: player.dynastyADP.superflex },
  ];

  const rankDelta = player.rank.oneQB - player.rank.superflex;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '40px 20px',
        zIndex: 200,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1117',
          borderRadius: 12,
          border: `1px solid ${posColor.border}44`,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${posColor.border}22, #1a1d2e)`,
          padding: '24px 28px',
          borderBottom: '1px solid #2a2d3e',
          position: 'relative',
        }}>
          {injured && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: '#ef4444',
              color: '#fff',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 16px',
              textAlign: 'center',
              letterSpacing: 1,
            }}>
              🚨 INJURY HISTORY — {player.injuries.map(i => i.type).join(', ')} 🚨
            </div>
          )}

          <div style={{ marginTop: injured ? 24 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 32,
                  color: '#f1f5f9',
                  margin: 0,
                }}>
                  {player.name}
                </h2>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: posColor.text,
                  background: posColor.bg,
                  padding: '4px 12px',
                  borderRadius: 6,
                }}>
                  {player.position}
                </span>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: '#9ca3af',
              }}>
                {player.college} · {player.height} / {player.weight} lbs · Age {player.age}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                color: capital.color,
              }}>
                {capital.emoji} {player.draftIsProjected ? 'Projected ' : ''}Round {player.draftRound}, Pick #{player.draftPick}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#6b7280',
              }}>
                {player.draftTeam} · {capital.label} Capital{player.draftIsProjected ? ' (Mock)' : ''}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: injured ? 36 : 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Left: Stats */}
            <div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#f59e0b',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>Full Stat Breakdown</h3>

              {player.position === 'QB' && (
                <>
                  <StatRow label="EPA" value={player.stats.epa} benchmark={0.15} />
                  <StatRow label="CPOE" value={player.stats.cpoe} benchmark={2.0} />
                  <StatRow label="Completion %" value={player.stats.completionPct} benchmark={64} unit="%" />
                  <StatRow label="Passing Yards" value={player.stats.passingYards?.toLocaleString()} />
                  <StatRow label="Passing TDs" value={player.stats.passingTDs} benchmark={25} />
                  <StatRow label="Interceptions" value={player.stats.interceptions} />
                  <StatRow label="Rushing Yards" value={player.stats.rushingYards} />
                  <StatRow label="Rushing TDs" value={player.stats.rushingTDs} />
                </>
              )}

              {player.position === 'RB' && (
                <>
                  <StatRow label="EPA" value={player.stats.epa} benchmark={0.15} />
                  <StatRow label="Rushing Yards" value={player.stats.rushingYards?.toLocaleString()} benchmark={1200} />
                  <StatRow label="Rushing TDs" value={player.stats.rushingTDs} benchmark={12} />
                  <StatRow label="YPC" value={player.stats.yardsPerCarry} benchmark={5.0} />
                  <StatRow label="Receptions" value={player.stats.receptions} benchmark={25} />
                  <StatRow label="Receiving Yards" value={player.stats.receivingYards} />
                  <StatRow label="Receiving TDs" value={player.stats.receivingTDs} />
                </>
              )}

              {(player.position === 'WR' || player.position === 'TE') && (
                <>
                  <StatRow label="EPA" value={player.stats.epa} benchmark={0.15} />
                  <StatRow label="YPR" value={player.yprr} benchmark={player.position === 'WR' ? 12.0 : 10.0} />
                  <StatRow label="YAC/Rec" value={player.yacPerRR} benchmark={4.0} />
                  <StatRow label="Dominator Rating" value={player.dominatorRating} benchmark={25} unit="%" />
                  <StatRow label="Rec Share" value={player.targetShare} benchmark={15} unit="%" />
                  <StatRow label="Receptions" value={player.stats.receptions} />
                  <StatRow label="Receiving Yards" value={player.stats.receivingYards?.toLocaleString()} />
                  <StatRow label="Receiving TDs" value={player.stats.receivingTDs} />
                  <StatRow label="Targets" value={player.stats.targets} />
                </>
              )}

              <div style={{ marginTop: 16 }}>
                <StatRow label="Breakout Age" value={player.breakoutAge || 'N/A'} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: breakout.color,
                  fontWeight: 700,
                }}>
                  {breakout.emoji} {breakout.label} Breakout Profile
                </div>
              </div>
            </div>

            {/* Right: Radar chart */}
            <div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#f59e0b',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>Player Profile</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#2a2d3e" />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar
                    name={player.name}
                    dataKey="value"
                    stroke={posColor.border}
                    fill={posColor.border}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* 1QB vs SF comparison */}
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#f59e0b',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginTop: 16,
                marginBottom: 8,
              }}>1QB vs Superflex Value</h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={rankComparisonData} layout="vertical">
                  <XAxis type="number" domain={[0, 40]} tick={{ fill: '#6b7280', fontSize: 10 }} reversed />
                  <YAxis
                    type="category"
                    dataKey="format"
                    tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: 6 }}
                    labelStyle={{ color: '#f1f5f9', fontFamily: "'Barlow Condensed', sans-serif" }}
                    itemStyle={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                  />
                  <Bar dataKey="rank" fill="#60a5fa" name="Rank" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="adp" fill="#a78bfa" name="ADP" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#9ca3af',
                marginTop: 4,
              }}>
                📊 Rank Delta: {rankDelta > 0 ? `+${rankDelta} spots higher in SF` : rankDelta < 0 ? `${Math.abs(rankDelta)} spots higher in 1QB` : 'Same rank'}
                {player.position === 'QB' && rankDelta > 0 && (
                  <span style={{ color: '#f59e0b' }}> — QB premium in Superflex</span>
                )}
              </div>
            </div>
          </div>

          {/* Injury Timeline */}
          {injured && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#ef4444',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>🚨 Injury Timeline</h3>
              {player.injuries.map((injury, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: i < player.injuries.length - 1 ? '1px solid rgba(239,68,68,0.15)' : 'none',
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: injury.severity === 'severe' ? '#ef4444' : '#f59e0b',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#f1f5f9',
                    }}>
                      {injury.type}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#9ca3af',
                    }}>
                      {injury.date} · {injury.severity} · {injury.gamesOut} games missed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Player Comps */}
          {player.playerComps && player.playerComps.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#f59e0b',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Player Comps</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {player.playerComps.map((comp, i) => (
                  <span key={i} style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#e2e8f0',
                    background: '#1e2133',
                    border: '1px solid #2a2d3e',
                    padding: '6px 14px',
                    borderRadius: 6,
                  }}>
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Scouting Summary */}
          <div style={{
            background: '#151825',
            borderRadius: 8,
            padding: 20,
            border: '1px solid #2a2d3e',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#f59e0b',
                letterSpacing: 1,
                textTransform: 'uppercase',
                margin: 0,
              }}>AI Scouting Report</h3>
              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    padding: '8px 16px',
                    border: '1px solid #f59e0b',
                    borderRadius: 6,
                    cursor: loadingSummary ? 'wait' : 'pointer',
                    background: loadingSummary ? '#2a2d3e' : 'rgba(245,158,11,0.15)',
                    color: '#f59e0b',
                    transition: 'all 0.15s',
                  }}
                >
                  {loadingSummary ? 'Generating...' : 'Generate Report'}
                </button>
              )}
            </div>
            {summary ? (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                lineHeight: 1.7,
                color: '#d1d5db',
                margin: 0,
              }}>
                {summary}
              </p>
            ) : (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#6b7280',
                margin: 0,
              }}>
                Click "Generate Report" to get an AI-powered scouting analysis.
                {!process.env.REACT_APP_ANTHROPIC_API_KEY && ' (Using fallback — set REACT_APP_ANTHROPIC_API_KEY for Claude-powered reports)'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailModal;
