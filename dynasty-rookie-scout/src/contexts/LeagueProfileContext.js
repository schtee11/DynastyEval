import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STANDARD_1QB, STANDARD_SF } from '../utils/personalizedRank';
import { fetchMySleeperLeagues } from '../services/apiClient';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'drs_league_profile';
const LEGACY_FORMAT_KEY = 'drs_league_format';
const AUTO_SYNC_FLAG = 'drs_league_profile_auto_synced';

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
  const { user } = useAuth();
  const [profile, setProfile] = useState(loadInitialProfile);
  // Remember the most recently seen Sleeper profile so the settings
  // modal can offer a one-click "use my Sleeper league" button.
  const [sleeperProfile, setSleeperProfile] = useState(null);

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

  // For authenticated users: fetch their most recently synced Sleeper
  // league and (a) remember it for the settings modal, (b) auto-apply
  // it the very first time so users who had synced before this feature
  // shipped see their league profile without having to re-sync.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMySleeperLeagues();
        if (cancelled) return;
        const leagues = res?.leagues || [];
        // Sorted by synced_at DESC on the backend; take the first.
        const mostRecent = leagues[0];
        if (!mostRecent?.league_profile) return;
        setSleeperProfile(mostRecent.league_profile);

        // Auto-apply once so pre-existing users get their league
        // rankings out of the box. After that, respect the user's
        // explicit choice (preset or manual).
        const alreadyAutoSynced = (() => {
          try { return localStorage.getItem(AUTO_SYNC_FLAG) === '1'; } catch { return false; }
        })();
        const hasExplicitProfile = (() => {
          try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
        })();
        if (!alreadyAutoSynced && !hasExplicitProfile) {
          setProfile(mostRecent.league_profile);
          try { localStorage.setItem(AUTO_SYNC_FLAG, '1'); } catch {}
        }
      } catch { /* offline / unauth / no leagues — silent */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setPreset1QB = useCallback(() => setProfile(STANDARD_1QB), []);
  const setPresetSF = useCallback(() => setProfile(STANDARD_SF), []);
  const setCustomProfile = useCallback((next) => {
    // Always stamp source='manual' unless caller explicitly set it.
    setProfile({ ...next, source: next.source || 'manual' });
  }, []);
  const applySleeperProfile = useCallback(() => {
    if (sleeperProfile) setProfile(sleeperProfile);
  }, [sleeperProfile]);

  const value = useMemo(() => ({
    profile,
    setProfile: setCustomProfile,
    setPreset1QB,
    setPresetSF,
    sleeperProfile,
    applySleeperProfile,
    hasSleeper: !!sleeperProfile,
    isCustom: profile.source !== 'preset',
  }), [profile, setCustomProfile, setPreset1QB, setPresetSF, sleeperProfile, applySleeperProfile]);

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
      sleeperProfile: null,
      applySleeperProfile: () => {},
      hasSleeper: false,
      isCustom: false,
    };
  }
  return ctx;
};
