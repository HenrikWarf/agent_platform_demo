import { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  QrCode, 
  Heart,
  RotateCcw
} from 'lucide-react';

/* ── Pre-configured Swedish Persona Archetypes for ICA Testing ─────────────── */
const ICA_PERSONA_PRESETS = {
  eco: {
    target_persona: "Ekologiskt Medveten",
    personalization_reason: "Valt för dig baserat på dina tidigare köp av KRAV-märkta mejeriprodukter",
    store_format: "ICA Maxi Stormarknad",
    store_name: "ICA Maxi Lindhagen, Stockholm",
    badge_type: "Stammispris",
    product: {
      name: "Ekologisk Svensk Mellanmjölk 1.5L",
      brand_line: "ICA I love eco",
      volume_weight: "1.5 Liter",
      origin_badge: "Från Sverige 🇸🇪",
      eco_badge: "KRAV 🌿",
      category: "Mejeri & Ägg",
      icon: "🥛"
    },
    pricing: {
      deal_price_major: "24",
      deal_price_minor: "90",
      unit: "kr/st",
      regular_price: "34:90 kr/st",
      savings_text: "Spara 10:00 (29% rabatt)",
      comparison_price: "Jfr-pris 16:60/l",
      limit_text: "Max 2 köp/stammis"
    },
    valid_until: "Söndag 24 aug",
    days_remaining: 3,
    recipe_suggestion: {
      title: "Klassiska Svenska Pannkakor med Eko-Mjölk & Sylt",
      prep_time: "20 min",
      servings: "4 port",
      difficulty: "Enkel"
    }
  },
  family: {
    target_persona: "Barnfamilj / Storpack",
    personalization_reason: "Valt för dig som handlar familjefavoriter och storpack till helgmiddagen",
    store_format: "ICA Kvantum",
    store_name: "ICA Kvantum Sickla",
    badge_type: "FamiljeKlipp!",
    product: {
      name: "Färsk Svensk Nötfärs 12% (Storpack)",
      brand_line: "ICA Svensk Råvara",
      volume_weight: "1000g / 1.0 kg",
      origin_badge: "Kött från Sverige 🇸🇪",
      eco_badge: "Klimatdeklarerad 🌱",
      category: "Kött & Chark",
      icon: "🥩"
    },
    pricing: {
      deal_price_major: "89",
      deal_price_minor: "90",
      unit: "kr/förp",
      regular_price: "129:00 kr/förp",
      savings_text: "Spara 39:10 (30% rabatt)",
      comparison_price: "Jfr-pris 89:90/kg",
      limit_text: "Max 2 köp/hushåll"
    },
    valid_until: "Söndag 24 aug",
    days_remaining: 2,
    recipe_suggestion: {
      title: "Klassisk Familjelasagne med Riklig Köttfärssås & Mozzarella",
      prep_time: "45 min",
      servings: "6 port",
      difficulty: "Medel"
    }
  },
  budget: {
    target_persona: "Prisjägare & Student",
    personalization_reason: "Valt för dig som uppskattar smarta basköp och högsta vardagsvärde",
    store_format: "ICA Supermarket",
    store_name: "ICA Supermarket Vanadis",
    badge_type: "Extra Stammispris",
    product: {
      name: "Svensk Rapsolja Kallpressad 500ml",
      brand_line: "ICA Gott Liv",
      volume_weight: "500 ml",
      origin_badge: "Från Sverige 🇸🇪",
      eco_badge: "Nyckelhålsmärkt 🔑",
      category: "Skafferi & Olja",
      icon: "🌻"
    },
    pricing: {
      deal_price_major: "19",
      deal_price_minor: "90",
      unit: "kr/st",
      regular_price: "29:90 kr/st",
      savings_text: "Spara 10:00 (33% rabatt)",
      comparison_price: "Jfr-pris 39:80/l",
      limit_text: "Max 3 köp/stammis"
    },
    valid_until: "Söndag 24 aug",
    days_remaining: 4,
    recipe_suggestion: {
      title: "Ugnsrostade Rotfrukter med Örter & Rapsolja",
      prep_time: "30 min",
      servings: "4 port",
      difficulty: "Enkel"
    }
  }
};

/* ── Pre-configured H&M-Inspired Fashion Presets for Crazy Fashion ─────────── */
const FASHION_PERSONA_PRESETS = {
  vip: {
    target_persona: "VIP Fashionista",
    personalization_reason: "Curated exclusively for your Stockholm Studio VIP tier and high affinity with Sustainable Tailoring",
    collection_title: "STUDIO COLLECTION // AUTUMN 2026",
    drop_badge: "MEMBER EXCLUSIVE",
    product_name: "NOVA Oversized Tailored Blazer",
    category: "Womenswear / Tailoring & Suiting",
    sustainability_tag: "100% Recycled Italian Wool 🌿",
    fit_and_fabric: "Relaxed Boxy Fit • Heavyweight Structured Twill • Double Breasted",
    color_options: ["Oatmeal Heather", "Midnight Navy", "Charcoal Slate"],
    size_options: ["XS", "S", "M", "L", "XL"],
    pricing: {
      regular_price: "€89.99",
      member_price: "€64.99",
      discount_pct: "-28% MEMBER DEAL",
      crazy_club_points: "+180 Club Points",
      garment_recycling_bonus: "Extra -15% with in-store garment drop-off"
    },
    valid_until: "Sunday 24 Aug Midnight",
    cta_text: "Claim Member Deal & Shop Now"
  },
  eco: {
    target_persona: "Eco Trendsetter",
    personalization_reason: "Selected for your frequent circular apparel purchases and eco-conscious preferences",
    collection_title: "CONSCIOUS EDIT // CIRCULAR CAPSULE",
    drop_badge: "CONSCIOUS CHOICE 🌿",
    product_name: "LUNA Wide-Leg Organic Trousers",
    category: "Womenswear / Sustainable Bottoms",
    sustainability_tag: "GOTS-Certified Organic French Linen 🌿",
    fit_and_fabric: "High-Waisted Fluid Drape • Breathable Natural Weave",
    color_options: ["Sage Green", "Warm Sand", "Chalk White"],
    size_options: ["XS", "S", "M", "L", "XL"],
    pricing: {
      regular_price: "€69.99",
      member_price: "€49.99",
      discount_pct: "-29% CONSCIOUS OFFER",
      crazy_club_points: "+140 Club Points",
      garment_recycling_bonus: "Extra -15% with garment recycling voucher"
    },
    valid_until: "Sunday 24 Aug Midnight",
    cta_text: "Claim Member Deal & Shop Now"
  }
};

/**
 * A2UIOfferBanner: Interactive Agent-to-User Interface (A2UI) component supporting
 * both ICA Sverige (Swedish Grocery Deal Banner) and Crazy Fashion (H&M-Style Editorial Drop Card).
 */
export default function A2UIOfferBanner({ data = {} }) {
  // Determine if this is a Crazy Fashion drop card or ICA Stammis banner
  const isCrazyFashion = (
    data.client_type === 'crazy_fashion' ||
    Boolean(data.fashion_drop_card) ||
    Boolean(data.collection_title) ||
    (data.brand && data.brand.toLowerCase().includes('fashion'))
  );

  if (isCrazyFashion) {
    const rawFashionData = data.fashion_drop_card || data;
    return <FashionDropCardComponent initialData={rawFashionData} />;
  }

  const rawIcaData = data.ica_offer_banner || data;
  return <IcaOfferBannerComponent initialData={rawIcaData} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. CRAZY FASHION // H&M-INSPIRED EDITORIAL DROP CARD COMPONENT
 * ───────────────────────────────────────────────────────────────────────────── */
function FashionDropCardComponent({ initialData = {} }) {
  const [selectedPreset, setSelectedPreset] = useState('vip');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(0);
  const [isSavedToBag, setIsSavedToBag] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const activeDrop = {
    ...FASHION_PERSONA_PRESETS[selectedPreset],
    ...initialData,
    pricing: {
      ...FASHION_PERSONA_PRESETS[selectedPreset].pricing,
      ...(initialData.pricing || {})
    }
  };

  const {
    collection_title,
    drop_badge,
    product_name,
    category,
    sustainability_tag,
    fit_and_fabric,
    color_options = ["Oatmeal Heather", "Midnight Navy", "Charcoal Slate"],
    size_options = ["XS", "S", "M", "L", "XL"],
    pricing,
    personalization_reason,
    valid_until
  } = activeDrop;

  const colorSwatches = [
    { name: color_options[0] || 'Oatmeal Heather', hex: '#d6c7b2' },
    { name: color_options[1] || 'Midnight Navy', hex: '#1e293b' },
    { name: color_options[2] || 'Charcoal Slate', hex: '#475569' }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      margin: '0.8rem 0',
      transition: 'all 0.25s ease'
    }}>
      {/* ── Top Editorial Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b, #27272a)',
        color: '#ffffff',
        padding: '0.75rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#a1a1aa'
          }}>
            {collection_title}
          </span>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            background: '#4f46e5',
            color: '#ffffff',
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            letterSpacing: '0.04em'
          }}>
            {drop_badge}
          </span>
        </div>

        {/* Persona Archetype Switcher for Testing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {Object.keys(FASHION_PERSONA_PRESETS).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPreset(key)}
              style={{
                fontSize: '0.62rem',
                fontWeight: selectedPreset === key ? 700 : 500,
                background: selectedPreset === key ? '#ffffff' : 'rgba(255,255,255,0.12)',
                color: selectedPreset === key ? '#18181b' : '#ffffff',
                border: 'none',
                padding: '0.15rem 0.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Editorial Content Grid ── */}
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Title, Category & Wishlist */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {category}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0.4rem', letterSpacing: '-0.02em' }}>
              {product_name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#059669',
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                padding: '0.12rem 0.5rem',
                borderRadius: '6px'
              }}>
                {sustainability_tag}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {fit_and_fabric}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLiked(prev => !prev)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLiked ? '#e11d48' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
            title={isLiked ? "Saved to Wishlist" : "Save to Wishlist"}
          >
            <Heart size={16} fill={isLiked ? '#e11d48' : 'none'} />
          </button>
        </div>

        {/* ── Pricing & Member Discount Banner (H&M High-Contrast Style) ── */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.9rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.8rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#e11d48', letterSpacing: '-0.02em' }}>
                {pricing?.member_price || '€59.99'}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 600 }}>
                {pricing?.regular_price || '€79.99'}
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                background: '#e11d48',
                color: '#ffffff',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}>
                {pricing?.discount_pct || '-25% OFF'}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Member Special • Valid until {valid_until || 'Sunday Midnight'}
            </div>
          </div>

          {/* Crazy Club Loyalty Perks */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
              <Sparkles size={13} />
              <span>{pricing?.crazy_club_points || '+150 Club Points'}</span>
            </div>
            {pricing?.garment_recycling_bonus && (
              <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                <RotateCcw size={11} />
                <span>{pricing.garment_recycling_bonus}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Color & Size Selector ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: '10px' }}>
          
          {/* Color Selector */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Color: <strong style={{ color: 'var(--text-main)' }}>{colorSwatches[selectedColor]?.name}</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {colorSwatches.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColor(idx)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: selectedColor === idx ? '2px solid #4f46e5' : '1px solid var(--border-color)',
                    boxShadow: selectedColor === idx ? '0 0 0 2px rgba(79, 70, 229, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Select Size:
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {size_options.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: selectedSize === sz ? 800 : 600,
                    background: selectedSize === sz ? '#18181b' : 'var(--bg-secondary)',
                    color: selectedSize === sz ? '#ffffff' : 'var(--text-main)',
                    border: selectedSize === sz ? '1px solid #18181b' : '1px solid var(--border-color)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Call To Action Button ── */}
        <button
          type="button"
          onClick={() => setIsSavedToBag(prev => !prev)}
          style={{
            background: isSavedToBag ? '#059669' : 'linear-gradient(135deg, #18181b, #312e81)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.85rem 1.4rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          {isSavedToBag ? <Check size={18} /> : <ShoppingBag size={18} />}
          {isSavedToBag ? '✓ Added to Club Bag!' : `Add to Bag • Size ${selectedSize}`}
        </button>

        {/* ── Personalization Rationale Drawer ── */}
        {personalization_reason && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.65rem 0.9rem',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            lineHeight: '1.45',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={14} color="#4f46e5" style={{ flexShrink: 0 }} />
            <span><strong>Why you see this:</strong> {personalization_reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. ICA SVERIGE // STAMMIS GROCERY DEAL BANNER COMPONENT
 * ───────────────────────────────────────────────────────────────────────────── */
function IcaOfferBannerComponent({ initialData = {} }) {
  const [selectedPersona, setSelectedPersona] = useState('eco');
  const [isLoadedToCard, setIsLoadedToCard] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  // Merge provided data or fallback to the interactive persona preset
  const activeOffer = {
    ...ICA_PERSONA_PRESETS[selectedPersona],
    ...initialData,
    product: { ...ICA_PERSONA_PRESETS[selectedPersona].product, ...(initialData.product || {}) },
    pricing: { ...ICA_PERSONA_PRESETS[selectedPersona].pricing, ...(initialData.pricing || {}) },
  };

  const {
    store_format = "ICA Maxi Stormarknad",
    store_name = "ICA Maxi Lindhagen, Stockholm",
    badge_type = "Stammispris",
    personalization_reason = "Valt för dig baserat på dina tidigare köp av mejeriprodukter",
    product,
    pricing,
    valid_until = "Söndag 24 aug",
    days_remaining = 3,
  } = activeOffer;

  const handleCardLoadToggle = () => {
    setIsLoadedToCard(prev => !prev);
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      margin: '0.8rem 0',
      transition: 'all 0.25s ease'
    }}>
      {/* ── Top Header: Brand, Store Format & Persona Preset Switcher ── */}
      <div style={{
        background: 'linear-gradient(135deg, #E01E26 0%, #b91c1c 100%)',
        color: '#ffffff',
        padding: '0.75rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: '#ffffff',
            color: '#E01E26',
            fontWeight: 900,
            fontSize: '0.95rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            letterSpacing: '-0.02em'
          }}>
            ICA
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.2 }}>
              {store_format}
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={10} />
              <span>{store_name}</span>
            </div>
          </div>
        </div>

        {/* Persona Switcher Pill Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85, marginRight: '0.2rem' }}>
            Persona:
          </span>
          {Object.keys(ICA_PERSONA_PRESETS).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPersona(key)}
              style={{
                fontSize: '0.62rem',
                fontWeight: selectedPersona === key ? 800 : 600,
                background: selectedPersona === key ? '#ffffff' : 'rgba(255,255,255,0.18)',
                color: selectedPersona === key ? '#E01E26' : '#ffffff',
                border: 'none',
                padding: '0.18rem 0.55rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {key === 'eco' ? 'Eko' : key === 'family' ? 'Familj' : 'Budget'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Offer Body ── */}
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Badge & Expiry Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{
              background: '#E01E26',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              {badge_type}
            </span>
            {product?.eco_badge && (
              <span style={{
                background: 'rgba(46, 125, 50, 0.12)',
                color: '#2e7d32',
                border: '1px solid rgba(46, 125, 50, 0.3)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.18rem 0.5rem',
                borderRadius: '6px'
              }}>
                {product.eco_badge}
              </span>
            )}
            {product?.origin_badge && (
              <span style={{
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.18rem 0.5rem',
                borderRadius: '6px'
              }}>
                {product.origin_badge}
              </span>
            )}
          </div>

          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontWeight: 600
          }}>
            <Clock size={12} color="#E01E26" />
            <span>Gäller t.o.m. {valid_until} ({days_remaining} dgr kvar)</span>
          </div>
        </div>

        {/* Product Details & Price Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem'
        }}>
          {/* Icon / Image Placeholder */}
          <div style={{
            fontSize: '2.5rem',
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            {product?.icon || '🛒'}
          </div>

          {/* Name & Subtitle */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {product?.brand_line} • {product?.volume_weight}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.15rem 0' }}>
              {product?.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {pricing?.comparison_price} • Ord. pris {pricing?.regular_price}
            </div>
          </div>

          {/* Large Swedish Deal Price */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', color: '#E01E26', lineHeight: 1 }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                {pricing?.deal_price_major}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                :{pricing?.deal_price_minor}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#E01E26', marginTop: '0.2rem' }}>
              {pricing?.unit}
            </div>
            <div style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              color: '#ffffff',
              background: '#E01E26',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              marginTop: '0.25rem',
              display: 'inline-block'
            }}>
              {pricing?.savings_text}
            </div>
          </div>
        </div>

        {/* Action Controls: Stammis Card Activation & List Quantity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          
          {/* Main "Ladda till kortet" CTA Button */}
          <button
            type="button"
            onClick={handleCardLoadToggle}
            style={{
              flex: 2,
              minWidth: '200px',
              background: isLoadedToCard ? '#2e7d32' : '#E01E26',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.2rem',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: isLoadedToCard ? '0 4px 12px rgba(46, 125, 50, 0.3)' : '0 4px 14px rgba(224, 30, 38, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoadedToCard ? <Check size={16} /> : <Sparkles size={16} />}
            <span>{isLoadedToCard ? '✓ Laddat på ditt Stammiskort' : 'Ladda till kortet'}</span>
          </button>

          {/* In-Store Barcode Modal Toggle */}
          <button
            type="button"
            onClick={() => setShowBarcode(prev => !prev)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.75rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              title: "Visa Streckkod för Snabbkassa"
            }}
          >
            <QrCode size={16} />
          </button>
        </div>

        {/* ── Expandable In-Store Barcode / Self-Scanning Drawer ── */}
        {showBarcode && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px dashed #E01E26',
            borderRadius: '10px',
            padding: '0.8rem 1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#E01E26' }}>
              Blippa i självscanning / snabbkassan:
            </div>
            <div style={{
              fontFamily: 'monospace',
              letterSpacing: '4px',
              fontSize: '1.2rem',
              fontWeight: 800,
              background: 'var(--bg-primary)',
              padding: '0.4rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              display: 'inline-block'
            }}>
              ||| | |||| | || ||||| 73108650012
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Kupongkod: ICA-STAMMIS-2026-X09 • Rabatten dras automatiskt i kassan
            </div>
          </div>
        )}

        {/* Personalization Rationale Footer */}
        {personalization_reason && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.55rem 0.8rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Sparkles size={13} color="#E01E26" style={{ flexShrink: 0 }} />
            <span><strong>Personlig anpassning:</strong> {personalization_reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
