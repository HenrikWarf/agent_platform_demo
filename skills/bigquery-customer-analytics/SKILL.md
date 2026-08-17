---
name: bigquery-customer-analytics
description: "Executes BigQuery SQL queries on customer datasets (RFM summary, Demographics 360, Transactions) to extract cohort metrics, customer counts, average monetary spend, and revenue-at-risk."
version: 1.1.0
category: marketing_analytics
---

# BigQuery Customer Data Analytics Skill

## Objective
Provide analytical procedures and SQL query patterns for querying customer datasets stored in Google BigQuery:
1. **`customer_rfm_summary`**: Cohort metrics (`customer_id`, `rfm_segment`, `recency_days`, `frequency_orders`, `total_monetary`).
2. **`customer_demographics_360`**: 360 customer profiles (`customer_id`, `full_name`, `email`, `age`, `location_city`, `location_country`, `income_bracket`, `preferred_communication_channel`, `favorite_product_features`, `churn_risk_score`, `lifetime_value_tier`).
3. **`customer_transactions`**: Real-time transaction logs (`transaction_id`, `customer_id`, `amount`, `transaction_date`).

## BigQuery SQL Templates

### Cohort Aggregation & Churn Metric Query
```sql
SELECT
  rfm_segment,
  COUNT(customer_id) AS customer_count,
  ROUND(AVG(recency_days), 1) AS avg_recency,
  ROUND(AVG(total_monetary), 2) AS avg_monetary,
  ROUND(SUM(total_monetary), 2) AS total_revenue_at_risk
FROM `{project_id}.{dataset_id}.customer_rfm_summary`
WHERE rfm_segment = @segment
GROUP BY rfm_segment
```

### 360 Customer Demographics & Behavior JOIN Query
```sql
SELECT
  r.customer_id,
  d.full_name,
  d.email,
  d.age,
  d.location_city,
  d.location_country,
  d.income_bracket,
  d.preferred_communication_channel,
  d.favorite_product_features,
  d.churn_risk_score,
  d.lifetime_value_tier,
  r.rfm_segment,
  r.recency_days,
  r.total_monetary
FROM `{project_id}.{dataset_id}.customer_rfm_summary` r
JOIN `{project_id}.{dataset_id}.customer_demographics_360` d
  ON r.customer_id = d.customer_id
WHERE r.rfm_segment = @segment;
```

## Data Analytics & Insights Protocol
1. **Cohort Metric Summary**: Extract customer count, recency, monetary spend, and total revenue at risk.
2. **Profile & Feature Analysis**: Identify top communication channels (e.g. Email, In-App Notification) and product features utilized by the target cohort.
3. **SQL Transparency**: Return the executed SQL query for auditability and trace logs.
