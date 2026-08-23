import { 
  Shirt, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap
} from 'lucide-react';

export const CLIENTS_METADATA = [
  {
    client_id: 'crazy_fashion',
    client_name: 'Crazy Fashion',
    tagline: 'Nordic Trend & Sustainable Apparel Retailer',
    industry: 'Fashion & Apparel Retail',
    currency_symbol: '€',
    currency_code: 'EUR',
    loyalty_program_name: 'Crazy Club',
    bigquery_dataset: 'marketing_analytics',
    primary_color: '#4f46e5',
    accent_color: '#7c3aed',
    header_gradient: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
    badge_color: 'rgba(79, 70, 229, 0.12)',
    logo_icon: Shirt,
    headquarters: 'Stockholm, Sweden',
    annual_revenue: '€22.3B',
    store_count: '3,247 stores',
    customer_count: '78M customers',
    sku_count: '50 Fashion SKUs',
    description: 'Specialized in trend-forward womenswear, menswear, and circular fashion across 45 markets with EUR-denominated transaction analytics.',
    badge_tags: ['Apparel & Footwear', 'Circular Fashion', 'EUR Currency (€)', 'Crazy Club Loyalty', '5 BigQuery Tables'],
    key_features: [
      '5 BigQuery Fashion Customer & Event Tables',
      'Crazy Club Loyalty Tier Segmentation (Bronze/Silver/Gold/Platinum)',
      '5-Product Merchandising Assortment Recommender',
      'Nordic Brand Voice Email, Social & SMS Copy Generation'
    ],
    sample_prompt: 'Recommend 5 premium, sustainability-certified pieces for our VIP Fashionistas cohort with EUR pricing and styling rationale.'
  },
  {
    client_id: 'ica_sweden',
    client_name: 'ICA Sverige',
    tagline: 'Nordic Food, Grocery & Health Retail Leader',
    industry: 'Grocery, Food & Health Retail',
    currency_symbol: 'kr',
    currency_code: 'SEK',
    loyalty_program_name: 'ICA Stammis',
    bigquery_dataset: 'marketing_analytics_ica',
    primary_color: '#E01E26',
    accent_color: '#FFE600',
    header_gradient: 'linear-gradient(135deg, #E01E26 0%, #B81319 100%)',
    badge_color: 'rgba(224, 30, 38, 0.12)',
    logo_icon: ShoppingBag,
    headquarters: 'Solna, Stockholm, Sweden',
    annual_revenue: 'SEK 146.5B',
    store_count: '~1,300 stores',
    customer_count: '5.2M Stammisar',
    sku_count: '50 Grocery SKUs',
    description: "Sweden's grocery market leader with ICA Maxi, Kvantum, Supermarket, Nära, Apotek Hjärtat, and ML-driven Stammis personalized app offers.",
    badge_tags: ['Grocery & Fresh Food', 'KRAV & Eko Produce', 'SEK Currency (kr)', 'ICA Stammis Loyalty', 'A2UI Deal Banners'],
    key_features: [
      '5 BigQuery Swedish Grocery Customer & Event Tables',
      'ICA Stammis Loyalty Program & Personal Receipt History',
      'Declarative A2UI Offer Banners (Interactive Card Loading)',
      'Swedish Food Tone (Matglädje, Klipp, Receptförslag & Självscanning)'
    ],
    sample_prompt: 'Generate an A2UI personalized deal banner for ICA Sweden targeting the Ekologiskt Medveten persona with Stammis loyalty pricing.'
  }
];

/**
 * ClientWorkspaceSelector: Landing page and modal overlay for selecting the active client context.
 */
export default function ClientWorkspaceSelector({ activeClientId, onSelectClient, isModal = false, onClose = () => {} }) {
  return (
    <div style={{
      position: isModal ? 'fixed' : 'relative',
      inset: isModal ? 0 : 'auto',
      zIndex: isModal ? 10000 : 1,
      background: isModal ? 'rgba(15, 23, 42, 0.85)' : 'var(--bg-primary, #f8f9fa)',
      backdropFilter: isModal ? 'blur(10px)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      minHeight: isModal ? '100vh' : 'calc(100vh - 120px)',
      overflowY: 'auto',
      animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1080px',
        width: '100%',
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #dadce0)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
        padding: '2.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
        position: 'relative'
      }}>
        {/* Close Button if Modal */}
        {isModal && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'var(--bg-secondary, #f1f3f4)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: 'var(--text-muted, #5f6368)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            ✕
          </button>
        )}

        {/* Header Hero */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(37, 99, 235, 0.08)',
            color: 'var(--color-primary, #2563eb)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            padding: '0.25rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.8rem'
          }}>
            <Sparkles size={13} />
            <span>Multi-Tenant Enterprise Context Engine</span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display, 'Google Sans', sans-serif)",
            fontSize: '1.9rem',
            fontWeight: 800,
            color: 'var(--text-main, #111827)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0'
          }}>
            Select Client Workspace
          </h1>

          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-muted, #5f6368)',
            lineHeight: 1.5,
            margin: 0
          }}>
            Choose an enterprise retail client to initialize brand guidelines, agent system instructions, 
            BigQuery customer segment datasets, and specialized A2UI renderers.
          </p>
        </div>

        {/* Dual Client Workspace Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginTop: '0.4rem'
        }}>
          {CLIENTS_METADATA.map(client => {
            const isCurrent = client.client_id === activeClientId;
            const Icon = client.logo_icon;

            return (
              <div
                key={client.client_id}
                style={{
                  background: 'var(--bg-secondary, #f8f9fa)',
                  border: isCurrent 
                    ? `2px solid ${client.primary_color}` 
                    : '1px solid var(--border-color, #dadce0)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isCurrent 
                    ? `0 8px 30px ${client.primary_color}25` 
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
              >
                {/* Active Badge */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: client.primary_color,
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    zIndex: 2
                  }}>
                    <CheckCircle2 size={11} strokeWidth={3} />
                    <span>ACTIVE WORKSPACE</span>
                  </div>
                )}

                {/* Card Brand Header */}
                <div style={{
                  background: client.header_gradient,
                  color: '#ffffff',
                  padding: '1.4rem 1.4rem 1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem'
                }}>
                  <div style={{
                    background: '#ffffff',
                    color: client.primary_color,
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}>
                    <Icon size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'rgba(255,255,255,0.85)'
                    }}>
                      {client.industry}
                    </span>
                    <h2 style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0.1rem 0 0.15rem 0',
                      lineHeight: 1.2
                    }}>
                      {client.client_name}
                    </h2>
                    <p style={{
                      fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.9)',
                      margin: 0,
                      lineHeight: 1.35
                    }}>
                      {client.tagline}
                    </p>
                  </div>
                </div>

                {/* Card Body Stats & Capabilities */}
                <div style={{
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  flex: 1
                }}>
                  {/* KPI Quick Badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    background: 'var(--bg-card, #ffffff)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #dadce0)',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #5f6368)', fontWeight: 600 }}>REVENUE</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #111827)' }}>{client.annual_revenue}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color, #dadce0)', borderRight: '1px solid var(--border-color, #dadce0)' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #5f6368)', fontWeight: 600 }}>STORES</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main, #111827)' }}>{client.store_count}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #5f6368)', fontWeight: 600 }}>LOYALTY</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: client.primary_color }}>{client.loyalty_program_name}</div>
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #5f6368)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Core AI Capabilities & Data
                    </div>
                    {client.key_features.map((feat, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.76rem',
                        color: 'var(--text-main, #202124)',
                        lineHeight: 1.35
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: client.primary_color,
                          flexShrink: 0
                        }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sample Query Callout */}
                  <div style={{
                    background: 'var(--code-bg, #f1f3f4)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #dadce0)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted, #5f6368)',
                    fontStyle: 'italic'
                  }}>
                    💡 "{client.sample_prompt}"
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClient(client.client_id);
                      if (isModal) onClose();
                    }}
                    style={{
                      marginTop: 'auto',
                      background: isCurrent ? client.primary_color : 'transparent',
                      color: isCurrent ? '#ffffff' : client.primary_color,
                      border: isCurrent ? 'none' : `1.5px solid ${client.primary_color}`,
                      borderRadius: '10px',
                      padding: '0.7rem 1.2rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: isCurrent ? `0 4px 14px ${client.primary_color}40` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{isCurrent ? `Currently in ${client.client_name}` : `Switch to ${client.client_name} Workspace`}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Architecture Note */}
        <div style={{
          background: 'var(--bg-secondary, #f1f3f4)',
          border: '1px solid var(--border-color, #dadce0)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #5f6368)'
        }}>
          <Zap size={16} color="var(--color-primary, #2563eb)" />
          <span>
            <strong>Zero-Downtime Context Switching:</strong> Selecting a client dynamically swaps agent instructions,
            BigQuery target datasets, currency standards (€ vs kr), and A2UI templates while preserving session telemetry.
          </span>
        </div>
      </div>
    </div>
  );
}
