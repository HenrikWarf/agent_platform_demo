---
name: ica-product-recommender
description: "Executes BigQuery transaction analytics and curates balanced 5-item Swedish grocery baskets and recipe synergies for ICA Sverige customer segments."
version: 2.0.0
category: product_recommendation
tenant: ica_sweden
---

# Product Recommendations & Merchandising Skill — ICA Sverige

## 1. Analytical Discovery Workflow (BigQuery SQL)
Before recommending products, query `agent-demo-09.marketing_analytics_ica` using available SQL/MCP tools to ground recommendations in empirical purchase behavior:

```sql
SELECT 
  p.product_id,
  p.product_name,
  p.category,
  p.subcategory,
  p.price_sek,
  p.sustainability_certified,
  COUNT(t.transaction_id) AS cohort_purchases,
  ROUND(SUM(t.amount_sek), 1) AS cohort_revenue_sek,
  COUNT(DISTINCT t.customer_id) AS unique_buyers
FROM `agent-demo-09.marketing_analytics_ica.customer_transactions` t
JOIN `agent-demo-09.marketing_analytics_ica.customer_rfm_summary` r ON t.customer_id = r.customer_id
JOIN `agent-demo-09.marketing_analytics_ica.product_catalog` p ON t.product_id = p.product_id
WHERE r.rfm_segment = @target_cohort -- e.g. 'Barnfamiljer Storhandlare', 'Ekologiskt Medvetna', etc.
GROUP BY 1,2,3,4,5,6
ORDER BY cohort_purchases DESC
LIMIT 15;
```

Additionally inspect recent browsing intent in `customer_events` and validate price elasticity against the segment's average monetary spend in SEK (`customer_rfm_summary.total_monetary_sek`).

---

## 2. The ICA 5-Item "Complete Balanced Basket" Formula
Every 5-product recommendation assortment must represent a cohesive, balanced Swedish household weekly basket:

1. **Item 1: Dinner Hero (`Huvudråvara`)**:
   - The central dinner protein or plant-based core (e.g. *Färsk Svensk Laxfilé 4x125g*, *Svensk Kycklingbröstfilé 1kg*, *Svensk Ekologisk Nötfärs 500g*).
2. **Item 2: Fresh Produce (`Grönt & Fräscht`)**:
   - Seasonal Swedish vegetables or fruits (e.g. *Svensk Färsk Broccoli 250g*, *Svenska Ekologiska Morötter 1kg KRAV*, *Körsbärstomater i ask 250g Eko*).
3. **Item 3: Pantry Staple (`Skafferibas`)**:
   - Everyday pantry essential or carb base (e.g. *Ekologisk Pasta Penne Rigate 500g*, *Svenska Havregryn Ekologiska 1.5kg*, *Gevalia Mellanrost Bryggkaffe 450g*).
4. **Item 4: Dairy & Everyday Staple (`Vardagsmejeri & Frukost`)**:
   - High-turnover breakfast or dairy item (e.g. *Ekologisk Svensk Mellanmjölk 1.5L*, *Grekisk Yoghurt Eko 1kg*, *Svensk Hushållsost 1kg*).
5. **Item 5: High-Value Stammis Deal (`Stammisklipp & Värdedrivare`)**:
   - Perceived high savings driver, weekend treat, or Apotek wellness item (e.g. *Handskalade Räkor i Lake 280g*, *Hjärtats Multivitamin Man/Kvinna*, *Färska Kanelbullar Butiksbakade*).

---

## 3. Provenance, Sustainability & Currency Rules
- **Swedish Provenance**: Prioritize products carrying *Från Sverige*, *KRAV*, *Svenskt Sigill*, or *MSC* certifications.
- **Currency & Pricing**: Ensure all retail prices are formatted in Swedish Kronor (**SEK / kr**).
- **Segment Alignment**:
  - *Barnfamiljer Storhandlare*: Large family pack sizes, staple nutrition, high volume-to-price ratio.
  - *Ekologiskt Medvetna*: KRAV / I love eco assortment, plant-based alternatives, seasonal organic root crops.
  - *Lojala Veckohandlare*: Consistent weekday meal builders, premium freshness, familiar Nordic classics.
  - *Inaktiva Stammisar*: Irresistible Stammis member deals with deep discounts to trigger win-back shopping trips.

---

## 4. Required Output Justification Structure
For each of the 5 recommended products, provide a structured data-driven justification:
- **Empirical Cohort Fit**: Cite historical purchase volume, penetration %, or category spend share from BigQuery.
- **Basket Role & Meal Synergy**: Explain how the item complements the other 4 items into a complete weekly meal (e.g. 20-minute weekday dinner).
- **Stammis Loyalty Impact**: Note the estimated Stammis bonus points earned (`+XX Stammis-poäng`) and member value proposition.
