import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignupGate from './SignupGate';

const FREE_PREVIEW_LIMIT = 5;

/**
 * TikTok/Reels-style vertical swipe feed.
 * Each child takes up the full viewport height.
 * Uses CSS scroll-snap for native smooth scrolling.
 */
const STORAGE_KEY = 'drs_feed_index';

const VerticalFeed = ({ children, onActiveChange }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
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

  const childArray = React.Children.toArray(children);
  const total = childArray.length;

  return (
    <div
      ref={containerRef}
      className="vertical-feed"
      style={{
        height: 'calc(100dvh - 48px - 56px)', // viewport minus header (48px) minus bottom nav (56px)
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
    >
      {childArray.map((child, i) => (
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
          }}
        >
          {/* Only render cards that are near the active one for performance */}
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
      ))}

      {/* Vertical position indicator */}
      <div style={{
        position: 'fixed',
        right: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        {total <= 20 ? (
          // Show dots for small lists
          childArray.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 6 : 4,
                height: i === activeIndex ? 6 : 4,
                borderRadius: '50%',
                background: i === activeIndex ? 'var(--accent)' : 'var(--text-tertiary)',
                opacity: i === activeIndex ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            />
          ))
        ) : (
          // Show counter for large lists
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 6px',
            borderRadius: 8,
            fontFamily: "'Inter', sans-serif",
            pointerEvents: 'auto',
          }}>
            {activeIndex + 1}/{total}
          </div>
        )}
      </div>

      {/* Swipe hint on first card */}
      {activeIndex === 0 && (
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
