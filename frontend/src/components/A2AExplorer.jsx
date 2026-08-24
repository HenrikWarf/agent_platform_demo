import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Globe, Send, RefreshCw, CheckCircle, AlertCircle, Copy,
  ChevronDown, ChevronRight, Zap, Radio, Code2, FileJson, X,
  Search, Database, Layers, Sparkles, Box, ShieldCheck, Tag
} from 'lucide-react';

const API_BASE = '';

export default function A2AExplorer({ activeClient }) {
  const [agentCard, setAgentCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(null);

  const [a2aPrompt, setA2aPrompt] = useState('How many customers are in the Champions segment?');
  const [a2aResponse, setA2aResponse] = useState(null);
  const [a2aLoading, setA2aLoading] = useState(false);
  const [a2aError, setA2aError] = useState(null);

  const [showRawCard, setShowRawCard] = useState(false);
  const [showRawRequest, setShowRawRequest] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [skillFilter, setSkillFilter] = useState('all');
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    if (!agentCard) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setAgentCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [agentCard]);

  const copyToClipboard = (text, field) => {
    window.navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchAgentCard = async () => {
    setCardLoading(true);
    setCardError(null);
    try {
      const res = await fetch(`${API_BASE}/api/a2a/agent-card`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAgentCard(data);
    } catch (err) {
      setCardError(err.message);
    } finally {
      setCardLoading(false);
    }
  };

  const sendA2AMessage = async () => {
    if (!a2aPrompt.trim()) return;
    setA2aLoading(true);
    setA2aError(null);
    setA2aResponse(null);
    try {
      const res = await fetch(`${API_BASE}/api/a2a/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: a2aPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setA2aResponse(data);
    } catch (err) {
      setA2aError(err.message);
    } finally {
      setA2aLoading(false);
    }
  };

  const buildRequestPayload = () => ({
    jsonrpc: '2.0',
    id: '<uuid>',
    method: 'SendMessage',
    params: {
      message: {
        messageId: '<uuid>',
        role: 'ROLE_USER',
        parts: [{ text: a2aPrompt }],
      },
      configuration: { acceptedOutputModes: ['text/plain'] },
    },
  });

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.2rem',
    backdropFilter: 'blur(12px)',
  };

  const labelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-dim)',
    marginBottom: '0.3rem',
  };

  const valueStyle = {
    fontSize: '0.88rem',
    color: 'var(--text-main)',
    fontWeight: 500,
  };

  const chipStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: `${color}18`,
    color: color,
    border: `1px solid ${color}30`,
  });

  const codeBlockStyle = {
    background: 'var(--code-bg)',
    borderRadius: '8px',
    padding: '1rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    lineHeight: 1.6,
    overflowX: 'auto',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    maxHeight: '400px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const buttonStyle = (variant = 'primary') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: variant === 'primary'
      ? (activeClient?.header_gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-purple))')
      : 'var(--chip-bg)',
    color: variant === 'primary' ? '#ffffff' : 'var(--text-main)',
    boxShadow: variant === 'primary' ? `0 2px 8px ${activeClient?.primary_color || 'rgba(37, 99, 235, 0.25)'}40` : undefined,
    opacity: 1,
  });

  const collapsibleHeader = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    padding: '0.4rem 0',
    userSelect: 'none',
  };

  // Helper to parse, title, categorize, and tag advertised skills
  const parseSkillMetadata = (skill) => {
    const id = skill.id || '';
    const name = skill.name || '';

    if (id.includes('recommendation_pipeline')) {
      if (id.includes('sub-agents')) {
        return {
          category: 'orchestration',
          categoryLabel: 'Orchestration',
          agentOrigin: 'Recommendation Pipeline',
          title: 'Product Recommendation Sub-Agents',
          color: '#059669',
          icon: Sparkles
        };
      }
      return {
        category: 'pipelines',
        categoryLabel: 'Sequential Pipeline',
        agentOrigin: 'Recommendation Pipeline',
        title: 'Product Recommendation Pipeline (SequentialAgent)',
        color: '#059669',
        icon: Layers
      };
    }

    if (id.includes('a2ui_pipeline')) {
      if (id.includes('sub-agents')) {
        return {
          category: 'orchestration',
          categoryLabel: 'Orchestration',
          agentOrigin: 'A2UI Personalization Engine',
          title: 'A2UI Component Sub-Agents',
          color: '#f97316',
          icon: Sparkles
        };
      }
      return {
        category: 'pipelines',
        categoryLabel: 'Sequential Pipeline',
        agentOrigin: 'A2UI Personalization Engine',
        title: 'A2UI Personalization & Offer Banner Pipeline',
        color: '#f97316',
        icon: Layers
      };
    }

    if (id.includes('strategy_pipeline')) {
      if (id.includes('sub-agents')) {
        return {
          category: 'orchestration',
          categoryLabel: 'Orchestration',
          agentOrigin: 'Strategy Pipeline',
          title: 'Campaign Strategy Sub-Agents',
          color: '#7c3aed',
          icon: Sparkles
        };
      }
      return {
        category: 'pipelines',
        categoryLabel: 'Sequential Pipeline',
        agentOrigin: 'Strategy Pipeline',
        title: 'Omnichannel Strategy Pipeline (SequentialAgent)',
        color: '#7c3aed',
        icon: Layers
      };
    }

    if (id.includes('content_pipeline')) {
      if (id.includes('sub-agents')) {
        return {
          category: 'orchestration',
          categoryLabel: 'Orchestration',
          agentOrigin: 'Content Pipeline',
          title: 'Brand Copywriting Sub-Agents',
          color: '#d97706',
          icon: Sparkles
        };
      }
      return {
        category: 'pipelines',
        categoryLabel: 'Sequential Pipeline',
        agentOrigin: 'Content Pipeline',
        title: 'Brand Voice Copywriting Pipeline (SequentialAgent)',
        color: '#d97706',
        icon: Layers
      };
    }

    if (id.includes('query_customer_data')) {
      return {
        category: 'tools',
        categoryLabel: 'BigQuery Tool',
        agentOrigin: 'Analytics Agent',
        title: 'Customer Data SQL Query (query_customer_data)',
        color: '#0284c7',
        icon: Database
      };
    }

    if (id.includes('bigquery_googleapis_com')) {
      let toolName = id.replace(/.*bigquery_googleapis_com_/, '');
      return {
        category: 'tools',
        categoryLabel: 'BigQuery API',
        agentOrigin: 'Analytics Agent',
        title: `BigQuery Schema: ${toolName}`,
        color: '#0284c7',
        icon: Database
      };
    }

    if (id.includes('list_skills') || id.includes('load_skill') || id.includes('run_skill')) {
      let skillTool = id.replace(/.*analytics_agent-/, '');
      return {
        category: 'skills',
        categoryLabel: 'Skill Standard',
        agentOrigin: 'Analytics Agent',
        title: `Skill Engine: ${skillTool}`,
        color: '#10b981',
        icon: Box
      };
    }

    return {
      category: 'general',
      categoryLabel: 'Agent Capability',
      agentOrigin: 'Marketing Orchestrator',
      title: name || id,
      color: '#4f46e5',
      icon: Zap
    };
  };

  const renderAgentCardModal = () => {
    if (!agentCard) return null;

    const skills = agentCard.skills || [];
    const enrichedSkills = skills.map(skill => ({
      ...skill,
      meta: parseSkillMetadata(skill)
    }));

    // Filter by tab category
    const categoryCounts = {
      all: enrichedSkills.length,
      pipelines: enrichedSkills.filter(s => s.meta.category === 'pipelines').length,
      orchestration: enrichedSkills.filter(s => s.meta.category === 'orchestration').length,
      tools: enrichedSkills.filter(s => s.meta.category === 'tools').length,
      skills: enrichedSkills.filter(s => s.meta.category === 'skills').length,
    };

    const filteredSkills = enrichedSkills.filter(skill => {
      const matchesCategory = skillFilter === 'all' || skill.meta.category === skillFilter;
      const matchesSearch = !skillSearch.trim() || (
        skill.meta.title.toLowerCase().includes(skillSearch.toLowerCase()) ||
        (skill.description || '').toLowerCase().includes(skillSearch.toLowerCase()) ||
        skill.id.toLowerCase().includes(skillSearch.toLowerCase()) ||
        skill.meta.agentOrigin.toLowerCase().includes(skillSearch.toLowerCase())
      );
      return matchesCategory && matchesSearch;
    });

    return createPortal(
      <div
        onClick={() => setAgentCard(null)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8, 10, 15, 0.78)', backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '1.5rem',
          boxSizing: 'border-box'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}
        >
          {/* Modal Sticky Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: `${activeClient?.primary_color || 'var(--color-primary)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileJson size={24} color={activeClient?.primary_color || 'var(--color-primary)'} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  A2A Agent Card Discovery
                  <div style={chipStyle('var(--color-success)')}>
                    <CheckCircle size={12} /> Live A2A Endpoint
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  Machine-readable discovery manifest defined by the <strong>Agent-to-Agent (A2A) Protocol</strong>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => copyToClipboard(agentCard, 'card_top')}
                style={{
                  ...buttonStyle('secondary'),
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.78rem',
                }}
                title="Copy entire Agent Card JSON"
              >
                <Copy size={13} color={copiedField === 'card_top' ? 'var(--color-success)' : 'var(--text-dim)'} />
                {copiedField === 'card_top' ? 'Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={() => setAgentCard(null)}
                title="Close modal (Esc)"
                style={{
                  background: 'var(--chip-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--chip-bg)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Hero Agent Identity Card */}
          <div style={{ ...cardStyle, background: 'var(--bg-surface-subtle, var(--panel-bg))', border: '1px solid var(--border-color)', padding: '1.4rem 1.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                  {agentCard.name}
                </span>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: `${activeClient?.primary_color || 'var(--color-primary)'}18`,
                  color: activeClient?.primary_color || 'var(--color-primary)',
                  border: `1px solid ${activeClient?.primary_color || 'var(--color-primary)'}35`,
                  whiteSpace: 'nowrap'
                }}>
                  <ShieldCheck size={13} /> Verified Root Agent
                </div>
                <span style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: 'var(--code-bg)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'nowrap'
                }}>
                  v{agentCard.version || '0.1.0'}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: '100%' }}>
                {agentCard.description}
              </p>
            </div>

            {/* Metric Pills Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={labelStyle}>Protocol Transport</div>
                <div style={{ ...valueStyle, fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.2rem' }}>JSON-RPC 2.0</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={labelStyle}>Supported A2A Versions</div>
                <div style={{ ...valueStyle, fontWeight: 700, marginTop: '0.2rem' }}>v1.0 & v0.3 (Compat)</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={labelStyle}>Streaming Mode</div>
                <div style={{ ...valueStyle, fontWeight: 600, color: agentCard.capabilities?.streaming ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.2rem' }}>
                  {agentCard.capabilities?.streaming ? '✅ Enabled (SSE)' : '❌ Disabled'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={labelStyle}>Default Input Modes</div>
                <div style={{ ...valueStyle, marginTop: '0.2rem' }}>{(agentCard.defaultInputModes || ['text/plain']).join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Supported Transport Endpoints */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Supported Interfaces & Endpoints</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {(agentCard.supportedInterfaces || []).length} Protocol Bindings Advertised
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(agentCard.supportedInterfaces || []).map((iface, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--code-bg)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={chipStyle('var(--color-primary)')}>
                      {iface.protocolBinding} v{iface.protocolVersion}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                      {iface.url}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(iface.url, `iface_${i}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: copiedField === `iface_${i}` ? 'var(--color-success)' : 'var(--text-dim)' }}
                  >
                    <Copy size={13} />
                    {copiedField === `iface_${i}` ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Advertised Skills & Capabilities */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={18} color="var(--color-warning)" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Advertised Skills & Capabilities ({skills.length})
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  Micro-agent pipelines, BigQuery SQL execution tools, and extensible skills published in the Agent Card.
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search skills, tools, schemas..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.8rem 0.45rem 2rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { id: 'all', label: 'All Capabilities', count: categoryCounts.all },
                { id: 'pipelines', label: '⚡ Pipelines', count: categoryCounts.pipelines },
                { id: 'orchestration', label: '🔄 Sub-Agents', count: categoryCounts.orchestration },
                { id: 'tools', label: '🛠️ BigQuery Tools', count: categoryCounts.tools },
                { id: 'skills', label: '📦 Skill Standard', count: categoryCounts.skills },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSkillFilter(tab.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: skillFilter === tab.id ? (activeClient?.primary_color || 'var(--color-primary)') : 'var(--border-color)',
                    background: skillFilter === tab.id ? `${activeClient?.primary_color || 'var(--color-primary)'}18` : 'var(--chip-bg)',
                    color: skillFilter === tab.id ? (activeClient?.primary_color || 'var(--color-primary)') : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, background: 'var(--code-bg)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Skills Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '0.8rem' }}>
              {filteredSkills.map((skill, i) => {
                const IconComponent = skill.meta.icon;
                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${skill.meta.color}`,
                      borderRadius: '10px',
                      padding: '0.9rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {/* Card Top: Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <IconComponent size={14} color={skill.meta.color} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: skill.meta.color }}>
                          {skill.meta.categoryLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', background: 'var(--chip-bg)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {skill.meta.agentOrigin}
                      </span>
                    </div>

                    {/* Skill Title */}
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                        {skill.meta.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                        {skill.id}
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {skill.description}
                    </p>

                    {/* Tags */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
                        {skill.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'var(--code-bg)',
                              color: 'var(--text-dim)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredSkills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No capabilities match your search query "{skillSearch}".
              </div>
            )}
          </div>

          {/* Raw JSON Collapsible */}
          <div style={{ ...cardStyle, background: 'var(--bg-surface-subtle, var(--panel-bg))' }}>
            <div style={collapsibleHeader} onClick={() => setShowRawCard(!showRawCard)}>
              {showRawCard ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Code2 size={14} />
              <span>Raw Agent Card JSON Schema Inspector</span>
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(agentCard, 'card_raw'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: copiedField === 'card_raw' ? 'var(--color-success)' : 'var(--text-dim)' }}
              >
                <Copy size={13} />
                {copiedField === 'card_raw' ? 'Copied' : 'Copy Raw JSON'}
              </button>
            </div>
            {showRawCard && (
              <pre style={{ ...codeBlockStyle, marginTop: '0.8rem' }}>{JSON.stringify(agentCard, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.4rem', height: '100%', overflowY: 'auto', width: '100%' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
          <Globe size={22} color="var(--color-primary)" />
          A2A Protocol Explorer
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Interact with the Marketing Orchestrator agent using the <strong>Agent-to-Agent (A2A) protocol</strong>. 
          Fetch the agent card to discover capabilities, then send a JSON-RPC message to invoke the agent.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem', flex: 1, minHeight: 0 }}>

        {/* ─── LEFT: Agent Card Discovery ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

          {/* Fetch Button Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileJson size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Agent Card Discovery</span>
              </div>
              <button onClick={fetchAgentCard} disabled={cardLoading} style={buttonStyle()}>
                {cardLoading ? <RefreshCw size={14} className="spin" /> : <Globe size={14} />}
                {cardLoading ? 'Fetching...' : 'Fetch Agent Card'}
              </button>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--code-bg)', padding: '0.5rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>GET /.well-known/agent-card.json</span>
              <button
                onClick={() => copyToClipboard('GET /a2a/app/.well-known/agent-card.json', 'url')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <Copy size={13} color={copiedField === 'url' ? 'var(--color-success)' : 'var(--text-dim)'} />
              </button>
            </div>
          </div>

          {cardError && (
            <div style={{ ...cardStyle, borderColor: 'var(--color-danger)', background: 'rgba(220, 38, 38, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {cardError}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Send A2A Message ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

          {/* Send Message Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <Send size={18} color="var(--color-purple)" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Send A2A Message</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--code-bg)', padding: '0.5rem 0.8rem', borderRadius: '6px', marginBottom: '0.8rem' }}>
              POST /a2a/app → JSON-RPC SendMessage (v1.0)
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <label style={labelStyle}>Prompt</label>
              <textarea
                value={a2aPrompt}
                onChange={(e) => setA2aPrompt(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button onClick={sendA2AMessage} disabled={a2aLoading || !a2aPrompt.trim()} style={{ ...buttonStyle(), width: '100%', justifyContent: 'center', opacity: a2aLoading ? 0.7 : 1 }}>
              {a2aLoading ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              {a2aLoading ? 'Processing via A2A...' : 'Send via A2A Protocol'}
            </button>
          </div>

          {/* Request Preview */}
          <div style={cardStyle}>
            <div style={collapsibleHeader} onClick={() => setShowRawRequest(!showRawRequest)}>
              {showRawRequest ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Code2 size={14} />
              JSON-RPC Request Payload
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(buildRequestPayload(), 'req'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <Copy size={13} color={copiedField === 'req' ? 'var(--color-success)' : 'var(--text-dim)'} />
              </button>
            </div>
            {showRawRequest && (
              <pre style={codeBlockStyle}>{JSON.stringify(buildRequestPayload(), null, 2)}</pre>
            )}
          </div>

          {a2aError && (
            <div style={{ ...cardStyle, borderColor: 'var(--color-danger)', background: 'rgba(220, 38, 38, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {a2aError}
              </div>
            </div>
          )}

          {/* A2A Response */}
          {a2aResponse && (
            <>
              {/* Status Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} color="var(--color-success)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>A2A Response</span>
                  </div>
                  <div style={chipStyle('var(--color-success)')}>
                    {a2aResponse.state || 'COMPLETED'}
                  </div>
                </div>
                
                {/* Response Text */}
                {a2aResponse.response_text && (
                  <div style={{ padding: '0.8rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={labelStyle}>Agent Response</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {a2aResponse.response_text}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
                  <div>
                    <div style={labelStyle}>Protocol</div>
                    <div style={valueStyle}>JSON-RPC 2.0</div>
                  </div>
                  <div>
                    <div style={labelStyle}>A2A Version</div>
                    <div style={valueStyle}>1.0</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Method</div>
                    <div style={valueStyle}>SendMessage</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Task State</div>
                    <div style={valueStyle}>{a2aResponse.state || 'COMPLETED'}</div>
                  </div>
                </div>
              </div>

              {/* Raw Response Collapsible */}
              <div style={cardStyle}>
                <div style={collapsibleHeader} onClick={() => setShowRawResponse(!showRawResponse)}>
                  {showRawResponse ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Code2 size={14} />
                  Raw JSON-RPC Response
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(a2aResponse.raw_response, 'resp'); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Copy size={13} color={copiedField === 'resp' ? 'var(--color-success)' : 'var(--text-dim)'} />
                  </button>
                </div>
                {showRawResponse && (
                  <pre style={codeBlockStyle}>{JSON.stringify(a2aResponse.raw_response, null, 2)}</pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {renderAgentCardModal()}
    </div>
  );
}
