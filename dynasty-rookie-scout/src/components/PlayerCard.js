import React, { memo, useMemo } from 'react';
import { positionColors, hasInjuryRisk, getStatAccessors, getBreakoutIndicator, computeHeadlineScore, getPercentileColor } from '../utils/helpers';
import PercentileBar from './PercentileBar';
import DraftBadge from './DraftBadge';
import ValueDelta from './ValueDelta';

const PlayerCard = memo(({ player, perspective = 'overall', onClick, allPlayers = [], isStudied = false }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const injured = hasInjuryRisk(player);
  const rank1QB = player.rank?.oneQB;
  const rankSF = player.rank?.superflex;
  const breakout = getBreakoutIndicator(player.breakoutAge);

  const accessors = useMemo(() => getStatAccessors(player.position, perspective), [player.position, perspective]);
  const peers = useMemo(() => allPlayers.filter(p => p.position === player.position), [allPlayers, player.position]);
  const headlineScore = useMemo(() => computeHeadlineScore(player, allPlayers), [player, allPlayers]);
  const scoreColor = getPercentileColor(headlineScore);

  return (
    <div
      onClick={() => onClick(player.id != null ? player.id : player)}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isStudied ? 'var(--success)' : 'var(--border-primary)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="player-card-hover"
    >
      {/* Position color bar */}
      <div style={{ height: 3, background: posColor.border }} />

      {/* Injury badge */}
      {injured && (
        <div style={{
          position: 'absolute', top: 7, right: 8,
          background: 'var(--danger)', color: '#fff',
          fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 700,
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
        }}>
          INJ
        </div>
      )}

      {/* Studied indicator */}
      {isStudied && (
        <div style={{
          position: 'absolute', top: 7, right: injured ? 38 : 8,
          background: 'var(--success)', color: '#fff',
          fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 700,
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
        }}>
          &#10003;
        </div>
      )}

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header: rank + name + pos badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          {/* Rank + value delta */}
          <div style={{ textAlign: 'center', minWidth: 26 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: rank1QB === 'UNR' ? 10 : 20,
              color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--text-primary)',
              lineHeight: 1,
            }}>
              {rank1QB === 'UNR' ? 'UNR' : rank1QB ?? '\u2014'}
            </div>
            <ValueDelta rank={rank1QB} adp={player.dynastyADP?.oneQB} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: 17,
              color: 'var(--text-primary)', lineHeight: 1.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {player.name}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11,
              color: 'var(--text-secondary)', marginTop: 1,
            }}>
              {[player.college, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' \u00B7 ') || 'TBD'}
            </div>
          </div>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10,
            color: posColor.text, background: posColor.bg,
            padding: '2px 7px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
          }}>
            {player.position}
          </span>
        </div>

        {/* Draft badge */}
        <div style={{ marginBottom: 6 }}>
          <DraftBadge round={player.draftRound} pick={player.draftPick} team={player.draftTeam} isProjected={player.draftIsProjected} />
        </div>

        {/* Headline score + Stat percentile bars */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          padding: '8px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          flex: 1,
        }}>
          {headlineScore != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22, fontWeight: 800,
                color: scoreColor, lineHeight: 1,
              }}>
                {headlineScore}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: 'var(--bar-track)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${headlineScore}%`, height: '100%',
                    background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}cc)`,
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 600,
                  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.3,
                }}>
                  Prospect Score
                </span>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {accessors.map((acc, i) => {
            const val = acc.getValue(player);
            const allVals = peers.map(p => acc.getValue(p));
            const fmt = typeof val === 'number' && val < 10 ? v => v.toFixed(2) : v => typeof v === 'number' && v >= 1000 ? v.toLocaleString() : v;
            return <PercentileBar key={i} label={acc.label} value={val} allValues={allVals} format={fmt} showPct />;
          })}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            {player.breakoutAge && breakout.label !== 'N/A' ? (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 600,
                color: breakout.color, background: 'var(--bg-tertiary)',
                padding: '1px 7px', borderRadius: 10,
              }}>
                {breakout.label} {player.breakoutAge}
              </span>
            ) : <span />}
            {player.gamesPlayed && (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 9, color: 'var(--text-tertiary)',
              }}>
                {player.gamesPlayed} GP
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
              color: rank1QB === 'UNR' ? 'var(--text-tertiary)' : 'var(--accent-text)',
            }}>
              1QB {rank1QB === 'UNR' ? 'UNR' : `#${rank1QB}`}
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 8, color: 'var(--text-tertiary)',
            }}>{'\u00B7'}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
              color: rankSF === 'UNR' ? 'var(--text-tertiary)' : 'var(--pos-wr-text)',
            }}>
              SF {rankSF === 'UNR' ? 'UNR' : `#${rankSF}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;
