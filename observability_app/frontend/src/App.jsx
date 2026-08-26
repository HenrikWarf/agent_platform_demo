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
import ObservabilityAssistantChat from './components/ObservabilityAssistantChat';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState('light');
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
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncGCP = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/obs/sync', { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error('Failed to sync with GCP Agent Engine', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header style={{
        padding: '0.85rem 1.75rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                GCP Agent Platform
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(79, 70, 229, 0.15)',
                color: 'var(--accent-indigo)',
                border: '1px solid rgba(79, 70, 229, 0.3)',
              }}>
                OBSERVABILITY
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Telemetry, Error Triage & LLM-as-a-Judge Quality Suite
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{
          display: 'flex',
          gap: '0.35rem',
          background: 'var(--bg-secondary)',
          padding: '0.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}>
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
            <Activity size={15} /> Fleet Overview
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
            onClick={handleSyncGCP}
            disabled={isSyncing}
            title="Sync latest completion logs from GCP Agent Engine (gs://agent-demo-09-agent-platform-logs)"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid rgba(79, 70, 229, 0.4)',
              background: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--accent-indigo)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing GCP...' : 'Sync GCP Logs'}
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

      {/* Floating Observability Assistant Chat (Bottom Right) */}
      <ObservabilityAssistantChat />

    </div>
  );
}
