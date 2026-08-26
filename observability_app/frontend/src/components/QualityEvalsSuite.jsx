import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, Play, RefreshCw, 
  HelpCircle, Check, ArrowRight, ShieldCheck, Zap, Layers,
  Bot, Terminal, Database, Scale, Cpu, Search, CheckSquare, Square,
  ChevronRight, BarChart2, Award, AlertTriangle, ExternalLink, Sliders
} from 'lucide-react';

export default function QualityEvalsSuite() {
  const [tenant, setTenant] = useState('ica_sweden');
  const [scenarioTheme, setScenarioTheme] = useState('bigquery_segment_analytics');
  const [questionCount, setQuestionCount] = useState(4);
  
  // Generation & Test Suite State
  const [isGenerating, setIsGenerating] = useState(false);
  const [testCases, setTestCases] = useState([]);
  
  // Batch Execution State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [batchVerdict, setBatchVerdict] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const resultsRef = useRef(null);

  const scenarioOptions = [
    { id: 'bigquery_segment_analytics', name: '📊 BigQuery RFM & Cohort Spend Analytics', desc: 'NL2SQL cohort queries, regional store comparisons, and event funnel metrics.' },
    { id: 'curated_5item_assortment', name: '🛍️ 5-Item Capsule Styling & Recipe Bundles', desc: 'Curating 5-item coordinated fashion looks (EUR) or grocery recipe baskets (SEK).' },
    { id: 'a2ui_personalized_banner', name: '🎴 A2UI Personalization & Stammis Deal Banners', desc: 'Interactive Stammis Deal with mandatory jämförpris (kr/kg) & Studio Drop Cards.' },
    { id: 'channel_scoped_copy', name: '📱 Strict Channel Scope & SMS 160-Char Limits', desc: 'Channel-isolated copy (SMS under 160 chars) without unrequested media channels.' },
    { id: 'omnichannel_campaign_strategy', name: '⚡ 3-Pillar Strategy & Multi-Agent Orchestration', desc: 'End-to-end campaign formulation: Data ➔ 3-Pillar Strategy ➔ Content ➔ A2UI Banner.' },
    { id: 'security_and_compliance', name: '🛡️ Nordic Law (Jämförpris) & Model Armor Guardrail', desc: 'Swedish price law compliance, currency isolation (kr vs €), and injection defense.' },
  ];

  // Auto-generate default scenario suite on initial load
  useEffect(() => {
    handleGenerateSuite();
  }, [tenant, scenarioTheme]);

  const handleGenerateSuite = async () => {
    setIsGenerating(true);
    setBatchVerdict(null);
    setSelectedTestCase(null);
    try {
      const res = await fetch('/api/obs/eval/generate-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_theme: scenarioTheme,
          tenant_id: tenant,
          count: questionCount,
        }),
      });
      const data = await res.json();
      setTestCases(data.map(tc => ({ ...tc, selected: true })));
    } catch (e) {
      console.error('Failed to generate test suite', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectAll = (select) => {
    setTestCases(prev => prev.map(tc => ({ ...tc, selected: select })));
  };

  const toggleSelectOne = (id) => {
    setTestCases(prev => prev.map(tc => tc.test_id === id ? { ...tc, selected: !tc.selected } : tc));
  };

  const handleRunBatchEval = async () => {
    const selectedCases = testCases.filter(tc => tc.selected);
    if (selectedCases.length === 0) return;

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/obs/eval/run-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_cases: selectedCases,
          tenant_id: tenant,
        }),
      });
      const data = await res.json();
      setBatchVerdict(data);
      if (data.test_results?.length > 0) {
        setSelectedTestCase(data.test_results[0]);
      }
      // Move user down smoothly to the evaluation verdict and results section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e) {
      console.error('Batch evaluation failed', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    if (verdict === 'PASS') {
      return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>✓ PASS</span>;
    }
    if (verdict === 'BORDERLINE') {
      return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 800, fontSize: '0.75rem' }}>⚠️ BORDERLINE</span>;
    }
    return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem' }}>✗ FAIL</span>;
  };

  const getDifficultyColor = (diff) => {
    if (diff === 'CRITICAL') return 'var(--accent-rose)';
    if (diff === 'HIGH') return 'var(--accent-amber)';
    return 'var(--accent-cyan)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={24} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Interactive Scenario & LLM-as-a-Judge Evaluation Playground</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Generate scenario-based test suites with Gemini, inspect test cases, run batch LLM evaluations, and deep-dive into judge scorecards.
          </p>
        </div>

        {/* Tenant Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Target Tenant:</span>
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="ica_sweden">ICA Sverige (Swedish Grocery)</option>
            <option value="crazy_fashion">Crazy Fashion (Nordic Apparel)</option>
          </select>
        </div>
      </div>

      {/* STEP 1: Scenario Configuration & AI Generator */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={16} color="var(--accent-indigo)" />
            Step 1: Configure Scenario & Generate AI Test Questions
          </div>
          <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent-indigo)' }}>
            Powered by Gemini on Vertex AI
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {scenarioOptions.map((sc) => {
            const isSelected = scenarioTheme === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setScenarioTheme(sc.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
                  border: isSelected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? 'var(--accent-indigo)' : 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {sc.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {sc.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Suite Size:</span>
            {[3, 4, 6].map((num) => (
              <button
                key={num}
                onClick={() => setQuestionCount(num)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: questionCount === num ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                  color: questionCount === num ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {num} Questions
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateSuite}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              background: 'var(--accent-indigo)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>{isGenerating ? 'Synthesizing Test Scenarios...' : '✨ Generate AI Test Suite with Gemini'}</span>
          </button>
        </div>
      </div>

      {/* STEP 2: Preview & Select AI-Generated Questions */}
      {testCases.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                Step 2: Preview & Select Questions to Evaluate ({testCases.filter(t => t.selected).length}/{testCases.length} Selected)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Review generated test prompts and evaluation criteria before running batch LLM-as-a-Judge scoring.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => toggleSelectAll(true)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Select All
              </button>
              <button
                onClick={() => toggleSelectAll(false)}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Deselect All
              </button>
              <button
                onClick={handleRunBatchEval}
                disabled={isEvaluating || testCases.filter(t => t.selected).length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.2rem',
                  borderRadius: '8px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: (isEvaluating || testCases.filter(t => t.selected).length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (isEvaluating || testCases.filter(t => t.selected).length === 0) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isEvaluating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} fill="#ffffff" />}
                <span>{isEvaluating ? 'Evaluating Batch...' : `⚡ Evaluate Selected (${testCases.filter(t => t.selected).length})`}</span>
              </button>
            </div>
          </div>

          {/* Test Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {testCases.map((tc) => (
              <div
                key={tc.test_id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: tc.selected ? 'var(--bg-card)' : 'rgba(0,0,0,0.02)',
                  border: tc.selected ? '1px solid var(--border-active)' : '1px solid var(--border-color)',
                  opacity: tc.selected ? 1 : 0.6,
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Selection Checkbox */}
                <div
                  onClick={() => toggleSelectOne(tc.test_id)}
                  style={{ cursor: 'pointer', marginTop: '0.15rem', color: tc.selected ? 'var(--accent-indigo)' : 'var(--text-muted)' }}
                >
                  {tc.selected ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                        {tc.test_id}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {tc.scenario_title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: getDifficultyColor(tc.difficulty) + '18', color: getDifficultyColor(tc.difficulty) }}>
                        {tc.difficulty} DIFFICULTY
                      </span>
                      <span className="badge" style={{ fontSize: '0.68rem' }}>
                        {tc.target_agent}
                      </span>
                    </div>
                  </div>

                  {/* Prompt Text */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontStyle: 'italic' }}>
                    "{tc.prompt}"
                  </div>

                  {/* Evaluation Criteria */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                    <Scale size={13} color="var(--accent-indigo)" />
                    <span><strong>Judge Rubric:</strong> {tc.evaluation_criteria}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Batch LLM-as-a-Judge Verdicts & Deep-Dive Question Inspector */}
      {batchVerdict && (
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollMarginTop: '2rem' }}>
          
          {/* Executive Suite Verdict Banner */}
          <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Suite LLM-as-a-Judge Evaluation Verdict
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Batch Quality Score: {batchVerdict.average_composite_score}%
                </div>
              </div>

              {/* Pass / Borderline / Fail Distribution */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pass Rate</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{batchVerdict.pass_rate_pct}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passed</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{batchVerdict.pass_count}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Borderline</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{batchVerdict.borderline_count}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failed</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{batchVerdict.fail_count}</div>
                </div>
              </div>
            </div>

            {/* 4 Dimension Averages Radar Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Success</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{batchVerdict.average_metrics.task_success}%</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Factual Grounding</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{batchVerdict.average_metrics.grounding_faithfulness}%</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tool Use Quality</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{batchVerdict.average_metrics.tool_use_quality}%</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Brand Voice & Compliance</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{batchVerdict.average_metrics.brand_voice_adherence}%</div>
              </div>
            </div>
          </div>

          {/* Two-Column: Scorecard List vs Deep-Dive Inspector */}
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Left: Questions Scorecard List */}
            <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Test Cases Evaluated ({batchVerdict.test_results.length})
              </div>

              {batchVerdict.test_results.map((res) => {
                const isSelected = selectedTestCase?.test_id === res.test_id;
                const evalData = res.eval_result;

                return (
                  <div
                    key={res.test_id}
                    onClick={() => setSelectedTestCase(res)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
                      border: isSelected ? '2px solid var(--border-active)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                        {res.test_id}
                      </span>
                      {getVerdictBadge(evalData.judge_verdict)}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {res.scenario_title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{res.target_agent}</span>
                      <span style={{ fontWeight: 700, color: evalData.composite_score >= 90 ? '#10b981' : '#f59e0b' }}>
                        Score: {evalData.composite_score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Deep-Dive Judge Inspector */}
            {selectedTestCase ? (
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                        {selectedTestCase.test_id}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {selectedTestCase.scenario_title}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Target Agent: <strong>{selectedTestCase.target_agent}</strong> | Category: <strong>{selectedTestCase.category}</strong>
                    </div>
                  </div>
                  {getVerdictBadge(selectedTestCase.eval_result.judge_verdict)}
                </div>

                {/* Evaluated User Prompt */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Evaluated User Prompt
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    "{selectedTestCase.prompt}"
                  </div>
                </div>

                {/* 4 Dimension Score Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Task Success</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{selectedTestCase.eval_result.task_success_score}%</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grounding</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{selectedTestCase.eval_result.grounding_score}%</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tool Quality</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedTestCase.eval_result.tool_use_score}%</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Brand Voice</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{selectedTestCase.eval_result.brand_voice_score}%</div>
                  </div>
                </div>

                {/* Qualitative Judge Critique */}
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-indigo)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bot size={14} /> LLM Judge Qualitative Critique
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {selectedTestCase.eval_result.judge_critique}
                  </div>
                </div>

                {/* Actionable Prompt & Skill Optimization Recommendation */}
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Zap size={14} /> Recommended ADK Optimization & Skill Remediation
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {selectedTestCase.eval_result.optimization_recommendation}
                  </div>
                </div>

              </div>
            ) : null}

          </div>

        </div>
      )}

    </div>
  );
}
