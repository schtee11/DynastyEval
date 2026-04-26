// ESPN draft picks — fetched via our backend proxy (which hits ESPN's
// public Core API and resolves athlete/team $refs server-side).
//
// Shape returned: [{ pick, round, name, position, college, team }, ...]

const API_BASE = process.env.REACT_APP_API_URL || '';

const CACHE_KEY_PREFIX = 'espn_draft_v1_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour client-side

const cacheKey = (year) => `${CACHE_KEY_PREFIX}${year}`;

const readCache = (year) => {
  try {
    const raw = localStorage.getItem(cacheKey(year));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(cacheKey(year));
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const writeCache = (year, data) => {
  try {
    localStorage.setItem(cacheKey(year), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full or unavailable
  }
};

/**
 * Fetch the actual draft picks for a given year.
 * Returns [] if the backend isn't reachable or has no data — callers should
 * fall back to whatever projected/static data they have.
 */
export const fetchEspnDraftPicks = async (year = 2026) => {
  const cached = readCache(year);
  if (cached) return cached;

  if (!API_BASE) {
    console.warn('[ESPN Draft] No REACT_APP_API_URL configured');
    return [];
  }

  try {
    const res = await fetch(`${API_BASE}/api/draft/${year}`);
    if (!res.ok) {
      console.warn(`[ESPN Draft] /api/draft/${year} → ${res.status}`);
      return [];
    }
    const body = await res.json();
    const picks = Array.isArray(body?.picks) ? body.picks : [];
    if (picks.length > 0) writeCache(year, picks);
    return picks;
  } catch (err) {
    console.warn('[ESPN Draft] fetch failed:', err.message);
    return [];
  }
};

/**
 * Force a fresh server-side pull (bypasses both client and server caches).
 * Use this from a manual "Refresh draft data" button.
 */
export const refreshEspnDraftPicks = async (year = 2026) => {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/draft/${year}/refresh`, { method: 'POST' });
    if (!res.ok) return [];
    const body = await res.json();
    const picks = Array.isArray(body?.picks) ? body.picks : [];
    if (picks.length > 0) writeCache(year, picks);
    return picks;
  } catch {
    return [];
  }
};

export const clearEspnDraftCache = (year = 2026) => {
  try { localStorage.removeItem(cacheKey(year)); } catch { /* noop */ }
};
