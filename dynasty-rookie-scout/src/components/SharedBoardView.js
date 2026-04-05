import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSharedBoard } from '../services/apiClient';
import { positionColors, getDraftCapitalInfo, getDraftRangeLabel, hasInjuryRisk } from '../utils/helpers';

const SharedBoardView = ({ players = [] }) => {
  const { token } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const playerMap = React.useMemo(() => {
    const map = {};
    for (const p of players) {
      map[String(p.id)] = p;
      if (p.sleeperId) map[p.sleeperId] = p;
    }
    return map;
  }, [players]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSharedBoard(token);
        setBoard(data.board || data);
      } catch (err) {
        setError(err.message || 'Board not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <div style={{ color: 'var(--danger)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Board Not Found
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          This share link may be invalid or expired.
        </div>
      </div>
    );
  }

  const boardPlayers = (board.player_ids || [])
    .map(id => playerMap[String(id)])
    .filter(Boolean);

  const formatLabel = board.format === 'SF' || board.format === 'superflex' ? 'Superflex' : '1QB';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          margin: '0 0 4px',
        }}>
          {board.name || 'Shared Board'}
        </h1>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: 'var(--text-tertiary)',
          display: 'flex',
          gap: 12,
        }}>
          <span>{formatLabel}</span>
          <span>{boardPlayers.length} players</span>
        </div>
      </div>

      {/* Player list */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 8,
      }}>
        {boardPlayers.map((player, i) => {
          const posColor = positionColors[player.position] || positionColors.WR;
          const capital = getDraftCapitalInfo(player.draftPick);
          const injured = hasInjuryRisk(player);
          return (
            <div
              key={player.id}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 6,
                borderLeft: `3px solid ${posColor.border}`,
                padding: '10px 16px',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Rank */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                width: 32,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              {/* Player info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--text-primary)',
                  }}>
                    {player.name}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    color: posColor.text,
                    background: posColor.bg,
                    padding: '1px 6px',
                    borderRadius: 3,
                  }}>
                    {player.position}
                  </span>
                  {injured && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: 'var(--danger)', background: 'var(--danger-light)',
                      padding: '1px 6px', borderRadius: 3,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      INJURY
                    </span>
                  )}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}>
                  {[player.college, player.draftRound ? `${capital.emoji} ${getDraftRangeLabel(player.draftRound, player.draftPick) || 'TBD'}` : null].filter(Boolean).join(' · ') || 'TBD'}
                </div>
              </div>
            </div>
          );
        })}

        {boardPlayers.length === 0 && (
          <div style={{
            padding: 30, textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontFamily: "'Inter', sans-serif", fontSize: 14,
          }}>
            This board is empty.
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedBoardView;
