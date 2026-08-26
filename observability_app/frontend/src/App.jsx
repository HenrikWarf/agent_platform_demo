import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, GitBranch, 
  Bot, Moon, Sun, RefreshCw, LayoutDashboard, Layers, Sparkles
} from 'lucide-react';

import FleetOverview from './components/FleetOverview';
import QualityEvalsSuite from './components/QualityEvalsSuite';
import ErrorTriageBoard from './components/ErrorTriageBoard';
import ConversationTraceWaterfall from './components/ConversationTraceWaterfall';
import AgentDeepDive from './components/AgentDeepDive';
import ObservabilityCopilotChat from './components/ObservabilityCopilotChat';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('dark');
  const [overviewData, setOverviewData] = useState(null);
  const [triageIssues, setTriageIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [overviewRes, triageRes] = await Promise.all([
        fetch('/api/obs/overview'),
        fetch('/api/obs/triage'),
      ]);
      const oData = await overviewRes.json();
      const tData = await triageRes.json();
      setOverviewData(oData);
      setTriageIssues(tData);
    } catch (e) {
      console.error('Failed to load telemetry', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar Header */}
      <header
        style={{
          height: '64px',
          padding: '0 2rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)' }}>
              <Activity size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Agent Observability & Quality Platform</h1>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GCP Reasoning Engines & OpenTelemetry Spans</div>
            </div>
          </div>

          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Project: agent-demo-09
          </span>
        </div>

        {/* Center Tab Navigation */}
        <nav style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.15)', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'overview' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <LayoutDashboard size={15} /> Fleet Overview
          </button>

          <button
            onClick={() => setActiveTab('evals')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'evals' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'evals' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={15} /> Quality Evals
          </button>

          <button
            onClick={() => setActiveTab('triage')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'triage' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'triage' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <AlertTriangle size={15} /> Error Triage ({overviewData?.open_triage_issues || 0})
          </button>

          <button
            onClick={() => setActiveTab('waterfall')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'waterfall' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'waterfall' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <GitBranch size={15} /> Trace Waterfall
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeTab === 'agents' ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === 'agents' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Bot size={15} /> Agent Deep-Dive
          </button>
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchData}
            title="Refresh Telemetry"
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <FleetOverview overviewData={overviewData} onSelectTab={setActiveTab} />
        )}
        {activeTab === 'evals' && <QualityEvalsSuite />}
        {activeTab === 'triage' && (
          <ErrorTriageBoard issues={triageIssues} onRefresh={fetchData} />
        )}
        {activeTab === 'waterfall' && <ConversationTraceWaterfall />}
        {activeTab === 'agents' && <AgentDeepDive />}
      </main>

      {/* Floating Observability Copilot Chat (Bottom Right) */}
      <ObservabilityCopilotChat />

    </div>
  );
}
