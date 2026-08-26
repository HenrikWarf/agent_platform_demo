import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Clock, User, Bot, Database, Zap, 
  ChevronDown, ChevronRight, Terminal, Layers, ArrowRight
} from 'lucide-react';

export default function ConversationTraceWaterfall() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTurnIdx, setSelectedTurnIdx] = useState(0);

  useEffect(() => {
    fetch('/api/obs/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].session_id);
        }
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetch(`/api/obs/sessions/${selectedSessionId}`)
      .then(res => res.json())
      .then(data => {
        setSessionDetail(data);
        setSelectedTurnIdx(0);
      })
      .catch(err => console.error(err));
  }, [selectedSessionId]);

  const activeTurn = sessionDetail?.turns?.[selectedTurnIdx];
  const maxSpanDuration = Math.max(...(activeTurn?.spans?.map(s => s.duration_ms) || [1000]));

  const getAgentColor = (agentName) => {
    if (!agentName) return '#4f46e5';
    if (agentName.includes('orchestrator')) return '#4f46e5';
    if (agentName.includes('analytics')) return '#0284c7';
    if (agentName.includes('recommendation')) return '#059669';
    if (agentName.includes('a2ui')) return '#ec4899';
    if (agentName.includes('strategy')) return '#7c3aed';
    if (agentName.includes('content')) return '#d97706';
    return '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Conversation Session Explorer & OpenTelemetry Waterfall</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Inspect full agent execution hierarchies, tool SQL queries, token counts, and span latencies.
          </p>
        </div>
        <span style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
          OpenTelemetry GenAI Spans
        </span>
      </div>

      {/* Two Column: Sessions List vs Waterfall Trace View */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Sessions List */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '720px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Recorded Sessions ({sessions.length})
          </div>

          {sessions.map((sess) => {
            const isSelected = sess.session_id === selectedSessionId;
            return (
              <div
                key={sess.session_id}
                onClick={() => setSelectedSessionId(sess.session_id)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{sess.session_id}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>{sess.overall_quality_score}%</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sess.latest_prompt || 'Session initialization'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>{sess.client_name}</span>
                  <span>{sess.turn_count} turns ({sess.total_latency_ms} ms)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Turn Selector & Interactive Waterfall Spans */}
        {sessionDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Turn Tabs Header */}
            <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Turns:</span>
                {sessionDetail.turns?.map((turn, idx) => (
                  <button
                    key={turn.turn_id}
                    onClick={() => setSelectedTurnIdx(idx)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: selectedTurnIdx === idx ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Turn #{idx + 1} ({turn.latency_ms}ms)
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Tokens: <strong style={{ color: 'var(--text-primary)' }}>{activeTurn?.total_tokens}</strong></span>
                <span>Quality Score: <strong style={{ color: '#10b981' }}>{activeTurn?.quality_score}%</strong></span>
              </div>
            </div>

            {/* Turn Prompt & Routed Hierarchy */}
            {activeTurn && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User size={16} color="var(--accent-indigo)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User Prompt</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  "{activeTurn.user_prompt}"
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Routed Agents:</span>
                  {activeTurn.routed_agents?.map((agent, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderLeft: `4px solid ${getAgentColor(agent)}`,
                        color: 'var(--text-primary)' 
                      }}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hierarchical Waterfall Gantt Visualizer */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--accent-indigo)" /> OpenTelemetry Waterfall Span Hierarchy
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total Turn Latency: <strong>{activeTurn?.latency_ms} ms</strong>
                </span>
              </div>

              {/* Gantt Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeTurn?.spans?.map((span, idx) => {
                  const leftPercent = 5 + (idx * 12);
                  const widthPercent = Math.max(15, (span.duration_ms / maxSpanDuration) * 75);
                  const isTool = span.name === 'execute_tool';

                  return (
                    <div key={span.span_id} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 90px', gap: '1rem', alignItems: 'center' }}>
                      
                      {/* Span Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{'└─'.repeat(idx > 0 ? 1 : 0)}</span>
                        {isTool ? <Database size={14} color="#06b6d4" /> : <Bot size={14} color={getAgentColor(span.agent_name)} />}
                        <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {span.name}
                        </strong>
                      </div>

                      {/* Waterfall Gantt Bar */}
                      <div style={{ position: 'relative', width: '100%', height: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            height: '100%',
                            background: isTool ? 'linear-gradient(90deg, #0284c7, #06b6d4)' : `linear-gradient(90deg, ${getAgentColor(span.agent_name)}, #818cf8)`,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '0.5rem',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          {span.duration_ms}ms
                        </div>
                      </div>

                      {/* Status */}
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: span.status === 'OK' ? '#10b981' : '#f43f5e' }}>
                        {span.status}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Agent Deliverable Output */}
            {activeTurn && (
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Final Turn Response
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {activeTurn.agent_response}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a session to inspect waterfall traces.
          </div>
        )}

      </div>

    </div>
  );
}
