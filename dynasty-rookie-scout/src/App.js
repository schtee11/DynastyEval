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

const loadStudied = () => {
  try {
    const raw = localStorage.getItem(STUDIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const LoadingFallback = () => (
  <div style={{
    textAlign: 'center',
    padding: 60,
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    color: 'var(--text-tertiary)',
  }}>
    Loading...
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

  // Persist studied set
  useEffect(() => {
    localStorage.setItem(STUDIED_KEY, JSON.stringify([...studiedPlayers]));
  }, [studiedPlayers]);

  const toggleStudied = useCallback((playerId) => {
    setStudiedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
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
