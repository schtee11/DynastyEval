import React, { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { positionColors, getBreakoutIndicator, getDraftCapitalInfo, hasInjuryRisk } from '../utils/helpers';
import { generateScoutingSummary } from '../services/anthropicApi';
import { perspectiveLabels } from '../services/receivingData';

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

const PlayerDetailModal = ({ player, perspective: initialPerspective = 'overall', onClose }) => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [modalPerspective, setModalPerspective] = useState(initialPerspective);
  const [slideIn, setSlideIn] = useState(false);
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isDesktop = winWidth >= 1025;
  const isTabletLandscape = winWidth >= 1025 && winWidth <= 1400;

  const posColor = positionColors[player.position] || positionColors.WR;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const result = await generateScoutingSummary(player);
      setSummary(result);
    } catch (err) {
      console.error('[PlayerDetailModal] AI summary failed:', err);
      setSummary('Failed to generate scouting summary. Check the browser console for details.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Trigger slide-in animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setSlideIn(true));
  }, []);

  // Reset AI summary when player changes
  useEffect(() => {
    setSummary(null);
    setLoadingSummary(false);
    setModalPerspective(initialPerspective);
  }, [player, initialPerspective]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getRadarData = () => {
    const s = player.stats || {};

    if (player.position === 'QB') {
      return [
        { stat: 'Comp %', value: Math.min(100, ((s.completionPct || 0) / 80) * 100), fullMark: 100 },
        { stat: 'Pass TDs', value: Math.min(100, ((s.passingTDs || 0) / 45) * 100), fullMark: 100 },
        { stat: 'Pass YDs', value: Math.min(100, ((s.passingYards || 0) / 5000) * 100), fullMark: 100 },
        { stat: 'Rush YDs', value: Math.min(100, ((s.rushingYards || 0) / 800) * 100), fullMark: 100 },
        { stat: 'Rush TDs', value: Math.min(100, ((s.rushingTDs || 0) / 15) * 100), fullMark: 100 },
      ];
    }

    if (player.position === 'RB') {
      return [
        { stat: 'Rush YDs', value: Math.min(100, ((s.rushingYards || 0) / 2000) * 100), fullMark: 100 },
        { stat: 'YPC', value: Math.min(100, ((s.yardsPerCarry || 0) / 8) * 100), fullMark: 100 },
        { stat: 'Receiving', value: Math.min(100, ((s.receivingYards || 0) / 500) * 100), fullMark: 100 },
        { stat: 'Rush TDs', value: Math.min(100, ((s.rushingTDs || 0) / 20) * 100), fullMark: 100 },
        { stat: 'MTF', value: Math.min(100, ((player.avoidedTackles || 0) / 60) * 100), fullMark: 100 },
      ];
    }

    // WR — receiving perspective data
    if (player.position === 'WR') {
      const pData = player.receivingByPerspective?.[modalPerspective];
      if (pData) {
        return [
          { stat: 'YPRR', value: Math.min(100, ((pData.yprr || 0) / 4) * 100), fullMark: 100 },
          { stat: 'Tgt/RR', value: Math.min(100, ((pData.tgtPerRR || 0) / 35) * 100), fullMark: 100 },
          { stat: '1D+TD/RR', value: Math.min(100, ((pData.firstDownTDPerRR || 0) / 0.3) * 100), fullMark: 100 },
          { stat: 'YAC/Rec', value: Math.min(100, ((player.yardsAfterCatchPerRec || 0) / 10) * 100), fullMark: 100 },
          { stat: 'Cont %', value: Math.min(100, (player.contestedCatchRate || 0)), fullMark: 100 },
          { stat: 'Tgt Share', value: Math.min(100, ((player.targetShare || 0) / 35) * 100), fullMark: 100 },
          { stat: 'Rec YDs', value: Math.min(100, ((pData.recYds || s.receivingYards || 0) / 1500) * 100), fullMark: 100 },
        ];
      }
      // WR fallback (no perspective data)
      return [
        { stat: 'YPRR', value: Math.min(100, ((player.yprr || 0) / 4) * 100), fullMark: 100 },
        { stat: 'Tgt/RR', value: Math.min(100, ((player.tgtPerRR || 0) / 35) * 100), fullMark: 100 },
        { stat: '1D+TD/RR', value: Math.min(100, ((player.firstDownTDPerRR || 0) / 0.3) * 100), fullMark: 100 },
        { stat: 'YAC/Rec', value: Math.min(100, ((player.yardsAfterCatchPerRec || 0) / 10) * 100), fullMark: 100 },
        { stat: 'Cont %', value: Math.min(100, (player.contestedCatchRate || 0)), fullMark: 100 },
        { stat: 'Tgt Share', value: Math.min(100, ((player.targetShare || 0) / 35) * 100), fullMark: 100 },
        { stat: 'Rec YDs', value: Math.min(100, ((s.receivingYards || 0) / 1500) * 100), fullMark: 100 },
      ];
    }

    // TE — same advanced metrics as WR
    return [
      { stat: 'YPRR', value: Math.min(100, ((player.yprr || 0) / 4) * 100), fullMark: 100 },
      { stat: 'Tgt/RR', value: Math.min(100, ((player.tgtPerRR || 0) / 35) * 100), fullMark: 100 },
      { stat: '1D+TD/RR', value: Math.min(100, ((player.firstDownTDPerRR || 0) / 0.3) * 100), fullMark: 100 },
      { stat: 'YAC/Rec', value: Math.min(100, ((player.yardsAfterCatchPerRec || 0) / 10) * 100), fullMark: 100 },
      { stat: 'Cont %', value: Math.min(100, (player.contestedCatchRate || 0)), fullMark: 100 },
      { stat: 'Tgt Share', value: Math.min(100, ((player.targetShare || 0) / 35) * 100), fullMark: 100 },
      { stat: 'Rec YDs', value: Math.min(100, ((s.receivingYards || 0) / 1500) * 100), fullMark: 100 },
    ];
  };

  const isUnranked = player.rank?.oneQB === 'UNR' || player.rank?.superflex === 'UNR';
  const rankComparisonData = player.rank && player.dynastyADP && !isUnranked ? [
    { format: '1QB', rank: player.rank.oneQB, adp: player.dynastyADP.oneQB },
    { format: 'SF', rank: player.rank.superflex, adp: player.dynastyADP.superflex },
  ] : [];

  const rankDelta = player.rank && !isUnranked ? (player.rank.oneQB - player.rank.superflex) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: isDesktop ? 'none' : 'rgba(0,0,0,0.8)',
        zIndex: 200,
        transition: 'background 0.3s ease',
        pointerEvents: isDesktop ? 'none' : 'auto',
      }}
      onClick={isDesktop ? undefined : onClose}
    >
      <div
        className="detail-modal-panel"
        onClick={e => e.stopPropagation()}
        style={{
          pointerEvents: 'auto',
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: isDesktop ? (isTabletLandscape ? 420 : 560) : '100%',
          maxWidth: '100vw',
          background: '#0f1117',
          borderLeft: isDesktop ? `2px solid ${posColor.border}44` : 'none',
          borderRadius: isDesktop ? 0 : 12,
          overflowY: 'auto',
          transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isDesktop ? '-8px 0 30px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${posColor.border}22, #1a1d2e)`,
          padding: isDesktop ? (isTabletLandscape ? '16px 18px' : '20px 24px') : '24px 28px',
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

          <div style={{ marginTop: injured ? 24 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap', paddingRight: 40 }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: isDesktop ? 26 : 32,
                color: '#f1f5f9',
                margin: 0,
              }}>
                {player.name}
              </h2>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: posColor.text,
                background: posColor.bg,
                padding: '3px 10px',
                borderRadius: 6,
              }}>
                {player.position}
              </span>
              {player.draftPick && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: capital.color,
                  background: `${capital.color}18`,
                  padding: '3px 10px',
                  borderRadius: 6,
                }}>
                  {player.draftTeam
                    ? `R${player.draftRound} #${player.draftPick} ${player.draftTeam}`
                    : `Proj Rd ${player.draftRound} (#${player.draftPick})`}
                </span>
              )}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#9ca3af',
            }}>
              {[player.college, player.height && player.weight ? `${player.height} / ${player.weight} lbs` : null, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' · ') || 'TBD'}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: injured ? 36 : 12,
              right: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #2a2d3e',
              borderRadius: 6,
              color: '#9ca3af',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: isDesktop ? 20 : 28 }}>
          <div className="detail-modal-body-grid" style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 24 }}>
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
              }}>{player.position === 'WR' && player.receivingByPerspective ? 'Receiving Breakdown' : 'Full Stat Breakdown'}</h3>

              {/* QB stats — from CFBD API */}
              {player.position === 'QB' && (
                <>
                  <StatRow label="Completion %" value={player.stats?.completionPct} benchmark={64} unit="%" />
                  <StatRow label="Passing Yards" value={player.stats?.passingYards?.toLocaleString()} />
                  <StatRow label="Passing TDs" value={player.stats?.passingTDs} benchmark={25} />
                  <StatRow label="Interceptions" value={player.stats?.interceptions} />
                  <StatRow label="Rushing Yards" value={player.stats?.rushingYards} />
                  <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} />
                </>
              )}

              {/* RB stats — from CFBD API */}
              {player.position === 'RB' && (
                <>
                  <StatRow label="Rushing Yards" value={player.stats?.rushingYards?.toLocaleString()} benchmark={1200} />
                  <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} benchmark={12} />
                  <StatRow label="YPC" value={player.stats?.yardsPerCarry} benchmark={5.0} />
                  <StatRow label="Yards After Contact" value={player.yardsAfterContact} />
                  <StatRow label="YAC/Attempt" value={player.ycoPerAttempt} benchmark={3.5} />
                  <StatRow label="Missed Tackles Forced" value={player.avoidedTackles} benchmark={40} />
                  <StatRow label="10+ Yard Runs" value={player.explosiveRuns} benchmark={25} />
                  <StatRow label="Receptions" value={player.stats?.receptions} benchmark={25} />
                  <StatRow label="Receiving Yards" value={player.stats?.receivingYards} />
                  <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} />
                </>
              )}

              {/* TE stats */}
              {player.position === 'TE' && (
                <>
                  <StatRow label="YPRR" value={player.yprr} benchmark={1.8} />
                  <StatRow label="Rec Grade" value={player.recGrade} benchmark={70} />
                  <StatRow label="Routes Run" value={player.routesRun} />
                  <StatRow label="Targets/RR" value={player.tgtPerRR} unit="%" benchmark={20} />
                  <StatRow label="1D+TD/RR" value={player.firstDownTDPerRR} />
                  <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" />
                  <StatRow label="Receptions" value={player.stats?.receptions} />
                  <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} />
                  <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} />
                  <StatRow label="Targets" value={player.stats?.targets} />
                  <StatRow label="YAC" value={player.yardsAfterCatch} />
                  <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} />
                  <StatRow label="Slot Rate" value={player.slotRate} unit="%" />
                  <StatRow label="Wide Rate" value={player.wideRate} unit="%" />
                  <StatRow label="Inline Rate" value={player.inlineRate} unit="%" />
                  <StatRow label="Contested Catch Rate" value={player.contestedCatchRate} unit="%" />
                  <StatRow label="Contested Receptions" value={player.contestedReceptions} />
                </>
              )}

              {/* WR — perspective-based receiving data */}
              {player.position === 'WR' && (() => {
                const pData = player.receivingByPerspective?.[modalPerspective];
                const val = (key) => pData?.[key] ?? null;
                return (
                  <>
                    {player.receivingByPerspective && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                        {Object.keys(player.receivingByPerspective).map(key => (
                          <button
                            key={key}
                            onClick={() => setModalPerspective(key)}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: modalPerspective === key ? 700 : 400,
                              padding: '4px 10px',
                              border: '1px solid',
                              borderColor: modalPerspective === key ? '#f59e0b' : '#2a2d3e',
                              borderRadius: 4,
                              cursor: 'pointer',
                              background: modalPerspective === key ? 'rgba(245,158,11,0.15)' : 'transparent',
                              color: modalPerspective === key ? '#f59e0b' : '#9ca3af',
                              transition: 'all 0.15s',
                            }}
                          >
                            {perspectiveLabels[key] || key}
                          </button>
                        ))}
                      </div>
                    )}
                    {pData ? (
                      <>
                        <StatRow label="YPRR" value={val('yprr')} benchmark={2.5} />
                        {modalPerspective === 'deepBall' ? (
                          <>
                            <StatRow label="Targets" value={val('targets')} />
                            <StatRow label="Receptions" value={val('receptions')} />
                            <StatRow label="% Career Rec Yards" value={val('pctCareerRecYds')} unit="%" />
                            <StatRow label="% Career Rec TDs" value={val('pctCareerRecTDs')} unit="%" />
                            <StatRow label="ADoT" value={val('adot')} />
                            <StatRow label="Contested Catch Rate" value={val('contestedCatchRate')} unit="%" />
                          </>
                        ) : modalPerspective === 'overall' ? (
                          <>
                            <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" />
                            <StatRow label="Routes Run" value={val('routesRun')} />
                            <StatRow label="Targets" value={val('targets')} />
                            <StatRow label="Receiving Yards" value={val('recYds')?.toLocaleString()} />
                            <StatRow label="Receiving TDs" value={val('recTDs')} />
                            <StatRow label="Targets/RR" value={val('tgtPerRR')} unit="%" benchmark={20} />
                            <StatRow label="1D+TD/RR" value={val('firstDownTDPerRR')} />
                            <StatRow label="YAC" value={player.yardsAfterCatch} />
                            <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} />
                            <StatRow label="Slot Rate" value={player.slotRate} unit="%" />
                            <StatRow label="Wide Rate" value={player.wideRate} unit="%" />
                            <StatRow label="Inline Rate" value={player.inlineRate} unit="%" />
                            <StatRow label="Contested Catch Rate" value={player.contestedCatchRate} unit="%" />
                            <StatRow label="Contested Receptions" value={player.contestedReceptions} />
                          </>
                        ) : (
                          <>
                            <StatRow label="Routes Run" value={val('routesRun')} />
                            <StatRow label="Targets" value={val('targets')} />
                            <StatRow label="% Career Rec Yards" value={val('pctCareerRecYds')} unit="%" />
                            <StatRow label="% Career Rec TDs" value={val('pctCareerRecTDs')} unit="%" />
                            <StatRow label="Targets/RR" value={val('tgtPerRR')} unit="%" benchmark={20} />
                            <StatRow label="1D+TD/RR" value={val('firstDownTDPerRR')} />
                          </>
                        )}
                        <StatRow label="Receiving Grade" value={val('recGrade')} benchmark={80} />
                      </>
                    ) : (
                      <>
                        {/* WR fallback — CFBD stats */}
                        <StatRow label="YPRR" value={player.yprr} benchmark={2.5} />
                        <StatRow label="Rec Grade" value={player.recGrade} benchmark={75} />
                        <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" />
                        <StatRow label="Receptions" value={player.stats?.receptions} />
                        <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} />
                        <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} />
                        <StatRow label="Targets" value={player.stats?.targets} />
                        <StatRow label="YAC" value={player.yardsAfterCatch} />
                        <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} />
                        <StatRow label="Slot Rate" value={player.slotRate} unit="%" />
                        <StatRow label="Wide Rate" value={player.wideRate} unit="%" />
                        <StatRow label="Inline Rate" value={player.inlineRate} unit="%" />
                        <StatRow label="Contested Catch Rate" value={player.contestedCatchRate} unit="%" />
                        <StatRow label="Contested Receptions" value={player.contestedReceptions} />
                      </>
                    )}
                  </>
                );
              })()}

              {!(player.position === 'WR' && player.receivingByPerspective) && (
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
              )}
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
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#2a2d3e" />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={({ x, y, payload, index }) => {
                      const radarData = getRadarData();
                      const pct = Math.round(radarData[index]?.value || 0);
                      return (
                        <g>
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            fill="#9ca3af"
                            fontSize={11}
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {payload.value}
                          </text>
                          <text
                            x={x}
                            y={y + 13}
                            textAnchor="middle"
                            fill={pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#6b7280'}
                            fontSize={10}
                            fontWeight={700}
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {pct}th %ile
                          </text>
                        </g>
                      );
                    }}
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

              {/* Unranked notice */}
              {isUnranked && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#6b7280',
                  background: '#1a1d2e',
                  borderRadius: 6,
                  padding: '10px 14px',
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                  UNR — Not ranked on FantasyCalc
                </div>
              )}

              {/* 1QB vs SF comparison */}
              {rankComparisonData.length > 0 && (<>
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
              </>)}
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
