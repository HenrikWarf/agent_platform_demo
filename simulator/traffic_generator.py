"""
Synthetic Traffic Generator & Load Simulator
Simulates active user traffic by sending synthetic marketing prompts to the Agent Gateway / Agent Engine.
"""
import time
import requests
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("traffic_simulator")

SAMPLE_PROMPTS = [
    ("Analyze churn risk for At-Risk Premium segment and generate win-back email sequence", "At-Risk Premium"),
    ("Identify high LTV Champions and create exclusive VIP reward campaign", "Champions"),
    ("Analyze onboarding metrics for Recent Explorers and create welcome series", "Recent Explorers"),
    ("Generate Q3 multi-channel retargeting campaign for hibernating customer segment", "At-Risk Premium")
]

def run_traffic_simulation(backend_url: str = "http://localhost:8080", interval_seconds: int = 5, duration_seconds: int = 60):
    logger.info(f"=== Starting Synthetic Traffic Generator -> {backend_url} ===")
    start_time = time.time()
    count = 0

    while time.time() - start_time < duration_seconds:
        prompt, segment = random.choice(SAMPLE_PROMPTS)
        logger.info(f"[Sim Call #{count + 1}] Sending prompt for segment '{segment}'...")

        try:
            res = requests.post(
                f"{backend_url}/api/chat",
                json={"prompt": prompt, "target_segment": segment},
                timeout=10
            )
            if res.status_code == 200:
                data = res.json()
                logger.info(f"  └─ Success: Status={data.get('status')}, A2A Trace Hops={len(data.get('a2a_trace', []))}")
            else:
                logger.warning(f"  └─ HTTP Error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"  └─ Failed to reach backend: {e}")

        count += 1
        time.sleep(interval_seconds)

    logger.info(f"=== Traffic Simulation Finished. Total Calls Sent: {count} ===")

if __name__ == "__main__":
    run_traffic_simulation(interval_seconds=3, duration_seconds=30)
