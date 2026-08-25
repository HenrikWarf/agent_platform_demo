---
name: ica-product-recommender
description: "Curates Swedish grocery assortments and recipe pairings from the ICA BigQuery catalog based on customer segments and dietary preferences."
version: 1.0.0
category: product_recommendation
tenant: ica_sweden
---

# Product Recommendations & Merchandising Skill — ICA Sverige

## Assortment Curation Guidelines
- Query `agent-demo-09.marketing_analytics_ica.product_catalog` to select active grocery products.
- Recommend strictly 5 products when a full recommendation list is requested.
- Provide data-driven justification for each item citing segment traits, meal inspiration, and price in SEK (kr).

## Merchandising Archetypes
- **Barnfamiljer Storhandlare**: Storköpsförpackningar, svensk ekologisk köttfärs, fullkornspasta, frukostmejeri, bananer.
- **Ekologiskt Medvetna**: KRAV-märkt havremjölk, svensk ekologisk blandfärs, närodlade rotfrukter, Änglamark/I love eco sortiment.
- **Lojala Veckohandlare**: Veckomatsedelns basvaror, färsk laxfilé, svensk hushållsost, säsongens grönsaker.
- **Inaktiva Stammisar**: Högvärdiga personliga Stammisklipp, helgmiddagsfavoriter med 20% välkomstrabatt.
