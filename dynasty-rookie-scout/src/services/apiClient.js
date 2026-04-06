// API client — all requests go through our backend (Railway)
// API keys are server-side only, never exposed to the frontend

const API_BASE = process.env.REACT_APP_API_URL || '';

const getToken = () => {
  try {
    return localStorage.getItem('drs_auth_token');
  } catch {
    return null;
  }
};

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `API ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
};

// Auth
export const register = (email, username, password) =>
  apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

export const login = (email, password) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const fetchMe = () => apiFetch('/api/auth/me');

export const updateProfile = (data) =>
  apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

// Players
export const fetchPlayers = () => apiFetch('/api/players');
export const fetchPlayerStats = (name) =>
  apiFetch(`/api/players/${encodeURIComponent(name)}/stats`);

// Discussions
export const fetchDiscussions = (playerId, sort = 'new') =>
  apiFetch(`/api/discussions?player_id=${playerId}&sort=${sort}`);

export const fetchAllDiscussions = (sort = 'hot', limit = 50, offset = 0) =>
  apiFetch(`/api/discussions?sort=${sort}&limit=${limit}&offset=${offset}`);

export const createDiscussion = (playerId, title, content, url) =>
  apiFetch('/api/discussions', {
    method: 'POST',
    body: JSON.stringify({ player_id: playerId, title, content, url }),
  });

export const fetchDiscussion = (id) => apiFetch(`/api/discussions/${id}`);

export const addComment = (discussionId, content, parentId) =>
  apiFetch(`/api/discussions/${discussionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parent_id: parentId }),
  });

export const voteDiscussion = (id, direction) =>
  apiFetch(`/api/discussions/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  });

// Boards
export const fetchMyBoards = () => apiFetch('/api/boards');
export const fetchPublicBoards = () => apiFetch('/api/boards/public');
export const createBoard = (name, format, playerIds, visibility) =>
  apiFetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name, format, player_ids: playerIds, visibility }),
  });
export const updateBoard = (id, data) =>
  apiFetch(`/api/boards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
export const shareBoard = (id) =>
  apiFetch(`/api/boards/${id}/share`, { method: 'POST' });
export const fetchSharedBoard = (token) =>
  apiFetch(`/api/boards/shared/${token}`);
export const forkBoard = (id) =>
  apiFetch(`/api/boards/${id}/fork`, { method: 'POST' });
export const deleteBoard = (id) =>
  apiFetch(`/api/boards/${id}`, { method: 'DELETE' });

// Sleeper integration
export const lookupSleeperUser = (username) =>
  apiFetch(`/api/sleeper/user/${encodeURIComponent(username)}`);

// NFL season: use current year, but before March use previous year (league renewal window)
const getNflSeason = () => {
  const now = new Date();
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  return String(year);
};

export const fetchSleeperLeagues = (sleeperUserId, season) =>
  apiFetch(`/api/sleeper/leagues/${sleeperUserId}/${season || getNflSeason()}`);

export const syncSleeperLeague = (data) =>
  apiFetch('/api/sleeper/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchMySleeperLeagues = () => apiFetch('/api/sleeper/my-leagues');

export const unlinkSleeperLeague = (leagueId) =>
  apiFetch(`/api/sleeper/league/${leagueId}`, { method: 'DELETE' });

export default apiFetch;
