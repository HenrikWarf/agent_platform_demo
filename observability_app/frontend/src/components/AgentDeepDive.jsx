import React, { useState, useEffect } from 'react';
import { 
  Bot, Clock, Cpu, AlertTriangle, CheckCircle2, 
  Database, ArrowUpRight, BarChart3, Layers, Sparkles, Activity
} from 'lucide-react';

export default function AgentDeepDive() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/obs/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getAgentColor = (name) => {
    if (!name) return '#4f46e5';
    const n = String(name).toLowerCase();
    if (n.includes('orchestrator')) return '#4f46e5';
    if (n.includes('analytics')) return '#0284c7';
    if (n.includes('recommendation') || n.includes('recommender')) return '#059669';
    if (n.includes('a2ui')) return '#ec4899';
    if (n.includes('strategy')) return '#7c3aed';
    if (n.includes('content')) return '#d97706';
    return '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={22} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Agent Fleet Deep-Dive & Performance Profiler</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Detailed breakdown of latency percentiles (p50/p90/p99), token overhead, and multi-turn execution efficiency.
          </p>
        </div>
        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} /> 6 Active Fleet Agents
        </span>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading agent fleet performance metrics...
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No agent performance metrics recorded yet.
        </div>
      ) : (
        /* Grid of Agent Performance Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {agents.map((agent) => {
            const agentId = agent.agent_id || agent.name || 'agent';
            const displayName = agent.agent_name || (agent.name ? agent.name.replace(/_/g, ' ').toUpperCase() : agentId);
            const role = agent.description || agent.role || 'Specialist Subagent';
            const color = agent.color || getAgentColor(agentId);
            const status = agent.sla_status || agent.status || (agent.error_rate_pct < 3.0 ? 'HEALTHY' : 'WARNING');
            const p50 = agent.p50_latency_ms ?? agent.p50_ms ?? 1200;
            const p90 = agent.p90_latency_ms ?? agent.p90_ms ?? 2400;
            const p99 = agent.p99_latency_ms ?? agent.p99_ms ?? 3100;
            const calls = agent.call_count ?? agent.calls ?? 0;
            const avgTokens = agent.avg_tokens ?? agent.avg_tokens_per_turn ?? 1200;
            const errorPct = agent.error_rate_pct ?? agent.error_pct ?? 0;

            const isHealthy = status === 'HEALTHY' || status === 'OPTIMAL';

            return (
              <div
                key={agentId}
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
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{displayName}</h3>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</div>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isHealthy ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {isHealthy ? '● OPTIMAL' : '⚠️ ATTENTION'}
                  </span>
                </div>

                {/* Latency Percentiles */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> Latency Distribution
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>p50 (Median)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{p50} ms</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>p90</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7', fontFamily: 'JetBrains Mono, monospace' }}>{p90} ms</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>p99</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: p99 > 3500 ? '#f43f5e' : '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {p99} ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Volume & Tokens */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invocations</div>
                    <strong style={{ fontSize: '0.95rem', fontFamily: 'JetBrains Mono, monospace' }}>{calls}</strong>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Tokens</div>
                    <strong style={{ fontSize: '0.95rem', fontFamily: 'JetBrains Mono, monospace' }}>{avgTokens}</strong>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Error Rate</div>
                    <strong style={{ fontSize: '0.95rem', color: errorPct > 3.0 ? '#f43f5e' : errorPct > 1.0 ? '#f59e0b' : '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                      {errorPct}%
                    </strong>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
