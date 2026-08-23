import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Play, Square, BarChart2, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, ChevronDown, ChevronRight, FileText, AlertCircle, RefreshCw, Zap, Clock, TrendingUp, Hash } from 'lucide-react';

export default function SimulatorControls({ activeClient }) {
  const [active, setActive] = useState(false);
  const [simMetrics, setSimMetrics] = useState(null);
  const pollRef = useRef(null);

  const [evalResult, setEvalResult] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: 'System initialized. OpenTelemetry collector ready.', type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: 'Vertex AI Agent Engine connected (Model: gemini-3.6-flash).', type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: 'Model Armor enforcement active via Agent Gateway.', type: 'info' }
  ]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
  }, []);

  // Poll simulator status when active
  useEffect(() => {
    if (active) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/simulator/status');
          if (res.ok) {
            const data = await res.json();
            setSimMetrics(data);
          }
        } catch {
          // Ignore polling errors
        }
      }, 2000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [active]);

  const toggleSimulator = async () => {
    const newActive = !active;
    setActive(newActive);
    try {
      await fetch('/api/simulator/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      addLog(`Traffic simulator ${newActive ? 'STARTED' : 'STOPPED'}. Target: live Agent Runtime`, newActive ? 'success' : 'warn');
    } catch {
      addLog('Failed to toggle simulator.', 'error');
    }
  };

  const runEvaluation = async () => {
    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);
    addLog('Starting automated multi-agent evaluation suite against Agent Runtime...', 'info');

    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setEvalResult(data);
      addLog(`Evaluation completed: ${data.passed}/${data.total} passed (${data.overall_score * 100}%). Overall status: ${data.passed === data.total ? 'PASS' : 'FAIL'}`, data.passed === data.total ? 'success' : 'error');
    } catch (err) {
      setEvalError(err.message);
      addLog(`Evaluation failed: ${err.message}`, 'error');
    } finally {
      setEvalLoading(false);
    }
  };

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

  const kpiStyle = () => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.8rem',
    background: 'var(--panel-bg)',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    minWidth: '100px',
  });

  return (
    <div style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      height: '100%',
      overflowY: 'auto',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.3rem',
          color: 'var(--text-main)',
        }}>
          <Activity size={22} color="var(--color-purple)" />
          Live Traffic Simulator & Cloud Trace Telemetry
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Send real synthetic traffic to the Agent Runtime or run the evaluation suite against live infrastructure.
        </p>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={toggleSimulator}
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            background: active ? 'rgba(234,67,53,0.15)' : (activeClient?.header_gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-purple))'),
            color: active ? 'var(--color-danger)' : '#ffffff',
            border: active ? '1px solid var(--color-danger)' : 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: active ? 'none' : `0 4px 15px ${activeClient?.primary_color || 'rgba(66,133,244,0.4)'}50`,
            transition: 'all 0.2s ease'
          }}
        >
          {active ? <Square size={16} /> : <Play size={16} />}
          {active ? 'Stop Traffic Simulator' : 'Start Synthetic Traffic Simulator'}
        </button>

        <button
          onClick={runEvaluation}
          disabled={evalLoading}
          style={{
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: evalLoading ? 'var(--chip-bg)' : 'linear-gradient(135deg, #16a34a, #15803d)',
            color: evalLoading ? 'var(--text-muted)' : '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: evalLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: evalLoading ? 'none' : '0 4px 15px rgba(22,163,74,0.3)',
          }}
        >
          {evalLoading ? <RefreshCw size={16} className="spin" /> : <BarChart2 size={16} />}
          {evalLoading ? 'Running Evaluation Against Agent Runtime...' : 'Run Local Evaluation Suite'}
        </button>
      </div>

      {/* ─── Live Simulator Metrics ─── */}
      {(active || simMetrics) && simMetrics && simMetrics.total_requests > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Live Traffic Metrics</span>
            </div>
            {active && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-success)',
                background: 'rgba(52,168,83,0.12)', padding: '0.2rem 0.6rem', borderRadius: '999px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse 1.5s infinite' }} />
                LIVE
              </div>
            )}
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
            <div style={kpiStyle('var(--color-primary)')}>
              <Hash size={16} color="var(--color-primary)" />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.3rem' }}>{simMetrics.total_requests}</div>
              <div style={labelStyle}>Total Requests</div>
            </div>
            <div style={kpiStyle('var(--color-success)')}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.3rem' }}>{simMetrics.successful}</div>
              <div style={labelStyle}>Successful</div>
            </div>
            <div style={kpiStyle('var(--color-danger)')}>
              <XCircle size={16} color={simMetrics.failed > 0 ? 'var(--color-danger)' : 'var(--text-dim)'} />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: simMetrics.failed > 0 ? 'var(--color-danger)' : 'var(--text-dim)', marginTop: '0.3rem' }}>{simMetrics.failed}</div>
              <div style={labelStyle}>Failed</div>
            </div>
            <div style={kpiStyle('var(--color-warning)')}>
              <Clock size={16} color="var(--color-warning)" />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.3rem' }}>{simMetrics.avg_latency_ms}<span style={{ fontSize: '0.7rem', fontWeight: 500 }}>ms</span></div>
              <div style={labelStyle}>Avg Latency</div>
            </div>
          </div>

          {/* Per-Agent Breakdown */}
          {simMetrics.per_agent && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ ...labelStyle, marginBottom: '0.6rem' }}>Per-Agent Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
                {Object.entries(simMetrics.per_agent).map(([key, ag]) => {
                  const agentColors = {
                    analytics: { bg: 'rgba(66,133,244,0.08)', border: 'rgba(66,133,244,0.25)', accent: 'var(--color-primary)' },
                    strategy: { bg: 'rgba(147,51,234,0.08)', border: 'rgba(147,51,234,0.25)', accent: 'var(--color-purple)' },
                    full_campaign: { bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', accent: 'var(--color-warning)' },
                  };
                  const colors = agentColors[key] || agentColors.analytics;
                  const successRate = ag.requests > 0 ? Math.round((ag.successful / ag.requests) * 100) : 0;

                  return (
                    <div key={key} style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      padding: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.accent }}>{ag.label}</span>
                        {ag.requests > 0 && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px',
                            background: successRate >= 100 ? 'rgba(52,168,83,0.15)' : successRate >= 50 ? 'rgba(217,119,6,0.15)' : 'rgba(220,38,38,0.15)',
                            color: successRate >= 100 ? 'var(--color-success)' : successRate >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                          }}>{successRate}% pass</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Requests</div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{ag.requests}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Avg Latency</div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{ag.avg_latency_ms}<span style={{ fontSize: '0.6rem', fontWeight: 500 }}>ms</span></div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Success</div>
                          <div style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '1rem' }}>{ag.successful}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Failed</div>
                          <div style={{ fontWeight: 800, color: ag.failed > 0 ? 'var(--color-danger)' : 'var(--text-dim)', fontSize: '1rem' }}>{ag.failed}</div>
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      {ag.requests > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '4px', height: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${successRate}%`, background: colors.accent, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Requests Table */}
          {simMetrics.recent_requests && simMetrics.recent_requests.length > 0 && (
            <div>
              <div style={labelStyle}>Recent Requests</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                {simMetrics.recent_requests.map((req, i) => {
                  const agentBadgeColors = {
                    analytics: { bg: 'rgba(66,133,244,0.12)', color: 'var(--color-primary)' },
                    strategy: { bg: 'rgba(147,51,234,0.12)', color: 'var(--color-purple)' },
                    full_campaign: { bg: 'rgba(217,119,6,0.12)', color: 'var(--color-warning)' },
                  };
                  const bc = agentBadgeColors[req.agent] || agentBadgeColors.analytics;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.4rem 0.6rem', background: 'var(--chip-bg)', borderRadius: '6px',
                      fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                    }}>
                      <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{req.timestamp}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                        borderRadius: '4px', minWidth: '52px', textAlign: 'center',
                        background: req.status === 'SUCCESS' ? 'rgba(52,168,83,0.12)' : req.status === 'ERROR' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                        color: req.status === 'SUCCESS' ? 'var(--color-success)' : req.status === 'ERROR' ? 'var(--color-danger)' : 'var(--color-warning)',
                      }}>{req.status}</span>
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                        borderRadius: '4px', whiteSpace: 'nowrap',
                        background: bc.bg, color: bc.color,
                      }}>{req.agent_label || req.agent}</span>
                      <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{req.latency_ms}ms</span>
                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {req.prompt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {evalError && (
        <div style={{ ...cardStyle, borderColor: 'var(--color-danger)', background: 'rgba(220, 38, 38, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> Evaluation Error: {evalError}
          </div>
        </div>
      )}

      {/* Evaluation Results */}
      {evalResult && !evalResult.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Overall Score */}
          <div style={{
            ...cardStyle,
            borderColor: evalResult.benchmark_score_pct >= 100 ? 'var(--color-success)' : evalResult.benchmark_score_pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
            boxShadow: `0 4px 20px ${evalResult.benchmark_score_pct >= 100 ? 'rgba(52,168,83,0.15)' : 'rgba(217,119,6,0.15)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color={evalResult.benchmark_score_pct >= 100 ? 'var(--color-success)' : 'var(--color-warning)'} />
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Evaluation Benchmark Score: {evalResult.benchmark_score_pct}%
                </span>
              </div>
              <span style={{
                fontSize: '0.74rem', fontWeight: 700, padding: '0.25rem 0.8rem', borderRadius: '6px',
                background: evalResult.benchmark_score_pct >= 100 ? 'rgba(52,168,83,0.15)' : 'rgba(217,119,6,0.15)',
                color: evalResult.benchmark_score_pct >= 100 ? 'var(--color-success)' : 'var(--color-warning)',
              }}>
                {evalResult.benchmark_score_pct >= 100 ? 'APPROVED FOR PRODUCTION' : 'NEEDS ATTENTION'}
              </span>
            </div>
            <div style={{ background: 'var(--chip-bg)', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '0.8rem' }}>
              <div style={{
                height: '100%', width: `${evalResult.benchmark_score_pct}%`,
                background: evalResult.benchmark_score_pct >= 100 ? 'var(--color-success)' : 'var(--color-warning)',
                borderRadius: '8px', transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
              <div>
                <div style={labelStyle}>Total Cases</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{evalResult.total_cases}</div>
              </div>
              <div>
                <div style={labelStyle}>Passed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>{evalResult.passed_cases}</div>
              </div>
              <div>
                <div style={labelStyle}>Failed</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: evalResult.total_cases - evalResult.passed_cases > 0 ? 'var(--color-danger)' : 'var(--text-dim)' }}>
                  {evalResult.total_cases - evalResult.passed_cases}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Case Results */}
          {(evalResult.details || []).map((testCase, i) => (
            <div key={testCase.eval_id} style={{ ...cardStyle, borderColor: testCase.status === 'PASS' ? 'rgba(52,168,83,0.3)' : 'rgba(220,38,38,0.3)', cursor: 'pointer' }}
              onClick={() => setExpandedCase(expandedCase === i ? null : i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {testCase.status === 'PASS' ? <CheckCircle2 size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-danger)" />}
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{testCase.eval_id}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: testCase.status === 'PASS' ? 'rgba(52,168,83,0.12)' : 'rgba(220,38,38,0.12)',
                    color: testCase.status === 'PASS' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}>{testCase.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: testCase.safety_eval?.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {testCase.safety_eval?.passed ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    Safety {testCase.safety_eval?.passed ? '✓' : '✗'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color: testCase.quality_eval?.has_content ? 'var(--color-success)' : testCase.safety_eval?.expected === 'blocked' ? 'var(--text-dim)' : 'var(--color-danger)' }}>
                    <Zap size={14} />
                    Quality {testCase.quality_eval?.has_content ? '✓' : testCase.safety_eval?.expected === 'blocked' ? 'N/A' : '✗'}
                  </div>
                  {expandedCase === i ? <ChevronDown size={16} color="var(--text-dim)" /> : <ChevronRight size={16} color="var(--text-dim)" />}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                <FileText size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} /> {testCase.prompt}
              </div>
              {expandedCase === i && (
                <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.82rem' }}>
                    <div><div style={labelStyle}>Safety — Expected</div><div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{testCase.safety_eval?.expected || 'N/A'}</div></div>
                    <div><div style={labelStyle}>Safety — Actual</div><div style={{ color: testCase.safety_eval?.passed ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{testCase.safety_eval?.actual || 'N/A'}{testCase.safety_eval?.passed ? ' ✓' : ' ✗ MISMATCH'}</div></div>
                    <div><div style={labelStyle}>Response Content</div><div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{testCase.quality_eval?.has_content ? 'Has meaningful content ✓' : testCase.safety_eval?.expected === 'blocked' ? 'Blocked (expected)' : 'No content ✗'}</div></div>
                    <div><div style={labelStyle}>Verdict</div><div style={{ fontWeight: 700, color: testCase.status === 'PASS' ? 'var(--color-success)' : 'var(--color-danger)' }}>{testCase.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}</div></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {evalResult && evalResult.error && (
        <div style={{ ...cardStyle, borderColor: 'var(--color-warning)', background: 'rgba(217,119,6,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', fontSize: '0.85rem', fontWeight: 600 }}>
            <AlertCircle size={16} /> {evalResult.error}
          </div>
        </div>
      )}

      {/* OpenTelemetry Live Span Log */}
      <div style={{
        flex: 1, minHeight: 0, background: 'var(--panel-bg)',
        border: '1px solid var(--border-color)', borderRadius: '12px',
        padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
          📡 OPENTELEMETRY TRACE & SYSTEM EVENT LOG
        </span>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
          display: 'flex', flexDirection: 'column', gap: '0.45rem',
          overflowY: 'auto', flex: 1,
          background: 'var(--code-bg)', padding: '1rem', borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>[{log.time}]</span>
              <span style={{
                color: log.type === 'success' ? 'var(--color-success)' : log.type === 'error' ? 'var(--color-danger)' : log.type === 'status' ? 'var(--color-primary)' : 'var(--text-main)',
                wordBreak: 'break-word'
              }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
