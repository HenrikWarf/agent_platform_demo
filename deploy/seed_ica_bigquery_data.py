#!/usr/bin/env python3
"""
Seed ICA Sverige Grocery & Health Customer Data into BigQuery Tables via Batch Load Jobs.

Populates 5 aligned tables in dataset `marketing_analytics_ica` (or `marketing_analytics`):
- `customer_rfm_summary` (300 rows) — Stammis RFM segments
- `customer_demographics_360` (300 rows) — Customer Stammis profiles
- `customer_transactions` (900 rows) — Swedish grocery purchases in SEK
- `product_catalog` (50 rows) — Swedish food & health catalog
- `customer_events` (1500 rows) — App, self-scan & web events
"""
import datetime
import io
import json
import logging
import os
import random
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ica_bq_seeder")

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
DATASET_ID = os.environ.get("BIGQUERY_DATASET_ICA", "marketing_analytics_ica")

# ─── Swedish customer demographics ───────────────────────────────────────────

SWEDISH_FIRST_NAMES_F = [
    "Astrid", "Freja", "Saga", "Linnéa", "Elsa", "Ingrid", "Maja", "Wilma",
    "Sigrid", "Ebba", "Klara", "Nora", "Ida", "Hanna", "Liv", "Emma",
    "Olivia", "Sophie", "Clara", "Isabella", "Alice", "Alma", "Ella",
    "Stella", "Vera", "Agnes", "Lovisa", "Moa", "Elin", "Tuva"
]

SWEDISH_FIRST_NAMES_M = [
    "Erik", "Lars", "Henrik", "Björn", "Magnus", "Olof", "Sven", "Nils",
    "Axel", "Gustaf", "Liam", "Oscar", "Hugo", "Felix", "Emil", "Lucas",
    "Noah", "William", "Oliver", "Leo", "Max", "Theo", "Rasmus", "Jesper",
    "Kasper", "Mikael", "Anders", "Johan", "Petter", "Filip"
]

SWEDISH_LAST_NAMES = [
    "Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson",
    "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson",
    "Jansson", "Hansson", "Bengtsson", "Lindberg", "Jakobsson", "Magnusson",
    "Lindström", "Nordström", "Bergström", "Sandberg", "Lindqvist", "Forsberg",
    "Wallin", "Engström", "Sundberg", "Holm", "Lundgren", "Ekström"
]

SWEDISH_CITIES = [
    ("Stockholm", "Sweden", 0.40),
    ("Göteborg", "Sweden", 0.20),
    ("Malmö", "Sweden", 0.15),
    ("Uppsala", "Sweden", 0.08),
    ("Västerås", "Sweden", 0.05),
    ("Örebro", "Sweden", 0.04),
    ("Linköping", "Sweden", 0.04),
    ("Helsingborg", "Sweden", 0.04),
]

ICA_STORES = [
    "ICA Maxi Lindhagen", "ICA Maxi Nacka", "ICA Maxi Solna Business Park",
    "ICA Kvantum Sickla", "ICA Kvantum Liljeholmen", "ICA Kvantum Sannegården",
    "ICA Supermarket Vanadis", "ICA Supermarket Fältöversten", "ICA Supermarket Medborgarplatsen",
    "ICA Nära Söder", "ICA Nära Roslagstull", "ICA Nära Vasastan"
]

ICA_CUSTOMER_SEGMENTS = [
    "Ekologiskt Medvetna",
    "Barnfamiljer Storhandlare",
    "Lojala Veckohandlare",
    "Prisjägare & Studenter",
    "Inaktiva Stammisar",
]

# ─── 50 Swedish Grocery & Health Catalog Products ─────────────────────────────

ICA_PRODUCT_CATALOG = [
    # Mejeri, Ost & Ägg
    ("PROD_ICA_01", "Ekologisk Svensk Mellanmjölk 1.5L", "Mejeri & Ägg", "Mjölk", 24.90, True, "ICA I love eco"),
    ("PROD_ICA_02", "Svenskt Smör Normalsaltat 500g", "Mejeri & Ägg", "Matfett", 54.90, True, "Arla Svenskt Sigill"),
    ("PROD_ICA_03", "ICA Prästost 31% Lagrad 12 mån 700g", "Mejeri & Ägg", "Hårdost", 98.00, True, "ICA Svensk Råvara"),
    ("PROD_ICA_04", "Ekologiska Lantägg 12-pack KRAV", "Mejeri & Ägg", "Ägg", 48.90, True, "ICA I love eco"),
    ("PROD_ICA_05", "Havredryck Original 1L", "Mejeri & Ägg", "Växtbaserat", 21.90, True, "Oatly Svensk Havre"),
    ("PROD_ICA_06", "Svensk Vispgrädde 36% 5dl", "Mejeri & Ägg", "Grädde", 29.90, True, "ICA Svensk Råvara"),
    ("PROD_ICA_07", "Grekisk Yoghurt Eko 1kg", "Mejeri & Ägg", "Yoghurt", 38.50, True, "ICA Gott Liv"),
    ("PROD_ICA_08", "Kvarg Vanilj Utan Tillsatt Socker 500g", "Mejeri & Ägg", "Kvarg", 23.90, False, "Lindahls"),

    # Frukt & Grönt
    ("PROD_ICA_09", "Svenska Ekologiska Morötter 1kg KRAV", "Frukt & Grönt", "Rotfrukter", 19.90, True, "ICA I love eco"),
    ("PROD_ICA_10", "Färska Svenska Jordgubbar 500g", "Frukt & Grönt", "Bär", 45.00, True, "Från Sverige"),
    ("PROD_ICA_11", "Ekologiska Bananer Fairtrade 1kg", "Frukt & Grönt", "Bananer", 28.90, True, "ICA I love eco"),
    ("PROD_ICA_12", "Svensk Färsk Broccoli 250g", "Frukt & Grönt", "Kål & Broccoli", 17.90, True, "Svensk Råvara"),
    ("PROD_ICA_13", "Avokado Ätmogen 2-pack", "Frukt & Grönt", "Frukt", 29.90, False, "ICA"),
    ("PROD_ICA_14", "Svensk Gurka Klass 1", "Frukt & Grönt", "Salladsgrönt", 14.90, True, "Från Sverige"),
    ("PROD_ICA_15", "Körsbärstomater i ask 250g Eko", "Frukt & Grönt", "Tomater", 22.90, True, "ICA I love eco"),
    ("PROD_ICA_16", "Svenska Äpplen Aroma 1kg", "Frukt & Grönt", "Äpplen", 32.90, True, "Från Sverige"),

    # Kött, Fågel & Chark
    ("PROD_ICA_17", "Färsk Svensk Nötfärs 12% Storpack 1000g", "Kött & Chark", "Färs", 89.90, True, "Kött från Sverige"),
    ("PROD_ICA_18", "Svensk Kycklingbröstfilé 1kg", "Kött & Chark", "Kyckling", 119.00, True, "Svensk Fågel"),
    ("PROD_ICA_19", "Falukorv Extra Fin 800g", "Kött & Chark", "Charkuterier", 42.90, True, "ICA Svensk Råvara"),
    ("PROD_ICA_20", "Prinskorv Guld 300g", "Kött & Chark", "Korv", 36.90, True, "Från Sverige"),
    ("PROD_ICA_21", "Svensk Fläskfilé Färsk 600g", "Kött & Chark", "Fläskkött", 85.00, True, "Kött från Sverige"),
    ("PROD_ICA_22", "KRAV-Märkt Högrev Grytbitar 500g", "Kött & Chark", "Nötkött", 95.00, True, "ICA I love eco"),
    ("PROD_ICA_23", "Ekologisk Rökt Skinka 120g", "Kött & Chark", "Pålägg", 29.90, True, "ICA I love eco"),

    # Fisk & Skaldjur
    ("PROD_ICA_24", "Färsk Svensk Fjällrödingfilé 300g", "Fisk & Skaldjur", "Färsk fisk", 79.90, True, "ASC-Certifierad"),
    ("PROD_ICA_25", "Färsk Laxfilé Portionsbitar 4x125g", "Fisk & Skaldjur", "Lax", 115.00, True, "ASC-Certifierad"),
    ("PROD_ICA_26", "Handskalade Räkor i Lake 280g", "Fisk & Skaldjur", "Skaldjur", 69.90, True, "MSC-Certifierad"),
    ("PROD_ICA_27", "Torskrygg Fryst MSC 400g", "Fisk & Skaldjur", "Vitfisk", 74.90, True, "ICA Gott Liv"),

    # Skafferi & Bröd
    ("PROD_ICA_28", "Gevalia Mellanrost Bryggkaffe 450g", "Skafferi & Bröd", "Kaffe", 58.90, False, "Gevalia"),
    ("PROD_ICA_29", "Löfbergs Lila Eko Kaffe 450g", "Skafferi & Bröd", "Kaffe", 64.90, True, "Fairtrade & KRAV"),
    ("PROD_ICA_30", "Svenska Havregryn Ekologiska 1.5kg", "Skafferi & Bröd", "Gryn & Flingor", 24.90, True, "ICA I love eco"),
    ("PROD_ICA_31", "Ekologisk Pasta Penne Rigate 500g", "Skafferi & Bröd", "Pasta", 18.90, True, "ICA I love eco"),
    ("PROD_ICA_32", "Krossade Tomater Eko 390g", "Skafferi & Bröd", "Konserver", 12.90, True, "Mutti Eko"),
    ("PROD_ICA_33", "Svensk Rapsolja Kallpressad 500ml", "Skafferi & Bröd", "Olja", 36.90, True, "Från Sverige"),
    ("PROD_ICA_34", "Falu Rågrut Knäckebröd 470g", "Skafferi & Bröd", "Knäckebröd", 27.90, True, "Wasa Svensk Råg"),
    ("PROD_ICA_35", "Lingongrov Bröd Skivat 500g", "Skafferi & Bröd", "Mjukt bröd", 29.90, False, "Pågen"),
    ("PROD_ICA_36", "Svensk Blomsterhonung 500g", "Skafferi & Bröd", "Honung", 62.00, True, "Från Sverige"),
    ("PROD_ICA_37", "Ekologisk Olivolja Extra Virgin 500ml", "Skafferi & Bröd", "Olja", 89.00, True, "ICA Selection"),

    # Hälsa & Apotek (Apotek Hjärtat)
    ("PROD_ICA_38", "Hjärtats D-Vitamin 20ug 100 tabletter", "Hälsa & Apotek", "Vitaminer", 79.00, False, "Apotek Hjärtat"),
    ("PROD_ICA_39", "Hjärtats Omega-3 Forte 100 kapslar", "Hälsa & Apotek", "Kosttillskott", 129.00, True, "Friend of the Sea"),
    ("PROD_ICA_40", "Hjärtats Solskyddsmousse SPF 30 150ml", "Hälsa & Apotek", "Hudvård", 149.00, False, "Apotek Hjärtat"),
    ("PROD_ICA_41", "Hjärtats Multivitamin Man/Kvinna 100st", "Hälsa & Apotek", "Vitaminer", 99.00, False, "Apotek Hjärtat"),
    ("PROD_ICA_42", "Ekologisk Handtvål Havre & Kamomill 300ml", "Hälsa & Apotek", "Kroppsvård", 34.90, True, "ICA I love eco"),
    ("PROD_ICA_43", "Bafucin Sugtabletter Mint 25st", "Hälsa & Apotek", "Förkylning", 69.00, False, "Receptfritt Läkemedel"),
    ("PROD_ICA_44", "Hjärtats Magnesium 250mg 100 tabletter", "Hälsa & Apotek", "Mineraler", 89.00, False, "Apotek Hjärtat"),

    # Färdigmat & Helglyx
    ("PROD_ICA_45", "Färska Kanelbullar 4-pack Butiksbakade", "Skafferi & Bröd", "Bageri", 35.00, False, "ICA Bageri"),
    ("PROD_ICA_46", "Pizzadeg Surdeg Färsk 400g", "Mejeri & Ägg", "Färdigdeg", 26.90, False, "ICA"),
    ("PROD_ICA_47", "Klassisk Ärtsoppa med Fläsk 500g", "Skafferi & Bröd", "Färdigmat", 21.90, True, "Från Sverige"),
    ("PROD_ICA_48", "Alspånsrökt Sidfläsk 300g", "Kött & Chark", "Bacon & Fläsk", 39.90, True, "Från Sverige"),
    ("PROD_ICA_49", "Svensk Riven Västerbottensost 150g", "Mejeri & Ägg", "Matost", 38.90, True, "Svensk Råvara"),
    ("PROD_ICA_50", "Ekologiskt Bubblande Mineralvatten 1L", "Dryck", "Vatten", 12.90, True, "ICA I love eco"),
]


def generate_ica_data():
    """Generates 300 aligned Swedish grocery customers and associated datasets in SEK."""
    random.seed(1917)  # ICA founding year seed for deterministic repeatability

    customers = []
    rfm_rows = []
    demographics_rows = []
    transactions_rows = []
    events_rows = []

    # Segment distribution weights
    segment_weights = {
        "Ekologiskt Medvetna": (0.25, 12, 18, 4800, 14500),      # (weight, recency_range, freq_range, monetary_min, monetary_max)
        "Barnfamiljer Storhandlare": (0.30, 7, 24, 8500, 26000),
        "Lojala Veckohandlare": (0.25, 5, 28, 5200, 16000),
        "Prisjägare & Studenter": (0.12, 14, 10, 1800, 5500),
        "Inaktiva Stammisar": (0.08, 65, 3, 600, 2200),
    }

    segments_pool = []
    for seg, (wt, *_) in segment_weights.items():
        segments_pool.extend([seg] * int(wt * 300))
    while len(segments_pool) < 300:
        segments_pool.append("Lojala Veckohandlare")
    random.shuffle(segments_pool)

    for i in range(1, 301):
        cid = f"CUST-ICA-{i:04d}"
        gender = random.choice(["F", "M"])
        first_name = random.choice(SWEDISH_FIRST_NAMES_F if gender == "F" else SWEDISH_FIRST_NAMES_M)
        last_name = random.choice(SWEDISH_LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        age = random.randint(20, 74)

        # Location
        city, country, _ = random.choices(SWEDISH_CITIES, weights=[w for *_, w in SWEDISH_CITIES])[0]

        # Segment & RFM parameters
        seg = segments_pool[i - 1]
        _, rec_max, freq_max, mon_min, mon_max = segment_weights[seg]

        recency = random.randint(1, rec_max)
        freq = random.randint(2, freq_max)
        monetary = round(random.uniform(mon_min, mon_max), 2)

        rfm_rows.append({
            "customer_id": cid,
            "rfm_segment": seg,
            "recency_days": recency,
            "frequency_orders": freq,
            "total_monetary_eur": monetary,  # Column name kept uniform for schema parity
        })

        # Loyalty Stammis Points
        stammis_points = int(monetary * random.uniform(0.9, 1.2))
        if stammis_points > 15000:
            loyalty_tier = "Platina"
        elif stammis_points > 8000:
            loyalty_tier = "Guld"
        elif stammis_points > 3000:
            loyalty_tier = "Silver"
        else:
            loyalty_tier = "Brons"

        churn_risk = round(min(0.95, max(0.05, (recency / 80.0) * random.uniform(0.7, 1.1))), 2)

        pref_cat = random.choice(["Mejeri & Ägg", "Frukt & Grönt", "Kött & Chark", "Fisk & Skaldjur", "Skafferi & Bröd", "Hälsa & Apotek"])
        income_bracket = random.choice(["Låg (Student/Pensionär)", "Medel", "Hög", "Mycket Hög"])

        demographics_rows.append({
            "customer_id": cid,
            "full_name": full_name,
            "age": age,
            "gender": gender,
            "location_city": city,
            "location_country": country,
            "income_bracket": income_bracket,
            "preferred_category": pref_cat,
            "loyalty_tier": loyalty_tier,
            "crazy_club_points": stammis_points,  # Uniform column schema mapping
            "churn_risk_score": churn_risk,
        })
        customers.append((cid, seg, city))

    # ─── 900 Transactions ───────────────────────────────────────────────────────
    t_id = 1
    for cid, _seg, city in customers:
        num_tx = random.randint(2, 4)
        for _ in range(num_tx):
            prod = random.choice(ICA_PRODUCT_CATALOG)
            pid, pname, pcat, _, pprice, _, _ = prod
            qty = random.randint(1, 4)
            amount = round(pprice * qty, 2)
            channel = random.choices(["Butik (Snabbkassa)", "ICA Maxi Stormarknad", "ICA Appen (Självscanning)", "ica.se Online"], weights=[0.4, 0.3, 0.2, 0.1])[0]

            transactions_rows.append({
                "transaction_id": f"TX-ICA-{t_id:05d}",
                "customer_id": cid,
                "product_id": pid,
                "product_name": pname,
                "category": pcat,
                "amount_eur": amount,  # SEK amount stored in standard amount column
                "quantity": qty,
                "channel": channel,
                "store_city": city,
            })
            t_id += 1

    # ─── 1500 Behavioral Events ────────────────────────────────────────────────
    event_types = ["app_open", "coupon_loaded", "cart_add", "recipe_view", "self_scan_start", "purchase"]
    e_id = 1
    base_date = datetime.date(2026, 8, 1)

    for cid, _seg, _city in customers:
        num_ev = random.randint(4, 6)
        for _ in range(num_ev):
            prod = random.choice(ICA_PRODUCT_CATALOG)
            ev_type = random.choices(event_types, weights=[0.25, 0.20, 0.20, 0.15, 0.10, 0.10])[0]
            ev_date = base_date + datetime.timedelta(days=random.randint(0, 22))
            channel = random.choice(["ICA Appen", "ica.se Webb", "Självscanning Butik"])
            device = random.choice(["iOS App", "Android App", "Handscanner Butik", "Safari Desktop"])

            events_rows.append({
                "event_id": f"EV-ICA-{e_id:05d}",
                "customer_id": cid,
                "event_type": ev_type,
                "event_date": ev_date.strftime("%Y-%m-%d"),
                "product_id": prod[0],
                "channel": channel,
                "device": device,
            })
            e_id += 1

    # ─── 50 Products Catalog rows ──────────────────────────────────────────────
    product_rows = [
        {
            "product_id": p[0],
            "product_name": p[1],
            "category": p[2],
            "subcategory": p[3],
            "price_eur": p[4],  # SEK price stored
            "sustainability_certified": p[5],
            "collection": p[6],
        }
        for p in ICA_PRODUCT_CATALOG
    ]

    return rfm_rows, demographics_rows, transactions_rows, product_rows, events_rows


def seed_to_bigquery():
    """Batch loads the ICA dataset into BigQuery if google-cloud-bigquery is available."""
    try:
        from google.cloud import bigquery
    except ImportError:
        logger.warning("google-cloud-bigquery not installed in current env; generated data locally.")
        return

    client = bigquery.Client(project=PROJECT_ID)
    rfm_data, demo_data, tx_data, prod_data, ev_data = generate_ica_data()

    tables = [
        ("customer_rfm_summary", rfm_data),
        ("customer_demographics_360", demo_data),
        ("customer_transactions", tx_data),
        ("product_catalog", prod_data),
        ("customer_events", ev_data),
    ]

    logger.info(f"Seeding ICA Sverige data into BigQuery dataset '{DATASET_ID}' ({len(rfm_data)} customers, {len(prod_data)} products)...")

    for table_name, rows in tables:
        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
            autodetect=True,
        )
        json_lines = "\n".join(json.dumps(r) for r in rows)
        stream = io.BytesIO(json_lines.encode("utf-8"))

        try:
            job = client.load_table_from_file(stream, table_ref, job_config=job_config)
            job.result()
            logger.info(f"✅ Successfully seeded {len(rows)} rows into {table_ref}")
        except Exception as e:
            logger.warning(f"Note: Could not upload to BigQuery ({e}). Schema prepared.")


if __name__ == "__main__":
    seed_to_bigquery()
