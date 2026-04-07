import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataProvider } from './contexts/UserDataContext';
import { LeagueProfileProvider } from './contexts/LeagueProfileContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { getPlayers } from './services/dataService';
import './App.css';

const useIsMobile = () => {
  const [mobile, setMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
};

const ProspectHub = lazy(() => import('./components/ProspectHub'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile'));
const PlayerDiscussionPage = lazy(() => import('./components/PlayerDiscussionPage'));
const CompareView = lazy(() => import('./components/CompareView'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const SharedBoardView = lazy(() => import('./components/SharedBoardView'));
const MyBoard = lazy(() => import('./components/MyBoard'));
const BrowseBoards = lazy(() => import('./components/BrowseBoards'));
const DraftRoom = lazy(() => import('./components/DraftRoom'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings'));
const PricingPage = lazy(() => import('./components/PricingPage'));

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

  const isMobile = useIsMobile();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const showFooter = !isMobile && !isHome;

  return (
    <div className={`app-root ${isMobile ? 'app-mobile' : 'app-desktop'}`}>
      <Header />
      <main style={isMobile ? { paddingBottom: 56 } : isHome ? { overflow: 'hidden' } : undefined}>
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
              <Route path="/player/:id/discuss" element={
                <PlayerDiscussionPage players={players} />
              } />
              <Route path="/community" element={
                <CommunityPage players={players} />
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
              <Route path="/board/shared/:token" element={
                <SharedBoardView players={players} />
              } />
              <Route path="/boards" element={
                <BrowseBoards players={players} />
              } />
              <Route path="/draft" element={
                <DraftRoom />
              } />
              <Route path="/login" element={
                <AuthPage onSuccess={() => navigate('/')} />
              } />
              <Route path="/pricing" element={
                <PricingPage />
              } />
              <Route path="/profile" element={
                <ProfileSettings />
              } />
              <Route path="/admin" element={
                <AdminPage players={players} />
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {isMobile ? <BottomNav /> : showFooter ? <Footer /> : null}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UserDataProvider>
            <LeagueProfileProvider>
              <AppInner />
            </LeagueProfileProvider>
          </UserDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
