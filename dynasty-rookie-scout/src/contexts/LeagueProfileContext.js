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
  // Remember every synced Sleeper league so the settings modal can
  // render one tile per league and let the user switch between them.
  const [sleeperLeagues, setSleeperLeagues] = useState([]);

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

  // For authenticated users: fetch every synced Sleeper league and
  // (a) remember them for the settings modal, (b) auto-apply the most
  // recent one the very first time so users who synced before this
  // feature shipped see their league profile without re-syncing.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMySleeperLeagues();
        if (cancelled) return;
        const leagues = (res?.leagues || []).filter(l => l?.league_profile);
        // Stamp each league's profile with its league_id so the UI can
        // identify which tile is currently active.
        const normalized = leagues.map(l => ({
          ...l,
          league_profile: { ...l.league_profile, leagueId: l.league_id },
        }));
        setSleeperLeagues(normalized);
        if (normalized.length === 0) return;

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
          setProfile(normalized[0].league_profile);
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

  const value = useMemo(() => ({
    profile,
    setProfile: setCustomProfile,
    setPreset1QB,
    setPresetSF,
    sleeperLeagues,
    hasSleeper: sleeperLeagues.length > 0,
    isCustom: profile.source !== 'preset',
  }), [profile, setCustomProfile, setPreset1QB, setPresetSF, sleeperLeagues]);

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
      sleeperLeagues: [],
      hasSleeper: false,
      isCustom: false,
    };
  }
  return ctx;
};
