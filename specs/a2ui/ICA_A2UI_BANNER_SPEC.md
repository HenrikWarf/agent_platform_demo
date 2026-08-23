# ICA Sweden — A2UI Personalized Deal & Offer Banner Specification

> **Specification for Agent-to-UI (A2UI) dynamic component generation for ICA Sweden (ICA Gruppen), personalizing grocery deals, Stammis loyalty pricing, and app retail banners.**

---

## 1. Brand Identity & Visual Attributes (ICA Sweden)

**ICA (Inköpscentralernas Aktiebolag)** is Sweden's leading grocery retailer with ~1,300 stores across 4 store profiles (ICA Maxi, ICA Kvantum, ICA Supermarket, ICA Nära).

### 1.1 Color Palette & Tokens
* **Primary Brand Red**: `#E01E26` (Iconic ICA Red — dominant header, primary buttons, price emphasis).
* **Stammis Loyalty Yellow**: `#FFE600` / `#F9B000` (Stammis badges, loyalty points, member highlight).
* **Fresh / Eco Green**: `#008744` / `#059669` (Eco badges, "KRAV", "ICA I love eco", loaded status).
* **Neutral Charcoal & Text**: `#1F2328` / `#111827` (Headlines, product titles, dark mode text).
* **Surface Backgrounds**:
  * Light: `#FFFFFF` (Card surface), `#F4F5F7` (App background), `#FFF5F5` (Deal card background tint).
  * Dark: `#1E1F23` (Card surface), `#121316` (App background).
* **Borders & Dividers**: `#E5E7EB` / `#D1D5DB`.

### 1.2 Typography & Tone of Voice
* **Typeface**: Clean, rounded Scandinavian sans-serif (inspired by custom typefaces *ICA Rubrik* and *ICA Text*).
* **Tone of Voice**: Warm, welcoming, helpful, food-loving, Swedish ("Gott!", "Klipp!", "Enkelt & vardagsgott").
* **Key Swedish Retail Terminology**:
  * `Stammispris`: Exclusive loyalty club price.
  * `Personligt erbjudande`: Machine-learning personalized discount based on previous receipts.
  * `Ladda till kortet`: Pre-activating a coupon onto the ICA card / BankID digital membership.
  * `Jfr-pris`: Mandatory Swedish comparison price (e.g. `Jfr-pris 59:90/kg`).
  * `KRAV / Från Sverige`: Verified Swedish origin and organic certification badges.

---

## 2. Component Layout & Visual Hierarchy

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 │ [ICA Stammis] ICA Maxi Lindhagen                    👤 Valt för dig: Ekologiska Mejerier │
 ├──────────────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                          │
 │   ┌──────────────┐   Arla / ICA I love eco                                               │
 │   │   PRODUCT    │   Ekologisk Svensk Mellanmjölk 1.5L                                   │
 │   │   CUTOUT     │   🇸🇪 Från Sverige  🌿 KRAV  🌱 Klimatkompenserad                      │
 │   │    IMAGE     │                                                                       │
 │   │   [🥛]       │   ┌────────────────────────────────────────┐                          │
 │   └──────────────┘   │  STAMMISPRIS                           │                          │
 │                      │  24:90 kr/st    Ord. 34:90 (Spara 10:-)│                          │
 │                      │  Jfr-pris 16:60/l • Max 2 köp/hushåll  │                          │
 │                      └────────────────────────────────────────┘                          │
 │                                                                                          │
 ├──────────────────────────────────────────────────────────────────────────────────────────┤
 │  ⏱️ Gäller t.o.m. söndag 24 aug  •  Endast 3 dagar kvar                                   │
 ├──────────────────────────────────────────────────────────────────────────────────────────┤
 │  [ + Ladda till kortet ]      [ 🛒 Lägg i inköpslista ]      [ 🍳 Se matchande recept ▼] │
 └──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. A2UI Declarative JSON Schema

The agent generates a structured JSON payload conforming to `A2UIOfferBannerSchema`:

```json
{
  "brand": "ICA",
  "store_format": "ICA Maxi Stormarknad",
  "store_name": "ICA Maxi Lindhagen, Stockholm",
  "badge_type": "Stammispris",
  "personalization_reason": "Valt för dig baserat på dina tidigare köp av ekologiska mejeriprodukter",
  "product": {
    "name": "Ekologiska Krossade Tomater 400g",
    "brand_line": "ICA I love eco",
    "volume_weight": "400g",
    "origin_badge": "Italien 🇮🇹",
    "eco_badge": "EU Ekologiskt 🌿",
    "category": "Skafferi & Konserver",
    "icon": "tomato"
  },
  "pricing": {
    "deal_price_major": "10",
    "deal_price_minor": "00",
    "unit": "kr/st",
    "regular_price": "16:95 kr/st",
    "savings_text": "Spara 6:95 (41% rabatt)",
    "comparison_price": "Jfr-pris 25:00/kg",
    "limit_text": "Max 4 köp/stammis"
  },
  "additional_deals": [
    {
      "product": {
        "name": "Svensk Nötfärs 12% Färsk",
        "brand_line": "ICA Svensk Råvara",
        "volume_weight": "500g",
        "origin_badge": "Från Sverige 🇸🇪",
        "eco_badge": "Klimatdeklarerad 🌱",
        "category": "Kött & Chark",
        "icon": "meat"
      },
      "pricing": {
        "deal_price_major": "49",
        "deal_price_minor": "90",
        "unit": "kr/st",
        "regular_price": "69:90 kr/st",
        "savings_text": "Spara 20:00 (29% rabatt)",
        "comparison_price": "Jfr-pris 99:80/kg"
      },
      "badge_type": "Stammispris"
    }
  ],
  "valid_until": "Söndag 24 aug",
  "days_remaining": 3,
  "recipe_suggestion": {
    "title": "Klassisk Familjebolognese med Ekologiska Tomater & Basilika",
    "prep_time": "25 min",
    "servings": "4 port",
    "difficulty": "Enkel",
    "cost_per_serving": "ca 22 kr/port",
    "ingredients": [
      "400g ICA I love eco Krossade Tomater (Stammispris)",
      "500g Svensk Nötfärs 12% (Stammispris)",
      "400g Spaghetti",
      "1 gul lök & 2 klyftor vitlök",
      "2 msk ICA Kallpressad Rapsolja"
    ],
    "instructions_summary": "Bryn färs och lök i olja. Rör ner tomater och oregano. Sjud på svag värme 15 min under tiden pastan kokar."
  }
}
```

---

## 4. Interactive UX Capabilities

1. **"Ladda till kortet" (Card Activation)**:
   - Interactive button with spring micro-interaction.
   - Single Deal: `[ + Ladda till kortet ]` ➔ `[ ✓ Laddat på ditt Stammiskort ]`.
   - Multi-Deal Bundle: `[ + Ladda alla 3 erbjudanden till kortet ]` (activates complete meal basket in one click).
2. **Interactive Swedish Recipe Drawer (`ICA Recept`)**:
   - Expandable meal inspiration accordion with cooking time, portions, difficulty, and budget price per serving.
   - Interactive checklist allowing customers to check off ingredients they already have at home.
   - Direct *"Lägg ingredienser i ICA Inköpslistan"* action button.
3. **Multi-Deal Tabbed Navigation**:
   - Horizontal tab pills allowing users to preview and inspect each item in a dinner bundle.
4. **In-Store Barcode / Self-Scanning Drawer**:
   - Quick-toggle in-store barcode display with coupon code for checkout scanning.
5. **Food Emoji & Asset Resolver**:
   - Maps category strings ('milk', 'tomato', 'meat', 'fish', 'cheese', 'oil', etc.) to Swedish food emojis.
