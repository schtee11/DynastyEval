import React, { useState, useRef, useEffect, memo } from 'react';

const SearchInput = memo(({ value, onChange }) => {
  const [local, setLocal] = useState(value || '');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Sync external value changes
  useEffect(() => { setLocal(value || ''); }, [value]);

  // Debounce
  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 150);
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
    inputRef.current?.focus();
  };

  // Keyboard shortcut: "/" to focus
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      maxWidth: 280,
      flex: 1,
    }}>
      {/* Search icon */}
      <svg
        style={{
          position: 'absolute',
          left: 10,
          width: 14,
          height: 14,
          color: 'var(--text-tertiary)',
          pointerEvents: 'none',
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search players..."
        value={local}
        onChange={handleChange}
        style={{
          width: '100%',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          padding: '7px 32px 7px 32px',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      />

      {/* Clear button or "/" hint */}
      {local ? (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: 16,
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >
          \u00D7
        </button>
      ) : (
        <span style={{
          position: 'absolute',
          right: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          padding: '1px 5px',
          borderRadius: 3,
          pointerEvents: 'none',
        }}>
          /
        </span>
      )}
    </div>
  );
});

export default SearchInput;
