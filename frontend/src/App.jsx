import React, { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, Database, Activity, Cpu, Sun, Moon } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SkillsInspector from './components/SkillsInspector';
import BigQueryDataViewer from './components/BigQueryDataViewer';
import SimulatorControls from './components/SimulatorControls';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      {/* Top Navbar Header */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Cpu size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">Google Cloud Agent Platform</span>
              <span className="brand-badge">Vertex AI Agent Engine</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Multi-Agent Marketing Demo | A2A Protocol | Model Armor | BigQuery
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={15} />
            Chat & A2A Visualizer
          </button>

          <button
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <BookOpen size={15} />
            Agent Registry & Skills
          </button>

          <button
            className={`tab-btn ${activeTab === 'bigquery' ? 'active' : ''}`}
            onClick={() => setActiveTab('bigquery')}
          >
            <Database size={15} />
            BigQuery Customer Data
          </button>

          <button
            className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Activity size={15} />
            Traffic Simulator & OTel
          </button>
        </nav>

        {/* Status & Theme Toggle */}
        <div className="status-section">
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode">
            {theme === 'dark' ? <Sun size={15} color="#fbbc04" /> : <Moon size={15} color="#4285f4" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="status-badge">
            <div className="pulse-dot"></div>
            <span>Agent Gateway Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'skills' && <SkillsInspector />}
        {activeTab === 'bigquery' && <BigQueryDataViewer />}
        {activeTab === 'simulator' && <SimulatorControls />}
      </main>
    </div>
  );
}
