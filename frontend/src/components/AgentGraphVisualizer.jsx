import React from 'react';
import { Cpu, ShieldCheck, Database, FileText, Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function AgentGraphVisualizer({ a2aTrace, modelArmor }) {
  const isArmorPassed = modelArmor?.passed !== false;

  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%', minHeight: 0 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Cpu size={18} color="var(--color-primary)" />
          A2A Protocol Visualizer
        </h3>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '0.25rem 0.65rem',
          borderRadius: '12px',
          background: isArmorPassed ? 'rgba(52, 168, 83, 0.15)' : 'rgba(234, 67, 53, 0.15)',
          color: isArmorPassed ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${isArmorPassed ? 'rgba(52, 168, 83, 0.35)' : 'rgba(234, 67, 53, 0.35)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <ShieldCheck size={13} />
          {isArmorPassed ? 'Model Armor: Passed' : 'Model Armor: Blocked'}
        </span>
      </div>

      {/* Agent Nodes 2x2 Responsive Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.8rem',
        background: 'var(--panel-bg)',
        padding: '0.9rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Node 1: Orchestrator */}
        <div style={nodeStyle('var(--color-primary)')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Orchestrator</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>A2A Router Supervisor</span>
          <span style={skillPill('var(--color-primary)')}>
            <Zap size={10} /> Router Gateway
          </span>
        </div>

        {/* Node 2: Analytics */}
        <div style={nodeStyle('var(--color-success)')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={16} color="var(--color-success)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Analytics</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BigQuery Customer SQL</span>
          <span style={skillPill('var(--color-success)')}>
            <Zap size={10} /> marketing_analytics
          </span>
        </div>

        {/* Node 3: Strategy */}
        <div style={nodeStyle('var(--color-purple)')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} color="var(--color-purple)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Strategy</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gemini 3.6 Campaign</span>
          <span style={skillPill('var(--color-purple)')}>
            <Zap size={10} /> omnichannel_strategy
          </span>
        </div>

        {/* Node 4: Content */}
        <div style={nodeStyle('var(--color-warning)')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--color-warning)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Content</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Brand Copywriting</span>
          <span style={skillPill('var(--color-warning)')}>
            <Zap size={10} /> brand_voice
          </span>
        </div>
      </div>

      {/* A2A Trace Message Log - Fills Vertical Height Dynamically */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            INTER-AGENT MESSAGES ({a2aTrace?.length || 0})
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Live Trace</span>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          paddingRight: '0.2rem'
        }}>
          {a2aTrace && a2aTrace.length > 0 ? (
            a2aTrace.map((msg, idx) => (
              <div key={idx} style={{
                background: 'var(--chip-bg)',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                borderLeft: `3px solid ${getSenderColor(msg.sender_id)}`,
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {formatAgentName(msg.sender_id)} <ArrowRight size={12} color="var(--text-muted)" /> {formatAgentName(msg.receiver_id)}
                  </span>
                  <span style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'JetBrains Mono, monospace',
                    background: 'var(--code-bg)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px'
                  }}>
                    {msg.intent}
                  </span>
                </div>

                {msg.skill_used && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Zap size={11} /> Executed Skill: {msg.skill_used}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '2rem'
            }}>
              No A2A messages yet. Submit a prompt to observe live inter-agent routing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function nodeStyle(color) {
  return {
    background: 'var(--bg-card)',
    border: `1px solid ${color}`,
    borderRadius: '10px',
    padding: '0.75rem 0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    transition: 'all 0.2s ease'
  };
}

function skillPill(color) {
  return {
    fontSize: '0.66rem',
    fontWeight: 600,
    color: color,
    background: 'rgba(66, 133, 244, 0.12)',
    border: `1px solid ${color}`,
    borderRadius: '12px',
    padding: '0.15rem 0.45rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.2rem',
    width: 'fit-content'
  };
}

function getSenderColor(sender) {
  if (!sender) return 'var(--text-muted)';
  if (sender.includes('orchestrator')) return 'var(--color-primary)';
  if (sender.includes('analytics')) return 'var(--color-success)';
  if (sender.includes('strategy')) return 'var(--color-purple)';
  if (sender.includes('content')) return 'var(--color-warning)';
  return 'var(--text-muted)';
}

function formatAgentName(name) {
  if (!name) return 'Agent';
  if (name.includes('orchestrator')) return 'Orchestrator';
  if (name.includes('analytics')) return 'Analytics';
  if (name.includes('strategy')) return 'Strategy';
  if (name.includes('content')) return 'Content';
  return name;
}
