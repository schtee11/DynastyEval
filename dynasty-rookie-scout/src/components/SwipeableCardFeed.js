import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Vertical full-screen swipeable card feed (TikTok / Tinder-style).
 * Each card takes up the full viewport height minus the header.
 * Swipe up → next card, swipe down → previous card.
 */
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY = 0.25;
const HEADER_HEIGHT = 52; // matches mobile header

const SwipeableCardFeed = ({ children }) => {
  const cards = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, locked: null });

  // Clamp index when card count changes (e.g. filter)
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, cards.length - 1)));
  }, [cards.length]);

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, cards.length - 1));
    setCurrentIndex(clamped);
    setOffsetY(0);
    setIsSwiping(false);
  }, [cards.length]);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      locked: null,
    };
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;

    // Lock direction on first significant movement
    if (touchRef.current.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touchRef.current.locked = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h';
    }

    if (touchRef.current.locked !== 'v') return;

    e.preventDefault();
    // Add resistance at boundaries
    const atTop = currentIndex === 0 && dy > 0;
    const atBottom = currentIndex >= cards.length - 1 && dy < 0;
    const resistance = (atTop || atBottom) ? 0.3 : 1;
    setOffsetY(dy * resistance);
  }, [currentIndex, cards.length]);

  const onTouchEnd = useCallback(() => {
    if (touchRef.current.locked !== 'v') {
      setOffsetY(0);
      setIsSwiping(false);
      return;
    }

    const elapsed = Date.now() - touchRef.current.startTime;
    const velocity = Math.abs(offsetY) / Math.max(elapsed, 1);
    const fastFlick = velocity > SWIPE_VELOCITY;

    if (offsetY < -SWIPE_THRESHOLD || (offsetY < -15 && fastFlick)) {
      goTo(currentIndex + 1); // swipe up → next
    } else if (offsetY > SWIPE_THRESHOLD || (offsetY > 15 && fastFlick)) {
      goTo(currentIndex - 1); // swipe down → prev
    } else {
      setOffsetY(0);
      setIsSwiping(false);
    }
  }, [offsetY, currentIndex, goTo]);

  if (cards.length === 0) return null;

  const safeIndex = Math.min(currentIndex, cards.length - 1);
  const cardHeight = `calc(100vh - ${HEADER_HEIGHT}px)`;

  return (
    <div
      style={{
        position: 'fixed',
        top: HEADER_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 50,
        background: 'var(--bg-primary)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Card stack — translates vertically */}
      <div
        style={{
          transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: `translateY(calc(-${safeIndex} * ${cardHeight} + ${offsetY}px))`,
          willChange: 'transform',
        }}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              height: cardHeight,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '12px 12px 0',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: 0 }}>{card}</div>
          </div>
        ))}
      </div>

      {/* Progress indicator — right edge */}
      <div style={{
        position: 'absolute', right: 6, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 3,
        alignItems: 'center',
      }}>
        {cards.length <= 20 ? (
          cards.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === safeIndex ? 4 : 3,
                height: i === safeIndex ? 14 : 6,
                borderRadius: 2,
                background: i === safeIndex ? 'var(--accent)' : 'var(--border-primary)',
                transition: 'all 0.2s',
                opacity: i === safeIndex ? 1 : 0.5,
              }}
            />
          ))
        ) : (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700,
            color: 'var(--text-secondary)',
            writingMode: 'vertical-lr',
            letterSpacing: 1,
          }}>
            {safeIndex + 1}/{cards.length}
          </span>
        )}
      </div>

      {/* Bottom counter bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 16px',
        background: 'linear-gradient(transparent, var(--bg-primary))',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 600,
          color: 'var(--text-tertiary)',
          background: 'var(--bg-card)',
          padding: '4px 12px',
          borderRadius: 12,
          border: '1px solid var(--border-primary)',
          pointerEvents: 'auto',
        }}>
          {safeIndex + 1} of {cards.length}
        </span>
      </div>
    </div>
  );
};

export default SwipeableCardFeed;
