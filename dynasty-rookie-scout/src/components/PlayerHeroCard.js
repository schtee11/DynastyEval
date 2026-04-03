import React, { useMemo } from 'react';
import { positionColors, positionChartColors, getBreakoutIndicator, hasInjuryRisk, computePercentile } from '../utils/helpers';
import { getArchetype } from '../utils/archetypes';
import StatHighlight from './StatHighlight';
import DraftBadge from './DraftBadge';

/**
 * Get position-specific headline stats for the hero card.
 * Returns 4 stats with labels, values, and tier indicators.
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
      {
        label: 'Comp %',
        value: stats?.completionPct != null ? `${stats.completionPct}%` : null,
        tier: tier(stats?.completionPct, peers.map(p => p.stats?.completionPct)),
      },
      {
        label: 'Pass TDs',
        value: stats?.passingTDs,
        tier: tier(stats?.passingTDs, peers.map(p => p.stats?.passingTDs)),
      },
      {
        label: 'Pass Yds',
        value: stats?.passingYards ? stats.passingYards.toLocaleString() : null,
        tier: tier(stats?.passingYards, peers.map(p => p.stats?.passingYards)),
      },
      {
        label: 'Rush Yds',
        value: stats?.rushingYards ? stats.rushingYards.toLocaleString() : null,
        tier: tier(stats?.rushingYards, peers.map(p => p.stats?.rushingYards)),
      },
    ];
  }

  if (position === 'RB') {
    return [
      {
        label: 'Rush Yds',
        value: stats?.rushingYards ? stats.rushingYards.toLocaleString() : null,
        tier: tier(stats?.rushingYards, peers.map(p => p.stats?.rushingYards)),
      },
      {
        label: 'YPC',
        value: stats?.yardsPerCarry?.toFixed(1),
        tier: tier(stats?.yardsPerCarry, peers.map(p => p.stats?.yardsPerCarry)),
      },
      {
        label: 'Total TDs',
        value: stats ? (stats.rushingTDs || 0) + (stats.receivingTDs || 0) : null,
        tier: tier(
          stats ? (stats.rushingTDs || 0) + (stats.receivingTDs || 0) : null,
          peers.map(p => p.stats ? (p.stats.rushingTDs || 0) + (p.stats.receivingTDs || 0) : 0)
        ),
      },
      {
        label: 'Rec',
        value: stats?.receptions,
        tier: tier(stats?.receptions, peers.map(p => p.stats?.receptions)),
      },
    ];
  }

  // WR and TE
  return [
    {
      label: 'Rec Yds',
      value: stats?.receivingYards ? stats.receivingYards.toLocaleString() : null,
      tier: tier(stats?.receivingYards, peers.map(p => p.stats?.receivingYards)),
    },
    {
      label: 'Rec',
      value: stats?.receptions,
      tier: tier(stats?.receptions, peers.map(p => p.stats?.receptions)),
    },
    {
      label: 'TDs',
      value: stats?.receivingTDs,
      tier: tier(stats?.receivingTDs, peers.map(p => p.stats?.receivingTDs)),
    },
    {
      label: 'Yds/Rec',
      value: stats?.receptions > 0
        ? (stats.receivingYards / stats.receptions).toFixed(1)
        : null,
      tier: tier(
        stats?.receptions > 0 ? stats.receivingYards / stats.receptions : null,
        peers.map(p => p.stats?.receptions > 0 ? p.stats.receivingYards / p.stats.receptions : 0)
      ),
    },
  ];
};

/**
 * Full-screen hero card for the TikTok-style vertical feed.
 * Top: Player identity + position accent
 * Middle: 4 headline stats
 * Bottom: Action bar
 */
const PlayerHeroCard = ({ player, allPlayers = [], onViewProfile, onDiscuss, isStudied }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const chartColor = positionChartColors[player.position] || '#7c3aed';
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);
  const archetype = useMemo(() => getArchetype(player, peers), [player, peers]);
  const heroStats = useMemo(() => getHeroStats(player, allPlayers), [player, allPlayers]);
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Position color accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: posColor.border,
      }} />

      {/* ── Top Section: Player Identity (55%) ── */}
      <div style={{
        flex: '0 0 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 24px 16px',
        textAlign: 'center',
        gap: 10,
      }}>
        {/* Rank badge */}
        {rank1QB && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-tertiary)',
            letterSpacing: 1,
          }}>
            #{rank1QB}
          </span>
        )}

        {/* Position badge */}
        <span style={{
          display: 'inline-block',
          padding: '4px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          background: posColor.bg,
          color: posColor.text,
          border: `1px solid ${posColor.border}`,
          letterSpacing: 1,
        }}>
          {player.position}
        </span>

        {/* Player name */}
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 42,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.05,
          letterSpacing: -0.5,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {player.name}
        </h2>

        {/* College + Age */}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          {player.college}{player.age ? ` · ${player.age} yrs` : ''}
        </span>

        {/* Archetype */}
        {archetype && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: chartColor,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontFamily: "'Inter', sans-serif",
          }}>
            {archetype}
          </span>
        )}

        {/* Draft projection */}
        <div style={{ marginTop: 4 }}>
          <DraftBadge
            round={player.draftRound}
            pick={player.draftPick}
            team={player.draftTeam}
            isProjected={player.draftIsProjected}
          />
        </div>

        {/* Injury + breakout badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {injured && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px',
              borderRadius: 10, background: 'rgba(239,68,68,0.1)',
              color: '#ef4444', fontFamily: "'Inter', sans-serif",
            }}>
              Injury Risk
            </span>
          )}
          {breakout.label !== 'N/A' && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px',
              borderRadius: 10, background: 'var(--bg-tertiary)',
              color: breakout.color, fontFamily: "'Inter', sans-serif",
            }}>
              Breakout: {breakout.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Middle Section: Stats (30%) ── */}
      <div style={{
        flex: '0 0 30%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '20px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          border: '1px solid var(--border-primary)',
        }}>
          {heroStats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <div style={{
                  width: 1,
                  height: 40,
                  background: 'var(--border-primary)',
                  flexShrink: 0,
                }} />
              )}
              <StatHighlight
                label={stat.label}
                value={stat.value}
                tier={stat.tier}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Bottom Section: Actions (15%) ── */}
      <div style={{
        flex: '0 0 15%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '0 24px 16px',
      }}>
        <button
          onClick={() => onViewProfile && onViewProfile(player.id)}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >
          Full Profile
        </button>
        <button
          onClick={() => onDiscuss && onDiscuss(player.id)}
          style={{
            padding: '14px 20px',
            borderRadius: 12,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
          }}
        >
          Discuss
        </button>
        <button
          onClick={() => {/* bookmark */}}
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid var(--border-primary)',
            background: isStudied ? 'var(--success)' : 'var(--bg-secondary)',
            color: isStudied ? '#fff' : 'var(--text-secondary)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title={isStudied ? 'Studied' : 'Mark as studied'}
        >
          {isStudied ? '\u2713' : '\u2606'}
        </button>
      </div>
    </div>
  );
};

export default PlayerHeroCard;
