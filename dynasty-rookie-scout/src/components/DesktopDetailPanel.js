import React, { useMemo } from 'react';
import { positionColors, positionChartColors, getBreakoutIndicator, hasInjuryRisk, computePercentile } from '../utils/helpers';
import { getArchetype, getStrengthTags } from '../utils/archetypes';
import StatHighlight from './StatHighlight';
import DraftBadge from './DraftBadge';

/**
 * Get 4 position-specific headline stats with tier indicators.
 */
const getHeroStats = (player, allPlayers) => {
  const { position, stats } = player;
  const peers = allPlayers.filter(p => p.position === position);

  const tier = (val, allVals) => {
    const pct = computePercentile(val, allVals);
    if (pct == null) return null;
    if (pct >= 75) return 'elite';
    if (pct >= 50) return 'good';
    if (pct >= 25) return 'avg';
    return 'poor';
  };

  if (position === 'QB') {
    return [
      { label: 'Comp %', value: stats?.completionPct != null ? `${stats.completionPct}%` : null, tier: tier(stats?.completionPct, peers.map(p => p.stats?.completionPct)) },
      { label: 'Pass TDs', value: stats?.passingTDs, tier: tier(stats?.passingTDs, peers.map(p => p.stats?.passingTDs)) },
      { label: 'Pass Yds', value: stats?.passingYards ? stats.passingYards.toLocaleString() : null, tier: tier(stats?.passingYards, peers.map(p => p.stats?.passingYards)) },
      { label: 'Rush Yds', value: stats?.rushingYards ? stats.rushingYards.toLocaleString() : null, tier: tier(stats?.rushingYards, peers.map(p => p.stats?.rushingYards)) },
    ];
  }
  if (position === 'RB') {
    return [
      { label: 'Rush Yds', value: stats?.rushingYards ? stats.rushingYards.toLocaleString() : null, tier: tier(stats?.rushingYards, peers.map(p => p.stats?.rushingYards)) },
      { label: 'YPC', value: stats?.yardsPerCarry?.toFixed(1), tier: tier(stats?.yardsPerCarry, peers.map(p => p.stats?.yardsPerCarry)) },
      { label: 'Total TDs', value: stats ? (stats.rushingTDs || 0) + (stats.receivingTDs || 0) : null, tier: tier(stats ? (stats.rushingTDs || 0) + (stats.receivingTDs || 0) : null, peers.map(p => p.stats ? (p.stats.rushingTDs || 0) + (p.stats.receivingTDs || 0) : 0)) },
      { label: 'Rec', value: stats?.receptions, tier: tier(stats?.receptions, peers.map(p => p.stats?.receptions)) },
    ];
  }
  return [
    { label: 'Rec Yds', value: stats?.receivingYards ? stats.receivingYards.toLocaleString() : null, tier: tier(stats?.receivingYards, peers.map(p => p.stats?.receivingYards)) },
    { label: 'Rec', value: stats?.receptions, tier: tier(stats?.receptions, peers.map(p => p.stats?.receptions)) },
    { label: 'TDs', value: stats?.receivingTDs, tier: tier(stats?.receivingTDs, peers.map(p => p.stats?.receivingTDs)) },
    { label: 'Yds/Rec', value: stats?.receptions > 0 ? (stats.receivingYards / stats.receptions).toFixed(1) : null, tier: tier(stats?.receptions > 0 ? stats.receivingYards / stats.receptions : null, peers.map(p => p.stats?.receptions > 0 ? p.stats.receivingYards / p.stats.receptions : 0)) },
  ];
};

/**
 * Desktop-optimized detail panel for the split view.
 * Uses horizontal space effectively with a two-column layout.
 */
const DesktopDetailPanel = ({ player, allPlayers = [], onViewProfile, onDiscuss, isStudied }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const chartColor = positionChartColors[player.position] || '#7c3aed';
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);
  const archetype = useMemo(() => getArchetype(player, peers), [player, peers]);
  const heroStats = useMemo(() => getHeroStats(player, allPlayers), [player, allPlayers]);
  const strengthTags = useMemo(() => getStrengthTags(player, allPlayers), [player, allPlayers]);
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;

  return (
    <div style={{
      padding: '32px 40px',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      {/* ── Header: Name + Position ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Position color accent */}
        <div style={{
          width: 4,
          alignSelf: 'stretch',
          borderRadius: 2,
          background: posColor.border,
          flexShrink: 0,
        }} />

        <div style={{ flex: 1 }}>
          {/* Position + Rank row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11,
              color: posColor.text, background: posColor.bg,
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${posColor.border}`,
            }}>
              {player.position}
            </span>
            {rank1QB && rank1QB !== 'UNR' && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                fontWeight: 700, color: 'var(--text-tertiary)',
              }}>
                #{rank1QB}
              </span>
            )}
            {injured && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#fff',
                background: 'var(--danger)', padding: '2px 6px', borderRadius: 4,
              }}>INJURY RISK</span>
            )}
            {isStudied && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#fff',
                background: 'var(--success)', padding: '2px 6px', borderRadius: 4,
              }}>STUDIED</span>
            )}
          </div>

          {/* Player name */}
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            lineHeight: 1.1,
          }}>
            {player.name}
          </h2>

          {/* College + Age + Archetype */}
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 14,
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{player.college}</span>
            {player.age && (
              <>
                <span style={{ color: 'var(--text-tertiary)' }}>&middot;</span>
                <span>{player.age} yrs</span>
              </>
            )}
            {archetype && (
              <>
                <span style={{ color: 'var(--text-tertiary)' }}>&middot;</span>
                <span style={{ color: chartColor, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {archetype}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Info Row: Draft + Rankings + Breakout ── */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <DraftBadge
          round={player.draftRound}
          pick={player.draftPick}
          team={player.draftTeam}
          isProjected={player.draftIsProjected}
        />
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)' }}>
            1QB {rank1QB === 'UNR' ? 'UNR' : `#${rank1QB}`}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)' }}>
            SF {rankSF === 'UNR' ? 'UNR' : `#${rankSF}`}
          </span>
        </div>
        {breakout.label !== 'N/A' && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px',
            borderRadius: 12, background: 'var(--bg-tertiary)',
            color: breakout.color, fontFamily: "'Inter', sans-serif",
          }}>
            Breakout: {breakout.label} ({player.breakoutAge})
          </span>
        )}
      </div>

      {/* ── Strength Tags ── */}
      {strengthTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {strengthTags.slice(0, 5).map((tag, i) => (
            <span key={i} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              color: tag.tier === 'elite' ? 'var(--success)' : 'var(--accent-text)',
              background: tag.tier === 'elite' ? 'var(--success-light)' : 'var(--accent-light)',
              padding: '4px 10px', borderRadius: 12,
            }}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        padding: '24px 20px',
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-primary)',
        marginBottom: 24,
      }}>
        {heroStats.map((stat, i) => (
          <StatHighlight
            key={stat.label}
            label={stat.label}
            value={stat.value}
            tier={stat.tier}
          />
        ))}
      </div>

      {/* ── Player Comps ── */}
      {player.playerComps && player.playerComps.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            color: 'var(--text-tertiary)', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 8,
          }}>
            Player Comps
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {player.playerComps.map((comp, i) => (
              <span key={i} style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                color: 'var(--text-primary)', background: 'var(--bg-tertiary)',
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid var(--border-primary)',
              }}>
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onViewProfile && onViewProfile(player.id)}
          style={{
            flex: 1,
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Full Profile
        </button>
        <button
          onClick={() => onDiscuss && onDiscuss(player.id)}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
          }}
        >
          Discuss
        </button>
      </div>
    </div>
  );
};

export default DesktopDetailPanel;
