import React, { useMemo, useState, useEffect } from 'react';
import { positionColors, getBreakoutIndicator, hasInjuryRisk, computePercentile } from '../utils/helpers';
import { fetchDiscussions } from '../services/apiClient';
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
  // For YPRR, compare against all WR+TE peers (not just same position) since it's a universal receiving metric
  const yprrPeers = allPlayers.filter(p => ['WR', 'TE'].includes(p.position));
  const yprr = player.advancedStats?.yprr;
  return [
    { label: 'Rec Yds', value: stats?.receivingYards ? stats.receivingYards.toLocaleString() : null, tier: tier(stats?.receivingYards, peers.map(p => p.stats?.receivingYards)) },
    { label: 'Rec', value: stats?.receptions, tier: tier(stats?.receptions, peers.map(p => p.stats?.receptions)) },
    { label: 'TDs', value: stats?.receivingTDs, tier: tier(stats?.receivingTDs, peers.map(p => p.stats?.receivingTDs)) },
    yprr
      ? { label: 'YPRR', value: yprr.toFixed(2), tier: tier(yprr, yprrPeers.map(p => p.advancedStats?.yprr).filter(Boolean)) }
      : { label: 'Yds/Rec', value: stats?.receptions > 0 ? (stats.receivingYards / stats.receptions).toFixed(1) : null, tier: tier(stats?.receptions > 0 ? stats.receivingYards / stats.receptions : null, peers.map(p => p.stats?.receptions > 0 ? p.stats.receivingYards / p.stats.receptions : 0)) },
  ];
};

/**
 * Desktop-optimized detail panel for the split view.
 * Uses horizontal space effectively with a two-column layout.
 */
const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const DesktopDetailPanel = ({ player, allPlayers = [], displayRank, onViewProfile, onDiscuss, isStudied }) => {
  const posColor = positionColors[player.position] || positionColors.WR;
  const heroStats = useMemo(() => getHeroStats(player, allPlayers), [player, allPlayers]);
  const breakout = getBreakoutIndicator(player.breakoutAge);
  const injured = hasInjuryRisk(player);
  const rank1QB = displayRank ?? player.rank?.oneQB;
  const rankSF = player.rank?.superflex;

  // Fetch trending discussions with client-side cache
  const [discussions, setDiscussions] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const cacheKey = `drs_disc_${player.id}`;

    // Check sessionStorage cache first (instant)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 5 * 60 * 1000) { // 5 min cache
          setDiscussions(data);
          return;
        }
      }
    } catch {}

    // Fetch in background
    fetchDiscussions(String(player.id), 'hot')
      .then(res => {
        if (cancelled) return;
        const data = res.discussions || [];
        setDiscussions(data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [player.id]);

  return (
    <div key={player.id} className="detail-fade-in" style={{
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
        {/* Player photo with initials fallback */}
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <img
            src={`/api/img/player/${encodeURIComponent(player.name)}.png`}
            alt={player.name}
            style={{
              width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
              border: `3px solid ${posColor.border}`, background: 'var(--bg-tertiary)',
            }}
            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'; }}
          />
          <div style={{
            display: 'none', width: 64, height: 64, borderRadius: '50%',
            background: posColor.bg, border: `3px solid ${posColor.border}`,
            alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: posColor.text,
          }}>
            {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>

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

      {/* ── Stats Grid ── */}
      <div key={player.id} className="stat-stagger" style={{
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

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
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

      {/* ── Trending Discussions ── */}
      <div style={{
        borderTop: '1px solid var(--border-primary)',
        paddingTop: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16,
            fontWeight: 700, color: 'var(--text-primary)',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Trending
          </div>
          <button
            onClick={() => onDiscuss && onDiscuss(player.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              color: 'var(--accent-text)',
            }}
          >
            View All
          </button>
        </div>

        {discussions.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            background: 'var(--bg-card)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: 'var(--text-tertiary)', marginBottom: 8,
            }}>
              No discussions yet
            </div>
            <button
              onClick={() => onDiscuss && onDiscuss(player.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                color: 'var(--accent-text)',
              }}
            >
              Start the first thread
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {discussions.slice(0, 4).map(d => (
              <div
                key={d.id}
                onClick={() => onDiscuss && onDiscuss(player.id)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                {/* Vote count */}
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  fontWeight: 700, color: 'var(--accent-text)',
                  minWidth: 28, textAlign: 'center',
                  paddingTop: 2,
                }}>
                  {d.upvote_count || 0}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                    color: 'var(--text-primary)', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d.title}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 11,
                    color: 'var(--text-tertiary)', marginTop: 3,
                    display: 'flex', gap: 8,
                  }}>
                    <span>{d.username || 'Anon'}</span>
                    <span>{timeAgo(d.created_at)}</span>
                    <span>{d.comment_count || 0} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopDetailPanel;
