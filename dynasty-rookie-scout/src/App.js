import React, { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const ScoutBoard = lazy(() => import('./components/ScoutBoard'));
const MyBoard = lazy(() => import('./components/MyBoard'));

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
  const [activeTab, setActiveTab] = useState('scout');

  return (
    <ThemeProvider>
      <div className="app-root">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 'scout' && <ScoutBoard />}
              {activeTab === 'myboard' && <MyBoard />}
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
