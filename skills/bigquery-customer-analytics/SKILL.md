---
name: bigquery-customer-analytics
description: "Executes BigQuery SQL queries on enterprise retail customer datasets (RFM summary, Demographics 360, Transactions, Product Catalog, Customer Events) for Crazy Fashion (EUR) and ICA Sverige (SEK)."
version: 2.1.0
category: marketing_analytics
---

# BigQuery Customer Data Analytics Skill

## Objective
Provide analytical procedures and SQL query patterns for querying enterprise retail customer datasets stored in Google BigQuery across active client workspaces:
- **ICA Sverige**: Dataset `agent-demo-09.marketing_analytics_ica` (Swedish Grocery & Health, SEK currency)
- **Crazy Fashion**: Dataset `agent-demo-09.marketing_analytics` (Nordic Fashion & Apparel, EUR currency)

## BigQuery Tables & Schema Parity
Both datasets share standardized schemas with native currency columns (`_sek` and `_eur`):

1. **`customer_rfm_summary`**:
   - `customer_id` (STRING), `rfm_segment` (STRING), `recency_days` (INT64), `frequency_orders` (INT64), `total_monetary_eur` (NUMERIC), `total_monetary_sek` (NUMERIC)
2. **`customer_demographics_360`**:
   - `customer_id` (STRING), `full_name` (STRING), `age` (INT64), `gender` (STRING), `location_city` (STRING), `location_country` (STRING), `income_bracket` (STRING), `preferred_category` (STRING), `loyalty_tier` (STRING), `crazy_club_points` (INT64), `stammis_points` (INT64), `churn_risk_score` (NUMERIC)
3. **`customer_transactions`**:
   - `transaction_id` (STRING), `customer_id` (STRING), `product_id` (STRING), `product_name` (STRING), `category` (STRING), `amount_eur` (NUMERIC), `amount_sek` (NUMERIC), `quantity` (INT64), `channel` (STRING), `store_city` (STRING)
4. **`product_catalog`**:
   - `product_id` (STRING), `product_name` (STRING), `category` (STRING), `subcategory` (STRING), `price_eur` (NUMERIC), `price_sek` (NUMERIC), `sustainability_certified` (BOOLEAN), `collection` (STRING)
5. **`customer_events`**:
   - `event_id` (STRING), `customer_id` (STRING), `event_type` (STRING), `event_date` (STRING/DATE), `product_id` (STRING), `channel` (STRING), `device` (STRING)

## BigQuery SQL Templates

### Cohort Aggregation & Revenue Analysis
```sql
SELECT
  rfm_segment,
  COUNT(customer_id) AS customer_count,
  ROUND(AVG(recency_days), 1) AS avg_recency,
  ROUND(AVG(total_monetary_sek), 2) AS avg_monetary_sek,
  ROUND(SUM(total_monetary_sek), 2) AS total_revenue_sek
FROM `agent-demo-09.marketing_analytics_ica.customer_rfm_summary`
WHERE rfm_segment = 'Ekologiskt Medvetna'
GROUP BY rfm_segment
```

### Top-Selling Products by Category
```sql
SELECT
  p.product_name,
  p.category,
  p.price_sek,
  COUNT(t.transaction_id) AS total_orders,
  SUM(t.quantity) AS total_quantity,
  ROUND(SUM(t.amount_sek), 2) AS total_revenue_sek
FROM `agent-demo-09.marketing_analytics_ica.product_catalog` p
LEFT JOIN `agent-demo-09.marketing_analytics_ica.customer_transactions` t
  ON p.product_id = t.product_id
GROUP BY p.product_name, p.category, p.price_sek
ORDER BY total_quantity DESC
LIMIT 20
```

## Data Analytics & Insights Protocol
1. **Tool Invocation**: When calling BigQuery tools (`execute_sql_readonly` or `execute_sql`), always pass `projectId: "agent-demo-09"` (or the active GCP project ID) along with the `query` string.
2. **Cohort Metric Summary**: Extract customer count, recency, monetary spend, and revenue by segment.
3. **Loyalty & Profile Analysis**: Analyze Stammis/Crazy Club membership tiers, preferred categories, and communication channels.
4. **Product Performance**: Identify top-selling products, category revenue, and sustainability-certified product adoption.
5. **Behavioral Events**: Track purchase funnels, cart abandonment rates, and app engagement.
6. **SQL Transparency**: Return the executed SQL query for auditability and trace logs.
