#!/usr/bin/env python3
"""
Seed Crazy Fashion Customer & Product Data into BigQuery Tables via Batch Load Jobs

Populates 5 aligned tables in dataset `marketing_analytics`:
- `customer_rfm_summary` (300 rows) — RFM segments
- `customer_demographics_360` (300 rows) — Customer profiles
- `customer_transactions` (900 rows) — Purchase history
- `product_catalog` (50 rows) — Fashion products
- `customer_events` (1500 rows) — Behavioral events
"""
import os
import sys
import random
import datetime
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bq_seeder")

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
DATASET_ID = os.environ.get("BIGQUERY_DATASET", "marketing_analytics")

# ─── Nordic/European names ───────────────────────────────────────────────────

FIRST_NAMES_F = [
    "Astrid", "Freya", "Saga", "Linnéa", "Elsa", "Ingrid", "Maja", "Wilma",
    "Sigrid", "Ebba", "Klara", "Nora", "Ida", "Hanna", "Liv", "Freja",
    "Emma", "Olivia", "Sophie", "Clara", "Isabella", "Charlotte", "Amélie",
    "Margot", "Léa", "Annika", "Katrine", "Mette", "Signe", "Thea",
]

FIRST_NAMES_M = [
    "Erik", "Lars", "Henrik", "Björn", "Magnus", "Olaf", "Sven", "Nils",
    "Axel", "Gustaf", "Liam", "Oscar", "Hugo", "Felix", "Emil", "Lukas",
    "Noah", "William", "Oliver", "Leo", "Max", "Theo", "Rasmus", "Jesper",
    "Kasper", "Mikael", "Anders", "Johan", "Petter", "Filip",
]

LAST_NAMES = [
    "Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson",
    "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson",
    "Jansson", "Hansson", "Bengtsson", "Lindberg", "Jakobsson", "Magnusson",
    "Lindström", "Nordström", "Bergström", "Sandberg", "Lindqvist", "Forsberg",
    "Hansen", "Pedersen", "Nielsen", "Madsen", "Kristiansen", "Virtanen",
]

CITIES = [
    ("Stockholm", "Sweden"), ("Gothenburg", "Sweden"), ("Malmö", "Sweden"),
    ("Oslo", "Norway"), ("Bergen", "Norway"), ("Copenhagen", "Denmark"),
    ("Aarhus", "Denmark"), ("Helsinki", "Finland"), ("Tampere", "Finland"),
    ("Hamburg", "Germany"), ("Berlin", "Germany"), ("Munich", "Germany"),
    ("London", "United Kingdom"), ("Manchester", "United Kingdom"),
    ("Amsterdam", "Netherlands"), ("Paris", "France"), ("Lyon", "France"),
]

SEGMENTS = [
    "VIP Fashionistas",
    "Loyal Regulars",
    "Seasonal Shoppers",
    "New Explorers",
    "Dormant At-Risk",
]

CHANNELS = ["Email", "App Push", "SMS", "Instagram DM", "In-Store"]

CATEGORIES = ["Womenswear", "Menswear", "Kids & Baby", "Accessories", "Home & Living"]

LOYALTY_TIERS = ["Platinum Member", "Gold Member", "Silver Member", "Bronze Member"]

INCOME_BRACKETS = ["€20k-€40k", "€40k-€60k", "€60k-€80k", "€80k+"]

# ─── Product Catalog ─────────────────────────────────────────────────────────

PRODUCTS = [
    # Womenswear (20 products)
    ("PROD-001", "NOVA Oversized Blazer", "Womenswear", "Outerwear", 89.99, "Relaxed-fit blazer in premium wool blend"),
    ("PROD-002", "DRIFT Slim Jeans", "Womenswear", "Denim", 49.99, "High-waist slim-fit jeans in stretch denim"),
    ("PROD-003", "FRÖST Puffer Jacket", "Womenswear", "Outerwear", 129.99, "Recycled polyester puffer with DWR finish"),
    ("PROD-004", "SOLSTICE Wrap Dress", "Womenswear", "Dresses", 59.99, "Midi wrap dress in printed viscose"),
    ("PROD-005", "LYRA Knit Sweater", "Womenswear", "Knitwear", 39.99, "Chunky cable-knit in organic cotton"),
    ("PROD-006", "ECHO Trench Coat", "Womenswear", "Outerwear", 149.99, "Classic double-breasted trench"),
    ("PROD-007", "BLOOM Floral Blouse", "Womenswear", "Tops", 34.99, "Relaxed floral print blouse"),
    ("PROD-008", "SKYE Midi Skirt", "Womenswear", "Skirts", 44.99, "A-line midi skirt in satin finish"),
    ("PROD-009", "VERA Wide-Leg Trousers", "Womenswear", "Bottoms", 54.99, "High-waist wide-leg in twill"),
    ("PROD-010", "EIRA Cashmere Scarf", "Womenswear", "Accessories", 69.99, "100% recycled cashmere scarf"),
    # Menswear (15 products)
    ("PROD-011", "STORM Tech Parka", "Menswear", "Outerwear", 179.99, "Waterproof parka with thermal lining"),
    ("PROD-012", "NORDIC Slim Chinos", "Menswear", "Bottoms", 44.99, "Stretch cotton slim-fit chinos"),
    ("PROD-013", "FJORD Oxford Shirt", "Menswear", "Shirts", 39.99, "Classic Oxford button-down in organic cotton"),
    ("PROD-014", "RUNE Merino Crew", "Menswear", "Knitwear", 59.99, "Fine-gauge merino wool crewneck"),
    ("PROD-015", "ODIN Bomber Jacket", "Menswear", "Outerwear", 99.99, "Nylon bomber with ribbed cuffs"),
    ("PROD-016", "TIDE Denim Jacket", "Menswear", "Denim", 79.99, "Classic trucker jacket in raw denim"),
    ("PROD-017", "BIRCH Linen Shorts", "Menswear", "Bottoms", 34.99, "Relaxed-fit linen-blend shorts"),
    ("PROD-018", "PEAK Performance Polo", "Menswear", "Tops", 29.99, "Technical polo in moisture-wicking fabric"),
    ("PROD-019", "ATLAS Leather Belt", "Menswear", "Accessories", 24.99, "Full-grain leather belt"),
    ("PROD-020", "STONE Wool Overcoat", "Menswear", "Outerwear", 199.99, "Tailored overcoat in Italian wool"),
    # Kids & Baby (8 products)
    ("PROD-021", "MINI FRÖST Puffer", "Kids & Baby", "Outerwear", 59.99, "Kids' puffer jacket in recycled fill"),
    ("PROD-022", "LILLA Organic Bodysuit 3-Pack", "Kids & Baby", "Basics", 19.99, "GOTS certified organic cotton"),
    ("PROD-023", "SAGA Print Dress", "Kids & Baby", "Dresses", 24.99, "Fun printed jersey dress"),
    ("PROD-024", "BJÖRN Denim Joggers", "Kids & Baby", "Bottoms", 29.99, "Soft denim joggers with elastic waist"),
    ("PROD-025", "LEKPARK Raincoat", "Kids & Baby", "Outerwear", 39.99, "PFC-free waterproof raincoat"),
    ("PROD-026", "SNÖFLINGA Fleece Set", "Kids & Baby", "Sets", 34.99, "Fleece top and bottom set"),
    ("PROD-027", "VILDA Adventure Boots", "Kids & Baby", "Footwear", 44.99, "Waterproof kids' boots"),
    ("PROD-028", "TUVA Knit Beanie", "Kids & Baby", "Accessories", 12.99, "Organic cotton ribbed beanie"),
    # Accessories (7 products)
    ("PROD-029", "AURORA Tote Bag", "Accessories", "Bags", 49.99, "Vegan leather structured tote"),
    ("PROD-030", "GLIMMER Chain Necklace", "Accessories", "Jewelry", 19.99, "Gold-plated layering necklace"),
    ("PROD-031", "SHIELD Sunglasses", "Accessories", "Eyewear", 29.99, "Oversized cat-eye frames"),
    ("PROD-032", "WOOLY Beanie", "Accessories", "Hats", 14.99, "Ribbed wool-blend beanie"),
    ("PROD-033", "COZY Cashmere Gloves", "Accessories", "Gloves", 34.99, "Touchscreen-compatible cashmere"),
    ("PROD-034", "WEEKEND Crossbody Bag", "Accessories", "Bags", 39.99, "Compact nylon crossbody"),
    ("PROD-035", "NORDIC Wool Socks 5-Pack", "Accessories", "Socks", 24.99, "Merino wool blend, unisex"),
    # Home & Living (5 products)
    ("PROD-036", "DRÖM Linen Duvet Cover", "Home & Living", "Bedding", 79.99, "Stonewashed linen duvet cover"),
    ("PROD-037", "MJUK Throw Blanket", "Home & Living", "Throws", 49.99, "Recycled wool throw"),
    ("PROD-038", "LUGN Scented Candle", "Home & Living", "Candles", 14.99, "Nordic pine and birch soy candle"),
    ("PROD-039", "HARMONI Cushion Cover", "Home & Living", "Cushions", 19.99, "Hand-printed linen cushion cover"),
    ("PROD-040", "STILLA Bath Towel Set", "Home & Living", "Bath", 34.99, "Organic cotton towel set"),
    # Additional bestsellers (10 products)
    ("PROD-041", "ESSENTIALS Crew T-Shirt 3-Pack", "Womenswear", "Basics", 24.99, "Organic cotton crew neck tees"),
    ("PROD-042", "ESSENTIALS Crew T-Shirt 3-Pack", "Menswear", "Basics", 24.99, "Organic cotton crew neck tees"),
    ("PROD-043", "MOVE Yoga Leggings", "Womenswear", "Activewear", 34.99, "High-waist leggings in recycled nylon"),
    ("PROD-044", "MOVE Training Shorts", "Menswear", "Activewear", 24.99, "Quick-dry training shorts"),
    ("PROD-045", "WINTER Collection Scarf", "Accessories", "Scarves", 29.99, "Oversized check-pattern wool scarf"),
    ("PROD-046", "VINTER Wool Coat", "Womenswear", "Outerwear", 189.99, "Double-faced wool coat"),
    ("PROD-047", "HÖST Leather Boots", "Womenswear", "Footwear", 129.99, "Ankle boots in vegetable-tanned leather"),
    ("PROD-048", "URBAN Backpack", "Accessories", "Bags", 44.99, "Water-resistant commuter backpack"),
    ("PROD-049", "PURE Organic Pajama Set", "Womenswear", "Loungewear", 44.99, "GOTS certified organic cotton pajamas"),
    ("PROD-050", "COLLAB x Designer Hoodie", "Menswear", "Collaboration", 79.99, "Limited edition designer collab hoodie"),
]

EVENT_TYPES = [
    "purchase", "website_visit", "app_open", "newsletter_signup",
    "product_return", "wishlist_add", "loyalty_redeem", "store_visit",
    "collection_preview", "cart_abandon",
]


def seed_bigquery():
    try:
        from google.cloud import bigquery
        client = bigquery.Client(project=PROJECT_ID)
        logger.info(f"Connected to BigQuery for project '{PROJECT_ID}'")
    except Exception as e:
        logger.error(f"Failed to initialize BigQuery client: {e}")
        return

    now = datetime.datetime.now(datetime.timezone.utc)
    random.seed(42)  # Reproducible data

    # ─── 1. Product Catalog (50 rows) ────────────────────────────────────────
    logger.info("🛍️  Generating product catalog (50 products)...")
    product_rows = []
    for pid, name, category, subcategory, price, description in PRODUCTS:
        product_rows.append({
            "product_id": pid,
            "product_name": name,
            "category": category,
            "subcategory": subcategory,
            "price_eur": price,
            "description": description,
            "sustainability_certified": random.choice([True, True, False]),
            "collection": random.choice(["Spring/Summer 2026", "Autumn/Winter 2026", "Essentials", "Collaboration"]),
        })

    # ─── 2. Customer Data (300 rows aligned) ─────────────────────────────────
    logger.info("👥 Generating 300 aligned Crazy Fashion customer records...")

    rfm_rows = []
    demo_rows = []
    tx_rows = []
    event_rows = []

    tx_counter = 1
    event_counter = 1

    for i in range(1, 301):
        cid = f"CF-{10000 + i}"
        seg = random.choice(SEGMENTS)

        # Name generation
        if random.random() < 0.5:
            fname = random.choice(FIRST_NAMES_F)
            gender_pref = "Womenswear"
        else:
            fname = random.choice(FIRST_NAMES_M)
            gender_pref = "Menswear"
        lname = random.choice(LAST_NAMES)
        full_name = f"{fname} {lname}"
        email = f"{fname.lower().replace('é', 'e').replace('ö', 'o')}.{lname.lower().replace('ö', 'o').replace('é', 'e').replace('å', 'a')}@email.com"

        # Segment-driven metrics
        if seg == "VIP Fashionistas":
            recency = random.randint(1, 15)
            freq = random.randint(20, 50)
            monetary = round(random.uniform(1500.0, 5000.0), 2)
            churn_score = round(random.uniform(0.02, 0.12), 2)
            loyalty_tier = random.choice(["Platinum Member", "Gold Member"])
            age = random.randint(25, 45)
        elif seg == "Loyal Regulars":
            recency = random.randint(5, 30)
            freq = random.randint(10, 25)
            monetary = round(random.uniform(800.0, 2500.0), 2)
            churn_score = round(random.uniform(0.08, 0.22), 2)
            loyalty_tier = random.choice(["Gold Member", "Silver Member"])
            age = random.randint(28, 55)
        elif seg == "Seasonal Shoppers":
            recency = random.randint(30, 90)
            freq = random.randint(3, 8)
            monetary = round(random.uniform(200.0, 800.0), 2)
            churn_score = round(random.uniform(0.25, 0.45), 2)
            loyalty_tier = random.choice(["Silver Member", "Bronze Member"])
            age = random.randint(22, 50)
        elif seg == "New Explorers":
            recency = random.randint(1, 20)
            freq = random.randint(1, 3)
            monetary = round(random.uniform(40.0, 250.0), 2)
            churn_score = round(random.uniform(0.30, 0.55), 2)
            loyalty_tier = "Bronze Member"
            age = random.randint(18, 35)
        else:  # Dormant At-Risk
            recency = random.randint(90, 365)
            freq = random.randint(1, 4)
            monetary = round(random.uniform(50.0, 400.0), 2)
            churn_score = round(random.uniform(0.65, 0.95), 2)
            loyalty_tier = random.choice(["Silver Member", "Bronze Member"])
            age = random.randint(20, 60)

        # RFM Row
        rfm_rows.append({
            "customer_id": cid,
            "rfm_segment": seg,
            "recency_days": recency,
            "frequency_orders": freq,
            "total_monetary_eur": monetary,
        })

        # Demographics Row
        city, country = random.choice(CITIES)
        preferred_cat = random.choice([gender_pref, "Accessories", "Home & Living"])

        demo_rows.append({
            "customer_id": cid,
            "full_name": full_name,
            "email": email,
            "age": age,
            "gender": "Female" if fname in FIRST_NAMES_F else "Male",
            "location_city": city,
            "location_country": country,
            "income_bracket": random.choice(INCOME_BRACKETS),
            "preferred_communication_channel": random.choice(CHANNELS),
            "preferred_category": preferred_cat,
            "loyalty_tier": loyalty_tier,
            "crazy_club_points": random.randint(0, 25000) if loyalty_tier != "Bronze Member" else random.randint(0, 999),
            "churn_risk_score": churn_score,
        })

        # Transaction Rows (3 per customer = 900 total)
        tx_products = random.sample(PRODUCTS, min(3, len(PRODUCTS)))
        for product in tx_products:
            tx_id = f"TXN-{100000 + tx_counter}"
            tx_counter += 1
            tx_date = (now - datetime.timedelta(days=random.randint(1, 180))).strftime("%Y-%m-%d %H:%M:%S")
            tx_amount = round(product[4] * random.uniform(0.85, 1.15), 2)  # Slight price variance

            tx_rows.append({
                "transaction_id": tx_id,
                "customer_id": cid,
                "product_id": product[0],
                "product_name": product[1],
                "category": product[2],
                "amount_eur": tx_amount,
                "quantity": random.randint(1, 3),
                "channel": random.choice(["Online", "In-Store", "App"]),
                "store_city": city if random.random() < 0.6 else random.choice(CITIES)[0],
                "transaction_date": tx_date,
            })

        # Event Rows (5 per customer = 1500 total)
        for _ in range(5):
            event_id = f"EVT-{200000 + event_counter}"
            event_counter += 1
            event_type = random.choice(EVENT_TYPES)
            event_date = (now - datetime.timedelta(days=random.randint(1, 120))).strftime("%Y-%m-%d %H:%M:%S")
            event_product = random.choice(PRODUCTS)

            event_rows.append({
                "event_id": event_id,
                "customer_id": cid,
                "event_type": event_type,
                "event_date": event_date,
                "product_id": event_product[0] if event_type in ("purchase", "product_return", "wishlist_add", "cart_abandon") else None,
                "channel": random.choice(["Web", "App", "In-Store", "Email"]),
                "device": random.choice(["Mobile", "Desktop", "Tablet", "In-Store POS"]),
                "session_duration_seconds": random.randint(30, 1800) if event_type in ("website_visit", "app_open") else None,
            })

    # ─── Batch Load to BigQuery ──────────────────────────────────────────────
    from google.cloud import bigquery
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        autodetect=True,
    )

    tables = [
        ("product_catalog", product_rows),
        ("customer_rfm_summary", rfm_rows),
        ("customer_demographics_360", demo_rows),
        ("customer_transactions", tx_rows),
        ("customer_events", event_rows),
    ]

    for table_name, rows in tables:
        table_id = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
        load_job = client.load_table_from_json(rows, table_id, job_config=job_config)
        load_job.result()
        logger.info(f"✅ Loaded {len(rows):,} rows into '{table_id}'")

    print(f"\n🎉 Crazy Fashion BigQuery Seeding Complete!")
    print(f"   📦 Products: {len(product_rows)}")
    print(f"   👥 Customers (RFM): {len(rfm_rows)}")
    print(f"   👤 Customers (Demographics): {len(demo_rows)}")
    print(f"   💳 Transactions: {len(tx_rows)}")
    print(f"   📊 Events: {len(event_rows)}")


if __name__ == "__main__":
    seed_bigquery()
