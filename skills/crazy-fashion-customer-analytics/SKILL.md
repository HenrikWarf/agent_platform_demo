---
name: crazy-fashion-customer-analytics
description: "Executes BigQuery SQL queries on Crazy Fashion customer datasets (RFM summary, Demographics 360, Transactions, Product Catalog, Events) with EUR revenue analysis."
version: 1.0.0
category: marketing_analytics
tenant: crazy_fashion
---

# BigQuery Customer Analytics Skill — Crazy Fashion

## Objective
Provide analytical procedures and SQL query patterns for querying Crazy Fashion customer datasets stored in Google BigQuery dataset `agent-demo-09.marketing_analytics`.

## BigQuery Tables & Schema
1. **`customer_rfm_summary`**:
   - `customer_id` (STRING), `rfm_segment` (STRING: 'VIP Fashionistas', 'Loyal Regulars', 'Seasonal Shoppers', 'New Explorers', 'Dormant At-Risk'), `recency_days` (INT64), `frequency_orders` (INT64), `total_monetary_eur` (NUMERIC)
2. **`customer_demographics_360`**:
   - `customer_id` (STRING), `full_name` (STRING), `age` (INT64), `gender` (STRING), `location_city` (STRING), `location_country` (STRING), `income_bracket` (STRING), `preferred_category` (STRING), `loyalty_tier` (STRING: Platinum, Gold, Silver, Member), `crazy_club_points` (INT64), `churn_risk_score` (NUMERIC: 0.0-1.0)
3. **`customer_transactions`**:
   - `transaction_id` (STRING), `customer_id` (STRING), `product_id` (STRING), `product_name` (STRING), `category` (STRING), `amount_eur` (NUMERIC), `quantity` (INT64), `channel` (STRING: Online, App, In-Store), `store_city` (STRING)
4. **`product_catalog`**:
   - `product_id` (STRING), `product_name` (STRING), `category` (STRING: Womenswear, Menswear, Accessories, Footwear, Sustainable Capsule), `subcategory` (STRING), `price_eur` (NUMERIC), `sustainability_certified` (BOOLEAN), `collection` (STRING)
5. **`customer_events`**:
   - `event_id` (STRING), `customer_id` (STRING), `event_type` (STRING: page_view, cart_abandon, wishlist_add, purchase), `event_date` (STRING/DATE), `product_id` (STRING), `channel` (STRING), `device` (STRING)

## SQL Query Guidelines
- Always query dataset `agent-demo-09.marketing_analytics`.
- Calculate revenues and averages in EUR (€).
- Use `execute_sql_readonly` tool with `projectId: "agent-demo-09"`.
- Return clean SQL queries and summarize key findings in clear markdown.

## Presentation Guidelines
- Do NOT output raw dataset names (e.g. `agent-demo-09.marketing_analytics`) or raw SQL in your conversational opening or closing text. The UI automatically displays the BigQuery data source and query audit in a dedicated collapsible panel.
- Focus conversational text entirely on business insights, trends, and executive takeaways.

## A2UI Visual Chart Guidelines
- When analyzing customer segments, product categories, or RFM distributions, structure table results with explicit columns:
  `| Segment | Customer Count | Avg Recency (Days) | Avg Order Frequency | Avg Spend (EUR) | Total Segment Revenue (EUR) |`
- Provide 2-3 concise strategic takeaways to power executive A2UI chart dashboards.
