import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicBoards, forkBoard } from '../services/apiClient';
import { positionColors } from '../utils/helpers';

const BrowseBoards = ({ players = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const playerMap = React.useMemo(() => {
    const map = {};
    for (const p of players) map[String(p.id)] = p;
    return map;
  }, [players]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicBoards();
        setBoards(data.boards || data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleFork = async (boardId) => {
    if (!user) return navigate('/login');
    try {
      await forkBoard(boardId);
      navigate('/board');
    } catch { /* ignore */ }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 80px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 22, letterSpacing: 1,
          textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0,
        }}>
          Community Boards
        </h1>
        <button
          onClick={() => navigate('/board')}
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
            textTransform: 'uppercase', padding: '6px 14px',
            border: '1px solid var(--accent)', borderRadius: 4,
            background: 'transparent', color: 'var(--accent-text)',
            cursor: 'pointer',
          }}
        >
          My Board
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && boards.length === 0 && (
        <div style={{
          padding: 40, textAlign: 'center',
          background: 'var(--bg-secondary)', borderRadius: 12,
          color: 'var(--text-tertiary)',
          fontFamily: "'Inter', sans-serif", fontSize: 14,
        }}>
          No public boards yet. Share yours to be the first!
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))',
        gap: 12,
      }}>
        {boards.map(board => {
          const boardPlayers = (board.player_ids || [])
            .map(id => playerMap[String(id)])
            .filter(Boolean);
          const top5 = boardPlayers.slice(0, 5);
          const formatLabel = board.format === 'SF' || board.format === 'superflex' ? 'Superflex' : '1QB';

          return (
            <div key={board.id} style={{
              background: 'var(--bg-card)',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}>
              {/* Header bar */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
                    color: 'var(--text-primary)',
                  }}>
                    {board.name || 'Untitled Board'}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: 'var(--text-tertiary)', marginTop: 2,
                  }}>
                    {formatLabel} · {boardPlayers.length} players
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {board.share_token && (
                    <button
                      onClick={() => navigate(`/board/shared/${board.share_token}`)}
                      style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid var(--border-primary)',
                        background: 'transparent', color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      View
                    </button>
                  )}
                  {user && (
                    <button
                      onClick={() => handleFork(board.id)}
                      style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                        padding: '4px 10px', borderRadius: 4,
                        border: 'none',
                        background: 'var(--accent)', color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>

              {/* Top 5 players */}
              <div style={{ padding: '8px 12px' }}>
                {top5.map((p, i) => {
                  const posColor = positionColors[p.position] || positionColors.WR;
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 4px',
                      borderBottom: i < top5.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 14, fontWeight: 700, color: 'var(--text-tertiary)',
                        width: 20, textAlign: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                        color: 'var(--text-primary)', flex: 1,
                      }}>
                        {p.name}
                      </span>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600, fontSize: 10,
                        color: posColor.text, background: posColor.bg,
                        padding: '1px 5px', borderRadius: 3,
                      }}>
                        {p.position}
                      </span>
                    </div>
                  );
                })}
                {boardPlayers.length > 5 && (
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, color: 'var(--text-tertiary)',
                    textAlign: 'center', padding: '6px 0',
                  }}>
                    +{boardPlayers.length - 5} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseBoards;
