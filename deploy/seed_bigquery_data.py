#!/usr/bin/env python3
"""
Seed Synthetic Marketing & RFM Data into BigQuery Tables via Batch Load Jobs
Populates and aligns `customer_rfm_summary` (200 rows), `customer_demographics_360` (200 rows), 
and `customer_transactions` (400 rows) in dataset `marketing_analytics`.
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

def company_name_gen(lname: str) -> str:
    suffixes = ["tech", "cloud", "corp", "labs", "global", "systems"]
    return f"{lname.lower()}{random.choice(suffixes)}"

def seed_bigquery():
    try:
        from google.cloud import bigquery
        client = bigquery.Client(project=PROJECT_ID)
        logger.info(f"Connected to BigQuery for project '{PROJECT_ID}'")
    except Exception as e:
        logger.error(f"Failed to initialize BigQuery client: {e}")
        return

    # Generate 200 aligned customers
    logger.info("🌱 Generating 200 aligned customer records...")
    segments = ["At-Risk Premium", "Champions", "Recent Explorers", "Hibernating Low-Value"]
    first_names = ["Sarah", "Michael", "Elena", "David", "Jessica", "Alex", "Marcus", "Priya", "Carlos", "Emma", "Liam", "Sophia", "Noah", "Olivia", "Ethan", "Ava"]
    last_names = ["Chen", "Smith", "Rostova", "Johnson", "Davis", "Wong", "Vance", "Patel", "Garcia", "Brown", "Taylor", "Miller", "Wilson", "Anderson", "Thomas", "Jackson"]
    cities = [("San Francisco", "USA"), ("New York", "USA"), ("London", "UK"), ("Berlin", "Germany"), ("Tokyo", "Japan"), ("Toronto", "Canada"), ("Sydney", "Australia"), ("Paris", "France")]
    channels = ["Email", "LinkedIn", "Direct Success Rep", "In-App Notification", "SMS"]
    feature_sets = [
        "Vertex AI Pipelines, Model Armor Guardrails, Custom Connectors",
        "BigQuery Data Warehousing, Real-Time Streaming Analytics",
        "Agent-to-Agent (A2A) Protocols, Multi-Agent Supervisor",
        "Automated Campaign Copywriting, Brand Voice Customizer"
    ]
    tiers = ["Enterprise Platinum", "Gold Growth", "Silver Standard", "Bronze Starter"]

    rfm_rows = []
    demo_rows = []
    tx_rows = []

    now = datetime.datetime.now(datetime.timezone.utc)
    tx_counter = 1

    for i in range(1, 201):
        cid = f"CUST-{1000 + i}"
        seg = random.choice(segments)
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        email = f"{fname.lower()}.{lname.lower()}@{company_name_gen(lname)}.com"

        if seg == "At-Risk Premium":
            recency = random.randint(60, 120)
            freq = random.randint(5, 15)
            monetary = round(random.uniform(1200.0, 4500.0), 2)
            churn_score = round(random.uniform(0.75, 0.95), 2)
        elif seg == "Champions":
            recency = random.randint(1, 20)
            freq = random.randint(15, 40)
            monetary = round(random.uniform(3000.0, 9500.0), 2)
            churn_score = round(random.uniform(0.05, 0.20), 2)
        elif seg == "Recent Explorers":
            recency = random.randint(5, 30)
            freq = random.randint(1, 3)
            monetary = round(random.uniform(100.0, 500.0), 2)
            churn_score = round(random.uniform(0.30, 0.50), 2)
        else: # Hibernating Low-Value
            recency = random.randint(120, 365)
            freq = random.randint(1, 2)
            monetary = round(random.uniform(30.0, 200.0), 2)
            churn_score = round(random.uniform(0.60, 0.85), 2)

        # 1. RFM Summary Row
        rfm_rows.append({
            "customer_id": cid,
            "rfm_segment": seg,
            "recency_days": recency,
            "frequency_orders": freq,
            "total_monetary": monetary
        })

        # 2. Demographics 360 Row
        city, country = random.choice(cities)
        demo_rows.append({
            "customer_id": cid,
            "full_name": full_name,
            "email": email,
            "age": random.randint(26, 58),
            "location_city": city,
            "location_country": country,
            "income_bracket": random.choice(["$100k-$150k", "$150k-$250k", "$250k+"]),
            "preferred_communication_channel": random.choice(channels),
            "favorite_product_features": random.choice(feature_sets),
            "churn_risk_score": churn_score,
            "lifetime_value_tier": random.choice(tiers)
        })

        # 3. Transaction Rows (2 transactions per customer)
        for _ in range(2):
            tx_id = f"TX-{90000 + tx_counter}"
            tx_counter += 1
            tx_date = (now - datetime.timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d %H:%M:%S")
            tx_amount = round(monetary / 2.0, 2)

            tx_rows.append({
                "transaction_id": tx_id,
                "customer_id": cid,
                "customer_name": full_name,
                "email": email,
                "segment": seg,
                "amount": tx_amount,
                "transaction_date": tx_date
            })

    from google.cloud import bigquery
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE
    )

    # 1. Batch Load customer_rfm_summary
    rfm_table_id = f"{PROJECT_ID}.{DATASET_ID}.customer_rfm_summary"
    load_job = client.load_table_from_json(rfm_rows, rfm_table_id, job_config=job_config)
    load_job.result()
    logger.info(f"✅ Batch loaded {len(rfm_rows)} rows into '{rfm_table_id}'")

    # 2. Batch Load customer_demographics_360
    demo_table_id = f"{PROJECT_ID}.{DATASET_ID}.customer_demographics_360"
    load_job = client.load_table_from_json(demo_rows, demo_table_id, job_config=job_config)
    load_job.result()
    logger.info(f"✅ Batch loaded {len(demo_rows)} rows into '{demo_table_id}'")

    # 3. Batch Load customer_transactions
    tx_table_id = f"{PROJECT_ID}.{DATASET_ID}.customer_transactions"
    load_job = client.load_table_from_json(tx_rows, tx_table_id, job_config=job_config)
    load_job.result()
    logger.info(f"✅ Batch loaded {len(tx_rows)} rows into '{tx_table_id}'")

    print(f"\n🎉 BigQuery Data Seeding & Alignment Complete: {len(rfm_rows)} RFM rows, {len(demo_rows)} Demographics rows, and {len(tx_rows)} Transaction rows aligned!")

if __name__ == "__main__":
    seed_bigquery()
