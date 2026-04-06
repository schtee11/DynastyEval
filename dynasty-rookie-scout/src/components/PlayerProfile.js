import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { positionColors, positionChartColors, getBreakoutIndicator, hasInjuryRisk, computePercentile, getPercentileColor } from '../utils/helpers';
import { generateScoutingSummary } from '../services/scoutingSummary';
import { useTheme } from '../ThemeContext';
import DraftBadge from './DraftBadge';
import ValueDelta from './ValueDelta';
import ProspectGlance from './ProspectGlance';

const StatRow = ({ label, value, benchmark, unit = '', allValues }) => {
  const displayValue = value == null || value === '' ? 'N/A' : value;
  const isNA = displayValue === 'N/A';
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : parseFloat(value);
  const pct = allValues ? computePercentile(numericValue, allValues) : null;
  const barColor = getPercentileColor(pct);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{
        fontFamily: "'Inter', sans-serif", fontSize: 12,
        color: 'var(--text-secondary)', width: 130, flexShrink: 0,
      }}>{label}</span>
      {pct != null && (
        <div style={{
          flex: 1, height: 6, background: 'var(--bar-track)',
          borderRadius: 3, overflow: 'hidden', minWidth: 60, position: 'relative',
        }}>
          <div style={{
            width: `${Math.max(pct, 3)}%`, height: '100%',
            background: barColor, borderRadius: 3, transition: 'width 0.4s ease',
          }} />
          {benchmark != null && allValues && (() => {
            const benchPct = computePercentile(benchmark, allValues);
            if (benchPct == null) return null;
            return (
              <div style={{
                position: 'absolute', left: `${benchPct}%`, top: 0, bottom: 0,
                width: 1, background: 'var(--text-tertiary)', opacity: 0.5,
              }} />
            );
          })()}
        </div>
      )}
      {pct == null && <div style={{ flex: 1 }} />}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
        color: isNA ? 'var(--text-tertiary)' : 'var(--text-primary)',
        minWidth: 52, textAlign: 'right', flexShrink: 0,
      }}>
        {isNA ? 'N/A' : `${displayValue}${unit}`}
      </span>
      {pct != null && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
          color: barColor, minWidth: 28, textAlign: 'right', flexShrink: 0,
        }}>
          {pct}th
        </span>
      )}
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11,
    color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 4, paddingBottom: 4,
    borderBottom: '1px solid var(--border-primary)',
  }}>
    {children}
  </div>
);

const extractYouTubeId = (url) => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const PlayerProfile = ({ player, allPlayers, studiedPlayers, toggleStudied, onBack, onSelectPlayer, videos = [], onAddVideo, onRemoveVideo }) => {
  const { theme } = useTheme();
  const [summary, setSummary] = useState(null);
  const [videoInput, setVideoInput] = useState('');

  const posColor = positionColors[player.position] || positionColors.WR;
  const chartColor = positionChartColors[player.position] || positionChartColors.WR;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const injured = hasInjuryRisk(player);
  const isStudied = studiedPlayers.has(player.id);

  const peers = allPlayers.filter(p => p.position === player.position);
  const peerVals = (accessor) => peers.map(accessor).filter(v => v != null);

  // Sorted player list for prev/next
  const sortedIds = useMemo(() => allPlayers
    .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .sort((a, b) => {
      const ra = a.rank?.oneQB === 'UNR' ? 999 : (a.rank?.oneQB || 999);
      const rb = b.rank?.oneQB === 'UNR' ? 999 : (b.rank?.oneQB || 999);
      return ra - rb;
    })
    .map(p => p.id), [allPlayers]);

  const currentIdx = sortedIds.indexOf(player.id);
  const prevId = currentIdx > 0 ? sortedIds[currentIdx - 1] : null;
  const nextId = currentIdx < sortedIds.length - 1 ? sortedIds[currentIdx + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' && prevId) onSelectPlayer(prevId);
      if (e.key === 'ArrowRight' && nextId) onSelectPlayer(nextId);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [prevId, nextId, onSelectPlayer]);

  // Reset state on player change
  useEffect(() => {
    setSummary(null);
  }, [player.id]);

  const handleGenerateSummary = () => {
    setSummary(generateScoutingSummary(player));
  };

  const getRadarData = useCallback(() => {
    const s = player.stats || {};
    const pos = player.position;
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
      const radarStats = [
        { stat: 'Rec YDs', value: computePercentile(s.receivingYards, peers.map(p => p.stats?.receivingYards)), fullMark: 100 },
        { stat: 'Receptions', value: computePercentile(s.receptions, peers.map(p => p.stats?.receptions)), fullMark: 100 },
        { stat: 'TDs', value: computePercentile(s.receivingTDs, peers.map(p => p.stats?.receivingTDs)), fullMark: 100 },
        { stat: 'Cont %', value: computePercentile(player.contestedCatchRate, peers.map(p => p.contestedCatchRate)), fullMark: 100 },
      ];
      if (player.advancedStats?.yprr) {
        radarStats.push({ stat: 'YPRR', value: computePercentile(player.advancedStats.yprr, peers.map(p => p.advancedStats?.yprr).filter(Boolean)), fullMark: 100 });
      }
      return radarStats;
    }
    // TE
    return [
      { stat: 'Rec YDs', value: computePercentile(s.receivingYards, peers.map(p => p.stats?.receivingYards)), fullMark: 100 },
      { stat: 'Receptions', value: computePercentile(s.receptions, peers.map(p => p.stats?.receptions)), fullMark: 100 },
      { stat: 'TDs', value: computePercentile(s.receivingTDs, peers.map(p => p.stats?.receivingTDs)), fullMark: 100 },
      { stat: 'Tgt Share', value: computePercentile(player.targetShare, peers.map(p => p.targetShare)), fullMark: 100 },
      { stat: 'YAC/Rec', value: computePercentile(player.yardsAfterCatchPerRec, peers.map(p => p.yardsAfterCatchPerRec)), fullMark: 100 },
    ];
  }, [player, peers]);

  // Filter out radar entries with no data (null percentile shows as 0th)
  const radarData = useMemo(() => getRadarData().filter(d => d.value != null && d.value > 0), [getRadarData]);

  const isUnranked = player.rank?.oneQB === 'UNR' || player.rank?.superflex === 'UNR';
  const rankComparisonData = player.rank && player.dynastyADP && !isUnranked ? [
    { format: '1QB', rank: player.rank.oneQB, adp: player.dynastyADP.oneQB },
    { format: 'SF', rank: player.rank.superflex, adp: player.dynastyADP.superflex },
  ] : [];

  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const labelColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tickColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Navigation bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, gap: 12,
      }}>
        <button onClick={onBack} style={{
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
          color: 'var(--accent-text)', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}>
          &larr; All Prospects
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {prevId && (
            <button onClick={() => onSelectPlayer(prevId)} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', padding: '5px 12px',
            }}>
              &larr; Prev
            </button>
          )}
          {nextId && (
            <button onClick={() => onSelectPlayer(nextId)} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', padding: '5px 12px',
            }}>
              Next &rarr;
            </button>
          )}
        </div>
      </div>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)', overflow: 'hidden', marginBottom: 24,
      }}>
        {/* Position color bar */}
        <div style={{ height: 4, background: posColor.border }} />

        {injured && (
          <div style={{
            background: 'var(--danger)', color: '#fff',
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
            padding: '5px 16px', textAlign: 'center', letterSpacing: 0.5,
          }}>
            INJURY HISTORY — {player.injuries.map(i => i.type).join(', ')}
          </div>
        )}

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              {/* Name with headshot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                {player.sleeperId ? (
                  <img
                    src={`/api/img/player/${encodeURIComponent(player.name)}.png`}
                    alt={player.name}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      objectFit: 'cover', border: `2px solid ${posColor.border}`,
                      flexShrink: 0,
                    }}
                  />
                ) : null}
                {player.sleeperId ? (
                  <div style={{
                    display: 'none', width: 56, height: 56, borderRadius: '50%',
                    background: posColor.bg, border: `2px solid ${posColor.border}`,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14,
                    color: posColor.text,
                  }}>
                    {player.position}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', width: 56, height: 56, borderRadius: '50%',
                    background: posColor.bg, border: `2px solid ${posColor.border}`,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14,
                    color: posColor.text,
                  }}>
                    {player.position}
                  </div>
                )}
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                  fontSize: 36, color: 'var(--text-primary)', margin: 0,
                  lineHeight: 1.1,
                }}>
                  {player.name}
                </h1>
              </div>

              {/* Position + College + Measurables */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13,
                  color: posColor.text, background: posColor.bg,
                  padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                }}>
                  {player.position}
                </span>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--text-secondary)',
                }}>
                  {[player.college, player.height && player.weight ? `${player.height} / ${player.weight} lbs` : null, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' · ')}
                </span>
              </div>

              {/* Draft + Rankings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {player.draftPick && (
                  <DraftBadge round={player.draftRound} pick={player.draftPick} team={player.draftTeam} isProjected={player.draftIsProjected} />
                )}
                <ValueDelta rank={player.rank?.oneQB} adp={player.dynastyADP?.oneQB} />
                {player.rank && !isUnranked && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
                      color: 'var(--text-secondary)', background: 'var(--bg-tertiary)',
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    }}>
                      1QB #{player.rank.oneQB}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
                      color: 'var(--text-secondary)', background: 'var(--bg-tertiary)',
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    }}>
                      SF #{player.rank.superflex}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Studied toggle */}
            <button
              onClick={() => toggleStudied(player.id)}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: isStudied ? 'var(--success)' : 'var(--border-primary)',
                background: isStudied ? 'var(--success)' : 'var(--bg-tertiary)',
                color: isStudied ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {isStudied ? '\u2713 Studied' : 'Mark as Studied'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <div className="profile-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 24,
      }}>
        {/* LEFT: At a Glance */}
        <ProspectGlance player={player} allPlayers={allPlayers} />

        {/* RIGHT: Radar Chart */}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)', padding: 20,
        }}>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
            color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
            margin: '0 0 16px',
          }}>
            Player Profile
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="stat"
                tick={({ x, y, payload, index }) => {
                  const rd = radarData;
                  const pct = Math.round(rd[index]?.value || 0);
                  return (
                    <g>
                      <text x={x} y={y} textAnchor="middle" fill={labelColor} fontSize={11} fontFamily="'Inter', sans-serif">
                        {payload.value}
                      </text>
                      <text x={x} y={y + 13} textAnchor="middle"
                        fill={pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : tickColor}
                        fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
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

          {/* Rank comparison */}
          {rankComparisonData.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14,
                color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                Rank vs ADP
              </h4>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={rankComparisonData} layout="vertical">
                  <XAxis type="number" domain={[0, 40]} tick={{ fill: tickColor, fontSize: 10 }} reversed />
                  <YAxis type="category" dataKey="format" tick={{ fill: labelColor, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 6 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Bar dataKey="rank" fill="#3b82f6" name="Rank" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="adp" fill="#94a3b8" name="ADP" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FULL STAT BREAKDOWN ═══ */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)', padding: 24, marginTop: 24,
      }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
          color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
          margin: '0 0 4px',
        }}>
          Full Statistics
          {player.gamesPlayed && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500,
              color: 'var(--text-tertiary)', marginLeft: 8, textTransform: 'none', letterSpacing: 0,
            }}>
              {player.gamesPlayed} games
            </span>
          )}
        </h3>

        <div className="stats-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            {player.position === 'QB' && (
              <>
                <SectionLabel>QB Production</SectionLabel>
                <StatRow label="Passing Yards" value={player.stats?.passingYards?.toLocaleString()} allValues={peerVals(p => p.stats?.passingYards)} />
                <StatRow label="Passing TDs" value={player.stats?.passingTDs} benchmark={25} allValues={peerVals(p => p.stats?.passingTDs)} />
                <StatRow label="INTs" value={player.stats?.interceptions} allValues={peerVals(p => p.stats?.interceptions)} />
                <StatRow label="Completion %" value={player.stats?.completionPct} benchmark={64} unit="%" allValues={peerVals(p => p.stats?.completionPct)} />
              </>
            )}

            {player.position === 'RB' && (
              <>
                <SectionLabel>RB Production</SectionLabel>
                <StatRow label="Rushing Yards" value={player.stats?.rushingYards?.toLocaleString()} benchmark={1200} allValues={peerVals(p => p.stats?.rushingYards)} />
                <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} benchmark={12} allValues={peerVals(p => p.stats?.rushingTDs)} />
                <StatRow label="YPC" value={player.stats?.yardsPerCarry} benchmark={5.0} allValues={peerVals(p => p.stats?.yardsPerCarry)} />
              </>
            )}

            {player.position === 'WR' && (
              <>
                <SectionLabel>WR Production</SectionLabel>
                <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} allValues={peerVals(p => p.stats?.receivingYards)} />
                <StatRow label="Receptions" value={player.stats?.receptions} allValues={peerVals(p => p.stats?.receptions)} />
                <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} allValues={peerVals(p => p.stats?.receivingTDs)} />
                {player.advancedStats?.yprr && (
                  <>
                    <SectionLabel>Efficiency</SectionLabel>
                    <StatRow label="YPRR" value={player.advancedStats.yprr.toFixed(2)} allValues={player.position === 'WR' ? peerVals(p => p.advancedStats?.yprr) : undefined} />
                  </>
                )}
              </>
            )}

            {player.position === 'TE' && (
              <>
                <SectionLabel>Production</SectionLabel>
                <StatRow label="Receiving Yards" value={player.stats?.receivingYards?.toLocaleString()} allValues={peerVals(p => p.stats?.receivingYards)} />
                <StatRow label="Receptions" value={player.stats?.receptions} allValues={peerVals(p => p.stats?.receptions)} />
                <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} allValues={peerVals(p => p.stats?.receivingTDs)} />
                {player.advancedStats?.yprr && (
                  <>
                    <SectionLabel>Efficiency</SectionLabel>
                    <StatRow label="YPRR" value={player.advancedStats.yprr.toFixed(2)} allValues={player.position === 'WR' ? peerVals(p => p.advancedStats?.yprr) : undefined} />
                  </>
                )}
              </>
            )}
          </div>

          <div>
            {player.position === 'QB' && (
              <>
                <SectionLabel>Rushing</SectionLabel>
                <StatRow label="Rushing Yards" value={player.stats?.rushingYards} allValues={peerVals(p => p.stats?.rushingYards)} />
                <StatRow label="Rushing TDs" value={player.stats?.rushingTDs} allValues={peerVals(p => p.stats?.rushingTDs)} />
              </>
            )}

            {player.position === 'RB' && (
              <>
                <SectionLabel>Receiving</SectionLabel>
                <StatRow label="Receptions" value={player.stats?.receptions} benchmark={25} allValues={peerVals(p => p.stats?.receptions)} />
                <StatRow label="Receiving Yards" value={player.stats?.receivingYards} allValues={peerVals(p => p.stats?.receivingYards)} />
                <StatRow label="Receiving TDs" value={player.stats?.receivingTDs} allValues={peerVals(p => p.stats?.receivingTDs)} />
              </>
            )}

            {player.position === 'TE' && (
              <>
                <SectionLabel>Usage</SectionLabel>
                <StatRow label="Targets" value={player.stats?.targets || null} allValues={peerVals(p => p.stats?.targets)} />
              </>
            )}

            {/* Breakout age for all */}
            <div style={{ marginTop: 16 }}>
              <SectionLabel>Profile</SectionLabel>
              <StatRow label="Breakout Age" value={player.breakoutAge || 'N/A'} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                fontFamily: "'Inter', sans-serif", fontSize: 12,
                color: breakout.color, fontWeight: 600,
              }}>
                {breakout.label} Breakout Profile
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FILM & VIDEO ═══ */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)', padding: 24, marginTop: 24,
      }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
          color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          Film & Video
        </h3>

        {/* Existing videos */}
        {videos.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12, marginBottom: 16,
          }}>
            {videos.map((url, i) => {
              const videoId = extractYouTubeId(url);
              return (
                <div key={i} style={{
                  background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', border: '1px solid var(--border-subtle)',
                }}>
                  {videoId ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                        alt="Video thumbnail"
                        style={{ width: '100%', height: 158, objectFit: 'cover', display: 'block' }}
                      />
                    </a>
                  ) : (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', padding: 16,
                      fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--accent-text)',
                      wordBreak: 'break-all',
                    }}>
                      {url}
                    </a>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px',
                  }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--accent-text)',
                      textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {videoId ? `youtube.com/watch?v=${videoId}` : url}
                    </a>
                    <button onClick={() => onRemoveVideo(url)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: 'var(--text-tertiary)', padding: '0 0 0 8px', lineHeight: 1,
                      flexShrink: 0,
                    }}>
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add video input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={videoInput}
            onChange={e => setVideoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && videoInput.trim()) {
                onAddVideo(videoInput.trim());
                setVideoInput('');
              }
            }}
            placeholder="Paste a YouTube URL..."
            style={{
              flex: 1, fontFamily: "'Inter', sans-serif", fontSize: 13,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={() => {
              if (videoInput.trim()) {
                onAddVideo(videoInput.trim());
                setVideoInput('');
              }
            }}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent)', background: 'var(--accent-light)',
              color: 'var(--accent-text)', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>

        {videos.length === 0 && (
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--text-tertiary)',
            margin: '8px 0 0', fontStyle: 'italic',
          }}>
            No videos yet — paste YouTube links to build your film library for {player.name}
          </p>
        )}
      </div>

      {/* ═══ AI SCOUTING SUMMARY ═══ */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)', padding: 24, marginTop: 24,
      }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16,
          color: 'var(--accent-text)', letterSpacing: 0.5, textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          AI Scouting Summary
        </h3>

        {summary ? (
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.7,
            color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {summary}
          </p>
        ) : (
          <button onClick={handleGenerateSummary} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent)', background: 'var(--accent-light)',
            color: 'var(--accent-text)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Generate Scouting Summary
          </button>
        )}
      </div>

      {/* ═══ BOTTOM NAV ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20,
        borderTop: '1px solid var(--border-primary)',
      }}>
        {prevId ? (
          <button onClick={() => onSelectPlayer(prevId)} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            color: 'var(--accent-text)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}>
            &larr; {allPlayers.find(p => p.id === prevId)?.name || 'Previous'}
          </button>
        ) : <div />}
        {nextId ? (
          <button onClick={() => onSelectPlayer(nextId)} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            color: 'var(--accent-text)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}>
            {allPlayers.find(p => p.id === nextId)?.name || 'Next'} &rarr;
          </button>
        ) : <div />}
      </div>
    </div>
  );
};

export default PlayerProfile;
