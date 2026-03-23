import React, { useState } from 'react';
import Header from './components/Header';
import ScoutBoard from './components/ScoutBoard';
import MyBoard from './components/MyBoard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('scout');

  return (
    <div className="app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {activeTab === 'scout' && <ScoutBoard />}
        {activeTab === 'myboard' && <MyBoard />}
      </main>
    </div>
  );
}

export default App;
