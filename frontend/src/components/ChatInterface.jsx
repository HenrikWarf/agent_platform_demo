import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Sparkles, Cpu, FileText, CheckCircle2, Share2, Mail,
  TrendingUp, Trash2, Database, Layers, Shuffle, ArrowRight,
  Maximize2, Minimize2, Zap, ChevronDown, ChevronUp, Terminal, Shield, MessageSquare,
  ShoppingBag, Tag, CreditCard
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AgentGraphVisualizer from './AgentGraphVisualizer';
import A2UIOfferBanner from './A2UIOfferBanner';

const AGENT_THEMES = {
  orchestrator: {
    key: 'orchestrator',
    name: 'Marketing Orchestrator',
    shortName: 'Orchestrator',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.06)',
    activeBg: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.22)',
    activeBorder: 'rgba(79, 70, 229, 0.5)',
    borderLeft: '#4f46e5',
    badgeBg: 'rgba(79, 70, 229, 0.12)',
    badgeBorder: 'rgba(79, 70, 229, 0.3)',
    badgeColor: '#4f46e5',
    glow: 'rgba(79, 70, 229, 0.25)',
  },
  analytics: {
    key: 'analytics',
    name: 'Analytics Agent',
    shortName: 'Analytics',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.06)',
    activeBg: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(2, 132, 199, 0.22)',
    activeBorder: 'rgba(2, 132, 199, 0.5)',
    borderLeft: '#0284c7',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeBorder: 'rgba(2, 132, 199, 0.3)',
    badgeColor: '#0284c7',
    glow: 'rgba(2, 132, 199, 0.25)',
  },
  recommendation: {
    key: 'recommendation',
    name: 'Recommendation Pipeline',
    shortName: 'Recommender',
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.06)',
    activeBg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.22)',
    activeBorder: 'rgba(16, 185, 129, 0.5)',
    borderLeft: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    badgeColor: '#059669',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  strategy: {
    key: 'strategy',
    name: 'Strategy Pipeline',
    shortName: 'Strategy',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.06)',
    activeBg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.22)',
    activeBorder: 'rgba(124, 58, 237, 0.5)',
    borderLeft: '#7c3aed',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    badgeBorder: 'rgba(124, 58, 237, 0.3)',
    badgeColor: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.25)',
  },
  content: {
    key: 'content',
    name: 'Content Pipeline',
    shortName: 'Content',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.06)',
    activeBg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.22)',
    activeBorder: 'rgba(217, 119, 6, 0.5)',
    borderLeft: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeBorder: 'rgba(217, 119, 6, 0.3)',
    badgeColor: '#d97706',
    glow: 'rgba(217, 119, 6, 0.25)',
  },
  gateway: {
    key: 'gateway',
    name: 'Agent Gateway & Model Armor',
    shortName: 'Model Armor',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.06)',
    activeBg: 'rgba(225, 29, 72, 0.12)',
    border: 'rgba(225, 29, 72, 0.22)',
    activeBorder: 'rgba(225, 29, 72, 0.5)',
    borderLeft: '#e11d48',
    badgeBg: 'rgba(225, 29, 72, 0.12)',
    badgeBorder: 'rgba(225, 29, 72, 0.3)',
    badgeColor: '#e11d48',
    glow: 'rgba(225, 29, 72, 0.25)',
  },
};

const getAgentTheme = (agent, agentName) => {
  const query = `${agent || ''} ${agentName || ''}`.toLowerCase();
  if (query.includes('analytics') || query.includes('bigquery') || query.includes('sql') || query.includes('data')) return AGENT_THEMES.analytics;
  if (query.includes('recommendation') || query.includes('recommender') || query.includes('catalog')) return AGENT_THEMES.recommendation;
  if (query.includes('strategy')) return AGENT_THEMES.strategy;
  if (query.includes('content') || query.includes('creative') || query.includes('copy') || query.includes('brand')) return AGENT_THEMES.content;
  if (query.includes('gateway') || query.includes('armor') || query.includes('security') || query.includes('guardrail')) return AGENT_THEMES.gateway;
  return AGENT_THEMES.orchestrator;
};

/* ── Structured Objective Catalog & Interest Categories ────────────────────────── */

const OBJECTIVE_CATEGORIES = [
  { id: 'recommended', label: 'Dynamic & Follow-ups', icon: Sparkles, color: '#4f46e5', desc: 'Context-aware suggestions dynamically generated from recent messages & target cohort.' },
  { id: 'a2ui', label: 'A2UI Retail Deals (ICA)', icon: CreditCard, color: '#E01E26', desc: 'Agent-to-UI (A2UI) declarative widgets: personalized Swedish retail offers, Stammis loyalty pricing, and interactive app banners.' },
  { id: 'analytics', label: 'BigQuery Data', icon: Database, color: '#0284c7', desc: 'SQL customer queries: RFM segments, demographics, behavioral events, and transaction streams.' },
  { id: 'recommendations', label: 'Product Recommendations', icon: ShoppingBag, color: '#059669', desc: '5-product assortment curation tailored to customer segment attributes, spending capacity, and past purchases.' },
  { id: 'strategy', label: 'Campaign Strategy', icon: TrendingUp, color: '#7c3aed', desc: 'Omnichannel frameworks: 3-pillar architectures, channel mix weights, and A/B test hypotheses.' },
  { id: 'content', label: 'Creative Copy', icon: Mail, color: '#d97706', desc: 'Brand-aligned Nordic creative copy: email sequences, Instagram posts, and SMS under 160 chars.' },
  { id: 'campaign', label: 'Full Omnichannel', icon: Layers, color: '#4f46e5', desc: 'End-to-end multi-agent pipeline: BigQuery Data -> Campaign Strategy -> Creative Assets.' },
];

const CATEGORY_QUESTIONS = {
  a2ui: [
    {
      title: "ICA Stammis Eko-Deal Banner",
      prompt: "Generate an A2UI personalized deal banner for ICA Sweden targeting the 'Ekologiskt Medveten' customer persona with KRAV-certified dairy products, Stammis loyalty pricing, and interactive app card actions.",
      agent: "A2UI Creative Agent",
      badge: "ICA Eko",
      color: "#E01E26"
    },
    {
      title: "ICA Maxi Barnfamilj Storpack",
      prompt: "Create an A2UI personalized offer banner for ICA Maxi Stormarknad for a 'Barnfamilj' purchasing Swedish meat storpack with savings calculations, comparison price, and recipe suggestion.",
      agent: "A2UI Creative Agent",
      badge: "ICA Family",
      color: "#E01E26"
    },
    {
      title: "ICA Prisjägare & Student Deal",
      prompt: "Generate an A2UI retail offer banner for ICA Supermarket targeting price-conscious students with staple pantry discounts and instant 'Ladda till kortet' activation.",
      agent: "A2UI Creative Agent",
      badge: "ICA Budget",
      color: "#E01E26"
    },
    {
      title: "ICA Helglyx Delikatess Klipp",
      prompt: "Design an A2UI HelgKlipp offer banner for ICA Maxi fresh fish & seafood delicacies with Nordic recipe pairing and weekend countdown timer.",
      agent: "A2UI Creative Agent",
      badge: "ICA Helg",
      color: "#E01E26"
    }
  ],
  analytics: [
    {
      title: "RFM Segment Comparison",
      prompt: "Query BigQuery to compare 'VIP Fashionistas' and 'Dormant At-Risk': customer count, average recency in days, and total monetary value in EUR.",
      agent: "Analytics Agent",
      badge: "RFM SQL",
      color: "var(--color-success)"
    },
    {
      title: "Demographics & Churn Risk by Tier",
      prompt: "Analyze customer demographics in BigQuery: calculate average churn risk score and average Crazy Club points for each loyalty tier (Platinum, Gold, Silver, Bronze).",
      agent: "Analytics Agent",
      badge: "Demographics",
      color: "var(--color-success)"
    },
    {
      title: "Sustainable Catalog Filter",
      prompt: "Query the product catalog for all sustainability-certified items in Womenswear and Menswear with EUR pricing and collection names.",
      agent: "Analytics Agent",
      badge: "Catalog",
      color: "var(--color-success)"
    },
    {
      title: "Cart Abandonment vs Purchase Events",
      prompt: "Analyze customer behavioral events in BigQuery: count 'cart_abandon' vs 'purchase' events broken down by channel (Online, App, In-Store).",
      agent: "Analytics Agent",
      badge: "Events SQL",
      color: "var(--color-success)"
    },
    {
      title: "Omnichannel Channel Revenue Breakdown",
      prompt: "Aggregate customer transactions to calculate total sales revenue in EUR and total quantity sold across Online, App, Flagship Store, and Outlet.",
      agent: "Analytics Agent",
      badge: "Transactions",
      color: "var(--color-success)"
    }
  ],
  recommendations: [
    {
      title: "VIP Luxury & Outerwear Curation",
      prompt: "Recommend 5 premium, sustainability-certified products for our 'VIP Fashionistas' cohort with EUR pricing and detailed data-driven reasoning.",
      agent: "Recommendation Pipeline",
      badge: "VIP Curation",
      color: "#10b981"
    },
    {
      "title": "Dormant At-Risk Win-Back Assortment",
      "prompt": "Recommend 5 high-converting bestseller products to reactivate our 'Dormant At-Risk' customers with voucher pairing suggestions.",
      "agent": "Recommendation Pipeline",
      "badge": "Win-Back",
      "color": "#10b981"
    },
    {
      "title": "New Explorers Trend Assortment",
      "prompt": "Suggest 5 entry-price, trend-forward pieces for 'New Explorers' under €60 to encourage their second purchase.",
      "agent": "Recommendation Pipeline",
      "badge": "Entry Trend",
      "color": "#10b981"
    },
    {
      "title": "Loyal Regulars Seasonal Refresh",
      "prompt": "Curate 5 versatile organic cotton and knitwear products for our 'Loyal Regulars' with loyalty point accelerator perks.",
      "agent": "Recommendation Pipeline",
      "badge": "Loyal Refresh",
      "color": "#10b981"
    }
  ],
  strategy: [
    {
      title: "Dormant Win-Back Framework",
      prompt: "Create an omnichannel retention strategy for our 'Dormant At-Risk' customer cohort with 3 campaign pillars, 4 channel mix allocations summing to 100%, and A/B test hypotheses.",
      agent: "Strategy Pipeline",
      badge: "Retention",
      color: "var(--color-purple)"
    },
    {
      title: "VIP Loyalty Lifetime Value Expansion",
      prompt: "Formulate a VIP expansion strategy for 'VIP Fashionistas' focusing on Platinum perks, private previews, and projected revenue recovery in EUR.",
      agent: "Strategy Pipeline",
      badge: "VIP Growth",
      color: "var(--color-purple)"
    },
    {
      title: "Seasonal Shoppers Reactivation",
      prompt: "Design a seasonal campaign framework to convert 'Seasonal Shoppers' into year-round regulars with personalized drop alerts and early access.",
      agent: "Strategy Pipeline",
      badge: "Reactivation",
      color: "var(--color-purple)"
    },
    {
      title: "App-First Conversion Growth",
      prompt: "Propose 3 testable A/B testing hypotheses to boost mobile app purchase conversion and store pickup adoption across Nordic markets.",
      agent: "Strategy Pipeline",
      badge: "A/B Testing",
      color: "var(--color-purple)"
    }
  ],
  content: [
    {
      title: "Autumn Collection Launch Suite",
      prompt: "Craft creative campaign assets for the Autumn Knitwear drop: email template (subject, preview, body, CTA), 2 Instagram posts, and SMS under 160 characters.",
      agent: "Content Pipeline",
      badge: "Email + Social",
      color: "var(--color-warning)"
    },
    {
      title: "Circular Fashion & Garment Recycling",
      prompt: "Write circular sustainability copy encouraging customers to bring old clothes to stores for double Crazy Club points. Include email and Instagram post.",
      agent: "Content Pipeline",
      badge: "Circular Copy",
      color: "var(--color-warning)"
    },
    {
      title: "New Member Nordic Onboarding Series",
      prompt: "Draft a 3-part Nordic welcome series for 'New Explorers' highlighting member discounts, Scandinavian styling tips, and SMS under 160 characters.",
      agent: "Content Pipeline",
      badge: "Onboarding",
      color: "var(--color-warning)"
    },
    {
      title: "Flash Drop Denim Social Teaser",
      prompt: "Generate high-energy Instagram and TikTok copy with Scandinavian minimalism for a 48-hour flash drop of recycled denim.",
      agent: "Content Pipeline",
      badge: "Social Drop",
      color: "var(--color-warning)"
    }
  ],
  campaign: [
    {
      title: "End-to-End Dormant Recovery Pipeline",
      prompt: "Run an end-to-end campaign: Query BigQuery for Dormant At-Risk metrics -> generate 3-pillar retention strategy -> produce creative email, social, and SMS copy.",
      agent: "Multi-Agent Orchestrator",
      badge: "Full Pipeline",
      color: "#3b82f6"
    },
    {
      title: "VIP Platinum Fashion Week Experience",
      prompt: "Execute full VIP campaign: Extract top spenders from BigQuery -> design private Stockholm showroom strategy -> write personalized invitation copy.",
      agent: "Multi-Agent Orchestrator",
      badge: "VIP Flow",
      color: "#3b82f6"
    },
    {
      title: "Sustainability Month Omnichannel Push",
      prompt: "Full campaign orchestration: Analyze eco-conscious buyer events -> develop circular retail strategy -> craft multi-channel marketing content.",
      agent: "Multi-Agent Orchestrator",
      badge: "Eco Flow",
      color: "#3b82f6"
    }
  ]
};

function getDynamicRecommendations(messages, shuffleSeed) {
  const dynamic = [];
  const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant');

  // Contextual follow-up generation based on previous assistant output
  if (lastBotMsg?.data?.strategy) {
    dynamic.push({
      title: "Draft Copy Suite for Pillar 1",
      prompt: "Generate the complete creative copy suite (email, 2 Instagram posts, and SMS under 160 chars) implementing Pillar 1 of the campaign strategy above.",
      agent: "Content Pipeline",
      badge: "Next Step ⚡",
      color: "var(--color-warning)"
    });
    dynamic.push({
      title: "Propose A/B Test Metric Variations",
      prompt: "Design 3 specific A/B testing variants and KPI metrics to measure the projected revenue recovery for this campaign framework.",
      agent: "Strategy Pipeline",
      badge: "Deep Dive 🎯",
      color: "var(--color-purple)"
    });
  } else if (lastBotMsg?.data?.content) {
    dynamic.push({
      title: "Adapt Copy for VIP Platinum Members",
      prompt: "Adapt this email copy into an exclusive private preview invitation for our Platinum Crazy Club loyalty members with double points.",
      agent: "Content Pipeline",
      badge: "Iteration ✍️",
      color: "var(--color-warning)"
    });
    dynamic.push({
      title: "Check Target Audience in BigQuery",
      prompt: "Query BigQuery to check how many active customers have app_open or newsletter_signup events in the last 30 days.",
      agent: "Analytics Agent",
      badge: "Validation 📊",
      color: "var(--color-success)"
    });
  } else if (lastBotMsg?.content?.includes("BigQuery") || lastBotMsg?.content?.includes("EUR") || lastBotMsg?.data?.analytics_data) {
    dynamic.push({
      title: "Convert Findings into Campaign Strategy",
      prompt: "Based on these customer metrics, formulate a 3-pillar omnichannel strategy with channel mix percentages summing to 100%.",
      agent: "Strategy Pipeline",
      badge: "Next Step 🎯",
      color: "var(--color-purple)"
    });
    dynamic.push({
      title: "Drill Deeper into Basket Size by Channel",
      prompt: "Query customer transactions to breakdown average basket size in EUR across Online, In-Store, and App channels.",
      agent: "Analytics Agent",
      badge: "Deep Dive 📊",
      color: "var(--color-success)"
    });
  }

  const staticFallbacks = [
    {
      title: "Compare RFM Segments in BigQuery",
      prompt: "Query BigQuery to compare 'VIP Fashionistas' and 'Dormant At-Risk': customer count, average recency in days, and total monetary value in EUR.",
      agent: "Analytics Agent",
      badge: "Discovery 📊",
      color: "var(--color-success)"
    },
    {
      title: "Garment Recycling & Circular Points",
      prompt: "Write circular sustainability copy encouraging customers to bring old clothes to stores for double Crazy Club points. Include email and Instagram post.",
      agent: "Content Pipeline",
      badge: "Brand Voice 🌿",
      color: "var(--color-warning)"
    },
    {
      title: "End-to-End Retention Campaign",
      prompt: "Run an end-to-end campaign: Query BigQuery for Dormant At-Risk metrics -> generate 3-pillar retention strategy -> produce creative email, social, and SMS copy.",
      agent: "Multi-Agent Orchestrator",
      badge: "Full Pipeline 🚀",
      color: "#3b82f6"
    },
    {
      title: "Cart Abandonment vs Purchase Analysis",
      prompt: "Analyze customer behavioral events in BigQuery: count 'cart_abandon' vs 'purchase' events broken down by channel (Online, App, In-Store).",
      agent: "Analytics Agent",
      badge: "Analytics 🛒",
      color: "var(--color-success)"
    },
    {
      title: "Autumn Collection Creative Suite",
      prompt: "Craft creative campaign assets for the Autumn Knitwear drop: email template (subject, preview, body, CTA), 2 Instagram posts, and SMS under 160 characters.",
      agent: "Content Pipeline",
      badge: "Creative 🍂",
      color: "var(--color-warning)"
    },
    {
      title: "VIP Crazy Club Points Push",
      prompt: "Analyze Platinum & Gold VIP loyalty tiers in BigQuery and generate an exclusive VIP Crazy Club rewards campaign with email CTA and SMS.",
      agent: "Multi-Agent Orchestrator",
      badge: "VIP Club 👑",
      color: "var(--color-primary)"
    }
  ];

  const combined = [...dynamic, ...staticFallbacks];
  if (shuffleSeed > 0) {
    const shift = shuffleSeed % combined.length;
    return combined.slice(shift).concat(combined.slice(0, shift));
  }
  return combined;
}

export default function ChatInterface({
  messages,
  setMessages,
  clearMessages,
  sessionId,
  setSessionId,
  userId,
  activeClient,
  activeClientId = 'crazy_fashion'
}) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTrace, setCurrentTrace] = useState([]);
  const [currentArmor, setCurrentArmor] = useState({ passed: true });
  const [selectedCategory, setSelectedCategory] = useState('recommended');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedAt, setAiGeneratedAt] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveSteps, setLiveSteps] = useState([]);
  const [expandedStepMsgIdx, setExpandedStepMsgIdx] = useState(null);
  const messageContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading, liveSteps]);

  const handleGenerateAiSuggestions = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/suggestions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: activeClientId,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            data: m.data ? {
              strategy: m.data.strategy ? { campaign_title: m.data.strategy.campaign_title } : null,
              content: !!m.data.content,
              analytics_data: !!m.data.analytics_data,
              sql_executed: !!m.data.sql_executed
            } : null
          }))
        })
      });
      if (!res.ok) throw new Error('Failed to generate suggestions');
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setAiSuggestions(data.questions);
        setAiGeneratedAt(new Date().toLocaleTimeString());
        setSelectedCategory('recommended');
      }
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const activeQuestions = useMemo(() => {
    if (selectedCategory === 'recommended') {
      if (aiSuggestions && aiSuggestions.length > 0) {
        if (shuffleSeed > 0) {
          const shift = shuffleSeed % aiSuggestions.length;
          return aiSuggestions.slice(shift).concat(aiSuggestions.slice(0, shift));
        }
        return aiSuggestions;
      }
      return getDynamicRecommendations(messages, shuffleSeed);
    }
    const list = CATEGORY_QUESTIONS[selectedCategory] || [];
    if (shuffleSeed > 0) {
      const shift = shuffleSeed % list.length;
      return list.slice(shift).concat(list.slice(0, shift));
    }
    return list;
  }, [selectedCategory, messages, shuffleSeed, aiSuggestions]);

  const currentCategoryObj = OBJECTIVE_CATEGORIES.find(c => c.id === selectedCategory);

  const handleSelectQuestion = (questionObj) => {
    setPrompt(questionObj.prompt);
    // Smoothly focus input without causing viewport or container jumps
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 30);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    const sendPrompt = prompt;
    setPrompt('');
    setLoading(true);

    const isExistingSession = Boolean(sessionId);
    const initialStep = {
      id: 'step_init',
      timestamp: new Date().toLocaleTimeString(),
      stage: 'orchestrating',
      agent: 'marketing_orchestrator',
      agent_name: 'Orchestrator Agent (A2A Supervisor)',
      title: isExistingSession ? 'A2A Multi-Agent Supervisor (Active Session)' : 'A2A Multi-Agent Supervisor Initialized',
      detail: isExistingSession ? 'Continuing active session. Evaluating follow-up context and routing path...' : 'Analyzing user objective intent and evaluating optimal routing path...',
      status: 'running',
      icon: 'cpu'
    };
    setLiveSteps([initialStep]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sendPrompt,
          session_id: sessionId,
          user_id: userId,
          client_id: activeClientId
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: Stream connection failed`);
      }

      const reader = response.body.getReader();
      const decoder = new window.TextDecoder();
      let buffer = '';
      let finalPayload = null;
      let accumulatedSteps = [initialStep];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'step' && event.step) {
              accumulatedSteps = [...accumulatedSteps.filter(s => s.id !== event.step.id), event.step];
              setLiveSteps(prev => {
                const exists = prev.some(s => s.id === event.step.id);
                if (exists) {
                  return prev.map(s => s.id === event.step.id ? event.step : s);
                }
                return [...prev, event.step];
              });
            } else if (event.type === 'final') {
              finalPayload = event.data;
              if (event.session_id && setSessionId) {
                setSessionId(event.session_id);
              }
              if (event.steps && event.steps.length > 0) {
                accumulatedSteps = event.steps;
              }
            }
          } catch (err) {
            console.warn('Error parsing SSE event chunk:', err);
          }
        }
      }

      if (finalPayload) {
        setLoading(false);
        if (finalPayload.session_id && setSessionId) {
          setSessionId(finalPayload.session_id);
        }
        setCurrentTrace(finalPayload.a2a_trace || []);
        setCurrentArmor(finalPayload.model_armor || { passed: true });

        const botMsg = {
          role: 'assistant',
          content: finalPayload.summary || finalPayload.error || 'Request completed.',
          data: finalPayload,
          a2a_trace: finalPayload.a2a_trace || [],
          model_armor: finalPayload.model_armor || { passed: true },
          steps: finalPayload.steps || accumulatedSteps
        };
        setMessages(prev => [...prev, botMsg]);
        setLiveSteps([]);
      } else {
        throw new Error('Stream concluded without final response payload');
      }
    } catch (streamErr) {
      console.warn('Streaming error, falling back to standard POST /api/chat:', streamErr);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sendPrompt, session_id: sessionId, user_id: userId })
      })
        .then(async res => {
          const contentType = res.headers.get('content-type') || '';
          if (!res.ok || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Server returned status ${res.status}: ${text.substring(0, 100)}`);
          }
          return res.json();
        })
        .then(data => {
          setLoading(false);
          if (data.session_id && setSessionId) {
            setSessionId(data.session_id);
          }
          setCurrentTrace(data.a2a_trace || []);
          setCurrentArmor(data.model_armor || { passed: true });

          const botMsg = {
            role: 'assistant',
            content: data.summary || data.error || 'Request completed.',
            data: data,
            a2a_trace: data.a2a_trace || [],
            model_armor: data.model_armor || { passed: true },
            steps: data.steps || liveSteps
          };
          setMessages(prev => [...prev, botMsg]);
          setLiveSteps([]);
        })
        .catch(err => {
          setLoading(false);
          setLiveSteps([]);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Agent Gateway Notification: ' + err.message }]);
        });
    }
  };

  const chatContent = (
    <div className="glass-panel" style={{
      flex: 1,
      maxWidth: isExpanded ? '1400px' : 'none',
      width: '100%',
      margin: isExpanded ? '0 auto' : '0',
      padding: isExpanded ? '1.2rem 1.6rem' : '1.2rem',
      gap: '1rem',
      overflow: 'hidden',
      minHeight: 0,
      boxShadow: isExpanded ? '0 20px 50px rgba(0, 0, 0, 0.14)' : undefined
    }}>
      {/* Chat Control Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>Multi-Agent Marketing Assistant</span>
          {sessionId && (
            <span
              title={`Active Agent Runtime Session ID: ${sessionId}\nPersists across follow-up queries until cleared or reloaded.`}
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.1rem 0.45rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Session: {sessionId.length > 14 ? `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}` : sessionId}
            </span>
          )}
          {isExpanded && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: 'rgba(37, 99, 235, 0.09)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              padding: '0.12rem 0.45rem',
              borderRadius: '10px'
            }}>
              Expanded Focus Mode
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={clearMessages}
            disabled={loading || messages.length <= 1}
            title="Clear chat history"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: messages.length <= 1 ? 'not-allowed' : 'pointer',
              opacity: messages.length <= 1 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { if (messages.length > 1) { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Trash2 size={13} />
            Clear Chat
          </button>

          {/* Fullscreen Expand / Minimize View Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            title={isExpanded ? "Exit Fullscreen Focus View (Esc)" : "Expand chat to cover the entire view"}
            style={{
              background: isExpanded ? (activeClient?.header_gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-purple))') : 'var(--bg-secondary)',
              border: isExpanded ? 'none' : '1px solid var(--border-color)',
              color: isExpanded ? '#ffffff' : 'var(--text-main)',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: isExpanded ? `0 2px 8px ${activeClient?.primary_color || 'rgba(37, 99, 235, 0.3)'}50` : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              if (!isExpanded) {
                e.currentTarget.style.borderColor = activeClient?.primary_color || 'var(--color-primary)';
                e.currentTarget.style.color = activeClient?.primary_color || 'var(--color-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!isExpanded) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isExpanded ? 'Exit Fullscreen' : 'Expand View'}</span>
            {isExpanded && (
              <span style={{ fontSize: '0.62rem', opacity: 0.85, background: 'rgba(255,255,255,0.2)', padding: '0.05rem 0.3rem', borderRadius: '4px', marginLeft: '0.15rem' }}>ESC</span>
            )}
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div ref={messageContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '0.4rem', minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: isExpanded ? '85%' : '92%',
              width: msg.role === 'user' ? 'auto' : '100%',
              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--color-primary), #2b6cb0)' : 'var(--panel-bg)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
              padding: '1rem 1.2rem',
              borderRadius: '14px',
              fontSize: '0.88rem',
              lineHeight: '1.6',
              boxShadow: msg.role === 'user' ? '0 4px 15px rgba(66,133,244,0.3)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, color: msg.role === 'user' ? '#ffffff' : 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {msg.role === 'user' ? 'You' : <><Cpu size={14} /> Orchestrator Agent (A2A Supervisor)</>}
                </span>
                {msg.model_armor && !msg.model_armor.passed && (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700, background: 'rgba(234,67,53,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ⛔ MODEL ARMOR BLOCKED
                  </span>
                )}
              </div>

              <div className="markdown-body" style={{ color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)' }}>
                <MarkdownRenderer content={msg.content} isUser={msg.role === 'user'} />
              </div>

              {/* A2UI Dynamic Offer Banner (ICA Sweden Retail Personalization) */}
              {msg.role === 'assistant' && i > 0 && (
                msg.data?.a2ui ||
                (msg.content && (
                  msg.content.toLowerCase().includes('a2ui') ||
                  msg.content.toLowerCase().includes('ladda till kortet') ||
                  msg.content.toLowerCase().includes('erbjudandebanner') ||
                  (msg.content.toLowerCase().includes('stammis') && msg.content.toLowerCase().includes('erbjudande'))
                ))
              ) && (
                <A2UIOfferBanner data={msg.data?.a2ui || {}} />
              )}

              {/* Product Recommendation Output Card */}
              {msg.data?.recommendation && Object.keys(msg.data.recommendation).length > 0 && (
                <div style={docBoxStyle('#10b981')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(16,185,129,0.25)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShoppingBag size={14} /> Curated 5-Product Assortment (Product Recommender)
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      {msg.data.recommendation.target_segment || 'Target Cohort'}
                    </span>
                  </div>

                  {msg.data.recommendation.segment_profile_summary && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.3rem 0', lineHeight: '1.45' }}>
                      <strong>Cohort Insights:</strong> {msg.data.recommendation.segment_profile_summary}
                    </p>
                  )}

                  {msg.data.recommendation.overall_curation_strategy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '0.4rem 0.7rem', borderRadius: '6px', margin: '0.3rem 0 0.6rem 0' }}>
                      <TrendingUp size={13} />
                      <span><strong>Merchandising Strategy:</strong> {msg.data.recommendation.overall_curation_strategy}</span>
                    </div>
                  )}

                  {/* 5-Product Recommendation Grid */}
                  {Array.isArray(msg.data.recommendation.recommended_products) && msg.data.recommendation.recommended_products.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Tag size={13} color="#10b981" /> 5 Tailored Product Highlights:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                        {msg.data.recommendation.recommended_products.map((prod, pIdx) => (
                          <div key={pIdx} style={{ background: 'var(--code-bg)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {prod.product_name}
                              </span>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                €{typeof prod.price_eur === 'number' ? prod.price_eur.toFixed(2) : prod.price_eur}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: 'var(--chip-bg)', padding: '0.1rem 0.35rem', borderRadius: '4px', color: 'var(--text-dim)' }}>
                                {prod.product_id}
                              </span>
                              <span style={{ fontSize: '0.65rem', background: 'rgba(37,99,235,0.1)', color: 'var(--color-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                {prod.category}
                              </span>
                              {prod.sustainability_certified && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                  🌿 Eco-Certified
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: '1.4' }}>
                              {prod.recommendation_reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Strategy Output Card */}
              {msg.data?.strategy && Object.keys(msg.data.strategy).length > 0 && (
                <div style={docBoxStyle('var(--color-purple)')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(161,66,244,0.25)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={14} /> Campaign Strategy Framework (Gemini 3.6 Flash)
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(161,66,244,0.15)', color: 'var(--color-purple)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      {msg.data.strategy.target_cohort}
                    </span>
                  </div>

                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: '0.4rem 0 0.2rem 0' }}>
                    {msg.data.strategy.campaign_title}
                  </strong>

                  {msg.data.strategy.projected_revenue_recovery && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-success)', background: 'rgba(52,168,83,0.12)', padding: '0.4rem 0.7rem', borderRadius: '6px', width: 'fit-content' }}>
                      <TrendingUp size={14} />
                      <strong>Projected Recovery:</strong> {msg.data.strategy.projected_revenue_recovery}
                    </div>
                  )}

                  {/* Campaign Pillars */}
                  {Array.isArray(msg.data.strategy.campaign_pillars) && msg.data.strategy.campaign_pillars.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Campaign Pillars:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        {msg.data.strategy.campaign_pillars.map((pil, pIdx) => {
                          const channelsList = Array.isArray(pil.channels)
                            ? pil.channels
                            : typeof pil.channels === 'string'
                              ? pil.channels.split(',').map(c => c.trim())
                              : [];
                          return (
                            <div key={pIdx} style={{ background: 'var(--code-bg)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{pil.pillar}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>{pil.description}</div>
                              {channelsList.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.3rem' }}>
                                  {channelsList.map((ch, cIdx) => (
                                    <span key={cIdx} style={{ fontSize: '0.65rem', background: 'rgba(66,133,244,0.15)', color: 'var(--color-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                      {ch}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* A/B Hypotheses */}
                  {Array.isArray(msg.data.strategy.ab_testing_hypotheses) && msg.data.strategy.ab_testing_hypotheses.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>A/B Testing Hypotheses:</span>
                      <ul style={{ margin: '0.2rem 0 0 1rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {msg.data.strategy.ab_testing_hypotheses.map((hyp, hIdx) => (
                          <li key={hIdx} style={{ marginBottom: '0.2rem' }}>{hyp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Content Creative Card */}
              {msg.data?.content?.generated_assets && Object.keys(msg.data.content.generated_assets).length > 0 && (
                <div style={docBoxStyle('var(--color-success)')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(52,168,83,0.25)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={14} /> Creative Content Assets (Brand Voice Craft)
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(52,168,83,0.15)', color: 'var(--color-success)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                      {msg.data.content.campaign_title || 'Omnichannel Assets'}
                    </span>
                  </div>

                  {/* Email Template Asset */}
                  {msg.data.content.generated_assets.email_template && (
                    <div style={{ background: 'var(--code-bg)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(52,168,83,0.25)', marginTop: '0.6rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                        <Mail size={13} /> Email Template Asset
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Subject: {msg.data.content.generated_assets.email_template.subject}
                      </div>
                      {msg.data.content.generated_assets.email_template.preview_text && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                          Preview: {msg.data.content.generated_assets.email_template.preview_text}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--chip-bg)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {msg.data.content.generated_assets.email_template.body}
                      </div>
                      {msg.data.content.generated_assets.email_template.cta_button && (
                        <button style={{
                          marginTop: '0.6rem',
                          background: 'linear-gradient(135deg, var(--color-success), var(--color-primary))',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}>
                          👉 {msg.data.content.generated_assets.email_template.cta_button}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Social Media Posts */}
                  {Array.isArray(msg.data.content.generated_assets.social_posts) && msg.data.content.generated_assets.social_posts.length > 0 && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                        <Share2 size={13} color="var(--color-primary)" /> Social Media Copy (LinkedIn & X)
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        {msg.data.content.generated_assets.social_posts.map((sp, sIdx) => (
                          <div key={sIdx} style={{ background: 'var(--code-bg)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)' }}>{sp.platform}</span>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{sp.copy}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SMS / Mobile Push Copy Asset */}
                  {msg.data.content.generated_assets.sms_copy && (
                    <div style={{ background: 'var(--code-bg)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(52,168,83,0.25)', marginTop: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MessageSquare size={13} /> SMS / Mobile Push Asset
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {msg.data.content.generated_assets.sms_copy.length} / 160 chars
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', background: 'var(--chip-bg)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                        📱 {msg.data.content.generated_assets.sms_copy}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Background Activity & Skill Trace Accordion */}
              {msg.role === 'assistant' && ((msg.steps && msg.steps.length > 0) || (msg.data?.steps && msg.data.steps.length > 0)) && (() => {
                const stepList = msg.steps || msg.data?.steps || [];
                return (
                  <div style={{ marginTop: '0.7rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedStepMsgIdx(prev => prev === i ? null : i)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Zap size={12} color="var(--color-primary)" />
                      <span>{stepList.length} Background Execution Steps & Skill Calls</span>
                      {expandedStepMsgIdx === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {expandedStepMsgIdx === i && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.55rem' }}>
                        {stepList.map((step, sIdx) => {
                          const theme = getAgentTheme(step.agent, step.agent_name);
                          return (
                            <div key={sIdx} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.65rem',
                              background: theme.bg,
                              border: `1px solid ${theme.border}`,
                              borderLeft: `4px solid ${theme.borderLeft}`,
                              borderRadius: '7px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.72rem',
                              transition: 'all 0.2s ease'
                            }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: theme.badgeBg,
                                color: theme.color,
                                border: `1px solid ${theme.badgeBorder}`,
                                flexShrink: 0,
                                marginTop: '0.05rem'
                              }}>
                                {step.icon === 'database' && <Database size={12} />}
                                {step.icon === 'shopping-bag' && <ShoppingBag size={12} />}
                                {step.icon === 'trending-up' && <TrendingUp size={12} />}
                                {step.icon === 'mail' && <Mail size={12} />}
                                {step.icon === 'terminal' && <Terminal size={12} />}
                                {step.icon === 'shield' && <Shield size={12} />}
                                {step.icon === 'file-text' && <FileText size={12} />}
                                {(!step.icon || step.icon === 'cpu' || step.icon === 'check') && <CheckCircle2 size={12} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{
                                      fontSize: '0.64rem',
                                      fontWeight: 700,
                                      background: theme.badgeBg,
                                      color: theme.color,
                                      border: `1px solid ${theme.badgeBorder}`,
                                      padding: '0.06rem 0.35rem',
                                      borderRadius: '3px'
                                    }}>
                                      {step.agent_name || theme.name}
                                    </span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{step.title}</span>
                                  </div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{step.timestamp}</span>
                                </div>
                                {step.detail && (
                                  <div style={{
                                    color: 'var(--text-muted)',
                                    marginTop: '0.18rem',
                                    fontSize: '0.7rem',
                                    fontFamily: step.stage === 'tool_call' ? 'var(--font-mono)' : 'inherit',
                                    lineHeight: '1.4'
                                  }}>
                                    {step.detail}
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
                                  {step.skill && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 700,
                                      background: theme.badgeBg,
                                      color: theme.color,
                                      border: `1px solid ${theme.badgeBorder}`,
                                      padding: '0.06rem 0.35rem',
                                      borderRadius: '3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      <Zap size={10} /> Skill: {step.skill}
                                    </span>
                                  )}
                                  {step.tool && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 700,
                                      background: 'rgba(0, 0, 0, 0.04)',
                                      color: 'var(--text-muted)',
                                      border: '1px solid var(--border-color)',
                                      padding: '0.06rem 0.35rem',
                                      borderRadius: '3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontFamily: 'var(--font-mono)'
                                    }}>
                                      <Terminal size={10} /> Tool: {step.tool}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        ))}

        {/* Live Background Activity Indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            padding: '1rem 1.2rem',
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header with live pulse dot & summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  boxShadow: '0 0 10px var(--color-primary)',
                  display: 'inline-block',
                  animation: 'pulse-dot 1.5s infinite'
                }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Cpu size={15} color="var(--color-primary)" />
                  Multi-Agent Live Execution & Skill Trace
                </span>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(37, 99, 235, 0.08)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '0.12rem 0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Sparkles size={11} className="spin" />
                {liveSteps.length} Step{liveSteps.length > 1 ? 's' : ''} Active
              </span>
            </div>

            {/* Stepper Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {liveSteps.map((step, sIdx) => {
                const isLatest = sIdx === liveSteps.length - 1;
                const theme = getAgentTheme(step.agent, step.agent_name);
                return (
                  <div key={step.id || sIdx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.6rem 0.8rem',
                    background: isLatest ? theme.activeBg : theme.bg,
                    borderRadius: '8px',
                    border: `1px solid ${isLatest ? theme.activeBorder : theme.border}`,
                    borderLeft: `4px solid ${theme.borderLeft}`,
                    boxShadow: isLatest ? `0 2px 12px ${theme.glow}` : 'none',
                    transition: 'all 0.25s ease',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: theme.badgeBg,
                      color: theme.color,
                      border: `1px solid ${theme.badgeBorder}`,
                      flexShrink: 0,
                      marginTop: '0.05rem'
                    }}>
                      {step.icon === 'database' && <Database size={13} />}
                      {step.icon === 'shopping-bag' && <ShoppingBag size={13} />}
                      {step.icon === 'trending-up' && <TrendingUp size={13} />}
                      {step.icon === 'mail' && <Mail size={13} />}
                      {step.icon === 'terminal' && <Terminal size={13} />}
                      {step.icon === 'shield' && <Shield size={13} />}
                      {step.icon === 'file-text' && <FileText size={13} />}
                      {step.icon === 'check' && <CheckCircle2 size={13} />}
                      {(!step.icon || step.icon === 'cpu') && <Cpu size={13} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            background: theme.badgeBg,
                            color: theme.color,
                            border: `1px solid ${theme.badgeBorder}`,
                            padding: '0.08rem 0.4rem',
                            borderRadius: '4px',
                            letterSpacing: '0.01em'
                          }}>
                            {step.agent_name || theme.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {step.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {step.timestamp}
                        </span>
                      </div>

                      {step.detail && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.2rem',
                          lineHeight: '1.45',
                          fontFamily: step.stage === 'tool_call' ? 'var(--font-mono)' : 'inherit'
                        }}>
                          {step.detail}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                        {step.skill && (
                          <span style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            background: theme.badgeBg,
                            color: theme.color,
                            border: `1px solid ${theme.badgeBorder}`,
                            padding: '0.08rem 0.4rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Zap size={10} /> Skill: {step.skill}
                          </span>
                        )}
                        {step.tool && (
                          <span style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            background: 'rgba(0, 0, 0, 0.05)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            padding: '0.08rem 0.4rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            <Terminal size={10} /> Tool: {step.tool}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginTop: '0.15rem' }}>
                      {isLatest ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: theme.color, fontWeight: 700 }}>
                          <Sparkles size={12} className="spin" />
                          In Progress
                        </span>
                      ) : (
                        <CheckCircle2 size={15} color={theme.color} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Objective Steering & Follow-Up Accordion */}
      <details style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}>
        <summary style={{
          fontSize: '0.78rem',
          color: 'var(--text-main)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '0.7rem 1rem',
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ fontSize: '0.95rem' }}>💡</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Objective Steering & Interactive Suggestions</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              background: `${activeClient?.primary_color || 'rgba(37, 99, 235, 0.08)'}18`,
              color: activeClient?.primary_color || 'var(--color-primary)',
              border: `1px solid ${activeClient?.primary_color || 'rgba(37, 99, 235, 0.2)'}35`,
              padding: '0.12rem 0.5rem',
              borderRadius: '12px'
            }}>
              {activeQuestions.length} Available
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              disabled={generatingAI}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleGenerateAiSuggestions();
              }}
              title="Call Gemini 3.6 Flash on Vertex AI to generate 6 live contextual follow-up questions"
              style={{
                background: activeClient?.header_gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-purple))',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                cursor: generatingAI ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: `0 2px 8px ${activeClient?.primary_color || 'rgba(37, 99, 235, 0.25)'}40`,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!generatingAI) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <Sparkles size={12} className={generatingAI ? 'spin' : ''} />
              {generatingAI ? 'Generating with Gemini...' : '✨ Generate AI Follow-ups'}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShuffleSeed(prev => prev + 1);
              }}
              title="Shuffle & rotate suggestions"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = activeClient?.primary_color || 'var(--color-primary)'; e.currentTarget.style.borderColor = activeClient?.primary_color || 'var(--color-primary)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            >
              <Shuffle size={12} />
              Shuffle
            </button>
          </div>
        </summary>

        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)' }}>
          {/* Category Steering Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {OBJECTIVE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const catHighlight = (cat.id === 'recommended' || cat.id === 'campaign' || cat.id === 'a2ui')
                ? (activeClient?.primary_color || cat.color)
                : cat.color;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 600,
                    background: isSelected
                      ? ((cat.id === 'recommended' || cat.id === 'campaign') ? (activeClient?.header_gradient || catHighlight) : catHighlight)
                      : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    border: isSelected ? `1px solid ${catHighlight}` : '1px solid var(--border-color)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: isSelected ? `0 2px 8px ${catHighlight}40` : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={12} color={isSelected ? '#ffffff' : catHighlight} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Category Description Banner */}
          <div style={{
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${currentCategoryObj?.color || activeClient?.primary_color || 'var(--color-primary)'}`,
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <span>
              {selectedCategory === 'recommended' && aiGeneratedAt ? (
                <strong style={{ color: 'var(--color-primary)' }}>
                  ✨ 6 Contextual Follow-up Questions Generated by Gemini 3.6 Flash at {aiGeneratedAt} based on your conversation history.
                </strong>
              ) : (
                currentCategoryObj?.desc
              )}
            </span>
            {selectedCategory === 'recommended' && (
              <button
                type="button"
                disabled={generatingAI}
                onClick={handleGenerateAiSuggestions}
                style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  borderRadius: '6px',
                  color: 'var(--color-primary)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  cursor: generatingAI ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Sparkles size={11} className={generatingAI ? 'spin' : ''} />
                {generatingAI ? 'Calling Gemini...' : aiSuggestions ? 'Regenerate with Gemini' : 'Generate with Gemini'}
              </button>
            )}
          </div>

          {/* Granular Questions Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(360px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.6rem',
            maxHeight: isExpanded ? '280px' : '230px',
            overflowY: 'auto',
            padding: '2px',
            paddingRight: '0.3rem'
          }}>
            {activeQuestions.map((q, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectQuestion(q)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  position: 'relative'
                }}
                className="prompt-chip"
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>▸</span> {q.title}
                  </span>
                  <span style={{
                    fontSize: '0.63rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '5px',
                    background: 'rgba(37, 99, 235, 0.07)',
                    color: q.color || 'var(--color-primary)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    {q.badge || q.agent}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.71rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {q.prompt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.1rem', fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    Populate <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your marketing objective (e.g. 'Analyze churn risk and generate campaign strategy')..."
          style={{
            flex: 1,
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '12px',
            padding: '0.8rem 1.1rem',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={e => e.target.style.borderColor = activeClient?.primary_color || 'var(--color-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            background: activeClient?.header_gradient || 'linear-gradient(135deg, var(--color-primary), var(--color-purple))',
            border: 'none',
            borderRadius: '12px',
            padding: '0.8rem 1.4rem',
            color: '#ffffff',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 15px ${activeClient?.primary_color || 'rgba(66, 133, 244, 0.4)'}50`,
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );

  if (isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-primary)',
        padding: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {chatContent}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 440px)',
      gap: '1.2rem',
      height: '100%',
      width: '100%',
      minHeight: 0
    }}>
      {/* Left Chat Column */}
      {chatContent}

      {/* Right Column: Live A2A Visualizer */}
      <div className="glass-panel" style={{ overflow: 'hidden', minHeight: 0 }}>
        <AgentGraphVisualizer a2aTrace={currentTrace} modelArmor={currentArmor} />
      </div>
    </div>
  );
}

function docBoxStyle(color) {
  return {
    marginTop: '0.8rem',
    background: 'var(--panel-bg)',
    border: `1px solid ${color}`,
    borderRadius: '10px',
    padding: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  };
}

function dedentCode(code) {
  if (!code) return '';
  const lines = code.split('\n');
  let minIndent = null;
  lines.forEach(line => {
    if (line.trim().length > 0) {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      if (minIndent === null || indent < minIndent) {
        minIndent = indent;
      }
    }
  });
  if (minIndent && minIndent > 0) {
    return lines.map(line => (line.length >= minIndent ? line.slice(minIndent) : line)).join('\n');
  }
  return code;
}

function MarkdownRenderer({ content, isUser }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.8rem 0 0.4rem', color: isUser ? '#fff' : 'var(--text-main)', borderBottom: isUser ? 'none' : '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>{children}</h3>
        ),
        h2: ({ children }) => (
          <h3 style={{ fontSize: '1.0rem', fontWeight: 700, margin: '0.8rem 0 0.4rem', color: isUser ? '#fff' : 'var(--text-main)', borderBottom: isUser ? 'none' : '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.7rem 0 0.3rem', color: isUser ? '#fff' : 'var(--text-main)' }}>{children}</h4>
        ),
        h4: ({ children }) => (
          <h5 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0.5rem 0 0.2rem', color: isUser ? '#fff' : 'var(--color-primary)' }}>{children}</h5>
        ),
        p: ({ children }) => (
          <p style={{ margin: '0.3rem 0', lineHeight: '1.65' }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: '0.3rem 0', paddingLeft: '1.4rem', listStyleType: 'disc' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: '0.3rem 0', paddingLeft: '1.4rem' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ margin: '0.15rem 0', lineHeight: '1.6' }}>{children}</li>
        ),
        hr: () => (
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.6rem 0' }} />
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 700, color: isUser ? '#fff' : 'var(--text-main)' }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic', color: isUser ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>{children}</em>
        ),
        code: ({ inline, className, children }) => {
          const codeStr = String(children).replace(/\n$/, '');
          if (inline) {
            return (
              <code style={{ background: 'var(--chip-bg)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--color-primary)' }}>{codeStr}</code>
            );
          }
          const lang = (className || '').replace('language-', '');
          const isSql = lang === 'sql' || codeStr.toUpperCase().includes('SELECT');
          // Only SQL gets the collapsible accordion
          if (isSql) {
            const cleanCode = dedentCode(codeStr);
            return (
              <details style={{
                background: 'var(--code-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '0.6rem',
                marginBottom: '0.6rem',
                overflow: 'hidden'
              }}>
                <summary style={{
                  padding: '0.6rem 0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'var(--chip-bg)',
                  userSelect: 'none',
                  outline: 'none'
                }}>
                  🔍 View Executed BigQuery SQL Query
                </summary>
                <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid var(--border-color)', overflowX: 'auto' }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    whiteSpace: 'pre',
                    textAlign: 'left'
                  }}>
                    <code>{cleanCode}</code>
                  </pre>
                </div>
              </details>
            );
          }
          // Non-SQL code: render as simple styled inline code
          return (
            <code style={{ background: 'var(--chip-bg)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--color-primary)' }}>{codeStr}</code>
          );
        },
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th style={{ textAlign: 'left', padding: '0.5rem 0.7rem', borderBottom: '2px solid var(--border-color)', fontWeight: 700, color: 'var(--text-main)', background: 'var(--chip-bg)' }}>{children}</th>
        ),
        td: ({ children }) => (
          <td style={{ padding: '0.4rem 0.7rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '0.8rem', margin: '0.4rem 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
