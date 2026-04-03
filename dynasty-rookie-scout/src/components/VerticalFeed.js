import React, { useRef, useEffect, useState } from 'react';

/**
 * TikTok/Reels-style vertical swipe feed.
 * Each child takes up the full viewport height.
 * Uses CSS scroll-snap for native smooth scrolling.
 */
const VerticalFeed = ({ children, onActiveChange }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
        height: 'calc(100dvh - 56px)', // viewport minus header
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
            height: 'calc(100dvh - 56px)',
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
    </div>
  );
};

export default VerticalFeed;
