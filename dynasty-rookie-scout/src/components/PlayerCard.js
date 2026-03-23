import React from 'react';
import { positionColors, getBreakoutIndicator, getDraftCapitalInfo, hasInjuryRisk, getTopStats } from '../utils/helpers';

const PlayerCard = ({ player, perspective = 'overall', onClick }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const capital = getDraftCapitalInfo(player.draftPick);
  const injured = hasInjuryRisk(player);
  const topStats = getTopStats(player, perspective);

  return (
    <div
      onClick={() => onClick(player)}
      style={{
        background: '#1a1d2e',
        borderRadius: 8,
        borderLeft: `4px solid ${posColor.border}`,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Injury warning banner */}
      {injured && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#ef4444',
          color: '#fff',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderBottomLeftRadius: 6,
          letterSpacing: 1,
          animation: 'pulse 2s infinite',
        }}>
          🚨 INJURY RISK
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: '#f1f5f9',
            lineHeight: 1.1,
          }}>
            {player.name}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#9ca3af',
            marginTop: 2,
          }}>
            {[player.college, player.draftTeam].filter(Boolean).join(' · ') || 'TBD'}
          </div>
        </div>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: posColor.text,
          background: posColor.bg,
          padding: '2px 8px',
          borderRadius: 4,
          letterSpacing: 1,
        }}>
          {player.position}
        </span>
      </div>

      {/* Draft pick + capital */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          color: capital.color,
        }}>
          {player.draftRound ? `${capital.emoji} R${player.draftRound} Pick #${player.draftPick}` : 'Draft TBD'}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: capital.color,
          background: `${capital.color}22`,
          padding: '1px 6px',
          borderRadius: 3,
        }}>
          {capital.label}
        </span>
        {player.draftIsProjected && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: '#9ca3af',
            background: '#2a2d3e',
            padding: '1px 5px',
            borderRadius: 3,
            letterSpacing: 0.5,
          }}>
            PROJ
          </span>
        )}
      </div>

      {/* Top 3 stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 10,
      }}>
        {topStats.map((stat, i) => (
          <div key={i} style={{
            background: '#0f1117',
            borderRadius: 4,
            padding: '6px 8px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              color: '#f1f5f9',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row: breakout + ranks */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #2a2d3e',
        paddingTop: 8,
      }}>
        {/* Breakout indicator */}
        {player.breakoutAge && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: breakout.color,
          }}>
            {breakout.emoji} BO: {player.breakoutAge} ({breakout.label})
          </span>
        )}

        {/* 1QB vs SF ranks */}
        {player.rank && (
          <div style={{
            display: 'flex',
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}>
            <span style={{ color: '#60a5fa' }}>
              1QB: #{player.rank.oneQB}
            </span>
            <span style={{ color: '#a78bfa' }}>
              SF: #{player.rank.superflex}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
