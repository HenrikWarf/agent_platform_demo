import { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  QrCode, 
  Heart,
  RotateCcw,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Layers,
  Utensils,
  Plus
} from 'lucide-react';

/* ── Swedish Grocery Icon & Emoji Resolver ──────────────────────────────────── */
const GROCERY_ICON_MAP = [
  // Vegetables & Greens
  { keys: ['gurka', 'cucumber', 'squash', 'zucchini'], emoji: '🥒' },
  { keys: ['morot', 'morötter', 'carrot'], emoji: '🥕' },
  { keys: ['potatis', 'potato'], emoji: '🥔' },
  { keys: ['lök', 'vitlök', 'rödlök', 'onion', 'garlic'], emoji: '🧅' },
  { keys: ['avokado', 'avocado'], emoji: '🥑' },
  { keys: ['paprika', 'pepper'], emoji: '🫑' },
  { keys: ['broccoli', 'sallad', 'spenat', 'kål', 'grönt', 'gront'], emoji: '🥦' },
  { keys: ['majs', 'corn'], emoji: '🌽' },
  { keys: ['svamp', 'kantarell', 'champinjon', 'mushroom'], emoji: '🍄' },
  { keys: ['krossade tomater', 'passerade tomater', 'konserv', 'burk', 'skafferi', 'bönor', 'kikärtor'], emoji: '🥫' },
  { keys: ['tomat', 'tomater', 'tomato'], emoji: '🍅' },

  // Fruits & Berries
  { keys: ['äpple', 'apple'], emoji: '🍎' },
  { keys: ['banan', 'banana'], emoji: '🍌' },
  { keys: ['citron', 'lime', 'lemon'], emoji: '🍋' },
  { keys: ['apelsin', 'mandarin', 'clementin', 'orange'], emoji: '🍊' },
  { keys: ['jordgubb', 'jordgubbar', 'hallon', 'blåbär', 'lingon', 'bär', 'strawberry', 'berry'], emoji: '🍓' },
  { keys: ['druvor', 'vindruvor', 'grapes'], emoji: '🍇' },
  { keys: ['vattenmelon', 'melon'], emoji: '🍉' },
  { keys: ['frukt', 'frukter', 'fruit'], emoji: '🍎' },

  // Dairy & Eggs
  { keys: ['ägg', 'lantägg', 'egg'], emoji: '🥚' },
  { keys: ['mjölk', 'mellanmjölk', 'standardmjölk', 'fil', 'yoghurt', 'mejeri', 'grädde', 'dairy', 'milk'], emoji: '🥛' },
  { keys: ['ost', 'prästost', 'herrgård', 'grevé', 'västerbotten', 'mozzarella', 'parmesan', 'cheese'], emoji: '🧀' },
  { keys: ['smör', 'bregott', 'butter', 'margarin'], emoji: '🧈' },

  // Meat, Poultry, Fish & Seafood
  { keys: ['nötfärs', 'blandfärs', 'färs', 'biff', 'oxfilé', 'fläskkotlett', 'kött', 'kott', 'meat', 'chark'], emoji: '🥩' },
  { keys: ['kyckling', 'kycklingfilé', 'fågel', 'chicken'], emoji: '🍗' },
  { keys: ['korv', 'falukorv', 'prinskorv', 'bacon', 'skinka', 'prosciutto'], emoji: '🥓' },
  { keys: ['lax', 'fjällröding', 'torsk', 'sill', 'fisk', 'fish'], emoji: '🐟' },
  { keys: ['räkor', 'kräftor', 'skaldjur', 'hummer', 'seafood', 'shrimp'], emoji: '🦐' },

  // Bakery & Grains
  { keys: ['bröd', 'limpa', 'fralla', 'surdegsbröd', 'toast', 'knäckebröd', 'bread'], emoji: '🍞' },
  { keys: ['croissant', 'bulle', 'kanelbulle', 'bageri', 'bakverk', 'pastry'], emoji: '🥐' },
  { keys: ['pasta', 'spaghetti', 'penne', 'lasagne', 'tagliatelle'], emoji: '🍝' },
  { keys: ['ris', 'basmatiris', 'jasminris', 'rice'], emoji: '🍚' },
  { keys: ['havre', 'havregryn', 'gryn', 'müsli', 'mjöl', 'flour'], emoji: '🌾' },

  // Pantry, Oils, Drinks & Snacks
  { keys: ['olja', 'rapsolja', 'olivolja', 'solrosolja', 'oil'], emoji: '🌻' },
  { keys: ['kaffe', 'kaffebönor', 'bryggkaffe', 'espresso', 'coffee'], emoji: '☕' },
  { keys: ['te', 'tea'], emoji: '🫖' },
  { keys: ['juice', 'must', 'saft'], emoji: '🧃' },
  { keys: ['vatten', 'läsk', 'bubbelvatten', 'dryck', 'soda'], emoji: '🥤' },
  { keys: ['choklad', 'godis', 'chips', 'snacks', 'chocolate'], emoji: '🍫' }
];

function resolveGroceryIcon(iconStr = '', productName = '', category = '') {
  // 1. If explicit Unicode Emoji was provided directly (e.g. 🥒, 🥚, 🥛), use it
  if (iconStr && /\p{Extended_Pictographic}/u.test(iconStr)) {
    return iconStr;
  }

  const pName = (productName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const rawIcon = (iconStr || '').toLowerCase().trim();

  // 2. High Priority: Inspect actual Product Name first for precise semantic match
  for (const entry of GROCERY_ICON_MAP) {
    if (entry.keys.some(k => pName.includes(k))) {
      return entry.emoji;
    }
  }

  // 3. Medium Priority: Inspect Category
  for (const entry of GROCERY_ICON_MAP) {
    if (entry.keys.some(k => cat.includes(k))) {
      return entry.emoji;
    }
  }

  // 4. Low Priority: Check icon string if not generic
  if (rawIcon && rawIcon !== 'tomato' && rawIcon !== 'shopping-bag' && rawIcon !== 'grocery' && rawIcon !== 'bag') {
    for (const entry of GROCERY_ICON_MAP) {
      if (entry.keys.some(k => rawIcon.includes(k))) {
        return entry.emoji;
      }
    }
  }

  // 5. Safe, Neutral Universal Fallback (Shopping Bag / Basket)
  return '🛍️';
}

/* ── Pre-configured Swedish Persona Archetypes for ICA Testing ─────────────── */
const ICA_PERSONA_PRESETS = {
  eco: {
    target_persona: "Ekologiskt Medveten",
    personalization_reason: "Valt för dig baserat på dina tidigare köp av KRAV-märkta skafferivaror & mejeriprodukter",
    store_format: "ICA Maxi Stormarknad",
    store_name: "ICA Maxi Lindhagen, Stockholm",
    badge_type: "Personligt Stammispris",
    product: {
      name: "Ekologiska Krossade Tomater 400g",
      brand_line: "ICA I love eco",
      volume_weight: "400g",
      origin_badge: "Italien 🇮🇹",
      eco_badge: "EU Ekologiskt 🌿",
      category: "Skafferi & Konserver",
      icon: "🥫"
    },
    pricing: {
      deal_price_major: "10",
      deal_price_minor: "00",
      unit: "kr/st",
      regular_price: "16:95 kr/st",
      savings_text: "Spara 6:95 (41% rabatt)",
      comparison_price: "Jfr-pris 25:00/kg",
      limit_text: "Max 4 köp/stammis"
    },
    additional_deals: [
      {
        product: {
          name: "Svensk Nötfärs 12% Färsk",
          brand_line: "ICA Svensk Råvara",
          volume_weight: "500g",
          origin_badge: "Från Sverige 🇸🇪",
          eco_badge: "Klimatdeklarerad 🌱",
          category: "Kött & Chark",
          icon: "🥩"
        },
        pricing: {
          deal_price_major: "49",
          deal_price_minor: "90",
          unit: "kr/st",
          regular_price: "69:90 kr/st",
          savings_text: "Spara 20:00 (29% rabatt)",
          comparison_price: "Jfr-pris 99:80/kg"
        },
        badge_type: "Stammispris"
      },
      {
        product: {
          name: "Ekologisk Ekologisk Spaghetti 500g",
          brand_line: "ICA I love eco",
          volume_weight: "500g",
          origin_badge: "Italien 🇮🇹",
          eco_badge: "KRAV 🌿",
          category: "Skafferi & Pasta",
          icon: "🍝"
        },
        pricing: {
          deal_price_major: "14",
          deal_price_minor: "90",
          unit: "kr/st",
          regular_price: "21:90 kr/st",
          savings_text: "Spara 7:00 (32% rabatt)",
          comparison_price: "Jfr-pris 29:80/kg"
        },
        badge_type: "Stammispris"
      }
    ],
    recipe_suggestion: {
      title: "Klassisk Familjebolognese med Ekologiska Tomater & Basilika",
      prep_time: "25 min",
      servings: "4 port",
      difficulty: "Enkel",
      cost_per_serving: "ca 22 kr/port",
      ingredients: [
        "400g ICA I love eco Krossade Tomater (Erbjudande)",
        "500g Svensk Nötfärs 12% (Erbjudande)",
        "400g Spaghetti (Erbjudande)",
        "1 gul lök & 2 klyftor vitlök",
        "2 msk ICA Kallpressad Rapsolja",
        "Färsk basilika & riven parmesan"
      ],
      instructions_summary: "Bryn färs och lök i olja. Rör ner tomater och oregano. Sjud på svag värme 15 min under tiden pastan kokar al dente."
    },
    valid_until: "Söndag 30 aug",
    days_remaining: 7
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
    recipe_suggestion: {
      title: "Klassisk Familjelasagne med Riklig Köttfärssås & Mozzarella",
      prep_time: "45 min",
      servings: "6 port",
      difficulty: "Medel",
      cost_per_serving: "ca 26 kr/port",
      ingredients: [
        "1000g Färsk Svensk Nötfärs",
        "2 frp Krossade Tomater",
        "1 paket Lasagneplattor",
        "5 dl Mjölk & Bechamelsås",
        "150g Riven Gratängost"
      ],
      instructions_summary: "Varva köttfärssås, bechamel och lasagneplattor i ugnsform. Toppa med ost och grädda i 200°C i 30 minuter."
    },
    valid_until: "Söndag 30 aug",
    days_remaining: 7
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
    recipe_suggestion: {
      title: "Ugnsrostade Svenska Rotfrukter med Örter & Rapsolja",
      prep_time: "30 min",
      servings: "4 port",
      difficulty: "Enkel",
      cost_per_serving: "ca 14 kr/port",
      ingredients: [
        "500g Morötter & Palsternackor",
        "500g Fast Potatis",
        "3 msk ICA Kallpressad Rapsolja",
        "Flingsalt & Färsk Timjan"
      ],
      instructions_summary: "Klyfta rotfrukter, vänd i olja och kryddor. Rosta i ugn på 225°C i 25-30 minuter tills gyllene."
    },
    valid_until: "Söndag 30 aug",
    days_remaining: 7
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
    additional_look_items: [
      {
        product_name: "LUNA Wide-Leg Recycled Wool Trousers",
        category: "Bottoms",
        sustainability_tag: "100% Recycled Wool 🌿",
        regular_price: "€69.99",
        member_price: "€49.99",
        discount_pct: "-28%"
      },
      {
        product_name: "Organic Silk Touch Neck Scarf",
        category: "Accessories",
        sustainability_tag: "Organic Silk 🌿",
        regular_price: "€29.99",
        member_price: "€19.99",
        discount_pct: "-33%"
      }
    ],
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
 * both ICA Sverige (Swedish Grocery Deal Banner + Recipe) and Crazy Fashion (H&M-Style Editorial Drop Card).
 */
export default function A2UIOfferBanner({ data = {} }) {
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

  const hasRealData = Boolean(
    initialData && (initialData.product_name || initialData.pricing || initialData.collection_title)
  );

  const activeDrop = hasRealData ? {
    ...initialData,
    pricing: { ...(initialData.pricing || {}) }
  } : {
    ...FASHION_PERSONA_PRESETS[selectedPreset],
    ...initialData,
    pricing: {
      ...FASHION_PERSONA_PRESETS[selectedPreset].pricing,
      ...(initialData.pricing || {})
    }
  };

  const {
    collection_title = "STUDIO COLLECTION // AUTUMN 2026",
    drop_badge = "MEMBER EXCLUSIVE",
    product_name = "Tailored Garment",
    category = "Apparel",
    sustainability_tag = "100% Recycled Fibers 🌿",
    fit_and_fabric = "Relaxed Fit • Structured Weave",
    color_options = ["Oatmeal Heather", "Midnight Navy", "Charcoal Slate"],
    size_options = ["XS", "S", "M", "L", "XL"],
    pricing,
    additional_look_items,
    personalization_reason,
    target_persona,
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

        {hasRealData ? (
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '0.18rem 0.55rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Sparkles size={11} color="#fbbf24" />
            <span>{target_persona || 'VIP Member Curation'}</span>
          </div>
        ) : (
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
        )}
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

        {/* ── Optional "Complete the Look" Sub-Items ── */}
        {additional_look_items && additional_look_items.length > 0 && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.8rem'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={13} color="#4f46e5" />
              <span>Complete the Look with Matching Pieces</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {additional_look_items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-primary)',
                  padding: '0.5rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600 }}>{item.sustainability_tag}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 800, color: '#e11d48' }}>{item.member_price}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{item.regular_price}</span>
                    <button type="button" style={{
                      background: 'rgba(79, 70, 229, 0.12)',
                      border: '1px solid rgba(79, 70, 229, 0.3)',
                      color: '#4f46e5',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
 * 2. ICA SVERIGE // STAMMIS GROCERY DEAL BANNER & RECIPE COMPONENT
 * ───────────────────────────────────────────────────────────────────────────── */
function IcaOfferBannerComponent({ initialData = {} }) {
  const [selectedPersona, setSelectedPersona] = useState('eco');
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [isLoadedToCard, setIsLoadedToCard] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [showRecipe, setShowRecipe] = useState(true);
  const [ingredientsChecked, setIngredientsChecked] = useState({});
  const [isListSaved, setIsListSaved] = useState(false);

  const hasRealData = Boolean(
    initialData && (initialData.product || initialData.pricing || initialData.personalization_reason)
  );

  const baseOffer = hasRealData ? {
    ...initialData,
    product: { ...(initialData.product || {}) },
    pricing: { ...(initialData.pricing || {}) },
    additional_deals: initialData.additional_deals || [],
    recipe_suggestion: initialData.recipe_suggestion || null
  } : {
    ...ICA_PERSONA_PRESETS[selectedPersona],
    ...initialData,
    product: { ...ICA_PERSONA_PRESETS[selectedPersona].product, ...(initialData.product || {}) },
    pricing: { ...ICA_PERSONA_PRESETS[selectedPersona].pricing, ...(initialData.pricing || {}) },
    additional_deals: ICA_PERSONA_PRESETS[selectedPersona].additional_deals || [],
    recipe_suggestion: ICA_PERSONA_PRESETS[selectedPersona].recipe_suggestion || null
  };

  // Compile all deals into a unified array for tab navigation
  const allDeals = [
    {
      product: baseOffer.product,
      pricing: baseOffer.pricing,
      badge_type: baseOffer.badge_type || "Stammispris",
      recipe_suggestion: baseOffer.recipe_suggestion
    },
    ...(baseOffer.additional_deals || [])
  ];

  const currentDeal = allDeals[activeDealIndex] || allDeals[0];
  const activeProduct = currentDeal.product || {};
  const activePricing = currentDeal.pricing || {};
  const activeRecipe = currentDeal.recipe_suggestion || baseOffer.recipe_suggestion;

  const {
    store_format = "ICA Maxi Stormarknad",
    store_name = "ICA Maxi Lindhagen, Stockholm",
    personalization_reason = "Valt för dig baserat på dina tidigare köp av mejeriprodukter",
    target_persona,
    valid_until = "Söndag 24 aug",
    days_remaining = 3,
  } = baseOffer;

  const handleCardLoadToggle = () => {
    setIsLoadedToCard(prev => !prev);
  };

  const handleToggleIngredient = (idx) => {
    setIngredientsChecked(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleSaveIngredientsToList = () => {
    setIsListSaved(true);
    setTimeout(() => setIsListSaved(false), 3000);
  };

  const resolvedIcon = resolveGroceryIcon(activeProduct.icon, activeProduct.name, activeProduct.category);

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
      {/* ── Top Header: Brand, Store Format & Persona Display ── */}
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

        {hasRealData ? (
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            letterSpacing: '0.02em'
          }}>
            <Sparkles size={11} color="#ffffff" />
            <span>{target_persona || 'Personligt Stammispris'}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85, marginRight: '0.2rem' }}>
              Persona:
            </span>
            {Object.keys(ICA_PERSONA_PRESETS).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedPersona(key);
                  setActiveDealIndex(0);
                }}
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
        )}
      </div>

      {/* ── Multi-Deal Bundle Tabs (If multiple offerings are present) ── */}
      {allDeals.length > 1 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.5rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.2rem', whiteSpace: 'nowrap' }}>
            Dina {allDeals.length} Erbjudanden:
          </span>
          {allDeals.map((deal, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveDealIndex(idx)}
              style={{
                fontSize: '0.72rem',
                fontWeight: activeDealIndex === idx ? 800 : 600,
                background: activeDealIndex === idx ? '#E01E26' : 'var(--bg-primary)',
                color: activeDealIndex === idx ? '#ffffff' : 'var(--text-main)',
                border: activeDealIndex === idx ? '1px solid #E01E26' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span>{resolveGroceryIcon(deal.product?.icon, deal.product?.name, deal.product?.category)}</span>
              <span>{deal.product?.name || `Erbjudande ${idx + 1}`}</span>
              <strong style={{ opacity: activeDealIndex === idx ? 1 : 0.8 }}>
                {deal.pricing?.deal_price_major ? `${deal.pricing.deal_price_major}:-` : ''}
              </strong>
            </button>
          ))}
        </div>
      )}

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
              {currentDeal.badge_type || "Stammispris"}
            </span>
            {activeProduct.eco_badge && (
              <span style={{
                background: 'rgba(46, 125, 50, 0.12)',
                color: '#2e7d32',
                border: '1px solid rgba(46, 125, 50, 0.3)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.18rem 0.5rem',
                borderRadius: '6px'
              }}>
                {activeProduct.eco_badge}
              </span>
            )}
            {activeProduct.origin_badge && (
              <span style={{
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.18rem 0.5rem',
                borderRadius: '6px'
              }}>
                {activeProduct.origin_badge}
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
          {/* Resolved Food Emoji / Icon */}
          <div style={{
            fontSize: '2.5rem',
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            {resolvedIcon}
          </div>

          {/* Name & Subtitle */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {activeProduct.brand_line || 'ICA'} • {activeProduct.volume_weight || ''}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.15rem 0' }}>
              {activeProduct.name || 'Produkt'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {activePricing.comparison_price} • Ord. pris {activePricing.regular_price}
            </div>
          </div>

          {/* Large Swedish Deal Price */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', color: '#E01E26', lineHeight: 1 }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                {activePricing.deal_price_major || '0'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                :{activePricing.deal_price_minor || '00'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#E01E26', marginTop: '0.2rem' }}>
              {activePricing.unit || 'kr/st'}
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
              {activePricing.savings_text}
            </div>
          </div>
        </div>

        {/* ── Interactive Swedish Recipe Pairing Drawer (ICA Specialty) ── */}
        {activeRecipe && (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(224, 30, 38, 0.25)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Recipe Header Toggle */}
            <button
              type="button"
              onClick={() => setShowRecipe(prev => !prev)}
              style={{
                width: '100%',
                background: 'rgba(224, 30, 38, 0.05)',
                border: 'none',
                borderBottom: showRecipe ? '1px solid rgba(224, 30, 38, 0.15)' : 'none',
                padding: '0.7rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={16} color="#E01E26" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E01E26' }}>
                  🍳 Veckans Stammis-Recept: {activeRecipe.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {showRecipe ? 'Dölj recept' : 'Visa recept & ingredienser'}
                </span>
                {showRecipe ? <ChevronUp size={15} color="#E01E26" /> : <ChevronDown size={15} color="#E01E26" />}
              </div>
            </button>

            {/* Expandable Recipe Body */}
            {showRecipe && (
              <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Recipe Metrics Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} color="#E01E26" /> {activeRecipe.prep_time || '25 min'}
                  </span>
                  <span style={{ fontSize: '0.68rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Utensils size={11} color="#E01E26" /> {activeRecipe.servings || '4 port'}
                  </span>
                  <span style={{ fontSize: '0.68rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Svårighet: {activeRecipe.difficulty || 'Enkel'}
                  </span>
                  {activeRecipe.cost_per_serving && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.25)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                      💰 {activeRecipe.cost_per_serving}
                    </span>
                  )}
                </div>

                {/* Ingredients Checklist */}
                {activeRecipe.ingredients && activeRecipe.ingredients.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Ingredienser:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.35rem' }}>
                      {activeRecipe.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleIngredient(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontSize: '0.72rem',
                            color: ingredientsChecked[idx] ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: ingredientsChecked[idx] ? 'line-through' : 'none',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '4px',
                            border: ingredientsChecked[idx] ? '1px solid #E01E26' : '1px solid var(--border-color)',
                            background: ingredientsChecked[idx] ? '#E01E26' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {ingredientsChecked[idx] && <Check size={10} color="#ffffff" />}
                          </div>
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions summary & Inköpslista CTA */}
                {activeRecipe.instructions_summary && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0', fontStyle: 'italic', lineHeight: '1.4' }}>
                    💡 <strong>Tillagningstips:</strong> {activeRecipe.instructions_summary}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveIngredientsToList}
                  style={{
                    alignSelf: 'flex-start',
                    background: isListSaved ? '#2e7d32' : 'var(--bg-secondary)',
                    color: isListSaved ? '#ffffff' : '#E01E26',
                    border: '1px solid rgba(224, 30, 38, 0.3)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isListSaved ? <Check size={13} /> : <Plus size={13} />}
                  <span>{isListSaved ? '✓ Sparat i ICA Inköpslista!' : 'Lägg ingredienser i Inköpslistan'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Controls: Stammis Card Activation & Barcode Toggle */}
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
            <span>
              {isLoadedToCard 
                ? (allDeals.length > 1 ? `✓ Laddat alla ${allDeals.length} erbjudanden på ditt Stammiskort` : '✓ Laddat på ditt Stammiskort')
                : (allDeals.length > 1 ? `Ladda alla ${allDeals.length} erbjudanden till kortet` : 'Ladda till kortet')}
            </span>
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
              justifyContent: 'center'
            }}
            title="Visa Streckkod för Snabbkassa"
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
