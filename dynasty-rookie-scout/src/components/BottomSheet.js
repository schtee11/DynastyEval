import React, { useRef, useCallback, useState } from 'react';

/**
 * Swipe-to-dismiss bottom sheet.
 * - Drag the handle area downward to dismiss.
 * - When scrollable content is at the top and user pulls down, also dismisses.
 * - Backdrop tap dismisses.
 */
const DISMISS_THRESHOLD = 80;

const BottomSheet = ({ open, onClose, children, maxHeight = '70vh' }) => {
  const contentRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const dragDecided = useRef(false); // have we decided if this touch is a drag vs scroll?

  // Called on the entire sheet (handle + content)
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    dragDecided.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    const content = contentRef.current;
    const scrolledToTop = !content || content.scrollTop <= 0;

    // Only drag the sheet if pulling down AND content is at the top
    if (!dragDecided.current) {
      if (delta > 8 && scrolledToTop) {
        // User is pulling down from top — start sheet drag
        dragDecided.current = true;
        setIsDragging(true);
      } else if (delta < -8 || !scrolledToTop) {
        // User is scrolling up or content is scrolled — let it scroll
        dragDecided.current = true;
        return;
      } else {
        return; // Not enough movement to decide
      }
    }

    if (isDragging) {
      const clampedDelta = Math.max(0, delta);
      setDragY(clampedDelta);
      e.preventDefault();
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      if (dragY > DISMISS_THRESHOLD) {
        onClose();
      }
      setDragY(0);
      setIsDragging(false);
    }
    dragDecided.current = false;
  }, [isDragging, dragY, onClose]);

  if (!open) return null;

  const translateY = isDragging ? dragY : 0;
  const opacity = isDragging ? Math.max(0.1, 1 - dragY / 400) : 1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 'var(--z-overlay, 200)',
          opacity,
          transition: isDragging ? 'none' : 'opacity 0.2s',
        }}
      />
      {/* Sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-modal, 300)',
          background: 'var(--bg-primary)',
          borderRadius: '16px 16px 0 0',
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: isDragging ? 'none' : 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          padding: '10px 0 6px',
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
        }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--text-tertiary)',
            opacity: 0.4,
            margin: '0 auto',
          }} />
        </div>
        {/* Content — scrolls normally until at top, then drag takes over */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
