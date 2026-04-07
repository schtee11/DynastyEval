import React, { useState, useEffect } from 'react';
import { useLeagueProfile } from '../contexts/LeagueProfileContext';
import { STANDARD_1QB, STANDARD_SF } from '../utils/personalizedRank';

/**
 * Modal for configuring the user's league profile. Drives every
 * personalized ranking in the app. Two quick-select presets plus a
 * manual form for format / teams / PPR / TEP / starting lineup.
 *
 * No backend calls — state is owned by LeagueProfileContext which
 * persists to localStorage on every change.
 */
const FieldLabel = ({ children }) => (
  <label style={{
    display: 'block',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  }}>
    {children}
  </label>
);

const NumInput = ({ value, onChange, min = 0, max = 16 }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    onChange={(e) => onChange(Number(e.target.value) || 0)}
    style={{
      width: '100%',
      padding: '8px 10px',
      fontFamily: "'Inter', sans-serif",
      fontSize: 14,
      color: 'var(--text-primary)',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      outline: 'none',
    }}
  />
);

const Tile = ({ selected, onClick, title, subtitle, badge, accent }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 4,
      padding: '12px 14px',
      fontFamily: "'Inter', sans-serif",
      textAlign: 'left',
      background: selected ? 'var(--accent-light, rgba(59,130,246,0.12))' : 'transparent',
      color: 'var(--text-primary)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-primary)'}`,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      transition: 'all 0.15s',
      width: '100%',
      position: 'relative',
    }}
  >
    {badge && (
      <span style={{
        position: 'absolute',
        top: 10,
        right: 12,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: accent ? 'var(--accent)' : 'var(--text-tertiary)',
        background: accent ? 'var(--accent-light, rgba(59,130,246,0.15))' : 'transparent',
        padding: '2px 6px',
        borderRadius: 3,
      }}>
        {badge}
      </span>
    )}
    <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{subtitle}</span>
  </button>
);

const Segmented = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
    {options.map((opt, i) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          flex: 1,
          padding: '8px 10px',
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          background: value === opt.value ? 'var(--accent)' : 'transparent',
          color: value === opt.value ? '#fff' : 'var(--text-secondary)',
          border: 'none',
          borderLeft: i === 0 ? 'none' : '1px solid var(--border-primary)',
          cursor: 'pointer',
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const LeagueProfileSettings = ({ open, onClose }) => {
  const { profile, setProfile, sleeperLeagues, hasSleeper } = useLeagueProfile();
  // Local working copy so the user can cancel without committing.
  const [draft, setDraft] = useState(profile);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setShowAdvanced(profile.source === 'manual');
    }
  }, [open, profile]);

  if (!open) return null;

  const patch = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const patchStarters = (patch) => setDraft((d) => ({ ...d, starters: { ...d.starters, ...patch } }));

  const applyPreset = (preset) => {
    setDraft(preset);
  };

  const save = () => {
    setProfile(draft);
    onClose?.();
  };

  const currentIs1QB = draft.source === 'preset' && draft.presetId === 'STANDARD_1QB';
  const currentIsSF = draft.source === 'preset' && draft.presetId === 'STANDARD_SF';

  // Build the subtitle string for a Sleeper league tile.
  const sleeperSubtitle = (lp) => {
    const fmt = lp.format === 'superflex' ? 'SF' : '1QB';
    const ppr = lp.ppr === 1 ? 'Full PPR' : lp.ppr === 0.5 ? '½ PPR' : '0 PPR';
    const tep = lp.tePremium > 0 ? ` · TEP ${lp.tePremium}` : '';
    return `${fmt} · ${lp.teams} teams · ${ppr}${tep}`;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-modal, 2000)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.4))',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              League Profile
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Rankings auto-adjust to your league settings
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* One tile per synced Sleeper league */}
          {hasSleeper && (
            <div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>Your Sleeper leagues</span>
                <span style={{
                  fontSize: 9,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-input)',
                  padding: '1px 6px',
                  borderRadius: 8,
                }}>
                  {sleeperLeagues.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sleeperLeagues.map((lg) => {
                  const lp = lg.league_profile;
                  const selected = draft.source === 'sleeper' && draft.leagueId === lp.leagueId;
                  return (
                    <Tile
                      key={lg.league_id}
                      selected={selected}
                      onClick={() => setDraft(lp)}
                      title={lp.leagueName || lg.league_name || 'Sleeper League'}
                      subtitle={sleeperSubtitle(lp)}
                      badge="Sleeper"
                      accent
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Preset tiles */}
          <div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
            }}>
              Generic presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Tile
                selected={currentIs1QB}
                onClick={() => applyPreset(STANDARD_1QB)}
                title="Standard 1QB"
                subtitle="12 teams · Full PPR"
              />
              <Tile
                selected={currentIsSF}
                onClick={() => applyPreset(STANDARD_SF)}
                title="Standard Superflex"
                subtitle="12 teams · Full PPR"
              />
            </div>
          </div>

          {/* Advanced disclosure */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>›</span>
            Custom league settings
          </button>

          {showAdvanced && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Format */}
              <div>
                <FieldLabel>Format</FieldLabel>
                <Segmented
                  options={[
                    { label: '1QB', value: 'oneQB' },
                    { label: 'Superflex', value: 'superflex' },
                  ]}
                  value={draft.format}
                  onChange={(format) => patch({ format, source: 'manual' })}
                />
              </div>

              {/* Teams + PPR + TEP row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel>Teams</FieldLabel>
                  <NumInput value={draft.teams} onChange={(teams) => patch({ teams, source: 'manual' })} min={4} max={24} />
                </div>
                <div>
                  <FieldLabel>PPR</FieldLabel>
                  <Segmented
                    options={[
                      { label: '0', value: 0 },
                      { label: '½', value: 0.5 },
                      { label: '1', value: 1 },
                    ]}
                    value={draft.ppr}
                    onChange={(ppr) => patch({ ppr, source: 'manual' })}
                  />
                </div>
                <div>
                  <FieldLabel>TE Premium</FieldLabel>
                  <NumInput value={draft.tePremium} onChange={(tePremium) => patch({ tePremium, source: 'manual' })} min={0} max={2} />
                </div>
              </div>

              {/* Starting lineup */}
              <div>
                <FieldLabel>Starters</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {['qb', 'rb', 'wr', 'te', 'flex', 'superflex'].map((key) => (
                    <div key={key}>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        marginBottom: 2,
                        textTransform: 'uppercase',
                      }}>
                        {key === 'superflex' ? 'SF' : key.toUpperCase()}
                      </div>
                      <NumInput
                        value={draft.starters?.[key] ?? 0}
                        onChange={(v) => { patchStarters({ [key]: v }); patch({ source: 'manual' }); }}
                        min={0}
                        max={6}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bench + Taxi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel>Bench</FieldLabel>
                  <NumInput value={draft.bench ?? 0} onChange={(bench) => patch({ bench, source: 'manual' })} min={0} max={20} />
                </div>
                <div>
                  <FieldLabel>Taxi</FieldLabel>
                  <NumInput value={draft.taxi ?? 0} onChange={(taxi) => patch({ taxi, source: 'manual' })} min={0} max={10} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '10px 18px',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeagueProfileSettings;
