import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { positionColors } from '../utils/helpers';
import SignupGate from './SignupGate';

const FREE_PREVIEW_LIMIT = 5;

/**
 * TikTok/Reels-style vertical swipe feed.
 * Each child takes up the full viewport height.
 * Uses CSS scroll-snap for native smooth scrolling.
 * Tap the position counter to open a quick-jump player list.
 */
const STORAGE_KEY = 'drs_feed_index';

const VerticalFeed = ({ children, players = [], onActiveChange }) => {
  const containerRef = useRef(null);
  const jumpListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
  const [showJumpList, setShowJumpList] = useState(false);
  const { user } = useAuth();
  const showGate = !user && activeIndex >= FREE_PREVIEW_LIMIT;

  // Save active index to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, String(activeIndex)); } catch {}
  }, [activeIndex]);

  // Restore scroll position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeIndex === 0) return;
    const timer = setTimeout(() => {
      const cardHeight = container.clientHeight;
      container.scrollTo({ top: activeIndex * cardHeight, behavior: 'instant' });
    }, 50);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect which card is currently visible via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = Number(entry.target.dataset.index);
            if (!isNaN(index)) {
              setActiveIndex(index);
              if (onActiveChange) onActiveChange(index);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    const cards = container.querySelectorAll('[data-feed-card]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [children, onActiveChange]);

  // Jump to a specific player index
  const jumpTo = useCallback((index) => {
    setShowJumpList(false);
    setActiveIndex(index);
    if (onActiveChange) onActiveChange(index);
    const container = containerRef.current;
    if (container) {
      const cardHeight = container.clientHeight;
      container.scrollTo({ top: index * cardHeight, behavior: 'instant' });
    }
  }, [onActiveChange]);

  // Scroll the jump list to show the active player when opened
  useEffect(() => {
    if (showJumpList && jumpListRef.current) {
      const activeRow = jumpListRef.current.querySelector('[data-jump-active]');
      if (activeRow) activeRow.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [showJumpList]);

  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  return (
    <div
      ref={containerRef}
      className="vertical-feed"
      style={{
        height: 'calc(100dvh - 48px - 56px)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
    >
      {childArray.map((child, i) => {
        const locked = !user && i >= FREE_PREVIEW_LIMIT;
        return (
        <div
          key={i}
          data-feed-card
          data-index={i}
          className="vertical-feed-card"
          style={{
            height: 'calc(100dvh - 48px - 56px)',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            position: 'relative',
            overflow: 'hidden',
            ...(locked ? { filter: 'blur(6px)', pointerEvents: 'none' } : {}),
          }}
        >
          {Math.abs(i - activeIndex) <= 2 ? child : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}>
              Loading...
            </div>
          )}
        </div>
        );
      })}

      {/* Position counter — tap to open quick-jump list */}
      <div
        onClick={() => setShowJumpList(true)}
        style={{
          position: 'fixed',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          cursor: 'pointer',
        }}
      >
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '6px 8px',
          borderRadius: 10,
          fontFamily: "'Inter', sans-serif",
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {activeIndex + 1}/{total}
        </div>
      </div>

      {/* Quick-jump player list (bottom sheet) */}
      {showJumpList && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowJumpList(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 'var(--z-overlay, 200)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 'var(--z-modal, 300)',
            background: 'var(--bg-primary)',
            borderRadius: '16px 16px 0 0',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
          }}>
            {/* Handle + header */}
            <div style={{
              padding: '12px 16px 8px',
              borderBottom: '1px solid var(--border-primary)',
              flexShrink: 0,
            }}>
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--text-tertiary)',
                opacity: 0.4,
                margin: '0 auto 10px',
              }} />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                }}>
                  Jump to Player
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}>
                  {total} players
                </span>
              </div>
            </div>

            {/* Scrollable player list */}
            <div
              ref={jumpListRef}
              style={{
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
              }}
            >
              {players.map((player, i) => {
                const isActive = i === activeIndex;
                const posColor = positionColors[player.position] || positionColors.WR;
                return (
                  <div
                    key={player.id}
                    {...(isActive ? { 'data-jump-active': true } : {})}
                    onClick={() => jumpTo(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-light)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                      width: 28,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>

                    {/* Position badge */}
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: posColor.text,
                      background: posColor.bg,
                      padding: '2px 6px',
                      borderRadius: 3,
                      flexShrink: 0,
                      minWidth: 26,
                      textAlign: 'center',
                    }}>
                      {player.position}
                    </span>

                    {/* Name */}
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {player.name}
                    </span>

                    {/* College */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}>
                      {player.college}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Swipe hint on first card */}
      {activeIndex === 0 && !showJumpList && (
        <div className="swipe-hint" style={{
          position: 'fixed', bottom: 140, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          zIndex: 40, pointerEvents: 'none',
          color: 'var(--text-tertiary)', fontSize: 11,
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Swipe up
        </div>
      )}

      {/* Signup gate after free preview */}
      {showGate && <SignupGate />}
    </div>
  );
};

export default VerticalFeed;
