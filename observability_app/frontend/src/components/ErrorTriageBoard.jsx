import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Bug, 
  ChevronRight, MessageSquare, Tag, Layers, ArrowRight, Database, Zap, FileCode2,
  Sparkles, RefreshCw, Sliders, Cpu, FileCheck, AlertOctagon, HelpCircle, Activity,
  Check, Filter, X
} from 'lucide-react';

const AGENT_FLEET_STATUS = [
  {
    id: 'marketing_orchestrator',
    name: 'Marketing Orchestrator',
    role: 'Root Coordinator & Workflow Routing',
    skill: 'campaign-framework',
    color: '#4f46e5',
    icon: <Layers size={18} color="#4f46e5" />,
    status: 'HEALTHY',
    successRate: 97.8,
    openIssues: 1,
    improvements: 'Minimizing delegation ping-pong hops on compound customer inquiries; ensuring single-turn sub-agent transfers.',
    suggestions: [
      'Audit orchestrator system prompt for direct sub-agent routing without intermediate reasoning hops.',
      'Run batch evaluation on "3-Pillar Strategy & Multi-Agent Orchestration" scenario.',
      'Verify A2A protocol JSON-RPC envelope headers and latency overhead.',
    ],
  },
  {
    id: 'analytics_agent',
    name: 'Analytics Agent',
    role: 'BigQuery NL2SQL Specialist',
    skill: 'bigquery-customer-analytics',
    color: '#0284c7',
    icon: <Database size={18} color="#0284c7" />,
    status: 'HEALTHY',
    successRate: 98.6,
    openIssues: 0,
    improvements: 'Ensuring strict column aliasing (e.g. AS total_monetary_eur) and handling store city comparisons without null joins.',
    suggestions: [
      'Audit BigQuery data dictionary in skills/bigquery-customer-analytics/references/.',
      'Monitor BigQuery SQL execution latency in Cloud Trace spans.',
      'Test edge-case zero-row queries on dormant customer cohorts.',
    ],
  },
  {
    id: 'recommendation_pipeline',
    name: 'Product Recommender',
    role: '5-Item Assortment & Cross-Sell Engine',
    skill: 'product-recommender',
    color: '#059669',
    icon: <Sparkles size={18} color="#059669" />,
    status: 'HEALTHY',
    successRate: 98.1,
    openIssues: 0,
    improvements: 'Strict 5-item cardinality enforcement; verifying catalog ID existence before returning recommendation payload.',
    suggestions: [
      'Enforce ProductCatalog schema array validation in recommendation formatter.',
      'Review inventory joins in marketing_analytics BigQuery tables.',
      'Test customer RFM affinity alignment for new vs loyal tiers.',
    ],
  },
  {
    id: 'a2ui_pipeline',
    name: 'A2UI Pipeline',
    role: 'Interactive Component Personalization',
    skill: 'a2ui-personalization',
    color: '#7c3aed',
    icon: <Sliders size={18} color="#7c3aed" />,
    status: 'NEEDS_ATTENTION',
    successRate: 94.2,
    openIssues: 1,
    improvements: 'Mandatory Swedish Price Information Act compliance (jämförpris kr/kg, kr/l); single-item vs multi-item banner layout fidelity.',
    suggestions: [
      'Audit skills/a2ui-personalization/SKILL.md for mandatory unit comparison pricing.',
      'Verify unit price calculation in A2UIOfferBanner.jsx component.',
      'Run "A2UI Personalization & Stammis Deal Banners" quality evaluation suite.',
    ],
  },
  {
    id: 'content_pipeline',
    name: 'Content Pipeline',
    role: 'Brand Voice & Channel-Selective Copy',
    skill: 'brand-voice-craft',
    color: '#d97706',
    icon: <FileCode2 size={18} color="#d97706" />,
    status: 'NEEDS_ATTENTION',
    successRate: 93.4,
    openIssues: 2,
    improvements: 'Strict SMS length constraint (< 160 characters); eliminating unrequested media channels when user asks for SMS-only.',
    suggestions: [
      'Add deterministic character-length validation in content_json_agent schema.',
      'Verify channel isolation negative constraints in skills/brand-voice-craft/.',
      'Test SMS 160-character truncation on Swedish special characters (å, ä, ö).',
    ],
  },
  {
    id: 'agent_gateway',
    name: 'Agent Gateway / Armor',
    role: 'Security & Ingress Guardrail',
    skill: 'model_armor',
    color: '#e11d48',
    icon: <ShieldAlert size={18} color="#e11d48" />,
    status: 'HEALTHY',
    successRate: 99.4,
    openIssues: 0,
    improvements: 'Currency crossover isolation (preventing SEK in Crazy Fashion or EUR in ICA); sensitive customer PII sanitization.',
    suggestions: [
      'Verify Model Armor template bindings in deploy/agent_gateway.yaml.',
      'Run adversarial prompt injection tests on system prompt override attempts.',
      'Monitor Cloud Logging security audit filter events.',
    ],
  },
];

export default function ErrorTriageBoard({ issues, onRefresh }) {
  const clusters = issues || [];
  const [selectedCluster, setSelectedCluster] = useState(clusters[0] || null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Keep selected cluster up-to-date
  const activeCluster = clusters.find(c => (c.cluster_id || c.issue_id) === (selectedCluster?.cluster_id || selectedCluster?.issue_id)) || clusters[0] || null;

  const filteredClusters = clusters.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && c.category !== filterCategory) return false;
    if (selectedAgentFilter) {
      const agentKey = selectedAgentFilter.toLowerCase();
      const clusterAgent = (c.affected_agent || '').toLowerCase();
      if (!clusterAgent.includes(agentKey) && !agentKey.includes(clusterAgent)) {
        if (agentKey === 'recommendation_pipeline' && !clusterAgent.includes('recommender') && !clusterAgent.includes('assortment')) return false;
        if (agentKey === 'a2ui_pipeline' && !clusterAgent.includes('a2ui') && !clusterAgent.includes('banner')) return false;
        if (agentKey === 'content_pipeline' && !clusterAgent.includes('content') && !clusterAgent.includes('copy')) return false;
        if (agentKey === 'marketing_orchestrator' && !clusterAgent.includes('orchestrator')) return false;
        if (agentKey === 'analytics_agent' && !clusterAgent.includes('analytic') && !clusterAgent.includes('sql')) return false;
        if (agentKey === 'agent_gateway' && !clusterAgent.includes('gateway') && !clusterAgent.includes('armor') && !clusterAgent.includes('guardrail')) return false;
      }
    }
    return true;
  });

  const handleUpdateStatus = async (status) => {
    if (!activeCluster) return;
    const cid = activeCluster.cluster_id || activeCluster.issue_id;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/obs/clusters/${cid}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          author: 'Engineer',
          note: newNote ? newNote : undefined,
        }),
      });
      const updated = await res.json();
      setSelectedCluster(updated);
      setNewNote('');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to update cluster status', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(225, 29, 72, 0.12)', color: 'var(--accent-rose)', border: '1px solid rgba(225, 29, 72, 0.3)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(217, 119, 6, 0.12)', color: 'var(--accent-amber)', border: '1px solid rgba(217, 119, 6, 0.3)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>MEDIUM</span>;
      default:
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: '1px solid rgba(148, 163, 184, 0.3)' }}>LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(225, 29, 72, 0.12)', color: 'var(--accent-rose)' }}>● OPEN</span>;
      case 'INVESTIGATING':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(217, 119, 6, 0.12)', color: 'var(--accent-amber)' }}>● INVESTIGATING</span>;
      case 'RESOLVED':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(5, 150, 105, 0.12)', color: 'var(--accent-emerald)' }}>✓ RESOLVED</span>;
      default:
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-muted)' }}>{status}</span>;
    }
  };

  const getCategoryIcon = (category) => {
    if (category.includes('HALLUCINATION')) return <Sparkles size={16} color="var(--accent-rose)" />;
    if (category.includes('ROUTING')) return <RefreshCw size={16} color="var(--accent-purple)" />;
    if (category.includes('EMPTY_TOOL')) return <HelpCircle size={16} color="var(--accent-amber)" />;
    if (category.includes('CHANNEL')) return <Sliders size={16} color="var(--accent-indigo)" />;
    if (category.includes('SQL')) return <Database size={16} color="var(--accent-cyan)" />;
    if (category.includes('TOKEN')) return <Cpu size={16} color="var(--accent-amber)" />;
    if (category.includes('COMPLIANCE')) return <FileCheck size={16} color="var(--accent-emerald)" />;
    if (category.includes('LATENCY')) return <Zap size={16} color="var(--accent-purple)" />;
    if (category.includes('GUARDRAIL') || category.includes('MODEL_ARMOR')) return <ShieldAlert size={16} color="var(--accent-rose)" />;
    return <Bug size={16} color="var(--accent-indigo)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* TOP SECTION: Agent Fleet Health, Status & Actionable Improvement Matrix */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={22} color="var(--accent-indigo)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Agent Fleet Overview, Status & Improvement Matrix</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Continuous reliability telemetry across all 6 multi-agent platform components, active operational statuses, identified weaknesses, and guided optimization recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(5, 150, 105, 0.12)', color: 'var(--accent-emerald)', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
              ● 6/6 Agents Online
            </span>
            <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent-indigo)', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
              96.7% Health Index
            </span>
            {selectedAgentFilter && (
              <button
                onClick={() => setSelectedAgentFilter(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(225, 29, 72, 0.12)',
                  color: 'var(--accent-rose)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <X size={13} /> Clear Agent Filter ({selectedAgentFilter})
              </button>
            )}
          </div>
        </div>

        {/* 6 Agent Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
          {AGENT_FLEET_STATUS.map((agent) => {
            const isFilterActive = selectedAgentFilter === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentFilter(isFilterActive ? null : agent.id)}
                style={{
                  padding: '1.15rem 1.25rem',
                  borderRadius: '10px',
                  background: isFilterActive ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
                  border: isFilterActive ? `2px solid ${agent.color}` : '1px solid var(--border-color)',
                  boxShadow: isFilterActive ? 'var(--shadow-glow)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Agent Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${agent.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {agent.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px', 
                        background: agent.status === 'HEALTHY' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)', 
                        color: agent.status === 'HEALTHY' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        border: agent.status === 'HEALTHY' ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)'
                      }}
                    >
                      {agent.status === 'HEALTHY' ? '● HEALTHY' : '⚠️ ATTENTION NEEDED'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {agent.successRate}% Success · {agent.openIssues} Issue{agent.openIssues !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* What Could Improve */}
                <div style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                    <AlertTriangle size={12} /> What Could Improve
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {agent.improvements}
                  </div>
                </div>

                {/* Suggestions on What to Look Into */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                    <Sparkles size={12} /> Suggestions to Look Into
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {agent.suggestions.map((sug, idx) => (
                      <li key={idx} style={{ marginBottom: '0.15rem' }}>{sug}</li>
                    ))}
                  </ul>
                </div>

                {/* Filter Trigger footer */}
                <div style={{ marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: isFilterActive ? agent.color : 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700 }}>
                    {isFilterActive ? '✓ Filtering issues below' : 'Click card to filter issues'}
                  </span>
                  <Filter size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* BOTTOM SECTION: Multi-Agent Error Clustering & Problem Matrix */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Multi-Agent Error Clustering & Problem Matrix</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Dynamic failure grouping across 7 enterprise dimensions: Grounding, Routing Loops, Empty Tools, Channel Contracts, SQL, Token Saturation, and Nordic Law.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          >
            <option value="ALL">All 7 Failure Dimensions</option>
            <option value="DATA_HALLUCINATION_DRIFT">Factual Grounding & Hallucination</option>
            <option value="ROUTING_DELEGATION_LOOP">Multi-Agent Routing Loops</option>
            <option value="EMPTY_TOOL_HANDOFF">Empty Tool Handoffs</option>
            <option value="CHANNEL_SCOPE_DRIFT">Channel Scope & Contracts</option>
            <option value="SQL_SYNTAX_OR_EXECUTION">BigQuery SQL & Column Alias</option>
            <option value="TOKEN_BLOAT_SATURATION">Context Saturation & Token Bloat</option>
            <option value="NORDIC_COMPLIANCE_BREACH">Nordic Law & Jämförpris</option>
            <option value="LATENCY_SLA_SPIKE">Latency SLA Spikes</option>
            <option value="MODEL_ARMOR_GUARDRAIL">Model Armor Security</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Grouped Error Clusters List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Problem Clusters ({filteredClusters.length})
          </div>

          {filteredClusters.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No error clusters match the selected filter.
            </div>
          ) : (
            filteredClusters.map((cluster) => {
              const cid = cluster.cluster_id || cluster.issue_id;
              const isSelected = (activeCluster?.cluster_id || activeCluster?.issue_id) === cid;
              const name = cluster.cluster_name || cluster.title;
              const occCount = cluster.total_occurrences || cluster.occurrence_count || 1;

              return (
                <div 
                  key={cid}
                  onClick={() => setSelectedCluster(cluster)}
                  className="glass-card"
                  style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
                      {cid}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {getSeverityBadge(cluster.severity)}
                      {getStatusBadge(cluster.status)}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getCategoryIcon(cluster.category)}
                    <span>{name}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge" style={{ fontSize: '0.7rem' }}>{cluster.affected_agent}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{occCount} events</span>
                    </div>
                    <ChevronRight size={16} color={isSelected ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Cluster Deep-Dive & Root-Cause Inspector */}
        {activeCluster ? (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header & Status Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
                    {activeCluster.cluster_id || activeCluster.issue_id}
                  </span>
                  {getSeverityBadge(activeCluster.severity)}
                  {getStatusBadge(activeCluster.status)}
                  <span className="badge" style={{ fontSize: '0.7rem' }}>{activeCluster.tenant_id}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getCategoryIcon(activeCluster.category)}
                  {activeCluster.cluster_name || activeCluster.title}
                </h3>
              </div>

              {/* Status Update Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleUpdateStatus('OPEN')}
                  disabled={isUpdating || activeCluster.status === 'OPEN'}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: activeCluster.status === 'OPEN' ? 'rgba(225, 29, 72, 0.15)' : 'var(--bg-secondary)',
                    color: activeCluster.status === 'OPEN' ? 'var(--accent-rose)' : 'var(--text-primary)',
                  }}
                >
                  Set Open
                </button>
                <button
                  onClick={() => handleUpdateStatus('INVESTIGATING')}
                  disabled={isUpdating || activeCluster.status === 'INVESTIGATING'}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: activeCluster.status === 'INVESTIGATING' ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-secondary)',
                    color: activeCluster.status === 'INVESTIGATING' ? 'var(--accent-amber)' : 'var(--text-primary)',
                  }}
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={isUpdating || activeCluster.status === 'RESOLVED'}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: activeCluster.status === 'RESOLVED' ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-secondary)',
                    color: activeCluster.status === 'RESOLVED' ? 'var(--accent-emerald)' : 'var(--text-primary)',
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Error Signature Pattern */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Diagnostic Anomaly Signature
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--accent-rose)' }}>
                {activeCluster.error_signature || activeCluster.error_message}
              </div>
            </div>

            {/* Root Cause & Remediation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.05)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bug size={16} /> Root Cause Analysis
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {activeCluster.root_cause || activeCluster.root_cause_analysis}
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.05)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> ADK Skill Remediation
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {activeCluster.remediation || activeCluster.remediation_guidance}
                </div>
              </div>
            </div>

            {/* Real Affected Sessions List */}
            {activeCluster.affected_sessions && activeCluster.affected_sessions.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Real Production Session Instances ({activeCluster.affected_sessions.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {activeCluster.affected_sessions.map((inst, idx) => (
                    <div key={idx} style={{ padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                          {inst.session_id}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          "{inst.prompt}"
                        </span>
                      </div>
                      <span className="badge" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {inst.latency_ms} ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Notes & Log */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Triage Audit Trail & Engineering Notes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {(activeCluster.notes || []).map((n, idx) => (
                  <div key={idx} style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>{n.author}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{new Date(n.time).toLocaleTimeString()}</span>
                    <p style={{ marginTop: '0.2rem', color: 'var(--text-primary)' }}>{n.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add engineering investigation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateStatus(activeCluster.status)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  onClick={() => handleUpdateStatus(activeCluster.status)}
                  disabled={!newNote.trim() || isUpdating}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'var(--accent-indigo)',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  Post Note
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a problem cluster from the left to inspect root causes and remediation.
          </div>
        )}

      </div>

    </div>
  );
}
