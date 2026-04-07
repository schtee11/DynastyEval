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

// Players
export const fetchPlayers = () => apiFetch('/api/players');
export const fetchPlayerStats = (name) =>
  apiFetch(`/api/players/${encodeURIComponent(name)}/stats`);

// Discussions
export const fetchDiscussions = (playerId, sort = 'new') =>
  apiFetch(`/api/discussions?player_id=${playerId}&sort=${sort}`);

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

export default apiFetch;
