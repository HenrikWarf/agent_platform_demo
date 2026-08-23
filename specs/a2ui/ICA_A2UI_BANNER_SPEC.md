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
    "name": "Ekologisk Svensk Mellanmjölk",
    "brand_line": "ICA I love eco",
    "volume_weight": "1.5 Liter",
    "origin_badge": "Från Sverige 🇸🇪",
    "eco_badge": "KRAV 🌿",
    "category": "Mejeri & Ägg",
    "icon": "milk"
  },
  "pricing": {
    "deal_price_major": "24",
    "deal_price_minor": "90",
    "unit": "kr/st",
    "regular_price": "34:90 kr/st",
    "savings_text": "Spara 10:00 (29% rabatt)",
    "comparison_price": "Jfr-pris 16:60/l",
    "limit_text": "Max 2 köp/stammis"
  },
  "validity": {
    "valid_until": "Söndag 24 aug",
    "days_remaining": 3,
    "status": "active"
  },
  "interactive_actions": [
    { "id": "load_to_card", "label": "Ladda till kortet", "type": "toggle" },
    { "id": "add_to_list", "label": "Lägg i inköpslista", "type": "counter" },
    { "id": "view_recipe", "label": "Receptförslag", "type": "accordion" }
  ],
  "recipe_suggestion": {
    "title": "Krämig Kardemummakaka på Ekologisk Mjölk & Smör",
    "prep_time": "35 min",
    "servings": "6 port"
  }
}
```

---

## 4. Interactive UX Capabilities

1. **"Ladda till kortet" (Card Activation)**:
   - Interactive button with spring micro-interaction.
   - Default: `[ + Ladda till kortet ]` (ICA Red button).
   - Activated: `[ ✓ Laddat på ditt ICA-kort ]` (Emerald Green button with checkmark badge).
2. **"Lägg i inköpslista" (Shopping List Counter)**:
   - Increments/decrements quantity directly within the chat widget.
3. **Interactive Persona Simulator**:
   - Segment switchers: **Familj**, **Ekologiskt Medveten**, **Student/Budget**, **Gourmet/Helg**.
   - Shows how the deal offer dynamically re-renders for each Swedish customer archetype.
