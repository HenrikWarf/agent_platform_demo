import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Clock, User, Bot, Database, Zap, 
  ChevronDown, ChevronRight, Terminal, Layers, ArrowRight,
  Filter, Search, Sliders, Cpu, Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function ConversationTraceWaterfall() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTurnIdx, setSelectedTurnIdx] = useState(0);

  // Filters
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [filterTenant, setFilterTenant] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpanType, setFilterSpanType] = useState('ALL');

  const fetchSessions = () => {
    let url = `/api/obs/sessions?limit=100`;
    if (filterTenant !== 'ALL') url += `&tenant_id=${filterTenant}`;
    if (filterAgent !== 'ALL') url += `&agent_name=${filterAgent}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0) {
          const currentExists = data.some(s => s.session_id === selectedSessionId);
          if (!currentExists) {
            setSelectedSessionId(data[0].session_id);
          }
        } else {
          setSelectedSessionId(null);
          setSessionDetail(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
  }, [filterAgent, filterTenant]);

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

  const [selectedSpanId, setSelectedSpanId] = useState(null);
  const activeTurn = sessionDetail?.turns?.[selectedTurnIdx];
  const rawSpans = activeTurn?.spans || [];
  const minTime = rawSpans.length > 0 ? Math.min(...rawSpans.map(s => s.start_time_ms)) : 0;
  const maxTime = rawSpans.length > 0 ? Math.max(...rawSpans.map(s => s.start_time_ms + s.duration_ms)) : 1000;
  const totalDuration = Math.max(1, maxTime - minTime);
  const selectedSpan = rawSpans.find(s => s.span_id === selectedSpanId) || rawSpans[0] || null;

  const getAgentColor = (agentName) => {
    if (!agentName) return '#4f46e5';
    if (agentName.includes('orchestrator')) return '#4f46e5';
    if (agentName.includes('analytics')) return '#0284c7';
    if (agentName.includes('recommendation')) return '#059669';
    if (agentName.includes('a2ui')) return '#ec4899';
    if (agentName.includes('strategy')) return '#7c3aed';
    if (agentName.includes('content')) return '#d97706';
    return '#64748b';
  };

  const getAgentShortName = (agentName) => {
    if (!agentName) return 'agent';
    return agentName
      .replace('_agent', '')
      .replace('_pipeline', '')
      .replace('marketing_', '');
  };

  const filteredSessions = sessions.filter(sess => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sess.session_id.toLowerCase().includes(q) ||
      (sess.latest_prompt && sess.latest_prompt.toLowerCase().includes(q)) ||
      (sess.client_name && sess.client_name.toLowerCase().includes(q))
    );
  });

  const filteredSpans = (activeTurn?.spans || []).filter(span => {
    if (filterSpanType === 'ALL') return true;
    if (filterSpanType === 'AGENT' && span.name === 'invoke_agent') return true;
    if (filterSpanType === 'LLM' && span.name === 'call_llm') return true;
    if (filterSpanType === 'TOOL' && span.name === 'execute_tool') return true;
    return false;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner with Granular Filters */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GitBranch size={22} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Conversation Trace & OpenTelemetry Waterfall</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Inspect multi-agent delegation chains, BigQuery SQL tool executions, and span latency percentiles.
          </p>
        </div>

        {/* Filters Group */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Routed Agent Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Filter size={14} color="var(--accent-indigo)" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Routed Agents</option>
              <option value="marketing_orchestrator">Orchestrator Agent</option>
              <option value="analytics_agent">Analytics Agent (NL2SQL)</option>
              <option value="recommendation_pipeline">Recommender Pipeline</option>
              <option value="a2ui_pipeline">A2UI Personalization</option>
              <option value="strategy_pipeline">Strategy Pipeline</option>
              <option value="content_pipeline">Content Pipeline</option>
            </select>
          </div>

          {/* Tenant Filter */}
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <option value="ALL">All Tenants</option>
            <option value="crazy_fashion">Crazy Fashion</option>
            <option value="ica_sweden">ICA Sverige</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.6rem' }} />
            <input
              type="text"
              placeholder="Search trace prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.4rem 0.8rem 0.4rem 2rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                width: '180px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Two Column: Sessions List vs Waterfall Trace View */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Sessions List with Routed Agent Badges */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '760px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Filtered Sessions ({filteredSessions.length})
            </span>
            {filterAgent !== 'ALL' && (
              <span className="badge" style={{ fontSize: '0.65rem', background: getAgentColor(filterAgent) + '22', color: getAgentColor(filterAgent) }}>
                {getAgentShortName(filterAgent)}
              </span>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No sessions found matching current filters.
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const isSelected = sess.session_id === selectedSessionId;
              const agents = sess.routed_agents || ['orchestrator'];

              return (
                <div
                  key={sess.session_id}
                  onClick={() => setSelectedSessionId(sess.session_id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: isSelected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {sess.session_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sess.has_errors ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {sess.overall_quality_score}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sess.latest_prompt || 'Session turn execution'}
                  </div>

                  {/* Routed Agent Badges */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    {agents.map((ag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: getAgentColor(ag) + '18',
                          color: getAgentColor(ag),
                          border: `1px solid ${getAgentColor(ag)}33`,
                        }}
                      >
                        {getAgentShortName(ag)}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{sess.client_name}</span>
                    <span>{sess.total_latency_ms} ms</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Waterfall Trace View */}
        {sessionDetail && activeTurn ? (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Session Header & Turn Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                    {sessionDetail.session_id}
                  </span>
                  <span className="badge" style={{ fontSize: '0.7rem' }}>{sessionDetail.client_name}</span>
                  <span className="badge" style={{ fontSize: '0.7rem' }}>{sessionDetail.turns.length} Turn(s)</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  "{activeTurn.user_prompt}"
                </div>
              </div>

              {/* Turn Metrics */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Turn Latency</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{activeTurn.latency_ms} ms</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tokens</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{activeTurn.total_tokens}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{activeTurn.quality_score}%</div>
                </div>
              </div>
            </div>

            {/* Routed Agents Flow Sequence Rail */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={14} color="var(--accent-indigo)" />
                Multi-Agent Delegation Flow
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(79, 70, 229, 0.15)', color: 'var(--accent-indigo)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={12} /> User Intent
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
                
                {activeTurn.routed_agents.map((ag, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: getAgentColor(ag) + '18',
                        color: getAgentColor(ag),
                        border: `1px solid ${getAgentColor(ag)}44`,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Bot size={14} />
                      {ag}
                    </div>
                    {idx < activeTurn.routed_agents.length - 1 && <ArrowRight size={14} color="var(--text-muted)" />}
                  </React.Fragment>
                ))}

                {activeTurn.tools_executed?.length > 0 && (
                  <>
                    <ArrowRight size={14} color="var(--text-muted)" />
                    <div style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.3)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Database size={14} /> BigQuery Tool
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Span Layer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                OpenTelemetry Waterfall Spans ({filteredSpans.length})
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {['ALL', 'AGENT', 'LLM', 'TOOL'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterSpanType(type)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      background: filterSpanType === type ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                      color: filterSpanType === type ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {type === 'ALL' ? 'All Spans' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Traditional Cloud Trace & OpenTelemetry Gantt Waterfall */}
            <div style={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              
              {/* Waterfall Timeline Header & Scale Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 38%) 1fr', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 1rem', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  Span Operation & Agent Hierarchy
                </div>
                
                {/* Time Axis Ticks */}
                <div style={{ position: 'relative', width: '100%', height: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  <span>0 ms</span>
                  <span style={{ position: 'absolute', left: '25%', transform: 'translateX(-50%)' }}>+{Math.round(totalDuration * 0.25)} ms</span>
                  <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>+{Math.round(totalDuration * 0.50)} ms</span>
                  <span style={{ position: 'absolute', left: '75%', transform: 'translateX(-50%)' }}>+{Math.round(totalDuration * 0.75)} ms</span>
                  <span>+{totalDuration} ms</span>
                </div>
              </div>

              {/* Span Rows with Contiguous Timing Flow */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredSpans.map((span, idx) => {
                  const startOffset = Math.max(0, span.start_time_ms - minTime);
                  const leftPercent = Math.max(0, Math.min(99, (startOffset / totalDuration) * 100));
                  const widthPercent = Math.max(2, Math.min(100 - leftPercent, (span.duration_ms / totalDuration) * 100));
                  const isSelected = selectedSpan?.span_id === span.span_id;
                  
                  const isRoot = !span.parent_span_id;
                  const isChild = span.parent_span_id && span.name === 'invoke_agent';
                  const isGrandchild = span.parent_span_id && (span.name === 'call_llm' || span.name === 'execute_tool' || span.name.startsWith('format') || span.name.startsWith('validate'));
                  
                  const indentLevel = isRoot ? 0 : isChild ? 16 : isGrandchild ? 32 : 16;
                  const color = getAgentColor(span.agent_name);
                  const isTool = span.name === 'execute_tool';
                  const isLlm = span.name === 'call_llm';
                  const isArmor = span.name === 'check_prompt_guardrail' || span.agent_name === 'model_armor';

                  return (
                    <div
                      key={span.span_id}
                      onClick={() => setSelectedSpanId(span.span_id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(280px, 38%) 1fr',
                        borderBottom: idx < filteredSpans.length - 1 ? '1px solid var(--border-color)' : 'none',
                        background: isSelected ? 'var(--bg-card-hover)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Left Column: Tree, Agent Badge & Operation */}
                      <div style={{ padding: '0.65rem 1rem', paddingLeft: `calc(1rem + ${indentLevel}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRight: '1px solid var(--border-color)', gap: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, overflow: 'hidden' }}>
                          {!isRoot && (
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {isGrandchild ? '└──' : '├──'}
                            </span>
                          )}
                          {isArmor ? (
                            <ShieldAlert size={14} color="var(--accent-rose)" />
                          ) : isTool ? (
                            <Database size={14} color="var(--accent-cyan)" />
                          ) : isLlm ? (
                            <Zap size={14} color="var(--accent-amber)" />
                          ) : (
                            <Bot size={14} color={color} />
                          )}
                          <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: isSelected ? 'var(--accent-indigo)' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {span.name}
                          </span>
                          {span.agent_name && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: color + '18', color: color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {getAgentShortName(span.agent_name)}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {span.duration_ms} ms
                          </span>
                          {span.status === 'ERROR' && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', fontWeight: 800 }}>⚠️</span>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Waterfall Flow Timeline Track */}
                      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '36px', display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                        
                        {/* Background Vertical Grid Reference Lines */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(148, 163, 184, 0.2)' }} />
                          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(148, 163, 184, 0.2)' }} />
                          <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(148, 163, 184, 0.2)' }} />
                        </div>

                        {/* Gantt Timing Bar (Placed at Exact Flow Offset) */}
                        <div
                          title={`${span.name} (${span.agent_name})\nStart: +${startOffset} ms\nDuration: ${span.duration_ms} ms\nEnd: +${startOffset + span.duration_ms} ms`}
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            height: '18px',
                            borderRadius: '4px',
                            background: span.status === 'ERROR' 
                              ? 'linear-gradient(90deg, #e11d48, #f43f5e)' 
                              : isArmor 
                              ? 'linear-gradient(90deg, #e11d48, #fb7185)'
                              : isTool 
                              ? 'linear-gradient(90deg, #0284c7, #38bdf8)' 
                              : isLlm 
                              ? 'linear-gradient(90deg, #d97706, #fbbf24)' 
                              : color,
                            boxShadow: isSelected ? `0 0 0 2px var(--bg-card), 0 0 0 4px ${color}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 0.35rem',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            fontFamily: 'JetBrains Mono, monospace',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                            zIndex: isSelected ? 2 : 1,
                          }}
                        >
                          {widthPercent > 8 ? `${span.duration_ms}ms` : ''}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Span Detail & OpenTelemetry Attributes Inspector */}
            {selectedSpan && (
              <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                      {selectedSpan.span_id}
                    </span>
                    <span className="badge" style={{ background: getAgentColor(selectedSpan.agent_name) + '22', color: getAgentColor(selectedSpan.agent_name), fontWeight: 700 }}>
                      {selectedSpan.agent_name}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedSpan.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>Start: <strong>+{Math.max(0, selectedSpan.start_time_ms - minTime)} ms</strong></span>
                    <span>Duration: <strong>{selectedSpan.duration_ms} ms</strong></span>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: selectedSpan.status === 'ERROR' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(5, 150, 105, 0.15)', color: selectedSpan.status === 'ERROR' ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 800 }}>
                      {selectedSpan.status}
                    </span>
                  </div>
                </div>

                {/* Attributes Grid */}
                {selectedSpan.attributes && Object.keys(selectedSpan.attributes).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      OpenTelemetry Span Attributes
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.4rem' }}>
                      {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                        <div key={key} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{key}: </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Executed Tools & SQL Payloads */}
            {activeTurn.tools_executed && activeTurn.tools_executed.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Terminal size={14} color="var(--accent-cyan)" />
                  Executed BigQuery Tool Payloads
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeTurn.tools_executed.map((tool, idx) => (
                    <div key={idx} style={{ padding: '0.75rem 1rem', borderRadius: '6px', background: '#0f172a', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.3rem' }}>
                        ▶ Tool: {tool.tool || 'query_customer_data'}
                      </div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {tool.arguments?.query || JSON.stringify(tool.arguments || tool, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Narrative Response */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Generated Agent Deliverable
              </div>
              <div style={{ padding: '1rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                {activeTurn.agent_response}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a session on the left to view the OpenTelemetry waterfall trace.
          </div>
        )}

      </div>

    </div>
  );
}
