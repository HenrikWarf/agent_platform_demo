---
name: product-recommender
description: "Recommends curated 5-product assortments for Crazy Fashion (Nordic Fashion, EUR) and ICA Sverige (Swedish Grocery, SEK) customer segments based on RFM metrics, demographic traits, and product catalog metadata."
version: 2.1.0
category: merchandising_recommendations
---

# Product Recommendation & Merchandising Skill

## Overview
This skill guides the **Recommendation Pipeline** (`recommendation_reasoner` ➔ `recommendation_formatter`) in curating data-driven 5-product assortments for target customer segments using live BigQuery customer intelligence and product catalog attributes:
- **ICA Sverige**: Dataset `agent-demo-09.marketing_analytics_ica.product_catalog` (Swedish Grocery, SEK)
- **Crazy Fashion**: Dataset `agent-demo-09.marketing_analytics.product_catalog` (Nordic Apparel, EUR)

---

## 1. ICA Sverige Merchandising Matrix (Grocery & Stammis)

1. **Ekologiskt Medvetna** (High Organic Share, KRAV & Eko affinity):
   - **Focus**: Organic dairy, KRAV produce, Fairtrade coffee, plant-based items.
   - **Sample Heroes**: `PROD-ICA-001` (ICA I love eco Krossade Tomater), `PROD-ICA-002` (Ekologiska Lantägg 12p), `PROD-ICA-004` (Svensk Rapsolja Kallpressad).

2. **Barnfamiljer Storhandlare** (Large Baskets, Family Packs, High Volume):
   - **Focus**: Family pack ground beef, bulk pasta, taco dinner sets, milk multi-packs.
   - **Sample Heroes**: `PROD-ICA-005` (Svensk Nötfärs 12% 1000g Storpack), `PROD-ICA-006` (Spaghetti 1kg), `PROD-ICA-008` (Mellanmjölk 1.5L).

3. **Prisjägare & Studenter** (Value Focus, Price Sensitivity, Extra Stammispriser):
   - **Focus**: High-utility pantry staples, budget staples, seasonal root vegetables.
   - **Sample Heroes**: `PROD-ICA-004` (ICA Gott Liv Rapsolja), `PROD-ICA-009` (Potatis Fast 2kg).

4. **Lojala Veckohandlare** & **Inaktiva Stammisar**:
   - **Focus**: High-convenience everyday items, fresh bakery, win-back staple discounts.

---

## 2. Crazy Fashion Merchandising Matrix (Nordic Apparel)

1. **VIP Fashionistas** (High Spend >€1,500, Platinum/Gold Tier):
   - **Focus**: Premium outerwear, designer collaborations, 100% recycled cashmere/wool, fine accessories.
   - **Sample Heroes**: `PROD-020` (STONE Wool Overcoat, €199.99), `PROD-001` (NOVA Oversized Blazer, €89.99).

2. **Loyal Regulars** (High Frequency, Gold/Silver Tier):
   - **Focus**: Versatile everyday workwear, premium organic cotton essentials, circular knitwear.
   - **Sample Heroes**: `PROD-005` (LYRA Knit Sweater, €39.99), `PROD-013` (FJORD Oxford Shirt, €39.99).

3. **Seasonal Shoppers** & **New Explorers**:
   - **Focus**: Trend-forward capsule drops, streetwear, weather-transition jackets.

4. **Dormant At-Risk**:
   - **Focus**: Bestsellers, staple denim, giftable knitwear paired with voucher incentives.

---

## 3. Structured Recommendation Output Rules
1. **Curate Exactly 5 Products**: Select 5 complementary products spanning hero pieces, core essentials, and accessories.
2. **Data-Driven Rationale**: For each recommended product, write a 2-3 sentence data-driven explanation citing segment affinity.
3. **Currency Alignment**: Format prices in **SEK (kr)** for ICA Sverige, **EUR (€)** for Crazy Fashion.

