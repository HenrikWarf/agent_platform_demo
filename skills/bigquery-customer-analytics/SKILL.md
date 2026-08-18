---
name: bigquery-customer-analytics
description: "Executes BigQuery SQL queries on Crazy Fashion customer datasets (RFM summary, Demographics 360, Transactions, Product Catalog, Customer Events) to extract cohort metrics, revenue analysis, and behavioral insights."
version: 2.0.0
category: marketing_analytics
---

# BigQuery Customer Data Analytics Skill — Crazy Fashion

## Objective
Provide analytical procedures and SQL query patterns for querying Crazy Fashion customer datasets stored in Google BigQuery:
1. **`customer_rfm_summary`**: Cohort metrics (`customer_id`, `rfm_segment`, `recency_days`, `frequency_orders`, `total_monetary_eur`).
2. **`customer_demographics_360`**: Customer profiles (`customer_id`, `full_name`, `email`, `age`, `gender`, `location_city`, `location_country`, `income_bracket`, `preferred_communication_channel`, `preferred_category`, `loyalty_tier`, `crazy_club_points`, `churn_risk_score`).
3. **`customer_transactions`**: Purchase history (`transaction_id`, `customer_id`, `product_id`, `product_name`, `category`, `amount_eur`, `quantity`, `channel`, `store_city`, `transaction_date`).
4. **`product_catalog`**: Product inventory (`product_id`, `product_name`, `category`, `subcategory`, `price_eur`, `description`, `sustainability_certified`, `collection`).
5. **`customer_events`**: Behavioral events (`event_id`, `customer_id`, `event_type`, `event_date`, `product_id`, `channel`, `device`, `session_duration_seconds`).

## BigQuery SQL Templates

### Cohort Aggregation & Revenue Analysis
```sql
SELECT
  rfm_segment,
  COUNT(customer_id) AS customer_count,
  ROUND(AVG(recency_days), 1) AS avg_recency,
  ROUND(AVG(total_monetary_eur), 2) AS avg_monetary_eur,
  ROUND(SUM(total_monetary_eur), 2) AS total_revenue_eur
FROM `{project_id}.{dataset_id}.customer_rfm_summary`
WHERE rfm_segment = @segment
GROUP BY rfm_segment
```

### Customer Demographics & Loyalty JOIN
```sql
SELECT
  r.customer_id,
  d.full_name,
  d.age,
  d.gender,
  d.location_city,
  d.location_country,
  d.preferred_category,
  d.loyalty_tier,
  d.crazy_club_points,
  d.churn_risk_score,
  r.rfm_segment,
  r.total_monetary_eur
FROM `{project_id}.{dataset_id}.customer_rfm_summary` r
JOIN `{project_id}.{dataset_id}.customer_demographics_360` d
  ON r.customer_id = d.customer_id
WHERE r.rfm_segment = @segment
```

### Top-Selling Products by Category
```sql
SELECT
  p.product_name,
  p.category,
  p.price_eur,
  COUNT(t.transaction_id) AS total_sales,
  SUM(t.amount_eur) AS total_revenue_eur
FROM `{project_id}.{dataset_id}.customer_transactions` t
JOIN `{project_id}.{dataset_id}.product_catalog` p
  ON t.product_id = p.product_id
GROUP BY p.product_name, p.category, p.price_eur
ORDER BY total_sales DESC
LIMIT 10
```

### Customer Event Funnel Analysis
```sql
SELECT
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM `{project_id}.{dataset_id}.customer_events`
WHERE event_date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY event_type
ORDER BY event_count DESC
```

## Data Analytics & Insights Protocol
1. **Cohort Metric Summary**: Extract customer count, recency, monetary spend (EUR), and revenue by segment.
2. **Loyalty & Profile Analysis**: Analyze Crazy Club membership tiers, preferred categories, and communication channels.
3. **Product Performance**: Identify top-selling products, category revenue, and sustainability-certified product adoption.
4. **Behavioral Events**: Track purchase funnels, cart abandonment rates, and app engagement.
5. **SQL Transparency**: Return the executed SQL query for auditability and trace logs.
