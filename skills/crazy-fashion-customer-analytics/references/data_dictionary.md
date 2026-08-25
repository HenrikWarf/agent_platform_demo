# BigQuery Data Dictionary — Crazy Fashion (`marketing_analytics`)

All analytics queries for Crazy Fashion must execute against dataset `agent-demo-09.marketing_analytics`.

## 1. `customer_rfm_summary` (300 rows)
- `customer_id` (STRING): Unique customer identifier (`CUST_001` - `CUST_300`).
- `rfm_segment` (STRING): Segment label (`VIP Fashionistas`, `Loyal Regulars`, `Seasonal Shoppers`, `New Explorers`, `Dormant At-Risk`).
- `recency_days` (INT64): Days since last transaction.
- `frequency_orders` (INT64): Count of completed purchases.
- `total_monetary_eur` (FLOAT64): Total customer spend in Euros (**EUR / €**).
- `id` (STRING): Unique row ID (`id = customer_id`).

## 2. `customer_demographics_360` (300 rows)
- `customer_id` (STRING): Customer identifier.
- `full_name` (STRING): Customer full name (Nordic names).
- `age` (INT64): Customer age.
- `gender` (STRING): Gender (`F`, `M`, `Non-binary`).
- `location_city` (STRING): Nordic city (`Stockholm`, `Copenhagen`, `Oslo`, `Helsinki`, `Gothenburg`).
- `location_country` (STRING): `Sweden`, `Denmark`, `Norway`, `Finland`.
- `income_bracket` (STRING): `Low`, `Medium`, `High`, `Very High`.
- `preferred_category` (STRING): `Womenswear`, `Menswear`, `Footwear`, `Accessories`, `Sportswear`.
- `loyalty_tier` (STRING): Crazy Club tier (`Silver`, `Gold`, `Diamond`).
- `crazy_club_points` (INT64): Accumulated loyalty points.
- `churn_risk_score` (FLOAT64): Probability score (0.00 to 1.00).
- `id` (STRING): Unique row ID (`id = customer_id`).

## 3. `customer_transactions` (900 rows)
- `transaction_id` (STRING): Unique transaction ID (`TXN_001` - `TXN_900`).
- `customer_id` (STRING): Customer ID.
- `product_id` (STRING): Product ID (`PROD_CF_01` - `PROD_CF_50`).
- `product_name` (STRING): Product title.
- `category` (STRING): Category.
- `amount_eur` (FLOAT64): Item transaction amount in Euros.
- `quantity` (INT64): Units purchased.
- `channel` (STRING): `Online Store`, `Flagship Store`, `Crazy Fashion App`.
- `store_city` (STRING): Store city.
- `id` (STRING): Unique row ID (`id = transaction_id`).

## 4. `product_catalog` (50 rows)
- `product_id` (STRING): Product ID.
- `product_name` (STRING): Product title.
- `category` (STRING): Department category.
- `subcategory` (STRING): Garment type.
- `price_eur` (FLOAT64): Retail price in EUR.
- `sustainability_certified` (BOOL): `true` if conscious materials certified.
- `collection` (STRING): `Studio Collection`, `Essentials`, `Conscious Knitwear`.
- `id` (STRING): Unique row ID (`id = product_id`).

## 5. `customer_events` (1500 rows)
- `event_id` (STRING): Event ID.
- `customer_id` (STRING): Customer ID.
- `event_type` (STRING): `app_open`, `view_lookbook`, `save_to_wishlist`, `add_to_bag`, `checkout_completed`.
- `event_date` (DATE): Interaction date.
- `channel` (STRING): `Crazy Fashion App`, `Web`, `In-Store QR`.
- `id` (STRING): Unique row ID (`id = event_id`).
