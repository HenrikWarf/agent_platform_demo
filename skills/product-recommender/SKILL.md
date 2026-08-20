---
name: product-recommender
description: "Recommends curated product selections for Crazy Fashion customer segments based on RFM metrics, demographic attributes, past transaction affinity, behavioral events, and product catalog metadata."
version: 1.0.0
category: merchandising_recommendations
---

# Product Recommendation & Merchandising Skill — Crazy Fashion

## Overview
This skill guides the **Recommendation Pipeline** (`recommendation_reasoner` ➔ `recommendation_formatter`) in curating data-driven product assortments for target customer segments using live BigQuery customer intelligence and product catalog attributes.

---

## 1. Core Principles & Heuristics

Every recommendation brief must produce **exactly 5 products** tailored to the segment's distinct profile:

### Segment Merchandising Matrix
1. **VIP Fashionistas** (Avg Spend >€1,500, Platinum/Gold Tier, Low Churn):
   - **Merchandising Focus**: High-ticket premium outerwear, limited-edition designer collaborations, 100% recycled cashmere/wool, fine jewelry.
   - **Price Sensitivity**: Low (€60 – €200+).
   - **Sample Heroes**: `PROD-020` (STONE Wool Overcoat, €199.99), `PROD-011` (STORM Tech Parka, €179.99), `PROD-050` (COLLAB x Designer Hoodie, €79.99), `PROD-010` (EIRA Cashmere Scarf, €69.99).

2. **Loyal Regulars** (Avg Spend €800–€2,500, Gold/Silver Tier, High Frequency):
   - **Merchandising Focus**: Versatile everyday workwear, premium organic cotton essentials, circular knitwear, and home & living textiles.
   - **Price Sensitivity**: Medium (€35 – €90).
   - **Sample Heroes**: `PROD-001` (NOVA Oversized Blazer, €89.99), `PROD-005` (LYRA Knit Sweater, €39.99), `PROD-013` (FJORD Oxford Shirt, €39.99), `PROD-037` (MJUK Throw Blanket, €49.99).

3. **Seasonal Shoppers** (Avg Spend €200–€800, Silver/Bronze Tier, High Inactivity between seasons):
   - **Merchandising Focus**: Weather-transition jackets, seasonal capsule drops, activewear, and statement accessories.
   - **Price Sensitivity**: Medium-Low (€25 – €75).
   - **Sample Heroes**: `PROD-003` (FRÖST Puffer Jacket, €129.99), `PROD-016` (TIDE Denim Jacket, €79.99), `PROD-026` (SNÖFLINGA Fleece Set, €34.99), `PROD-043` (MOVE Yoga Leggings, €34.99).

4. **New Explorers** (Avg Spend €40–€250, Young Demographics 18–35, Bronze Tier):
   - **Merchandising Focus**: Trend-forward streetwear, viral social styles, accessible entry-price denim, and everyday tees.
   - **Price Sensitivity**: High / Entry Level (€15 – €55).
   - **Sample Heroes**: `PROD-009` (VERA Wide-Leg Trousers, €54.99), `PROD-002` (DRIFT Slim Jeans, €49.99), `PROD-041` (ESSENTIALS Crew T-Shirt 3-Pack, €24.99), `PROD-034` (WEEKEND Crossbody Bag, €39.99).

5. **Dormant At-Risk** (Recency >90 days, Churn Risk >0.65, Lapsed Buyers):
   - **Merchandising Focus**: Universally appealing bestsellers, seasonal revival staples, and giftable items with voucher incentive pairings.
   - **Price Sensitivity**: Value-Driven (€20 – €60).
   - **Sample Heroes**: `PROD-005` (LYRA Knit Sweater, €39.99), `PROD-043` (MOVE Yoga Leggings, €34.99), `PROD-035` (NORDIC Wool Socks 5-Pack, €24.99), `PROD-001` (NOVA Oversized Blazer, €89.99).

---

## 2. Product Catalog Schema (`product_catalog`)
All recommendations MUST reference real catalog items from `agent-demo-09.marketing_analytics.product_catalog`:
- `product_id` (e.g. `PROD-001`)
- `product_name` (e.g. `NOVA Oversized Blazer`)
- `category` (Womenswear, Menswear, Kids & Baby, Accessories, Home & Living)
- `subcategory` (Outerwear, Denim, Knitwear, Dresses, Tops, Bags, Bedding, etc.)
- `price_eur` (All pricing in EUR)
- `description` (Detailed product features)
- `sustainability_certified` (Boolean)
- `collection` (Autumn/Winter 2026, Spring/Summer 2026, Essentials, Collaboration)

---

## 3. Structured Recommendation Output Rules
1. **Curate Exactly 5 Products**: Select 5 complementary products spanning hero pieces, core essentials, and accessories.
2. **Data-Driven Rationale**: For each recommended product, write a 2-3 sentence data-driven explanation citing why this product matches the segment's age profile, spend history, and category affinity.
3. **Merchandising Strategy Summary**: Provide an overarching 2-3 sentence strategy summarizing how the selected assortment balances price point, seasonal relevance, and Crazy Fashion sustainability values.
4. **EUR Currency Standard**: All prices must be formatted in EUR (€).
