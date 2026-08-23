import { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  MapPin, 
  QrCode, 
  ChevronDown, 
  ChevronUp, 
  Heart,
  Leaf
} from 'lucide-react';

/* ── Pre-configured Swedish Persona Archetypes for Live Testing ─────────────── */
const PERSONA_PRESETS = {
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
  },
  gourmet: {
    target_persona: "Helglyx & Gourmet",
    personalization_reason: "Valt för dig baserat på dina tidigare helginköp av delikatesser och färskvaror",
    store_format: "ICA Maxi Stormarknad",
    store_name: "ICA Maxi Nacka",
    badge_type: "HelgKlipp!",
    product: {
      name: "Färsk Svensk Fjällrödingfilé",
      brand_line: "ICA Selection Delikatess",
      volume_weight: "ca 300g",
      origin_badge: "Från Sverige 🇸🇪",
      eco_badge: "ASC-Certifierad 🐟",
      category: "Fisk & Skaldjur",
      icon: "🐟"
    },
    pricing: {
      deal_price_major: "199",
      deal_price_minor: "00",
      unit: "kr/kg",
      regular_price: "289:00 kr/kg",
      savings_text: "Spara 90:00/kg (31% rabatt)",
      comparison_price: "Jfr-pris 199:00/kg",
      limit_text: "Gäller manuella fiskdisken"
    },
    valid_until: "Lördag 23 aug",
    days_remaining: 1,
    recipe_suggestion: {
      title: "Smörstekt Fjällröding med Sandefjordsmörsås & Dillslungad Färskpotatis",
      prep_time: "25 min",
      servings: "2 port",
      difficulty: "Medel"
    }
  }
};

/**
 * A2UIOfferBanner: An interactive, brand-accurate Swedish Retail Offer component for ICA
 * Demonstrates Agent-to-User Interface (A2UI) declarative UI generation in chat.
 */
export default function A2UIOfferBanner({ data = {} }) {
  const [selectedPersona, setSelectedPersona] = useState('eco');
  const [isLoadedToCard, setIsLoadedToCard] = useState(false);
  const [listQuantity, setListQuantity] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Merge provided data or fallback to the interactive persona preset
  const activeOffer = {
    ...PERSONA_PRESETS[selectedPersona],
    ...data,
    product: { ...PERSONA_PRESETS[selectedPersona].product, ...(data.product || {}) },
    pricing: { ...PERSONA_PRESETS[selectedPersona].pricing, ...(data.pricing || {}) },
    recipe_suggestion: { ...PERSONA_PRESETS[selectedPersona].recipe_suggestion, ...(data.recipe_suggestion || {}) }
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
    recipe_suggestion
  } = activeOffer;

  const handleCardLoadToggle = () => {
    setIsLoadedToCard(prev => !prev);
  };

  const handleAddToList = () => {
    setListQuantity(prev => prev + 1);
  };

  const handleDecrementList = () => {
    setListQuantity(prev => Math.max(0, prev - 1));
  };

  return (
    <div style={{
      background: 'var(--bg-card, #ffffff)',
      border: '1px solid rgba(224, 30, 38, 0.25)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(224, 30, 38, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      margin: '0.8rem 0',
      transition: 'all 0.25s ease'
    }}>
      {/* ─── Top Brand Header & Persona Selector Bar ─────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #E01E26 0%, #B81319 100%)',
        color: '#ffffff',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Brand Logo & Store Format */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: '#ffffff',
            color: '#E01E26',
            fontWeight: 900,
            fontSize: '0.95rem',
            letterSpacing: '-0.03em',
            padding: '0.15rem 0.55rem',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            <span>ICA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              {store_format}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <MapPin size={10} /> {store_name}
            </span>
          </div>
        </div>

        {/* Stammis Loyalty Badge & Like Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            background: '#FFE600',
            color: '#1F2328',
            fontWeight: 800,
            fontSize: '0.68rem',
            padding: '0.18rem 0.5rem',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
          }}>
            ⭐ {badge_type}
          </span>

          <button
            type="button"
            onClick={() => setIsLiked(!isLiked)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: isLiked ? '#FFE600' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title={isLiked ? 'Sparad i dina favoriter' : 'Spara som favorit'}
          >
            <Heart size={14} fill={isLiked ? '#FFE600' : 'none'} />
          </button>
        </div>
      </div>

      {/* ─── Interactive Persona Switcher Simulator (A2UI Demonstration) ──── */}
      <div style={{
        background: 'rgba(224, 30, 38, 0.04)',
        borderBottom: '1px solid rgba(224, 30, 38, 0.12)',
        padding: '0.4rem 0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.4rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted, #5f6368)', fontWeight: 600 }}>
          <Sparkles size={11} color="#E01E26" />
          <span>A2UI Kundprofil:</span>
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {[
            { id: 'eco', label: '🌿 Eko-Medveten' },
            { id: 'family', label: '👨‍👩‍👧‍👦 Barnfamilj' },
            { id: 'budget', label: '🏷️ Prisjägare' },
            { id: 'gourmet', label: '🍷 Gourmet' }
          ].map(persona => (
            <button
              key={persona.id}
              type="button"
              onClick={() => {
                setSelectedPersona(persona.id);
                setIsLoadedToCard(false);
                setListQuantity(0);
                setShowRecipe(false);
              }}
              style={{
                fontSize: '0.65rem',
                fontWeight: selectedPersona === persona.id ? 700 : 500,
                background: selectedPersona === persona.id ? '#E01E26' : 'var(--bg-secondary, #f1f3f4)',
                color: selectedPersona === persona.id ? '#ffffff' : 'var(--text-main, #202124)',
                border: 'none',
                padding: '0.18rem 0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {persona.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Personalization Rationale Banner ─────────────────────────── */}
      <div style={{
        background: 'rgba(255, 230, 0, 0.12)',
        borderBottom: '1px dashed rgba(224, 30, 38, 0.2)',
        padding: '0.45rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.72rem',
        color: 'var(--text-main, #202124)'
      }}>
        <span style={{ fontSize: '0.85rem' }}>🎯</span>
        <span>
          <strong style={{ color: '#E01E26' }}>Personligt Stammiserbjudande:</strong> {personalization_reason}
        </span>
      </div>

      {/* ─── Main Deal & Product Content Stage ────────────────────────── */}
      <div style={{
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(90px, 110px) 1fr',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {/* Product Visual Icon & Badges */}
        <div style={{
          background: 'radial-gradient(circle, rgba(224,30,38,0.06) 0%, rgba(255,255,255,0.9) 100%)',
          border: '1px solid var(--border-color, #dadce0)',
          borderRadius: '12px',
          height: '110px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
            {product.icon || '🛍️'}
          </span>
          <span style={{
            position: 'absolute',
            bottom: '4px',
            fontSize: '0.62rem',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.75)',
            color: '#ffffff',
            padding: '0.08rem 0.4rem',
            borderRadius: '4px'
          }}>
            {product.volume_weight}
          </span>
        </div>

        {/* Product Details & Bold Scandinavian Price Splash */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {/* Brand line & Certification Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#008744',
              background: 'rgba(0, 135, 68, 0.1)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px'
            }}>
              {product.brand_line}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #5f6368)' }}>
              {product.origin_badge}
            </span>
            {product.eco_badge && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#008744',
                display: 'flex',
                alignItems: 'center',
                gap: '0.15rem'
              }}>
                <Leaf size={10} /> {product.eco_badge}
              </span>
            )}
          </div>

          {/* Product Headline */}
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-main, #202124)',
            lineHeight: 1.25,
            margin: '0.1rem 0'
          }}>
            {product.name}
          </h3>

          {/* Bold Price Presentation Block */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem',
            marginTop: '0.15rem',
            flexWrap: 'wrap'
          }}>
            {/* Massive Deal Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', color: '#E01E26' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {pricing.deal_price_major}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, verticalAlign: 'super', marginLeft: '1px' }}>
                :{pricing.deal_price_minor}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #5f6368)', marginLeft: '0.25rem' }}>
                {pricing.unit}
              </span>
            </div>

            {/* Regular Price & Strikethrough */}
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.68rem' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted, #80868b)' }}>
                {pricing.regular_price}
              </span>
              <span style={{
                fontWeight: 700,
                color: '#008744',
                background: 'rgba(0, 135, 68, 0.1)',
                padding: '0.05rem 0.35rem',
                borderRadius: '3px',
                width: 'fit-content'
              }}>
                {pricing.savings_text}
              </span>
            </div>
          </div>

          {/* Comparison Price & Limitation Footnote */}
          <div style={{
            fontSize: '0.66rem',
            color: 'var(--text-muted, #5f6368)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginTop: '0.1rem'
          }}>
            <span>{pricing.comparison_price}</span>
            <span>•</span>
            <span>{pricing.limit_text}</span>
          </div>
        </div>
      </div>

      {/* ─── Validity & Expiry Countdown Bar ──────────────────────────── */}
      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderTop: '1px solid var(--border-color, #dadce0)',
        borderBottom: '1px solid var(--border-color, #dadce0)',
        padding: '0.4rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted, #5f6368)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={12} color="#E01E26" />
          <span>Gäller t.o.m. <strong>{valid_until}</strong></span>
        </div>

        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: days_remaining <= 2 ? '#E01E26' : '#008744',
          background: days_remaining <= 2 ? 'rgba(224,30,38,0.1)' : 'rgba(0,135,68,0.1)',
          padding: '0.1rem 0.4rem',
          borderRadius: '4px'
        }}>
          ⏱️ {days_remaining} {days_remaining === 1 ? 'dag kvar' : 'dagar kvar'}
        </span>
      </div>

      {/* ─── Interactive Action Buttons (A2UI Core Actions) ───────────── */}
      <div style={{
        padding: '0.8rem 1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-card, #ffffff)'
      }}>
        {/* Primary Action: Ladda till kortet */}
        <button
          type="button"
          onClick={handleCardLoadToggle}
          style={{
            flex: '1 1 180px',
            background: isLoadedToCard ? '#008744' : '#E01E26',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.55rem 0.9rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            boxShadow: isLoadedToCard 
              ? '0 2px 8px rgba(0, 135, 68, 0.3)' 
              : '0 2px 8px rgba(224, 30, 38, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          {isLoadedToCard ? (
            <>
              <Check size={15} strokeWidth={3} />
              <span>Laddat på ICA-kortet</span>
            </>
          ) : (
            <>
              <Plus size={15} strokeWidth={2.5} />
              <span>Ladda till ICA-kortet</span>
            </>
          )}
        </button>

        {/* Secondary Action: Lägg i inköpslista with interactive quantity counter */}
        {listQuantity === 0 ? (
          <button
            type="button"
            onClick={handleAddToList}
            style={{
              background: 'var(--bg-secondary, #f1f3f4)',
              color: 'var(--text-main, #202124)',
              border: '1px solid var(--border-color, #dadce0)',
              borderRadius: '8px',
              padding: '0.55rem 0.85rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s'
            }}
          >
            <ShoppingBag size={13} color="#E01E26" />
            <span>Lägg i inköpslista</span>
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary, #f1f3f4)',
            border: '1px solid #E01E26',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={handleDecrementList}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.5rem 0.6rem',
                cursor: 'pointer',
                color: '#E01E26',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Minus size={12} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 0.4rem', color: '#E01E26' }}>
              {listQuantity} st i lista
            </span>
            <button
              type="button"
              onClick={handleAddToList}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.5rem 0.6rem',
                cursor: 'pointer',
                color: '#E01E26',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        {/* Optional Secondary Action: Matchande recept toggle */}
        {recipe_suggestion && (
          <button
            type="button"
            onClick={() => setShowRecipe(!showRecipe)}
            style={{
              background: 'transparent',
              color: 'var(--text-muted, #5f6368)',
              border: '1px solid var(--border-color, #dadce0)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s'
            }}
          >
            <ChefHat size={13} color="#E01E26" />
            <span>Recept</span>
            {showRecipe ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {/* Snabbkassa / Barcode modal toggle */}
        <button
          type="button"
          onClick={() => setShowBarcode(!showBarcode)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.55rem 0.4rem',
            color: 'var(--text-muted, #80868b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Visa streckkod för självscanning"
        >
          <QrCode size={16} />
        </button>
      </div>

      {/* ─── Expandable Recipe Suggestion Accordion ───────────────────── */}
      {showRecipe && recipe_suggestion && (
        <div style={{
          background: 'rgba(224, 30, 38, 0.03)',
          borderTop: '1px dashed var(--border-color, #dadce0)',
          padding: '0.75rem 1rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 700, color: '#E01E26', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ChefHat size={13} /> {recipe_suggestion.title}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #5f6368)' }}>
              ⏱️ {recipe_suggestion.prep_time} • 🍽️ {recipe_suggestion.servings}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted, #5f6368)', lineHeight: 1.4, fontSize: '0.72rem' }}>
            Inspirerande vardagsrecept framtaget för att matcha din stammisrabatt. Ingredienserna finns samlade på din inköpslista i ICA-appen.
          </p>
        </div>
      )}

      {/* ─── Expandable In-Store Barcode / Self-Scanning Modal ─────────── */}
      {showBarcode && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid var(--border-color, #dadce0)',
          padding: '0.8rem 1rem',
          textAlign: 'center',
          color: '#1F2328'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#E01E26' }}>
            Blippa i självscanning / snabbkassan:
          </div>
          <div style={{
            fontFamily: 'monospace',
            letterSpacing: '4px',
            fontSize: '1.2rem',
            fontWeight: 800,
            background: '#f8f9fa',
            padding: '0.4rem',
            borderRadius: '4px',
            border: '1px solid #dadce0',
            display: 'inline-block'
          }}>
            ||| | |||| | || ||||| 73108650012
          </div>
          <div style={{ fontSize: '0.62rem', color: '#5f6368', marginTop: '0.2rem' }}>
            Kupongkod: ICA-STAMMIS-2026-X09 • Rabatten dras automatiskt i kassan
          </div>
        </div>
      )}
    </div>
  );
}
