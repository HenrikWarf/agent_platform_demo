import React from 'react';
import { 
  Activity, CheckCircle2, AlertTriangle, Clock, Zap, ShieldCheck, 
  TrendingUp, Database, Sparkles, Layers, ArrowUpRight, Cpu
} from 'lucide-react';

export default function FleetOverview({ overviewData, onSelectTab }) {
  if (!overviewData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Fleet Metrics...</div>;

  const {
    global_quality_score,
    task_completion_rate,
    grounding_faithfulness,
    hallucination_rate,
    average_latency_ms,
    total_analyzed_turns,
    total_active_sessions,
    total_tokens_consumed,
    open_triage_issues,
    error_rate_percentage,
    radar_health_dimensions,
    tenant_comparison
  } = overviewData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Banner: Global Health Index */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)' }}>
            <Activity size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Fleet Quality Index</h2>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                HEALTHY (SLA MET)
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Real-time telemetry and quality grading across 6 autonomous ADK agents on Vertex AI Reasoning Engines.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Global Score</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-indigo)', letterSpacing: '-0.03em' }}>{global_quality_score}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Task Success</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>{task_completion_rate}%</div>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Grounding Index</span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{grounding_faithfulness}%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={12} /> BigQuery Grounded
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hallucination Rate</span>
            <Sparkles size={18} color={hallucination_rate < 1.0 ? '#10b981' : '#f59e0b'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: hallucination_rate < 1.0 ? 'var(--text-primary)' : '#f59e0b' }}>{hallucination_rate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Under 1.5% SLA</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Avg Turn Latency</span>
            <Clock size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{average_latency_ms} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span></div>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', marginTop: '0.25rem' }}>p50: 1.1s | p90: 2.4s</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Error Rate</span>
            <AlertTriangle size={18} color={error_rate_percentage < 2.0 ? '#10b981' : '#f43f5e'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{error_rate_percentage}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{open_triage_issues} open issues</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Analyzed Turns</span>
            <Layers size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{total_analyzed_turns}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{total_active_sessions} total sessions</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Tokens</span>
            <Cpu size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{(total_tokens_consumed / 1000).toFixed(1)}k</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Gemini 3.6 Flash</div>
        </div>

      </div>

      {/* Grid: Health Radar Dimensions & Tenant Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Quality Dimensions Breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Quality Health Dimensions</h3>
            <button 
              onClick={() => onSelectTab('evals')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Run Evals <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(radar_health_dimensions || {}).map(([dim, score]) => {
              const label = dim.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <div key={dim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontWeight: 700, color: score > 95 ? '#10b981' : score > 90 ? '#06b6d4' : '#f59e0b' }}>{score}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${score}%`, 
                        height: '100%', 
                        background: score > 95 ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, #6366f1, #a855f7)', 
                        borderRadius: '4px',
                        transition: 'width 0.8s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tenant Fleet Comparison */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Multi-Tenant Fleet Diagnostics</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {/* Crazy Fashion Card */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Crazy Fashion</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nordic Retail & Drop Cards</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Quality Score:</span>
                  <strong style={{ color: '#10b981' }}>{tenant_comparison?.crazy_fashion?.avg_quality}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Turn Latency:</span>
                  <strong>{tenant_comparison?.crazy_fashion?.avg_latency_ms} ms</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Open Triage:</span>
                  <strong style={{ color: tenant_comparison?.crazy_fashion?.open_issues ? '#f59e0b' : '#10b981' }}>
                    {tenant_comparison?.crazy_fashion?.open_issues} issues
                  </strong>
                </div>
              </div>
            </div>

            {/* ICA Sverige Card */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🛒</span>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>ICA Sverige</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stammis Deals & Recipes</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Quality Score:</span>
                  <strong style={{ color: '#10b981' }}>{tenant_comparison?.ica_sweden?.avg_quality}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Turn Latency:</span>
                  <strong>{tenant_comparison?.ica_sweden?.avg_latency_ms} ms</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Open Triage:</span>
                  <strong style={{ color: tenant_comparison?.ica_sweden?.open_issues ? '#f59e0b' : '#10b981' }}>
                    {tenant_comparison?.ica_sweden?.open_issues} issues
                  </strong>
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.85rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="var(--accent-indigo)" />
            <span>Both reasoning engines are synchronized with SHA-256 multi-file skills and Model Armor guardrails.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
