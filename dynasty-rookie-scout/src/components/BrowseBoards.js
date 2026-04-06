import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicBoards, forkBoard } from '../services/apiClient';

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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px' }}>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, fontSize: 22, letterSpacing: 1,
        textTransform: 'uppercase', color: 'var(--text-primary)',
        margin: '0 0 16px',
      }}>
        Community Boards
      </h1>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!loading && boards.length === 0 && (
        <div style={{
          padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontFamily: "'Inter', sans-serif", fontSize: 14,
        }}>
          No public boards yet. Share yours to be the first!
        </div>
      )}

      {boards.map(board => {
        const topPlayers = (board.player_ids || []).slice(0, 5)
          .map(id => playerMap[String(id)])
          .filter(Boolean);
        const formatLabel = board.format === 'SF' || board.format === 'superflex' ? 'SF' : '1QB';

        return (
          <div key={board.id} style={{
            background: 'var(--bg-card)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            padding: '12px 16px',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 6,
            }}>
              <div>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>
                  {board.name || 'Untitled Board'}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: 'var(--text-tertiary)', marginLeft: 8,
                }}>
                  {formatLabel} · {(board.player_ids || []).length} players
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {board.share_token && (
                  <button
                    onClick={() => navigate(`/board/shared/${board.share_token}`)}
                    style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
                      color: 'var(--accent-text)', background: 'none', border: 'none',
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
                      color: 'var(--accent-text)', background: 'var(--accent-light)',
                      border: 'none', borderRadius: 4, padding: '3px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Copy to My Board
                  </button>
                )}
              </div>
            </div>

            {/* Top 5 preview */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: 'var(--text-secondary)',
            }}>
              {topPlayers.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ' → '}
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: 2 }}>{p.position}</span>
                </span>
              ))}
              {(board.player_ids || []).length > 5 && (
                <span style={{ color: 'var(--text-tertiary)' }}> +{(board.player_ids || []).length - 5} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BrowseBoards;
