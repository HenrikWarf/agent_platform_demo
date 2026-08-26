import React, { useState, useEffect } from 'react';
import { 
  Bot, Clock, Cpu, AlertTriangle, CheckCircle2, 
  Database, ArrowUpRight, BarChart3, Layers
} from 'lucide-react';

export default function AgentDeepDive() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/obs/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const getAgentColor = (name) => {
    if (name.includes('orchestrator')) return '#4f46e5';
    if (name.includes('analytics')) return '#0284c7';
    if (name.includes('recommendation')) return '#059669';
    if (name.includes('a2ui')) return '#ec4899';
    if (name.includes('strategy')) return '#7c3aed';
    if (name.includes('content')) return '#d97706';
    return '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Agent Fleet Deep-Dive & Performance Profiler</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Detailed breakdown of latency percentiles (p50/p90/p99), token overhead, and tool invocation efficiency.
          </p>
        </div>
        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
          6 Fleet Agents Active
        </span>
      </div>

      {/* Grid of Agent Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {agents.map((agent) => {
          const color = getAgentColor(agent.name);
          return (
            <div
              key={agent.name}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Bot size={18} color={color} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{agent.name}</h3>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agent.role}</div>
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: agent.status === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: agent.status === 'OPTIMAL' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {agent.status}
                </span>
              </div>

              {/* Latency Percentiles */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Latency Distribution
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>p50 (Median)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{agent.p50_ms} ms</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>p90</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#06b6d4' }}>{agent.p90_ms} ms</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>p99</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: agent.p99_ms > 4000 ? '#f43f5e' : '#f59e0b' }}>
                      {agent.p99_ms} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Volume & Tokens */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Invocations</div>
                  <strong style={{ fontSize: '0.95rem' }}>{agent.calls}</strong>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Tokens</div>
                  <strong style={{ fontSize: '0.95rem' }}>{agent.avg_tokens}</strong>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Error Rate</div>
                  <strong style={{ fontSize: '0.95rem', color: agent.error_pct > 1.5 ? '#f59e0b' : '#10b981' }}>{agent.error_pct}%</strong>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
