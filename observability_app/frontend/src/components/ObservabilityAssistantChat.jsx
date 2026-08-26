import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  Terminal, ShieldCheck, RefreshCw, ChevronDown, Maximize2, Minimize2,
  Activity, Layers, Database, CheckCircle2, Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ObservabilityAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I am your **AI Observability & Quality Assistant** running on Vertex AI Agent Engine.\n\nI have direct access to your fleet telemetry store, OpenTelemetry waterfall spans, 7-dimension error clusters, and automated quality rubrics.\n\nHow can I assist you with performance diagnosis or error triage today?',
      tools: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const messagesEndRef = useRef(null);

  const loadingSteps = [
    'Analyzing prompt intent & loading telemetry-analysis skill...',
    'Querying BigQuery traces & 7-dimension error clusters...',
    'Evaluating agent latencies & synthesizing diagnostic report...',
  ];

  const quickPrompts = [
    'What open problem clusters do we currently have?',
    'What is our global fleet quality score and SLA latency?',
    'Which agent has the highest latency and why?',
    'How does Crazy Fashion compare with ICA Sverige?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading, loadingStep]);

  // Loading animation step timer
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/obs/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.response || 'Telemetry query completed.',
        tools: data.tools_called || [],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat failed', e);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to the Observability Assistant backend. Please check server logs.',
          tools: [],
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: isExpanded ? '1rem' : '1.5rem', 
      right: isExpanded ? '1rem' : '1.5rem', 
      top: isExpanded ? '1rem' : 'auto',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
    }}>
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.35rem',
            borderRadius: '9999px',
            background: 'var(--accent-indigo)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 8px 10px -6px rgba(79, 70, 229, 0.3)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
          }}
        >
          <Bot size={20} />
          <span>Observability Assistant</span>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            width: isExpanded ? 'min(920px, calc(100vw - 2rem))' : '440px',
            height: isExpanded ? 'calc(100vh - 2rem)' : '580px',
            maxHeight: isExpanded ? 'calc(100vh - 2rem)' : '580px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-active)',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Observability Assistant
                </div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  ADK Runtime & Telemetry Tools Active
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', borderRadius: '4px' }}
                title={isExpanded ? 'Collapse' : 'Expand width for data tables'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', borderRadius: '4px' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'var(--bg-secondary)',
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: isUser ? '85%' : '96%',
                      width: 'fit-content',
                      padding: '0.85rem 1.15rem',
                      borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                      background: isUser ? 'var(--accent-indigo)' : 'var(--bg-card)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {isUser ? (
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.45, fontWeight: 500 }}>
                        {m.content}
                      </div>
                    ) : (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Tool Call Badges */}
                  {!isUser && m.tools && m.tools.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem', paddingLeft: '0.25rem' }}>
                      {m.tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(2, 132, 199, 0.12)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Terminal size={10} />
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* True Animated Multi-Step Loading State */}
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '16px 16px 16px 3px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  width: 'fit-content',
                  maxWidth: '92%',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                    <RefreshCw size={13} className="animate-spin" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Assistant Thinking
                    </span>
                    <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
                      <span className="dot-1" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'inline-block' }} />
                      <span className="dot-2" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'inline-block' }} />
                      <span className="dot-3" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-indigo)', display: 'inline-block' }} />
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.2rem' }}>
                  <Activity size={12} color="var(--accent-cyan)" />
                  <span>{loadingSteps[loadingStep]}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Inquiries Rail */}
          {messages.length === 1 && (
            <div style={{ padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Suggested Diagnostic Queries
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isExpanded ? '1fr 1fr' : '1fr', gap: '0.4rem' }}>
                {quickPrompts.slice(0, isExpanded ? 4 : 2).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    style={{
                      textAlign: 'left',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sparkles size={12} color="var(--accent-indigo)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Input Box */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-primary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask Assistant about traces, 7-dimension clusters, or SLA latencies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '0.6rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                background: 'var(--accent-indigo)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!input.trim() || isLoading) ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
