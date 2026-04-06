import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { positionColors, positionChartColors, getBreakoutIndicator, hasInjuryRisk, computePercentile, getPercentileColor } from '../utils/helpers';
import { generateScoutingSummary } from '../services/scoutingSummary';
import { fetchDiscussions } from '../services/apiClient';
import { useTheme } from '../ThemeContext';
import DraftBadge from './DraftBadge';
import PlayerCompChip from './PlayerCompChip';
import ValueDelta from './ValueDelta';

// Perspective labels kept for UI compatibility (proprietary data source removed)
const perspectiveLabels = {
  overall: 'Overall', deepBall: 'Deep Ball', redZone: 'Red Zone', lateDown: 'Late Down',
};

/**
 * Enhanced StatRow with inline percentile bar.
 * Shows: [label] [====-----] [value] [pct badge]
 */
const StatRow = ({ label, value, benchmark, unit = '', allValues }) => {
  const displayValue = value == null || value === '' ? 'N/A' : value;
  const isNA = displayValue === 'N/A';
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : parseFloat(value);
  const pct = allValues ? computePercentile(numericValue, allValues) : null;
  const barColor = getPercentileColor(pct);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        color: 'var(--text-secondary)',
        width: 120,
        flexShrink: 0,
      }}>{label}</span>

      {/* Mini percentile bar */}
      {pct != null && (
        <div style={{
          flex: 1,
          height: 5,
          background: 'var(--bar-track)',
          borderRadius: 3,
          overflow: 'hidden',
          minWidth: 50,
          position: 'relative',
        }}>
          <div style={{
            width: `${Math.max(pct, 3)}%`,
            height: '100%',
            background: barColor,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
          {/* Benchmark tick */}
          {benchmark != null && allValues && (() => {
            const benchPct = computePercentile(benchmark, allValues);
            if (benchPct == null) return null;
            return (
              <div style={{
                position: 'absolute',
                left: `${benchPct}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--text-tertiary)',
                opacity: 0.5,
              }} />
            );
          })()}
        </div>
      )}
      {pct == null && <div style={{ flex: 1 }} />}

      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        color: isNA ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: 48,
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {isNA ? 'N/A' : `${displayValue}${unit}`}
      </span>

      {pct != null && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: barColor,
          minWidth: 28,
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {pct}th
        </span>
      )}
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: 11,
    color: 'var(--text-tertiary)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: '1px solid var(--border-primary)',
  }}>
    {children}
  </div>
);

const SIMPLIFIED_PERSPECTIVES = ['overall', 'deepBall', 'redZone', 'lateDown'];

const PlayerDetailModal = ({ player, allPlayers = [], perspective: initialPerspective = 'overall', onClose, isDesktopPanel = false }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [modalPerspective, setModalPerspective] = useState(initialPerspective);
  const [slideIn, setSlideIn] = useState(false);
  const [recentThreads, setRecentThreads] = useState([]);
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isDesktop = isDesktopPanel || winWidth >= 1025;
  const isTabletLandscape = winWidth >= 1025 && winWidth <= 1400;

  const posColor = positionColors[player.position] || positionColors.WR;
  const chartColor = positionChartColors[player.position] || positionChartColors.WR;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const injured = hasInjuryRisk(player);

  // Same-position peers for percentile stat bars
  const peers = allPlayers.filter(p => p.position === player.position);
  const peerVals = (accessor) => peers.map(accessor).filter(v => v != null);

  const handleGenerateSummary = () => {
    setSummary(generateScoutingSummary(player));
  };

  useEffect(() => {
    requestAnimationFrame(() => setSlideIn(true));
  }, []);

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

  // Fetch recent discussions for this player
  useEffect(() => {
    const loadThreads = async () => {
      try {
        const { discussions } = await fetchDiscussions(String(player.id), 'hot');
        setRecentThreads((discussions || []).slice(0, 3));
      } catch { setRecentThreads([]); }
    };
    loadThreads();
  }, [player.id]);

  const getRadarData = () => {
    const s = player.stats || {};
    const pos = player.position;
    const peers = allPlayers.filter(p => p.position === pos);

    if (pos === 'QB') {
      return [
        { stat: 'Comp %', value: computePercentile(s.completionPct, peers.map(p => p.stats?.completionPct)), fullMark: 100 },
        { stat: 'Pass TDs', value: computePercentile(s.passingTDs, peers.map(p => p.stats?.passingTDs)), fullMark: 100 },
        { stat: 'Y/A', value: computePercentile(s.yardsPerAttempt, peers.map(p => p.stats?.yardsPerAttempt)), fullMark: 100 },
        { stat: 'TD/INT', value: computePercentile(s.tdIntRatio, peers.map(p => p.stats?.tdIntRatio)), fullMark: 100 },
        { stat: 'Rush YDs', value: computePercentile(s.rushingYards, peers.map(p => p.stats?.rushingYards)), fullMark: 100 },
      ];
    }

    if (pos === 'RB') {
      return [
        { stat: 'Rush YDs', value: computePercentile(s.rushingYards, peers.map(p => p.stats?.rushingYards)), fullMark: 100 },
        { stat: 'YPC', value: computePercentile(s.yardsPerCarry, peers.map(p => p.stats?.yardsPerCarry)), fullMark: 100 },
        { stat: 'Rec Work', value: computePercentile(s.receivingWorkPct, peers.map(p => p.stats?.receivingWorkPct)), fullMark: 100 },
        { stat: 'Total TDs', value: computePercentile(s.totalTDs, peers.map(p => p.stats?.totalTDs)), fullMark: 100 },
        { stat: 'Receiving', value: computePercentile(s.receivingYards, peers.map(p => p.stats?.receivingYards)), fullMark: 100 },
      ];
    }

    if (pos === 'WR') {
      const pData = player.receivingByPerspective?.[modalPerspective];
      if (pData) {
        return [
          { stat: 'YPRR', value: computePercentile(pData.yprr, peers.map(p => p.receivingByPerspective?.[modalPerspective]?.yprr)), fullMark: 100 },
          { stat: 'Tgt/RR', value: computePercentile(pData.tgtPerRR, peers.map(p => p.receivingByPerspective?.[modalPerspective]?.tgtPerRR)), fullMark: 100 },
          { stat: '1D+TD/RR', value: computePercentile(pData.firstDownTDPerRR, peers.map(p => p.receivingByPerspective?.[modalPerspective]?.firstDownTDPerRR)), fullMark: 100 },
          { stat: 'YAC/Rec', value: computePercentile(player.yardsAfterCatchPerRec, peers.map(p => p.yardsAfterCatchPerRec)), fullMark: 100 },
          { stat: 'Tgt Share', value: computePercentile(player.targetShare, peers.map(p => p.targetShare)), fullMark: 100 },
          { stat: 'Rec YDs', value: computePercentile(pData.recYds || s.receivingYards, peers.map(p => p.receivingByPerspective?.[modalPerspective]?.recYds || p.stats?.receivingYards)), fullMark: 100 },
        ];
      }
      return [
        { stat: 'YPRR', value: computePercentile(player.yprr, peers.map(p => p.yprr)), fullMark: 100 },
        { stat: 'Tgt Share', value: computePercentile(player.targetShare, peers.map(p => p.targetShare)), fullMark: 100 },
        { stat: 'YAC/Rec', value: computePercentile(player.yardsAfterCatchPerRec, peers.map(p => p.yardsAfterCatchPerRec)), fullMark: 100 },
        { stat: 'Cont %', value: computePercentile(player.contestedCatchRate, peers.map(p => p.contestedCatchRate)), fullMark: 100 },
        { stat: 'Rec YDs', value: computePercentile(s.receivingYards, peers.map(p => p.stats?.receivingYards)), fullMark: 100 },
      ];
    }

    // TE
    return [
      { stat: 'Rec YDs', value: computePercentile(s.receivingYards, peers.map(p => p.stats?.receivingYards)), fullMark: 100 },
      { stat: 'Receptions', value: computePercentile(s.receptions, peers.map(p => p.stats?.receptions)), fullMark: 100 },
      { stat: 'TDs', value: computePercentile(s.receivingTDs, peers.map(p => p.stats?.receivingTDs)), fullMark: 100 },
      { stat: 'Tgt Share', value: computePercentile(player.targetShare, peers.map(p => p.targetShare)), fullMark: 100 },
      { stat: 'YAC/Rec', value: computePercentile(player.yardsAfterCatchPerRec, peers.map(p => p.yardsAfterCatchPerRec)), fullMark: 100 },
    ];
  };

  const isUnranked = player.rank?.oneQB === 'UNR' || player.rank?.superflex === 'UNR';
  const rankComparisonData = player.rank && player.dynastyADP && !isUnranked ? [
    { format: '1QB', rank: player.rank.oneQB, adp: player.dynastyADP.oneQB },
    { format: 'SF', rank: player.rank.superflex, adp: player.dynastyADP.superflex },
  ] : [];

  const rankDelta = player.rank && !isUnranked ? (player.rank.oneQB - player.rank.superflex) : 0;

  const availablePerspectives = player.receivingByPerspective
    ? SIMPLIFIED_PERSPECTIVES.filter(k => player.receivingByPerspective[k])
    : [];

  // Chart theme colors
  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const labelColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tickColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  const panelContent = (
    <>
      {/* Header */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: isDesktop ? (isTabletLandscape ? '16px 18px' : '20px 24px') : '24px 28px',
          borderBottom: '1px solid var(--border-primary)',
          position: 'relative',
        }}>
          {injured && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: 'var(--danger)',
              color: '#fff',
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 16px',
              textAlign: 'center',
              letterSpacing: 0.5,
            }}>
              INJURY HISTORY \u2014 {player.injuries.map(i => i.type).join(', ')}
            </div>
          )}

          <div style={{ marginTop: injured ? 24 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap', paddingRight: 40 }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: isDesktop ? 24 : 28,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {player.name}
              </h2>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: posColor.text,
                background: posColor.bg,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}>
                {player.position}
              </span>
              {player.draftPick && (
                <>
                  <DraftBadge round={player.draftRound} pick={player.draftPick} team={player.draftTeam} isProjected={player.draftIsProjected} />
                  <ValueDelta rank={player.rank?.oneQB} adp={player.dynastyADP?.oneQB} />
                </>
              )}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              {[player.college, player.height && player.weight ? `${player.height} / ${player.weight} lbs` : null, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' \u00B7 ') || 'TBD'}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: injured ? 36 : 12,
              right: 12,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 16,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 10px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            \u00D7
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: isDesktop ? 20 : 28 }}>
          <div className="detail-modal-body-grid" style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Stats */}
            <div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--accent-text)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                Stats
                {player.gamesPlayed && (
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 500,
                    color: 'var(--text-tertiary)', marginLeft: 8, textTransform: 'none', letterSpacing: 0,
                  }}>
                    {player.gamesPlayed} games
                  </span>
                )}
              </h3>

              {player.position === 'QB' && (
                <>
                  <SectionLabel>Passing</SectionLabel>
                  <StatRow label="Completion %" value={player.stats?.completionPct} benchmark={64} unit="%" allValues={peerVals(p => p.stats?.completionPct)} />
                  <StatRow label="Passing Yards" value={player.stats?.passingYards?.toLocaleString()} allValues={peerVals(p => p.stats?.passingYards)} />
                  <StatRow label="Passing TDs" value={player.stats?.passingTDs} benchmark={25} allValues={peerVals(p => p.stats?.passingTDs)} />
                  <StatRow label="Interceptions" value={player.stats?.interceptions} />
                  <SectionLabel>Efficiency</SectionLabel>
                  <StatRow label="Yards/Attempt" value={player.stats?.yardsPerAttempt} benchmark={8.0} allValues={peerVals(p => p.stats?.yardsPerAttempt)} />
                  <StatRow label="TD/INT Ratio" value={player.stats?.tdIntRatio} benchmark={2.5} allValues={peerVals(p => p.stats?.tdIntRatio)} />
                  <SectionLabel>Rushing</SectionLabel>
                  <StatRow label="Rushing Yards" value={player.stats?.rushingYards} allValues={peerVals(p => p.stats?.rushingYards)} />
                  <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} allValues={peerVals(p => p.stats?.rushingTDs)} />
                  <StatRow label="Rush Share" value={player.stats?.rushingShare} unit="%" allValues={peerVals(p => p.stats?.rushingShare)} />
                </>
              )}

              {player.position === 'RB' && (
                <>
                  <SectionLabel>Production</SectionLabel>
                  <StatRow label="Total Yards" value={player.stats?.totalYards?.toLocaleString()} allValues={peerVals(p => p.stats?.totalYards)} />
                  <StatRow label="Rushing Yards" value={player.stats?.rushingYards?.toLocaleString()} benchmark={1200} allValues={peerVals(p => p.stats?.rushingYards)} />
                  <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} benchmark={12} allValues={peerVals(p => p.stats?.rushingTDs)} />
                  <StatRow label="YPC" value={player.stats?.yardsPerCarry} benchmark={5.0} allValues={peerVals(p => p.stats?.yardsPerCarry)} />
                  <SectionLabel>Receiving</SectionLabel>
                  <StatRow label="Receptions" value={player.stats?.receptions} benchmark={25} allValues={peerVals(p => p.stats?.receptions)} />
                  <StatRow label="Receiving Yards" value={player.stats?.receivingYards} allValues={peerVals(p => p.stats?.receivingYards)} />
                  <StatRow label="Rec Work %" value={player.stats?.receivingWorkPct} unit="%" allValues={peerVals(p => p.stats?.receivingWorkPct)} />
                  <SectionLabel>Efficiency</SectionLabel>
                  <StatRow label="Total TDs" value={player.stats?.totalTDs} allValues={peerVals(p => p.stats?.totalTDs)} />
                  <StatRow label="YAC/Attempt" value={player.ycoPerAttempt} benchmark={3.5} allValues={peerVals(p => p.ycoPerAttempt)} />
                  <StatRow label="MTF" value={player.avoidedTackles} benchmark={40} allValues={peerVals(p => p.avoidedTackles)} />
                </>
              )}

              {player.position === 'TE' && (
                <>
                  <SectionLabel>Production</SectionLabel>
                  <StatRow label="Receptions" value={player.stats?.receptions} allValues={peerVals(p => p.stats?.receptions)} />
                  <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} allValues={peerVals(p => p.stats?.receivingYards)} />
                  <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} allValues={peerVals(p => p.stats?.receivingTDs)} />
                  <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" allValues={peerVals(p => p.targetShare)} />
                  <SectionLabel>Efficiency</SectionLabel>
                  <StatRow label="YPRR" value={player.yprr} benchmark={1.8} />
                  {player.stats?.catchRate != null && <StatRow label="Catch Rate" value={player.stats.catchRate} unit="%" benchmark={65} allValues={peerVals(p => p.stats?.catchRate)} />}
                  {player.stats?.yardsPerTarget != null && <StatRow label="Yards/Target" value={player.stats.yardsPerTarget} benchmark={9} allValues={peerVals(p => p.stats?.yardsPerTarget)} />}
                  {player.stats?.yardsPerReception != null && <StatRow label="Yards/Rec" value={player.stats.yardsPerReception} benchmark={12} allValues={peerVals(p => p.stats?.yardsPerReception)} />}
                  {player.stats?.tdRate != null && <StatRow label="TD Rate" value={player.stats.tdRate} unit="%" benchmark={8} allValues={peerVals(p => p.stats?.tdRate)} />}
                  <StatRow label="Rec Grade" value={player.recGrade} benchmark={70} allValues={peerVals(p => p.recGrade)} />
                  <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} allValues={peerVals(p => p.yardsAfterCatchPerRec)} />
                </>
              )}

              {player.position === 'WR' && (() => {
                const pData = player.receivingByPerspective?.[modalPerspective];
                const val = (key) => pData?.[key] ?? null;
                return (
                  <>
                    {availablePerspectives.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                        {availablePerspectives.map(key => (
                          <button
                            key={key}
                            onClick={() => setModalPerspective(key)}
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 11,
                              fontWeight: modalPerspective === key ? 600 : 400,
                              padding: '4px 10px',
                              border: '1px solid',
                              borderColor: modalPerspective === key ? 'var(--accent)' : 'var(--border-primary)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              background: modalPerspective === key ? 'var(--accent-light)' : 'transparent',
                              color: modalPerspective === key ? 'var(--accent-text)' : 'var(--text-secondary)',
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
                        {modalPerspective === 'deepBall' ? (
                          <>
                            <SectionLabel>Deep Ball</SectionLabel>
                            <StatRow label="YPRR" value={val('yprr')} benchmark={2.5} />
                            <StatRow label="Targets" value={val('targets')} />
                            <StatRow label="Receptions" value={val('receptions')} />
                            <StatRow label="ADoT" value={val('adot')} />
                            <StatRow label="Contested Catch %" value={val('contestedCatchRate')} unit="%" />
                            <StatRow label="Receiving Grade" value={val('recGrade')} benchmark={80} />
                          </>
                        ) : modalPerspective === 'overall' ? (
                          <>
                            <SectionLabel>Production</SectionLabel>
                            <StatRow label="Receiving Yards" value={val('recYds')?.toLocaleString()} />
                            <StatRow label="Receiving TDs" value={val('recTDs')} />
                            <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" />
                            <SectionLabel>Efficiency</SectionLabel>
                            <StatRow label="YPRR" value={val('yprr')} benchmark={2.5} />
                            <StatRow label="Targets/RR" value={val('tgtPerRR')} unit="%" benchmark={20} />
                            <StatRow label="1D+TD/RR" value={val('firstDownTDPerRR')} />
                            <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} />
                            <StatRow label="Contested Catch %" value={player.contestedCatchRate} unit="%" />
                            <StatRow label="Receiving Grade" value={val('recGrade')} benchmark={80} />
                          </>
                        ) : (
                          <>
                            <SectionLabel>{perspectiveLabels[modalPerspective] || modalPerspective}</SectionLabel>
                            <StatRow label="YPRR" value={val('yprr')} benchmark={2.5} />
                            <StatRow label="Targets" value={val('targets')} />
                            <StatRow label="Targets/RR" value={val('tgtPerRR')} unit="%" benchmark={20} />
                            <StatRow label="1D+TD/RR" value={val('firstDownTDPerRR')} />
                            <StatRow label="Receiving Grade" value={val('recGrade')} benchmark={80} />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <SectionLabel>Production</SectionLabel>
                        <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} />
                        <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} />
                        <StatRow label="Target Share" value={player.targetShare} benchmark={20} unit="%" />
                        <SectionLabel>Efficiency</SectionLabel>
                        <StatRow label="YPRR" value={player.yprr} benchmark={2.5} />
                        {player.stats?.catchRate != null && <StatRow label="Catch Rate" value={player.stats.catchRate} unit="%" benchmark={65} />}
                        {player.stats?.yardsPerTarget != null && <StatRow label="Yards/Target" value={player.stats.yardsPerTarget} benchmark={9} />}
                        {player.stats?.tdRate != null && <StatRow label="TD Rate" value={player.stats.tdRate} unit="%" benchmark={8} />}
                        <StatRow label="Rec Grade" value={player.recGrade} benchmark={75} />
                        <StatRow label="YAC/Rec" value={player.yardsAfterCatchPerRec} benchmark={5.0} />
                        <StatRow label="Contested Catch %" value={player.contestedCatchRate} unit="%" />
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
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: breakout.color,
                      fontWeight: 600,
                    }}>
                      {breakout.label} Breakout Profile
                    </div>
              </div>
              )}
            </div>

            {/* Radar chart */}
            <div>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--accent-text)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>Player Profile</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={({ x, y, payload, index }) => {
                      const radarData = getRadarData();
                      const pct = Math.round(radarData[index]?.value || 0);
                      return (
                        <g>
                          <text x={x} y={y} textAnchor="middle" fill={labelColor} fontSize={11} fontFamily="'Inter', sans-serif">
                            {payload.value}
                          </text>
                          <text
                            x={x} y={y + 13} textAnchor="middle"
                            fill={pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : tickColor}
                            fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace"
                          >
                            {pct}th
                          </text>
                        </g>
                      );
                    }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar name={player.name} dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>

              {isUnranked && (
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                  UNR \u2014 Not ranked on FantasyCalc
                </div>
              )}

              {rankComparisonData.length > 0 && (<>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--accent-text)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginTop: 16,
                marginBottom: 8,
              }}>1QB vs Superflex</h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={rankComparisonData} layout="vertical">
                  <XAxis type="number" domain={[0, 40]} tick={{ fill: tickColor, fontSize: 10 }} reversed />
                  <YAxis type="category" dataKey="format" tick={{ fill: labelColor, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Bar dataKey="rank" fill="#3b82f6" name="Rank" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="adp" fill="#7c3aed" name="ADP" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text-tertiary)',
                marginTop: 4,
              }}>
                Rank Delta: {rankDelta > 0 ? `+${rankDelta} spots higher in SF` : rankDelta < 0 ? `${Math.abs(rankDelta)} spots higher in 1QB` : 'Same rank'}
                {player.position === 'QB' && rankDelta > 0 && (
                  <span style={{ color: 'var(--warning)' }}> \u2014 QB premium</span>
                )}
              </div>
              </>)}
            </div>
          </div>

          {/* Injuries */}
          {injured && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              marginBottom: 24,
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--danger)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>Injury Timeline</h3>
              {player.injuries.map((injury, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: i < player.injuries.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: injury.severity === 'severe' ? 'var(--danger)' : 'var(--warning)',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {injury.type}
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--text-secondary)' }}>
                      {injury.date} \u00B7 {injury.severity} \u00B7 {injury.gamesOut} games missed
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
                fontSize: 15,
                color: 'var(--accent-text)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Player Comps</h3>
              <PlayerCompChip comps={player.playerComps} max={5} />
            </div>
          )}

          {/* AI Summary */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            border: '1px solid var(--border-primary)',
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
                fontSize: 15,
                color: 'var(--accent-text)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                margin: 0,
              }}>AI Scouting Report</h3>
              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '7px 14px',
                    border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'var(--accent-light)',
                    color: 'var(--accent-text)',
                    transition: 'all 0.15s',
                  }}
                >
                  Generate Report
                </button>
              )}
            </div>
            {summary ? (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                {summary}
              </p>
            ) : (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: 'var(--text-tertiary)',
                margin: 0,
              }}>
                Click "Generate Report" for an AI scouting analysis.
              </p>
            )}
          </div>
        </div>

        {/* Discussion preview */}
        <div style={{ padding: isDesktop ? '16px 24px 24px' : '16px 28px 28px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10,
          }}>
            <h4 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 14, letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'var(--text-primary)', margin: 0,
            }}>
              Discussions
            </h4>
            <button
              onClick={() => navigate(`/community?player=${player.id}`)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                color: 'var(--accent-text)',
              }}
            >
              View All →
            </button>
          </div>
          {recentThreads.length === 0 ? (
            <div style={{
              padding: '12px 0',
              fontFamily: "'Inter', sans-serif", fontSize: 12,
              color: 'var(--text-tertiary)',
            }}>
              No discussions yet.{' '}
              <button
                onClick={() => navigate(`/community?player=${player.id}`)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600,
                  color: 'var(--accent-text)', padding: 0,
                }}
              >
                Start one →
              </button>
            </div>
          ) : (
            recentThreads.map(d => (
              <div
                key={d.id}
                onClick={() => navigate(`/community?player=${player.id}`)}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                  color: 'var(--text-primary)', lineHeight: 1.3,
                }}>
                  {d.title}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: 'var(--text-tertiary)',
                  marginTop: 3, display: 'flex', gap: 8,
                }}>
                  <span>{d.username || 'Anonymous'}</span>
                  <span>↑{d.upvote_count || 0}</span>
                  <span>💬{d.comment_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
    </>
  );

  // Desktop grid child: sticky sidebar
  if (isDesktopPanel) {
    return (
      <div
        className="detail-modal-panel"
        style={{
          position: 'sticky',
          top: 'var(--header-height)',
          height: 'calc(100vh - var(--header-height))',
          overflowY: 'auto',
          background: 'var(--bg-modal)',
          borderLeft: '1px solid var(--border-primary)',
        }}
      >
        {panelContent}
      </div>
    );
  }

  // Mobile/tablet: fixed overlay with backdrop
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 200,
        transition: 'background 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        className="detail-modal-panel"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '100vw',
          background: 'var(--bg-modal)',
          borderRadius: 12,
          overflowY: 'auto',
          transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {panelContent}
      </div>
    </div>
  );
};

export default PlayerDetailModal;
