import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { getPlayers } from './services/dataService';
import './App.css';

const ProspectHub = lazy(() => import('./components/ProspectHub'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile'));
const CompareView = lazy(() => import('./components/CompareView'));
const MyBoard = lazy(() => import('./components/MyBoard'));
const AuthPage = lazy(() => import('./components/AuthPage'));

const STUDIED_KEY = 'drs_studied_players';
const VIDEOS_KEY = 'drs_player_videos';

const loadStudied = () => {
  try {
    const raw = localStorage.getItem(STUDIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const loadVideos = () => {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const LoadingFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 60,
  }}>
    <div className="loading-spinner" />
    <span style={{
      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
      color: 'var(--text-secondary)',
    }}>Loading...</span>
  </div>
);

// Wrapper to inject navigation + route params
function PlayerProfileRoute({ players, studiedPlayers, toggleStudied, playerVideos, addVideo, removeVideo }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerId = Number(id);
  const player = players.find(p => p.id === playerId) || null;

  if (!player) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Player not found</div>;
  }

  return (
    <PlayerProfile
      player={player}
      allPlayers={players}
      studiedPlayers={studiedPlayers}
      toggleStudied={toggleStudied}
      onBack={() => navigate('/')}
      onSelectPlayer={(pid) => navigate(`/player/${pid}`)}
      videos={playerVideos[playerId] || []}
      onAddVideo={(url) => addVideo(playerId, url)}
      onRemoveVideo={(url) => removeVideo(playerId, url)}
    />
  );
}

function AppInner() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studiedPlayers, setStudiedPlayers] = useState(loadStudied);
  const [playerVideos, setPlayerVideos] = useState(loadVideos);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPlayers((updated) => setPlayers(updated));
        setPlayers(data);
      } catch (err) {
        console.error('[App] Failed to load players:', err);
        setError(err.message || 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(STUDIED_KEY, JSON.stringify([...studiedPlayers]));
  }, [studiedPlayers]);

  useEffect(() => {
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(playerVideos));
  }, [playerVideos]);

  const toggleStudied = useCallback((playerId) => {
    setStudiedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }, []);

  const addVideo = useCallback((playerId, url) => {
    setPlayerVideos(prev => {
      const existing = prev[playerId] || [];
      if (existing.includes(url)) return prev;
      return { ...prev, [playerId]: [...existing, url] };
    });
  }, []);

  const removeVideo = useCallback((playerId, url) => {
    setPlayerVideos(prev => {
      const existing = prev[playerId] || [];
      const filtered = existing.filter(u => u !== url);
      const next = { ...prev };
      if (filtered.length === 0) delete next[playerId];
      else next[playerId] = filtered;
      return next;
    });
  }, []);

  return (
    <div className="app-root">
      <Header
        onNavigate={(path) => navigate(path)}
      />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={
                <ProspectHub
                  players={players}
                  loading={loading}
                  error={error}
                  studiedPlayers={studiedPlayers}
                  toggleStudied={toggleStudied}
                  onSelectPlayer={(pid) => navigate(`/player/${pid}`)}
                  onCompare={(ids) => navigate('/compare', { state: { playerIds: ids } })}
                />
              } />
              <Route path="/player/:id" element={
                <PlayerProfileRoute
                  players={players}
                  studiedPlayers={studiedPlayers}
                  toggleStudied={toggleStudied}
                  playerVideos={playerVideos}
                  addVideo={addVideo}
                  removeVideo={removeVideo}
                />
              } />
              <Route path="/compare" element={
                <CompareView
                  players={players}
                  onSelectPlayer={(pid) => navigate(`/player/${pid}`)}
                />
              } />
              <Route path="/board" element={
                <MyBoard
                  onSelectPlayer={(pid) => navigate(`/player/${pid}`)}
                />
              } />
              <Route path="/login" element={
                <AuthPage onSuccess={() => navigate('/')} />
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
