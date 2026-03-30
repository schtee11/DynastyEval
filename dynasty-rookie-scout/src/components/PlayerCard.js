import React, { memo, useMemo } from 'react';
import { positionColors, hasInjuryRisk, getStatAccessors, getBreakoutIndicator } from '../utils/helpers';
import PercentileBar from './PercentileBar';
import DraftBadge from './DraftBadge';

const PlayerCard = memo(({ player, perspective = 'overall', onClick, allPlayers = [] }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;
  const breakout = getBreakoutIndicator(player.breakoutAge);

  const accessors = useMemo(() => getStatAccessors(player.position, perspective), [player.position, perspective]);
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);

  // Signal dots
  const signals = [];
  if (player.breakoutAge && player.breakoutAge <= 20) signals.push({ color: 'var(--success)', title: 'Elite breakout age' });
  if (player.draftPick && player.draftPick <= 32) signals.push({ color: 'var(--warning)', title: 'Day 1 capital' });
  if (injured) signals.push({ color: 'var(--danger)', title: 'Injury history' });
  if (rank1QB != null && rank1QB !== 'UNR' && rank1QB <= 12) signals.push({ color: 'var(--accent)', title: 'Top 12 rank' });

  return (
    <div
      onClick={() => onClick(player)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Position color bar */}
      <div style={{ height: 3, background: posColor.border }} />

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header: rank + name + pos badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          {/* Rank */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800,
            fontSize: rank1QB === 'UNR' ? 11 : 22,
            color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
            lineHeight: 1,
            minWidth: 28,
          }}>
            {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '\u2014'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.name}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginTop: 2,
            }}>
              {[player.college, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' \u00B7 ') || 'TBD'}
            </div>
          </div>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: posColor.text,
            background: posColor.bg,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
          }}>
            {player.position}
          </span>
        </div>

        {/* Draft badge */}
        <div style={{ marginBottom: 12 }}>
          <DraftBadge
            round={player.draftRound}
            pick={player.draftPick}
            team={player.draftTeam}
            isProjected={player.draftIsProjected}
          />
        </div>

        {/* Stat percentile bars */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: '10px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          flex: 1,
        }}>
          {accessors.map((acc, i) => {
            const val = acc.getValue(player);
            const allVals = peers.map(p => acc.getValue(p));
            const fmt = typeof val === 'number' && val < 10 ? v => v.toFixed(2) : v => typeof v === 'number' && v >= 1000 ? v.toLocaleString() : v;
            return (
              <PercentileBar
                key={i}
                label={acc.label}
                value={val}
                allValues={allVals}
                format={fmt}
              />
            );
          })}
        </div>

        {/* Footer: signal dots + SF rank */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 8,
        }}>
          {/* Signal dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {signals.map((s, i) => (
              <div key={i} title={s.title} style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: s.color,
              }} />
            ))}
            {breakout.label !== 'N/A' && breakout.label !== 'Late' && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                fontWeight: 600,
                color: breakout.color,
                marginLeft: 2,
              }}>
                {breakout.label} breakout
              </span>
            )}
          </div>
          {/* SF rank */}
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)',
          }}>
            SF {rankSF === 'UNR' ? 'UNR' : `#${rankSF}`}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;
