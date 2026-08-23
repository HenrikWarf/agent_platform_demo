import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  BookOpen, 
  Database, 
  Activity, 
  Sun, 
  Moon, 
  Globe, 
  Shirt, 
  Layers,
  ChevronDown
} from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SkillsInspector from './components/SkillsInspector';
import BigQueryDataViewer from './components/BigQueryDataViewer';
import A2AExplorer from './components/A2AExplorer';
import SimulatorControls from './components/SimulatorControls';
import ClientWorkspaceSelector, { CLIENTS_METADATA } from './components/ClientWorkspaceSelector';

const getWelcomeMessage = (clientId) => {
  if (clientId === 'ica_sweden') {
    return {
      role: 'assistant',
      content: 'Välkommen till **ICA Sverige Marketing & Deal Platform**! Jag är din AI-marknadsassistent för dagligvaror, hälsa och Stammis-lojalitet driven av **Google Cloud Agent Engine**. Be mig analysera kunddata i BigQuery, curera produktrekommendationer, skapa deklarativa A2UI-erbjudandebanners med "Ladda till kortet", eller formulera kampanjstrategier i SEK (kr).',
      a2a_trace: [],
      model_armor: { passed: true }
    };
  }
  return {
    role: 'assistant',
    content: 'Welcome to the **Crazy Fashion Marketing Platform**! I\'m your AI marketing assistant powered by **Google Cloud Agent Engine**. Ask me to analyze customer segments in BigQuery, curate 5-product assortments, design campaign strategies for our Nordic fashion collections, or generate on-brand creative copy in EUR (€).',
    a2a_trace: [],
    model_armor: { passed: true }
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [theme, setTheme] = useState('light');

  // Client workspace management
  const [activeClientId, setActiveClientId] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('gcp_agent_client_id') || 'crazy_fashion';
    }
    return 'crazy_fashion';
  });
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !window.localStorage.getItem('gcp_agent_client_id_visited');
    }
    return false;
  });

  const activeClient = CLIENTS_METADATA.find(c => c.client_id === activeClientId) || CLIENTS_METADATA[0];

  const [messages, setMessages] = useState(() => [getWelcomeMessage(activeClientId)]);
  const [sessionId, setSessionId] = useState(null);
  const [userId] = useState(() => `user-${Math.random().toString(36).substring(2, 9)}`);

  const clearMessages = useCallback(() => {
    setMessages([getWelcomeMessage(activeClientId)]);
    setSessionId(null);
  }, [activeClientId]);

  // Handle client workspace selection
  const handleSelectClient = (clientId) => {
    setActiveClientId(clientId);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gcp_agent_client_id', clientId);
      window.localStorage.setItem('gcp_agent_client_id_visited', 'true');
    }
    setShowWorkspaceSelector(false);
    setMessages([getWelcomeMessage(clientId)]);
    setSessionId(null);

    // Notify backend
    fetch('/api/clients/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId })
    }).catch(err => console.log('Client switch API sync:', err));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const ClientIcon = activeClient.logo_icon || Shirt;

  return (
    <div className="app-container">
      {/* Client Workspace Selector Modal Overlay */}
      {showWorkspaceSelector && (
        <ClientWorkspaceSelector
          activeClientId={activeClientId}
          onSelectClient={handleSelectClient}
          isModal={typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('gcp_agent_client_id_visited') === 'true'}
          onClose={() => setShowWorkspaceSelector(false)}
        />
      )}

      {/* Top Navbar Header */}
      <header className="navbar" style={{ borderBottomColor: `${activeClient.primary_color}30` }}>
        <div className="brand-section">
          <div className="brand-logo" style={{ background: activeClient.header_gradient }}>
            <ClientIcon size={19} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span className="brand-title" style={{ fontWeight: 800 }}>
                {activeClient.client_name}
              </span>
              <span className="brand-badge" style={{
                background: `${activeClient.primary_color}18`,
                color: activeClient.primary_color,
                border: `1px solid ${activeClient.primary_color}35`
              }}>
                {activeClient.industry}
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {activeClient.loyalty_program_name} | Currency: {activeClient.currency_code} ({activeClient.currency_symbol}) | BigQuery: {activeClient.bigquery_dataset}
            </span>
          </div>
        </div>

        {/* Client Workspace Switcher Pill Button */}
        <button
          type="button"
          onClick={() => setShowWorkspaceSelector(true)}
          style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${activeClient.primary_color}45`,
            borderRadius: '20px',
            padding: '0.35rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          title="Switch Client Context (Crazy Fashion / ICA Sverige)"
        >
          <Layers size={13} color={activeClient.primary_color} />
          <span>Client: <strong style={{ color: activeClient.primary_color }}>{activeClient.client_name}</strong></span>
          <ChevronDown size={12} color="var(--text-muted)" />
        </button>

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
            className={`tab-btn ${activeTab === 'a2a' ? 'active' : ''}`}
            onClick={() => setActiveTab('a2a')}
          >
            <Globe size={15} />
            A2A Protocol Explorer
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

          <div className="status-badge" style={{ borderColor: `${activeClient.primary_color}40` }}>
            <div className="pulse-dot" style={{ background: activeClient.primary_color }}></div>
            <span>Agent Gateway Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ display: activeTab === 'chat' ? 'contents' : 'none' }}>
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            clearMessages={clearMessages}
            sessionId={sessionId}
            setSessionId={setSessionId}
            userId={userId}
            activeClient={activeClient}
            activeClientId={activeClientId}
          />
        </div>
        {activeTab === 'skills' && <SkillsInspector activeClient={activeClient} />}
        {activeTab === 'bigquery' && <BigQueryDataViewer activeClient={activeClient} />}
        {activeTab === 'a2a' && <A2AExplorer activeClient={activeClient} />}
        {activeTab === 'simulator' && <SimulatorControls activeClient={activeClient} />}
      </main>
    </div>
  );
}
