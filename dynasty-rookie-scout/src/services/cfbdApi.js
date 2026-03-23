// collegefootballdata.com API service
// Requires REACT_APP_CFBD_API_KEY env var

const BASE_URL = 'https://api.collegefootballdata.com';

const headers = () => ({
  'Authorization': `Bearer ${process.env.REACT_APP_CFBD_API_KEY}`,
  'Content-Type': 'application/json'
});

export const getPlayerStats = async (playerName, year = 2024) => {
  try {
    const res = await fetch(
      `${BASE_URL}/stats/player/season?year=${year}&searchTerm=${encodeURIComponent(playerName)}`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(`CFBD API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('CFBD API fetch failed:', err);
    return null;
  }
};

export const getPlayerUsage = async (playerName, year = 2024) => {
  try {
    const res = await fetch(
      `${BASE_URL}/player/usage?year=${year}&searchTerm=${encodeURIComponent(playerName)}`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(`CFBD API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('CFBD usage fetch failed:', err);
    return null;
  }
};

export const getAdvancedStats = async (team, year = 2024) => {
  try {
    const res = await fetch(
      `${BASE_URL}/stats/season/advanced?year=${year}&team=${encodeURIComponent(team)}`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(`CFBD API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('CFBD advanced stats fetch failed:', err);
    return null;
  }
};
