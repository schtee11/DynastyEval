import React, { useState, lazy, Suspense } from 'react';
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
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 18,
    color: '#6b7280',
  }}>
    Loading...
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('scout');

  return (
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
  );
}

export default App;
