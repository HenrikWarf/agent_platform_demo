import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  Terminal, ShieldCheck, RefreshCw, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ObservabilityAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I am your **AI Observability & Quality Assistant** deployed on Vertex AI Agent Engine. I have direct access to your fleet telemetry, OpenTelemetry waterfall traces, BigQuery error logs, and quality evaluations.\n\nHow can I assist you with quality triage or performance analysis today?',
      tools: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'What is our global quality score and task success rate?',
    'Show me the open BigQuery and schema error clusters.',
    'Which agent has the highest latency and why?',
    'How does Crazy Fashion compare with ICA Sverige?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

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
        content: data.response || 'Telemetry query executed.',
        tools: data.tools_called || [],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat failed', e);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to the Observability Assistant backend.',
          tools: [],
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
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
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            width: isExpanded ? '640px' : '380px',
            height: isExpanded ? '650px' : '520px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-active)',
            transition: 'width 0.25s ease, height 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Observability Assistant</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  ADK Agent Live
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '0.85rem',
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
                    gap: '0.3rem',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '0.75rem 1rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      lineHeight: 1.45,
                    }}
                  >
                    {isUser ? (
                      <div>{m.content}</div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Tool Call Badges */}
                  {!isUser && m.tools && m.tools.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      {m.tools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(2, 132, 199, 0.12)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
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

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>Assistant querying telemetry store...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Rail */}
          {messages.length === 1 && (
            <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Suggested Inquiries
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {quickPrompts.slice(0, isExpanded ? 4 : 2).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    style={{
                      textAlign: 'left',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Sparkles size={12} color="var(--accent-indigo)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Ask Assistant about traces, errors, or evals..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '0.5rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--accent-indigo)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
