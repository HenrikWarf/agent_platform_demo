import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Bug, 
  ChevronRight, MessageSquare, Tag, Layers, ArrowRight, Database, Zap, FileCode2,
  Sparkles, RefreshCw, Sliders, Cpu, FileCheck, AlertOctagon, HelpCircle
} from 'lucide-react';

export default function ErrorTriageBoard({ issues, onRefresh }) {
  const clusters = issues || [];
  const [selectedCluster, setSelectedCluster] = useState(clusters[0] || null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Keep selected cluster up-to-date
  const activeCluster = clusters.find(c => (c.cluster_id || c.issue_id) === (selectedCluster?.cluster_id || selectedCluster?.issue_id)) || clusters[0] || null;

  const filteredClusters = clusters.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && c.category !== filterCategory) return false;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Cluster Filters */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Multi-Agent Error Clustering & Problem Matrix</h2>
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
