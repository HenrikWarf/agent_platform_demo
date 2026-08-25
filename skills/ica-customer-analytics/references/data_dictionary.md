# BigQuery Data Dictionary — ICA Sverige (`marketing_analytics_ica`)

All analytics queries for ICA Sverige must execute against dataset `agent-demo-09.marketing_analytics_ica`.

## 1. `customer_rfm_summary` (300 rows)
- `customer_id` (STRING): Unique customer identifier (`CUST_001` - `CUST_300`).
- `rfm_segment` (STRING): Segment label (`Barnfamiljer Storhandlare`, `Ekologiskt Medvetna`, `Lojala Veckohandlare`, `Inaktiva Stammisar`, `Prismedvetna Studenter`).
- `recency_days` (INT64): Days since last transaction.
- `frequency_orders` (INT64): Count of completed purchases in past 12 months.
- `total_monetary_sek` (FLOAT64): Total customer spend in Swedish Kronor (**SEK**).
- `id` (STRING): Unique row ID (`id = customer_id`).

## 2. `customer_demographics_360` (300 rows)
- `customer_id` (STRING): Customer identifier.
- `full_name` (STRING): Customer full name (Swedish names).
- `age` (INT64): Customer age.
- `gender` (STRING): Gender (`F`, `M`, `Non-binary`).
- `location_city` (STRING): Swedish city (`Stockholm`, `Göteborg`, `Malmö`, `Uppsala`, `Västerås`).
- `location_country` (STRING): `Sweden`.
- `income_bracket` (STRING): `Low`, `Medium`, `High`, `Very High`.
- `preferred_category` (STRING): Primary category preference (`Mejeri & Ägg`, `Frukt & Grönt`, `Kött & Chark`, `Fisk & Skaldjur`, `Skafferi & Bröd`, `Hälsa & Apotek`).
- `loyalty_tier` (STRING): Stammis tier (`Brons`, `Silver`, `Guld`, `Diamant`).
- `stammis_points` (INT64): Accumulated Stammis loyalty points.
- `churn_risk_score` (FLOAT64): Probability score (0.00 to 1.00).
- `id` (STRING): Unique row ID (`id = customer_id`).

## 3. `customer_transactions` (895 rows)
- `transaction_id` (STRING): Unique transaction ID (`TXN_001` - `TXN_900`).
- `customer_id` (STRING): Customer ID.
- `product_id` (STRING): Product ID (`PROD_ICA_01` - `PROD_ICA_50`).
- `product_name` (STRING): Product title.
- `category` (STRING): Department category.
- `amount_sek` (FLOAT64): Item transaction amount in Swedish Kronor.
- `quantity` (INT64): Number of units purchased.
- `channel` (STRING): `ICA Kvantum`, `ICA Maxi`, `ICA Nära`, `ICA Online`.
- `store_city` (STRING): Store city location.
- `id` (STRING): Unique row ID (`id = transaction_id`).

## 4. `product_catalog` (50 rows)
- `product_id` (STRING): Product ID.
- `product_name` (STRING): Product title.
- `category` (STRING): Department category.
- `subcategory` (STRING): Subcategory item type.
- `price_sek` (FLOAT64): Shelf price in SEK.
- `sustainability_certified` (BOOL): `true` if certified KRAV / Från Sverige / MSC.
- `id` (STRING): Unique row ID (`id = product_id`).

## 5. `customer_events` (1492 rows)
- `event_id` (STRING): Event ID.
- `customer_id` (STRING): Customer ID.
- `event_type` (STRING): `app_open`, `clip_coupon`, `search_recipe`, `view_stammis_deal`, `add_to_cart`.
- `event_date` (DATE): Timestamp date of interaction.
- `channel` (STRING): `ICA App`, `ica.se Web`, `Självscanning Kassa`.
- `id` (STRING): Unique row ID (`id = event_id`).
