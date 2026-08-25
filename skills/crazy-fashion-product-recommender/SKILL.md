---
name: crazy-fashion-product-recommender
description: "Executes BigQuery transaction analytics and curates high-affinity 5-item fashion capsule collections for Crazy Fashion customer segments."
version: 2.0.0
category: product_recommendation
tenant: crazy_fashion
---

# Product Recommendations & Merchandising Skill — Crazy Fashion

## 1. Analytical Discovery Workflow (BigQuery SQL)
Before recommending products, query `agent-demo-09.marketing_analytics` using available SQL/MCP tools to ground recommendations in empirical purchase behavior:

```sql
SELECT 
  p.product_id,
  p.product_name,
  p.category,
  p.subcategory,
  p.price_eur,
  p.sustainability_certified,
  COUNT(t.transaction_id) AS cohort_purchases,
  ROUND(SUM(t.amount_eur), 1) AS cohort_revenue_eur,
  COUNT(DISTINCT t.customer_id) AS unique_buyers
FROM `agent-demo-09.marketing_analytics.customer_transactions` t
JOIN `agent-demo-09.marketing_analytics.customer_rfm_summary` r ON t.customer_id = r.customer_id
JOIN `agent-demo-09.marketing_analytics.product_catalog` p ON t.product_id = p.product_id
WHERE r.rfm_segment = @target_cohort -- e.g. 'VIP Fashionistas', 'Seasonal Shoppers', etc.
GROUP BY 1,2,3,4,5,6
ORDER BY cohort_purchases DESC
LIMIT 15;
```

Additionally inspect recent style browsing intent in `customer_events` and validate price points against the cohort's average monetary spend in EUR (`customer_rfm_summary.total_monetary_eur`).

---

## 2. The 5-Item "Capsule Wardrobe" Formula
Every 5-product fashion recommendation assortment must represent a cohesive, styled Nordic capsule edit:

1. **Item 1: Hero Outerwear or Tailoring Piece**: Statement coat, blazer, or structured trench.
2. **Item 2: Core Layering Knit / Top**: Premium cashmere, organic cotton rib top, or silk shirt.
3. **Item 3: Essential Bottom**: Tailored wide-leg trousers, recycled denim, or pleated midi skirt.
4. **Item 4: Footwear Anchor**: Leather boots, classic loafers, or minimalist sneakers.
5. **Item 5: Accenting Accessory**: Recycled wool scarf, leather tote bag, or minimalist belt.

---

## 3. Brand & Pricing Rules
- Ensure all prices are in Euros (**EUR / €**).
- Highlight conscious materials (*100% Recycled Italian Wool 🌿*, *GOTS Organic Cotton*, *LWG Leather*).

---

## 4. Required Output Justification Structure
For each product:
- **Empirical Cohort Fit**: Reference historical transaction volume or category spend share from BigQuery.
- **Styling Synergy**: Explain how it coordinates with the rest of the capsule look.
- **Loyalty Value**: Note Crazy Club points generated (`+XX Club Points`) and member pricing tier.
