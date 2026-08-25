---
name: ica-customer-analytics
description: "Executes BigQuery SQL queries on ICA Sverige Swedish grocery datasets (RFM summary, Demographics 360, Transactions, Catalog, Events) with SEK revenue analysis."
version: 1.0.0
category: marketing_analytics
tenant: ica_sweden
---

# BigQuery Customer Analytics Skill — ICA Sverige

## Objective
Provide analytical procedures and SQL query patterns for querying ICA Sverige customer datasets stored in Google BigQuery dataset `agent-demo-09.marketing_analytics_ica`.

## BigQuery Tables & Schema
1. **`customer_rfm_summary`**:
   - `customer_id` (STRING), `rfm_segment` (STRING: 'Barnfamiljer Storhandlare', 'Ekologiskt Medvetna', 'Lojala Veckohandlare', 'Priskänsliga Jägare', 'Inaktiva Stammisar'), `recency_days` (INT64), `frequency_orders` (INT64), `total_monetary_sek` (NUMERIC)
2. **`customer_demographics_360`**:
   - `customer_id` (STRING), `full_name` (STRING), `age` (INT64), `gender` (STRING), `location_city` (STRING), `location_country` (STRING), `income_bracket` (STRING), `preferred_category` (STRING), `loyalty_tier` (STRING: Stammis Guld, Stammis Silver, Stammis Medlem), `stammis_points` (INT64), `churn_risk_score` (NUMERIC: 0.0-1.0)
3. **`customer_transactions`**:
   - `transaction_id` (STRING), `customer_id` (STRING), `product_id` (STRING), `product_name` (STRING), `category` (STRING), `amount_sek` (NUMERIC), `quantity` (INT64), `channel` (STRING: Butik, ICA App, Online), `store_city` (STRING)
4. **`product_catalog`**:
   - `product_id` (STRING), `product_name` (STRING), `category` (STRING: Frukt & Grönt, Mejeri & Ägg, Kött, Fågel & Fisk, Skafferi & Frukost, Färdigmat & Mellanmål), `subcategory` (STRING), `price_sek` (NUMERIC), `sustainability_certified` (BOOLEAN: KRAV/Eko/Från Sverige), `collection` (STRING)
5. **`customer_events`**:
   - `event_id` (STRING), `customer_id` (STRING), `event_type` (STRING: page_view, cart_abandon, recipe_view, purchase), `event_date` (STRING/DATE), `product_id` (STRING), `channel` (STRING), `device` (STRING)

## SQL Query Guidelines
- Always query dataset `agent-demo-09.marketing_analytics_ica`.
- Calculate revenues and averages in SEK (kr).
- Use `execute_sql_readonly` tool with `projectId: "agent-demo-09"`.
- Return clean SQL queries and summarize key findings in Swedish or English as requested.

## Presentation Guidelines
- Do NOT output raw dataset names (e.g. `agent-demo-09.marketing_analytics_ica`) or raw SQL in your conversational opening or closing text. The UI automatically displays the BigQuery data source and query audit in a dedicated collapsible panel.
- Focus conversational text entirely on business insights, trends, and executive takeaways.

## A2UI Visual Chart & Distribution Guidelines
- When analyzing customer segments, product categories, or Stammis RFM distributions, structure table results with explicit columns including a `Visual Distribution` column using proportional Unicode blocks (`████████`):
  | RFM Segment | Customer Count | Avg. Spend (SEK) | Total Revenue (SEK) | Share | Visual Distribution |
  | :--- | :---: | :---: | :---: | :---: | :--- |
  | **Barnfamiljer Storhandlare** | 72 | 9,820 kr | 707,076 kr | 38.5% | `████████████` |
  | **Gourmet Matälskare** | 45 | 12,450 kr | 560,250 kr | 30.5% | `█████████` |
  | **Ekologiskt Medvetna** | 58 | 6,340 kr | 367,720 kr | 20.0% | `██████` |
  | **Prisjägare & Studenter** | 65 | 2,150 kr | 139,750 kr | 7.6% | `██` |
  | **Inaktiva Stammiskunder** | 60 | 1,420 kr | 85,200 kr | 3.4% | `█` |
- Provide 2-3 concise strategic takeaways to power executive A2UI chart dashboards.
