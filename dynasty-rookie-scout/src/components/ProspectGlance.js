import React from 'react';
import { generateStrengths, generateConcerns, generateOutlook, positionColors } from '../utils/helpers';
const StrengthItem = ({ item }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 0',
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    <span style={{
      flexShrink: 0,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: item.percentile >= 90 ? 'var(--success)' : 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 800,
      marginTop: 1,
    }}>
      {item.percentile >= 90 ? '\u2605' : '\u2713'}
    </span>
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 13,
      color: 'var(--text-primary)',
      lineHeight: 1.5,
    }}>
      {item.text}
    </span>
  </div>
);

const ConcernItem = ({ item }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 0',
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    <span style={{
      flexShrink: 0,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: item.severity === 'high' ? 'var(--danger)' : 'var(--warning)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 800,
      marginTop: 1,
    }}>
      !
    </span>
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 13,
      color: 'var(--text-primary)',
      lineHeight: 1.5,
    }}>
      {item.text}
    </span>
  </div>
);

const SectionTitle = ({ children, color }) => (
  <h3 style={{
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: color || 'var(--accent-text)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
  }}>
    {children}
  </h3>
);

const ProspectGlance = ({ player, allPlayers }) => {
  const strengths = generateStrengths(player, allPlayers);
  const concerns = generateConcerns(player, allPlayers);
  const outlook = generateOutlook(player, allPlayers);
  const posColor = positionColors[player.position] || positionColors.WR;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        background: posColor.bg,
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: posColor.text,
          margin: 0,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          At a Glance
        </h2>
      </div>

      <div style={{ padding: 20 }}>
        {/* Strengths */}
        {strengths.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle color="var(--success)">Strengths</SectionTitle>
            {strengths.map((s, i) => <StrengthItem key={i} item={s} />)}
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle color="var(--danger)">Concerns</SectionTitle>
            {concerns.map((c, i) => <ConcernItem key={i} item={c} />)}
          </div>
        )}

        {/* Dynasty Outlook */}
        {outlook && (
          <div>
            <SectionTitle>Dynasty Outlook</SectionTitle>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              margin: 0,
            }}>
              {outlook}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectGlance;
