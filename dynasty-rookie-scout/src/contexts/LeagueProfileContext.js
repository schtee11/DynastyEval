import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STANDARD_1QB, STANDARD_SF } from '../utils/personalizedRank';

const STORAGE_KEY = 'drs_league_profile';
const LEGACY_FORMAT_KEY = 'drs_league_format';

const LeagueProfileContext = createContext(null);

/**
 * Reads any persisted profile from localStorage, falling back to the
 * legacy `drs_league_format` string (from the old 1QB/SF toggle) so
 * existing users land on a sensible preset on first load.
 */
const loadInitialProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.format) {
        return parsed;
      }
    }
  } catch { /* fall through */ }

  try {
    const legacy = localStorage.getItem(LEGACY_FORMAT_KEY);
    if (legacy === 'SF' || legacy === 'superflex') return STANDARD_SF;
  } catch { /* ignore */ }

  return STANDARD_1QB;
};

/**
 * LeagueProfileProvider — owns the user's current league profile.
 * Persists to localStorage on every change. Exposes helpers to swap
 * between the built-in presets or set a custom profile.
 */
export const LeagueProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(loadInitialProfile);

  // Mirror changes to localStorage + maintain the legacy format key so
  // any un-migrated components still work.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(LEGACY_FORMAT_KEY, profile.format === 'superflex' ? 'SF' : '1QB');
    } catch { /* ignore quota errors */ }
  }, [profile]);

  // When SleeperSync writes a new profile to localStorage, pick it up.
  useEffect(() => {
    const onExternalUpdate = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.format) {
          setProfile(parsed);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('drs_league_profile_updated', onExternalUpdate);
    return () => window.removeEventListener('drs_league_profile_updated', onExternalUpdate);
  }, []);

  const setPreset1QB = useCallback(() => setProfile(STANDARD_1QB), []);
  const setPresetSF = useCallback(() => setProfile(STANDARD_SF), []);
  const setCustomProfile = useCallback((next) => {
    // Always stamp source='manual' unless caller explicitly set it.
    setProfile({ ...next, source: next.source || 'manual' });
  }, []);

  const value = useMemo(() => ({
    profile,
    setProfile: setCustomProfile,
    setPreset1QB,
    setPresetSF,
    isCustom: profile.source !== 'preset',
  }), [profile, setCustomProfile, setPreset1QB, setPresetSF]);

  return (
    <LeagueProfileContext.Provider value={value}>
      {children}
    </LeagueProfileContext.Provider>
  );
};

export const useLeagueProfile = () => {
  const ctx = useContext(LeagueProfileContext);
  if (!ctx) {
    // Defensive fallback so components that render outside the provider
    // (tests, storybook) don't crash — they just get the 1QB preset.
    return {
      profile: STANDARD_1QB,
      setProfile: () => {},
      setPreset1QB: () => {},
      setPresetSF: () => {},
      isCustom: false,
    };
  }
  return ctx;
};
