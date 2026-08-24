import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Code, 
  Layers, 
  FileText, 
  Zap, 
  X,
  Cpu,
  Database,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Palette
} from 'lucide-react';

function getAgentIcon(agentId) {
  switch (agentId) {
    case 'marketing_orchestrator': return <Cpu size={17} color="#4f46e5" />;
    case 'analytics_agent': return <Database size={17} color="#0284c7" />;
    case 'recommendation_pipeline': return <ShoppingBag size={17} color="#059669" />;
    case 'a2ui_pipeline': return <Sparkles size={17} color="#ec4899" />;
    case 'strategy_pipeline': return <TrendingUp size={17} color="#7c3aed" />;
    case 'content_pipeline': return <Palette size={17} color="#d97706" />;
    default: return <Layers size={17} color="var(--color-primary)" />;
  }
}

function getAgentTypeBadge(type = 'specialist') {
  if (type === 'orchestrator') {
    return {
      label: 'Root Orchestrator',
      color: '#4f46e5',
      bg: 'rgba(79, 70, 229, 0.12)',
      border: 'rgba(79, 70, 229, 0.25)'
    };
  }
  return {
    label: 'Sequential Pipeline',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(2, 132, 199, 0.25)'
  };
}

export default function SkillsInspector({ activeClient = {} }) {
  const [skills, setSkills] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillContent, setSkillContent] = useState('');

  const clientId = activeClient?.client_id || 'crazy_fashion';

  useEffect(() => {
    fetch(`/api/skills?client_id=${clientId}`)
      .then(res => res.json())
      .then(data => setSkills(data.skills || []))
      .catch(err => console.error(err));

    fetch(`/api/agents?client_id=${clientId}`)
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .catch(err => console.error(err));
  }, [clientId]);

  const inspectSkill = (skillId) => {
    setSelectedSkill(skillId);
    fetch(`/api/skills/${skillId}?client_id=${clientId}`)
      .then(res => res.json())
      .then(data => setSkillContent(data.content || 'No content found'))
      .catch(() => setSkillContent('Error loading skill content'));
  };

  return (
    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.4rem', height: '100%', overflowY: 'auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
            <BookOpen size={22} color="var(--color-primary)" />
            Agent Registry & Dynamic Skills Store
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Skills are modular domain instructions registered in Agent Registry and dynamically bound to agents in Vertex AI Agent Engine.
          </p>
        </div>

        {activeClient?.client_name && (
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: activeClient.primary_color || 'var(--color-primary)',
            background: 'var(--bg-secondary)',
            border: `1px solid ${activeClient.primary_color || 'var(--border-color)'}40`,
            padding: '0.35rem 0.8rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeClient.primary_color || 'var(--color-primary)' }}></span>
            <span>Active Tenant: <strong>{activeClient.client_name}</strong></span>
          </div>
        )}
      </div>

      {/* Agents List with Bound Skills */}
      <div>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--color-purple)" />
          Active Agent Engine Standalone Instances ({agents.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {agents.map((agent, i) => {
            const typeBadge = getAgentTypeBadge(agent.type);
            return (
              <div key={i} style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
              }}>
                {/* Top Badge Row */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      background: typeBadge.bg,
                      color: typeBadge.color,
                      border: `1px solid ${typeBadge.border}`
                    }}>
                      {typeBadge.label}
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {agent.agent_id}
                    </span>
                  </div>

                  {/* Agent Title with Icon */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ marginTop: '0.15rem', flexShrink: 0 }}>
                      {getAgentIcon(agent.agent_id)}
                    </div>
                    <h4 style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      lineHeight: '1.35',
                      margin: 0,
                      wordBreak: 'break-word',
                      flex: 1
                    }}>
                      {agent.name}
                    </h4>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.9rem',
                    lineHeight: '1.45'
                  }}>
                    {agent.description || agent.role || 'Standalone Reasoning Engine Agent Instance.'}
                  </p>
                </div>

                {/* Bottom Footer: Bound Skills & Runtime Indicator */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {agent.skills && agent.skills.length > 0 ? (
                      agent.skills.map((s, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '10px',
                          background: 'rgba(52, 168, 83, 0.12)',
                          color: 'var(--color-success)',
                          border: '1px solid rgba(52, 168, 83, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <CheckCircle size={10} /> {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        A2A Multi-Agent Router
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                    <span>Live Runtime</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSkill ? '1fr 1.3fr' : '1fr', gap: '1.2rem' }}>
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code size={18} color="var(--color-success)" />
            Registered Agent Skills ({skills.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {skills.map((skill, i) => (
              <div key={i} 
                onClick={() => inspectSkill(skill.skill_id)}
                style={{
                  background: selectedSkill === skill.skill_id ? 'rgba(66, 133, 244, 0.12)' : 'var(--panel-bg)',
                  border: `1px solid ${selectedSkill === skill.skill_id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedSkill === skill.skill_id ? '0 4px 20px rgba(66, 133, 244, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Zap size={14} color="var(--color-warning)" /> {skill.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-purple)', fontWeight: 600, background: 'rgba(161,66,244,0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {skill.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{skill.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Skill Code Inspector */}
        {selectedSkill && (
          <div style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '14px',
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} /> skills/{selectedSkill}/SKILL.md
              </span>
              <button 
                onClick={() => setSelectedSkill(null)}
                style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                <X size={14} /> Close
              </button>
            </div>
            <pre style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.76rem',
              color: 'var(--text-main)',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              maxHeight: '420px',
              background: 'var(--code-bg)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              lineHeight: '1.5'
            }}>
              {skillContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
