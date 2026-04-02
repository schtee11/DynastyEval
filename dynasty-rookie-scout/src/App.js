import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { getPlayers } from './services/dataService';
import './App.css';

const ProspectHub = lazy(() => import('./components/ProspectHub'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile'));
const CompareView = lazy(() => import('./components/CompareView'));
const MyBoard = lazy(() => import('./components/MyBoard'));

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

function App() {
  const [activeTab, setActiveTab] = useState('hub');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [comparePlayerIds, setComparePlayerIds] = useState([]);
  const [studiedPlayers, setStudiedPlayers] = useState(loadStudied);
  const [playerVideos, setPlayerVideos] = useState(loadVideos);

  // Load players once at app level
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPlayers();
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

  // Persist studied set and videos
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

  const navigateToProfile = useCallback((playerId) => {
    setSelectedPlayerId(playerId);
    setActiveTab('profile');
    window.scrollTo(0, 0);
  }, []);

  const navigateToHub = useCallback(() => {
    setActiveTab('hub');
    setSelectedPlayerId(null);
  }, []);

  const navigateToCompare = useCallback((playerIds = []) => {
    setComparePlayerIds(playerIds);
    setActiveTab('compare');
  }, []);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || null;

  return (
    <ThemeProvider>
      <div className="app-root">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPlayer={selectedPlayer}
          onBackToHub={navigateToHub}
        />
        <main>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 'hub' && (
                <ProspectHub
                  players={players}
                  loading={loading}
                  error={error}
                  studiedPlayers={studiedPlayers}
                  toggleStudied={toggleStudied}
                  onSelectPlayer={navigateToProfile}
                  onCompare={navigateToCompare}
                />
              )}
              {activeTab === 'profile' && selectedPlayer && (
                <PlayerProfile
                  player={selectedPlayer}
                  allPlayers={players}
                  studiedPlayers={studiedPlayers}
                  toggleStudied={toggleStudied}
                  onBack={navigateToHub}
                  onSelectPlayer={navigateToProfile}
                  videos={playerVideos[selectedPlayerId] || []}
                  onAddVideo={(url) => addVideo(selectedPlayerId, url)}
                  onRemoveVideo={(url) => removeVideo(selectedPlayerId, url)}
                />
              )}
              {activeTab === 'compare' && (
                <CompareView
                  players={players}
                  initialPlayerIds={comparePlayerIds}
                  onSelectPlayer={navigateToProfile}
                />
              )}
              {activeTab === 'myboard' && (
                <MyBoard
                  onSelectPlayer={navigateToProfile}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
