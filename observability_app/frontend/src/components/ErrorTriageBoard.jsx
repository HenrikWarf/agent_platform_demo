import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Bug, 
  ChevronRight, MessageSquare, Tag, UserCheck, Check, ArrowRight
} from 'lucide-react';

export default function ErrorTriageBoard({ issues, onRefresh }) {
  const [selectedIssue, setSelectedIssue] = useState(issues?.[0] || null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredIssues = (issues || []).filter(issue => {
    if (filterStatus !== 'ALL' && issue.status !== filterStatus) return false;
    if (filterSeverity !== 'ALL' && issue.severity !== filterSeverity) return false;
    return true;
  });

  const handleUpdateStatus = async (status) => {
    if (!selectedIssue) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/obs/triage/${selectedIssue.issue_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          author: 'Engineer',
          note: newNote ? newNote : undefined,
        }),
      });
      const updated = await res.json();
      setSelectedIssue(updated);
      setNewNote('');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}>MEDIUM</span>;
      default:
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}>LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>● OPEN</span>;
      case 'INVESTIGATING':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>● INVESTIGATING</span>;
      case 'RESOLVED':
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>✓ RESOLVED</span>;
      default:
        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(156, 163, 175, 0.12)', color: '#9ca3af' }}>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner & Filters */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Intelligent Error Triage & Problem Identification</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Root cause analysis and resolution workflow across SQL errors, schema violations, and latency spikes.
          </p>
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout: Issue List & Issue Detail Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Issue Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredIssues.map((issue) => {
            const isSelected = selectedIssue?.issue_id === issue.issue_id;
            return (
              <div
                key={issue.issue_id}
                onClick={() => setSelectedIssue(issue)}
                className="glass-card"
                style={{
                  padding: '1.1rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{issue.issue_id}</span>
                    {getSeverityBadge(issue.severity)}
                  </div>
                  {getStatusBadge(issue.status)}
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', lineHeight: 1.4 }}>
                  {issue.title}
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Agent: <strong style={{ color: 'var(--text-secondary)' }}>{issue.affected_agent}</strong></span>
                  <span>{issue.occurrence_count} occurrences</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Diagnostic & Triage Action View */}
        {selectedIssue ? (
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{selectedIssue.issue_id}</span>
                  {getSeverityBadge(selectedIssue.severity)}
                  {getStatusBadge(selectedIssue.status)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tenant: <strong>{selectedIssue.tenant_id}</strong></span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedIssue.title}</h3>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleUpdateStatus('INVESTIGATING')}
                  disabled={isUpdating || selectedIssue.status === 'INVESTIGATING'}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    cursor: 'pointer',
                  }}
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={isUpdating || selectedIssue.status === 'RESOLVED'}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    cursor: 'pointer',
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Error Message & Sample Prompt */}
            <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Captured Error Message
              </div>
              <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {selectedIssue.error_message}
              </code>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Sample User Prompt</div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{selectedIssue.sample_prompt}"</div>
            </div>

            {/* Root Cause & Remediation Guidance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
                  🔍 Root Cause Analysis
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedIssue.root_cause_analysis}
                </p>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '0.4rem' }}>
                  🛠️ Recommended Remediation
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedIssue.remediation_guidance}
                </p>
              </div>
            </div>

            {/* Audit Notes & Activity */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} /> Investigation Audit Trail ({selectedIssue.notes?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {selectedIssue.notes?.map((n, idx) => (
                  <div key={idx} style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                      <strong>{n.author}</strong>
                      <span>{new Date(n.time).toLocaleTimeString()}</span>
                    </div>
                    <div>{n.text}</div>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add triage note or investigation finding..."
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  onClick={() => handleUpdateStatus(selectedIssue.status)}
                  disabled={!newNote || isUpdating}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent-indigo)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: !newNote || isUpdating ? 'not-allowed' : 'pointer',
                  }}
                >
                  Post Note
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an issue from the left to view diagnostic root-cause reports.
          </div>
        )}

      </div>

    </div>
  );
}
