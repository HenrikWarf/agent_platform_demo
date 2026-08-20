import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Send, RefreshCw, CheckCircle, AlertCircle, Copy, ChevronDown, ChevronRight, Zap, Radio, Code2, FileJson, X } from 'lucide-react';

const API_BASE = '';

export default function A2AExplorer() {
  const [agentCard, setAgentCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(null);

  const [a2aPrompt, setA2aPrompt] = useState('How many customers are in the Champions segment?');
  const [a2aResponse, setA2aResponse] = useState(null);
  const [a2aLoading, setA2aLoading] = useState(false);
  const [a2aError, setA2aError] = useState(null);

  const [showRawCard, setShowRawCard] = useState(false);
  const [showRawRequest, setShowRawRequest] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!agentCard) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setAgentCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [agentCard]);

  const copyToClipboard = (text, field) => {
    window.navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchAgentCard = async () => {
    setCardLoading(true);
    setCardError(null);
    try {
      const res = await fetch(`${API_BASE}/api/a2a/agent-card`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAgentCard(data);
    } catch (err) {
      setCardError(err.message);
    } finally {
      setCardLoading(false);
    }
  };

  const sendA2AMessage = async () => {
    if (!a2aPrompt.trim()) return;
    setA2aLoading(true);
    setA2aError(null);
    setA2aResponse(null);
    try {
      const res = await fetch(`${API_BASE}/api/a2a/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: a2aPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setA2aResponse(data);
    } catch (err) {
      setA2aError(err.message);
    } finally {
      setA2aLoading(false);
    }
  };

  const buildRequestPayload = () => ({
    jsonrpc: '2.0',
    id: '<uuid>',
    method: 'SendMessage',
    params: {
      message: {
        messageId: '<uuid>',
        role: 'ROLE_USER',
        parts: [{ text: a2aPrompt }],
      },
      configuration: { acceptedOutputModes: ['text/plain'] },
    },
  });

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

  const valueStyle = {
    fontSize: '0.88rem',
    color: 'var(--text-main)',
    fontWeight: 500,
  };

  const chipStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: `${color}18`,
    color: color,
    border: `1px solid ${color}30`,
  });

  const codeBlockStyle = {
    background: 'var(--code-bg)',
    borderRadius: '8px',
    padding: '1rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    lineHeight: 1.6,
    overflowX: 'auto',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    maxHeight: '400px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const buttonStyle = (variant = 'primary') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: variant === 'primary'
      ? 'linear-gradient(135deg, var(--color-primary), var(--color-purple))'
      : 'var(--chip-bg)',
    color: variant === 'primary' ? '#ffffff' : 'var(--text-main)',
    opacity: 1,
  });

  const collapsibleHeader = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-dim)',
    padding: '0.4rem 0',
    userSelect: 'none',
  };

  const renderAgentCardModal = () => {
    if (!agentCard) return null;
    return createPortal(
      <div
        onClick={() => setAgentCard(null)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 12, 16, 0.72)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '2rem 1.5rem',
          boxSizing: 'border-box'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '88vh',
            overflowY: 'auto',
            padding: '1.8rem',
            boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileJson size={22} color="var(--color-primary)" />
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Agent Card Discovery</span>
              <div style={chipStyle('var(--color-success)')}>
                <CheckCircle size={12} /> Live A2A Endpoint
              </div>
            </div>
            <button
              onClick={() => setAgentCard(null)}
              title="Close modal (Esc)"
              style={{
                background: 'var(--chip-bg)', border: '1px solid var(--border-color)',
                borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--chip-bg)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Identity */}
          <div style={{ ...cardStyle, background: 'var(--chip-bg)' }}>
            <div style={labelStyle}>Agent Identity</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>{agentCard.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.5 }}>{agentCard.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginTop: '1rem' }}>
              <div>
                <div style={labelStyle}>Version</div>
                <div style={valueStyle}>{agentCard.version || 'N/A'}</div>
              </div>
              <div>
                <div style={labelStyle}>Streaming</div>
                <div style={valueStyle}>{agentCard.capabilities?.streaming ? '✅ Yes' : '❌ No'}</div>
              </div>
              <div>
                <div style={labelStyle}>Input Modes</div>
                <div style={valueStyle}>{(agentCard.defaultInputModes || []).join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Interfaces */}
          <div style={{ ...cardStyle, background: 'var(--chip-bg)' }}>
            <div style={labelStyle}>Supported Interfaces</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {(agentCard.supportedInterfaces || []).map((iface, i) => (
                <div key={i} style={chipStyle('var(--color-primary)')}>
                  <Radio size={11} />
                  {iface.protocolBinding} v{iface.protocolVersion}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {agentCard.skills && agentCard.skills.length > 0 && (
            <div style={{ ...cardStyle, background: 'var(--chip-bg)' }}>
              <div style={labelStyle}>Advertised Skills ({agentCard.skills.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {agentCard.skills.map((skill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.7rem', background: 'var(--bg-card)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                    <Zap size={13} color="var(--color-warning)" />
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', minWidth: '140px' }}>{skill.id}:{skill.name}</span>
                    <span style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(skill.description || '').substring(0, 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Collapsible */}
          <div style={{ ...cardStyle, background: 'var(--chip-bg)' }}>
            <div style={collapsibleHeader} onClick={() => setShowRawCard(!showRawCard)}>
              {showRawCard ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Code2 size={14} />
              Raw Agent Card JSON
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(agentCard, 'card'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <Copy size={13} color={copiedField === 'card' ? 'var(--color-success)' : 'var(--text-dim)'} />
              </button>
            </div>
            {showRawCard && (
              <pre style={codeBlockStyle}>{JSON.stringify(agentCard, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.4rem', height: '100%', overflowY: 'auto', width: '100%' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
          <Globe size={22} color="var(--color-primary)" />
          A2A Protocol Explorer
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Interact with the Marketing Orchestrator agent using the <strong>Agent-to-Agent (A2A) protocol</strong>. 
          Fetch the agent card to discover capabilities, then send a JSON-RPC message to invoke the agent.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem', flex: 1, minHeight: 0 }}>

        {/* ─── LEFT: Agent Card Discovery ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

          {/* Fetch Button Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileJson size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Agent Card Discovery</span>
              </div>
              <button onClick={fetchAgentCard} disabled={cardLoading} style={buttonStyle()}>
                {cardLoading ? <RefreshCw size={14} className="spin" /> : <Globe size={14} />}
                {cardLoading ? 'Fetching...' : 'Fetch Agent Card'}
              </button>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--code-bg)', padding: '0.5rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>GET /.well-known/agent-card.json</span>
              <button
                onClick={() => copyToClipboard('GET /a2a/app/.well-known/agent-card.json', 'url')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <Copy size={13} color={copiedField === 'url' ? 'var(--color-success)' : 'var(--text-dim)'} />
              </button>
            </div>
          </div>

          {cardError && (
            <div style={{ ...cardStyle, borderColor: 'var(--color-danger)', background: 'rgba(220, 38, 38, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {cardError}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Send A2A Message ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

          {/* Send Message Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <Send size={18} color="var(--color-purple)" />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Send A2A Message</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--code-bg)', padding: '0.5rem 0.8rem', borderRadius: '6px', marginBottom: '0.8rem' }}>
              POST /a2a/app → JSON-RPC SendMessage (v1.0)
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <label style={labelStyle}>Prompt</label>
              <textarea
                value={a2aPrompt}
                onChange={(e) => setA2aPrompt(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button onClick={sendA2AMessage} disabled={a2aLoading || !a2aPrompt.trim()} style={{ ...buttonStyle(), width: '100%', justifyContent: 'center', opacity: a2aLoading ? 0.7 : 1 }}>
              {a2aLoading ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
              {a2aLoading ? 'Processing via A2A...' : 'Send via A2A Protocol'}
            </button>
          </div>

          {/* Request Preview */}
          <div style={cardStyle}>
            <div style={collapsibleHeader} onClick={() => setShowRawRequest(!showRawRequest)}>
              {showRawRequest ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Code2 size={14} />
              JSON-RPC Request Payload
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(buildRequestPayload(), 'req'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <Copy size={13} color={copiedField === 'req' ? 'var(--color-success)' : 'var(--text-dim)'} />
              </button>
            </div>
            {showRawRequest && (
              <pre style={codeBlockStyle}>{JSON.stringify(buildRequestPayload(), null, 2)}</pre>
            )}
          </div>

          {a2aError && (
            <div style={{ ...cardStyle, borderColor: 'var(--color-danger)', background: 'rgba(220, 38, 38, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {a2aError}
              </div>
            </div>
          )}

          {/* A2A Response */}
          {a2aResponse && (
            <>
              {/* Status Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} color="var(--color-success)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>A2A Response</span>
                  </div>
                  <div style={chipStyle('var(--color-success)')}>
                    {a2aResponse.state || 'COMPLETED'}
                  </div>
                </div>
                
                {/* Response Text */}
                {a2aResponse.response_text && (
                  <div style={{ padding: '0.8rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={labelStyle}>Agent Response</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {a2aResponse.response_text}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
                  <div>
                    <div style={labelStyle}>Protocol</div>
                    <div style={valueStyle}>JSON-RPC 2.0</div>
                  </div>
                  <div>
                    <div style={labelStyle}>A2A Version</div>
                    <div style={valueStyle}>1.0</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Method</div>
                    <div style={valueStyle}>SendMessage</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Task State</div>
                    <div style={valueStyle}>{a2aResponse.state || 'COMPLETED'}</div>
                  </div>
                </div>
              </div>

              {/* Raw Response Collapsible */}
              <div style={cardStyle}>
                <div style={collapsibleHeader} onClick={() => setShowRawResponse(!showRawResponse)}>
                  {showRawResponse ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Code2 size={14} />
                  Raw JSON-RPC Response
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(a2aResponse.raw_response, 'resp'); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Copy size={13} color={copiedField === 'resp' ? 'var(--color-success)' : 'var(--text-dim)'} />
                  </button>
                </div>
                {showRawResponse && (
                  <pre style={codeBlockStyle}>{JSON.stringify(a2aResponse.raw_response, null, 2)}</pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {renderAgentCardModal()}
    </div>
  );
}
