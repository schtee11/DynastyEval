import React, { useState } from 'react';
import Header from './components/Header';
import ScoutBoard from './components/ScoutBoard';
import MyBoard from './components/MyBoard';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('scout');

  return (
    <div className="app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        <ErrorBoundary>
          {activeTab === 'scout' && <ScoutBoard />}
          {activeTab === 'myboard' && <MyBoard />}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
