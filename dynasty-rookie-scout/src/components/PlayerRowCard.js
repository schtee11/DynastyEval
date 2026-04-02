import React, { memo, useMemo } from 'react';
import { positionColors, hasInjuryRisk, getStatAccessors, getBreakoutIndicator, getTierForPlayer } from '../utils/helpers';
import { getArchetype } from '../utils/archetypes';
import PercentileBar from './PercentileBar';
import DraftBadge from './DraftBadge';
import ValueDelta from './ValueDelta';

const TIER_TINTS = {
  Elite: 'var(--tier-elite-tint)',
  'Day 1': 'var(--tier-day1-tint)',
  'Day 2': 'var(--tier-day2-tint)',
  'Day 3': 'var(--tier-day3-tint)',
  'Undrafted / TBD': 'transparent',
};

const PlayerRowCard = memo(({ player, perspective, onClick, isOdd, allPlayers, isStudied = false }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;
  const isTopRank = rank1QB != null && rank1QB !== 'UNR' && rank1QB <= 12;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const tier = getTierForPlayer(player);
  const tierTint = TIER_TINTS[tier];

  const accessors = useMemo(() => getStatAccessors(player.position, perspective), [player.position, perspective]);
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);
  const archetype = useMemo(() => getArchetype(player, peers), [player, peers]);

  const baseBg = isOdd ? 'var(--bg-secondary)' : 'var(--bg-primary)';
  const bg = tierTint !== 'transparent' ? tierTint : baseBg;

  return (
    <div
      className="player-row-card"
      onClick={() => onClick(player)}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        background: bg,
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${posColor.border}`,
        transition: 'background 0.1s, box-shadow 0.15s',
        padding: '7px 0',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bg;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* RANK ZONE (40px) */}
      <div style={{
        width: 40, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
      }}>
        {rank1QB === 'UNR' ? (
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 9, color: 'var(--text-tertiary)' }}>UNR</span>
        ) : isTopRank ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11,
          }}>
            {rank1QB}
          </span>
        ) : (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            {rank1QB ?? '\u2014'}
          </span>
        )}
      </div>

      {/* IDENTITY BLOCK (flex: 1) */}
      <div style={{ flex: 1, minWidth: 0, padding: '0 12px 0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9,
            color: posColor.text, background: posColor.bg,
            padding: '2px 5px', borderRadius: 3, flexShrink: 0,
          }}>
            {player.position}
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14,
            color: 'var(--text-primary)', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.name}
          </span>
          {injured && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 700,
              color: '#fff', background: 'var(--danger)',
              padding: '1px 4px', borderRadius: 3, flexShrink: 0,
            }}>INJ</span>
          )}
          {isStudied && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 700,
              color: '#fff', background: 'var(--success)',
              padding: '1px 4px', borderRadius: 3, flexShrink: 0,
            }}>&#10003;</span>
          )}
          <ValueDelta rank={rank1QB} adp={player.dynastyADP?.oneQB} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--text-secondary)' }}>
            {player.college || 'TBD'}
          </span>
          <DraftBadge round={player.draftRound} pick={player.draftPick} team={player.draftTeam} isProjected={player.draftIsProjected} />
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 600,
            color: posColor.text, letterSpacing: 0.2,
          }}>
            {archetype}
          </span>
          {player.breakoutAge && breakout.label !== 'N/A' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontFamily: "'Inter', sans-serif", fontSize: 9, color: breakout.color, fontWeight: 500,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: breakout.color }} />
              {player.breakoutAge}
            </span>
          )}
        </div>
      </div>

      {/* STAT BARS (200px) */}
      <div className="row-stats" style={{ width: 200, flexShrink: 0, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {accessors.map((acc, i) => {
          const val = acc.getValue(player);
          const allVals = peers.map(p => acc.getValue(p));
          const fmt = typeof val === 'number' && val < 10 ? v => v.toFixed(2) : v => typeof v === 'number' && v >= 1000 ? v.toLocaleString() : v;
          return <PercentileBar key={i} label={acc.label} value={val} allValues={allVals} format={fmt} />;
        })}
      </div>

      {/* RANKS (80px) */}
      <div className="row-ranks" style={{ width: 80, flexShrink: 0, padding: '0 8px', textAlign: 'right' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)',
        }}>
          1QB {rank1QB === 'UNR' ? 'UNR' : `#${rank1QB}`}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)',
        }}>
          SF {rankSF === 'UNR' ? 'UNR' : `#${rankSF}`}
        </div>
      </div>
    </div>
  );
});

export default PlayerRowCard;
