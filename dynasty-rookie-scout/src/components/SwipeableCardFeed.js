import React, { useState, useRef, useCallback, useEffect } from 'react';

const SWIPE_THRESHOLD = 50; // px to trigger card change
const SWIPE_VELOCITY = 0.3; // px/ms — fast flick triggers even below threshold

const SwipeableCardFeed = ({ children, className }) => {
  const cards = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, locked: null });
  const containerRef = useRef(null);

  // Reset index when card count changes (e.g. filter applied)
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, cards.length - 1)));
  }, [cards.length]);

  const goTo = useCallback((idx) => {
    setCurrentIndex(Math.max(0, Math.min(idx, cards.length - 1)));
    setOffsetX(0);
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

    // Determine scroll direction lock (horizontal swipe vs vertical scroll)
    if (touchRef.current.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (touchRef.current.locked === 'v') return; // let browser handle vertical scroll

    e.preventDefault(); // prevent vertical scroll during horizontal swipe
    setOffsetX(dx);
  }, []);

  const onTouchEnd = useCallback(() => {
    const elapsed = Date.now() - touchRef.current.startTime;
    const velocity = Math.abs(offsetX) / Math.max(elapsed, 1);
    const fastFlick = velocity > SWIPE_VELOCITY;

    if (offsetX < -SWIPE_THRESHOLD || (offsetX < -20 && fastFlick)) {
      goTo(currentIndex + 1);
    } else if (offsetX > SWIPE_THRESHOLD || (offsetX > 20 && fastFlick)) {
      goTo(currentIndex - 1);
    } else {
      setOffsetX(0);
      setIsSwiping(false);
    }
  }, [offsetX, currentIndex, goTo]);

  if (cards.length === 0) return null;

  const safeIndex = Math.min(currentIndex, cards.length - 1);

  return (
    <div className={className}>
      {/* Card viewport */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y',
        }}
      >
        <div
          style={{
            display: 'flex',
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
            transform: `translateX(calc(-${safeIndex * 100}% + ${offsetX}px))`,
          }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                flex: '0 0 100%',
                minWidth: 0,
                padding: '0 4px',
                boxSizing: 'border-box',
              }}
            >
              {card}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators + counter */}
      {cards.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '12px 0 4px',
        }}>
          {/* Prev arrow */}
          <button
            onClick={() => goTo(safeIndex - 1)}
            disabled={safeIndex === 0}
            style={{
              background: 'none', border: 'none', cursor: safeIndex === 0 ? 'default' : 'pointer',
              color: safeIndex === 0 ? 'var(--text-tertiary)' : 'var(--accent-text)',
              fontSize: 18, padding: 4, opacity: safeIndex === 0 ? 0.3 : 1,
              fontFamily: 'system-ui',
            }}
            aria-label="Previous"
          >
            &#8249;
          </button>

          {/* Dots (show max 7 around current) */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {cards.length <= 9 ? (
              cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === safeIndex ? 10 : 6,
                    height: i === safeIndex ? 10 : 6,
                    borderRadius: '50%',
                    background: i === safeIndex ? 'var(--accent)' : 'var(--border-primary)',
                    border: 'none', padding: 0, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))
            ) : (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>
                {safeIndex + 1} / {cards.length}
              </span>
            )}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => goTo(safeIndex + 1)}
            disabled={safeIndex >= cards.length - 1}
            style={{
              background: 'none', border: 'none',
              cursor: safeIndex >= cards.length - 1 ? 'default' : 'pointer',
              color: safeIndex >= cards.length - 1 ? 'var(--text-tertiary)' : 'var(--accent-text)',
              fontSize: 18, padding: 4, opacity: safeIndex >= cards.length - 1 ? 0.3 : 1,
              fontFamily: 'system-ui',
            }}
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
};

export default SwipeableCardFeed;
