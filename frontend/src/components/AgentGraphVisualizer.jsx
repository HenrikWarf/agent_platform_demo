import React, { useState } from 'react';
import { Cpu, ShieldCheck, Database, FileText, Sparkles, ArrowRight, Zap, X, Wrench, BookOpen, MessageSquare } from 'lucide-react';

/* ── Agent Metadata ────────────────────────────────────────────────────────── */

const AGENT_META = {
  orchestrator: {
    name: 'Marketing Orchestrator',
    role: 'A2A Router Supervisor',
    model: 'gemini-3.6-flash',
    color: 'var(--color-primary)',
    icon: Cpu,
    skill: 'Router Gateway',
    description: 'Routes user requests to specialised sub-agents via A2A protocol. Classifies intent as ANALYTICS_ONLY, STRATEGY_ONLY, or FULL_CAMPAIGN.',
    capabilities: [
      'Classifies user intent into routing categories',
      'Delegates to analytics, strategy, and content sub-agents',
      'Enforces Model Armor safety screening on all requests',
      'Rejects prompt injection and unsafe inputs',
    ],
    instruction: `Route requests to sub-agents efficiently.

Sub-agents:
1. analytics_agent — Data queries, BigQuery, customer metrics, RFM segments.
2. strategy_agent — Campaign strategy, channel mix, pillars, A/B testing.
3. content_agent — Email copy, social posts, SMS templates.

Routing:
• Data questions → analytics_agent only.
• Strategy requests → analytics_agent first, then strategy_agent.
• Content requests → strategy_agent first, then content_agent.
• Full campaign → analytics_agent → strategy_agent → content_agent.`,
    tools: [],
    skills: []
  },
  analytics: {
    name: 'Analytics Agent',
    role: 'BigQuery Customer SQL',
    model: 'gemini-3.6-flash',
    color: 'var(--color-success)',
    icon: Database,
    skill: 'marketing_analytics',
    description: 'Executes BigQuery customer data analysis, cohort extraction, and RFM segmentation across 200 aligned customer records.',
    capabilities: [
      'Generates BigQuery Standard SQL from natural language',
      'Queries RFM summary, demographics 360, and transaction tables',
      'Returns structured row-level data or aggregate summaries',
      'Stores results in session state for downstream agents',
    ],
    instruction: `Answer data questions by writing BigQuery SQL and executing it with query_customer_data.

BigQuery Tables (dataset: agent-demo-09.marketing_analytics):
1. customer_rfm_summary — customer_id, rfm_segment, recency_days, frequency_orders, total_monetary
2. customer_demographics_360 — customer_id, full_name, email, age, location, churn_risk_score, lifetime_value_tier
3. customer_transactions — transaction_id, customer_id, amount, transaction_date

Rules:
• Write a single BigQuery Standard SQL query.
• Use fully qualified table names.
• Add LIMIT 20 for row-level listings.
• Call query_customer_data EXACTLY ONCE.`,
    tools: [
      { name: 'query_customer_data', description: 'Executes a BigQuery SQL query against the marketing_analytics dataset and returns structured results.' }
    ],
    skills: [
      { name: 'bigquery-customer-analytics', path: 'skills/bigquery-customer-analytics/SKILL.md' }
    ]
  },
  strategy: {
    name: 'Strategy Agent',
    role: 'SequentialAgent Pipeline',
    model: 'gemini-3.6-flash',
    color: 'var(--color-purple)',
    icon: FileText,
    skill: 'omnichannel_strategy',
    description: 'SequentialAgent pipeline: a reasoning agent generates the strategy from analytics context, then a formatter agent structures the output as validated JSON via output_schema.',
    capabilities: [
      'Creates campaign frameworks with 3 strategic pillars',
      'Allocates channel mix weights across email, social, SMS, in-app',
      'Generates A/B testing hypotheses',
      'Projects revenue recovery targets',
    ],
    instruction: `Create a comprehensive marketing campaign strategy based on the analytics data
available in the conversation context.

Include:
- A campaign title and business goal
- 3 campaign pillars with channel assignments
- Channel mix with weights and cadences
- 3 A/B testing hypotheses
- A projected revenue recovery figure

Be specific and data-driven. Reference the analytics findings directly.
Do NOT use any tools. Generate the strategy using your own reasoning.`,
    tools: [],
    skills: [
      { name: 'campaign-framework', path: 'skills/campaign-framework/SKILL.md' }
    ]
  },
  content: {
    name: 'Content Agent',
    role: 'SequentialAgent Pipeline',
    model: 'gemini-3.6-flash',
    color: 'var(--color-warning)',
    icon: Sparkles,
    skill: 'brand_voice',
    description: 'SequentialAgent pipeline: a reasoning agent generates creative assets from strategy context, then a formatter agent structures the output as validated JSON via output_schema.',
    capabilities: [
      'Drafts email templates with subject, preview text, body, and CTA',
      'Creates platform-specific social media copy',
      'Generates SMS copy within 160-character limits',
      'Aligns all content with brand voice guidelines',
    ],
    instruction: `Generate high-converting marketing creative assets based on the campaign strategy
available in the conversation context.

Create:
- Email template (subject, preview text, body, CTA button)
- 2 social media posts (platform-specific copy)
- SMS copy (max 160 characters)

Ensure all copy is professional, brand-aligned, and includes clear CTAs.
Do NOT use any tools. Generate the content using your own creativity.`,
    tools: [],
    skills: [
      { name: 'brand-voice-craft', path: 'skills/brand-voice-craft/SKILL.md' }
    ]
  }
};

/* ── Agent Detail Modal ────────────────────────────────────────────────────── */

function AgentDetailModal({ agentKey, onClose }) {
  const agent = AGENT_META[agentKey];
  if (!agent) return null;
  const Icon = agent.icon;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '16px', width: '100%', maxWidth: '520px',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${agent.color}18`, border: `1.5px solid ${agent.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={18} color={agent.color} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {agent.role} · {agent.model}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--chip-bg)', border: '1px solid var(--border-color)',
              borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-color)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--chip-bg)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Description */}
          <p style={{ fontSize: '0.84rem', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
            {agent.description}
          </p>

          {/* Capabilities */}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <div style={sectionHeader()}>
                <Zap size={14} color="var(--color-primary)" />
                Capabilities
              </div>
              <ul style={{
                margin: 0, paddingLeft: '1.2rem',
                display: 'flex', flexDirection: 'column', gap: '0.3rem'
              }}>
                {agent.capabilities.map((cap, i) => (
                  <li key={i} style={{
                    fontSize: '0.78rem', lineHeight: '1.5',
                    color: 'var(--text-main)'
                  }}>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* System Instruction */}
          <div>
            <div style={sectionHeader()}>
              <MessageSquare size={14} color="var(--color-primary)" />
              System Instruction
            </div>
            <div style={{
              background: 'var(--code-bg)', border: '1px solid var(--border-color)',
              borderRadius: '10px', padding: '0.85rem 1rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.76rem',
              lineHeight: '1.6', color: 'var(--text-main)',
              whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto'
            }}>
              {agent.instruction}
            </div>
          </div>

          {/* Tools — only when agent has code-defined tools */}
          {agent.tools.length > 0 && (
            <div>
              <div style={sectionHeader()}>
                <Wrench size={14} color="var(--color-primary)" />
                Tools ({agent.tools.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {agent.tools.map((tool, i) => (
                  <div key={i} style={{
                    background: 'var(--chip-bg)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '0.6rem 0.85rem'
                  }}>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: 700, color: agent.color,
                      fontFamily: 'var(--font-mono)', marginBottom: '0.2rem'
                    }}>
                      {tool.name}()
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills — only when agent has separately defined SKILL.md skills */}
          {agent.skills.length > 0 && (
            <div>
              <div style={sectionHeader()}>
                <BookOpen size={14} color="var(--color-primary)" />
                Skills ({agent.skills.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {agent.skills.map((skill, i) => (
                  <div key={i} style={{
                    background: `${agent.color}08`, border: `1px solid ${agent.color}30`,
                    borderRadius: '8px', padding: '0.6rem 0.85rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <Zap size={14} color={agent.color} />
                    <div>
                      <div style={{
                        fontSize: '0.8rem', fontWeight: 700, color: agent.color,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {skill.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {skill.path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sectionHeader() {
  return {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
    marginBottom: '0.45rem', display: 'flex', alignItems: 'center',
    gap: '0.4rem', letterSpacing: '0.03em', textTransform: 'uppercase'
  };
}

/* ── Main Visualizer Component ─────────────────────────────────────────────── */

export default function AgentGraphVisualizer({ a2aTrace, modelArmor }) {
  const isArmorPassed = modelArmor?.passed !== false;
  const [selectedAgent, setSelectedAgent] = useState(null);

  const agents = [
    { key: 'orchestrator', ...AGENT_META.orchestrator },
    { key: 'analytics', ...AGENT_META.analytics },
    { key: 'strategy', ...AGENT_META.strategy },
    { key: 'content', ...AGENT_META.content },
  ];

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

      {/* Agent Nodes 2x2 Grid — Clickable */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.8rem',
        background: 'var(--panel-bg)',
        padding: '0.9rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        {agents.map(agent => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.key}
              onClick={() => setSelectedAgent(agent.key)}
              style={{
                ...nodeStyle(agent.color),
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${agent.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon size={16} color={agent.color} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{agent.name.replace('Marketing ', '').replace(' Agent', '')}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{agent.role}</span>
              <span style={skillPill(agent.color)}>
                <Zap size={10} /> {agent.skill}
              </span>
            </div>
          );
        })}
      </div>

      {/* A2A Trace Message Log */}
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

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agentKey={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

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
