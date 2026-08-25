---
name: crazy-fashion-product-recommender
description: "Curates high-affinity fashion product assortments from the Crazy Fashion BigQuery catalog based on customer segments and purchase patterns."
version: 1.0.0
category: product_recommendation
tenant: crazy_fashion
---

# Product Recommendations & Merchandising Skill — Crazy Fashion

## Assortment Curation Guidelines
- Query `agent-demo-09.marketing_analytics.product_catalog` to select active products.
- Recommend strictly 5 products when a full recommendation list is requested.
- Provide data-driven justification for each product citing segment traits and price in EUR (€).

## Merchandising Archetypes
- **VIP Fashionistas**: Cashmere knitwear, tailored wool coats, leather accessories, Studio Collection items.
- **Seasonal Shoppers**: Seasonal wardrobe staples, transitional jackets, versatile everyday knitwear.
- **Dormant At-Risk**: High-affinity giftable accessories, iconic classics with 15% incentive vouchers.
- **New Explorers**: Entry-price essentials, sustainable denim, introductory hero garments.
