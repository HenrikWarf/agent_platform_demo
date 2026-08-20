"""
Google Cloud Agent Platform Demo - FastAPI Server
Exposes Agent Runtime proxy, Agent Registry Skills, BigQuery, and Evaluation endpoints.

The backend is a thin API layer — all agent orchestration is delegated to the
deployed ADK Agent on Vertex AI Agent Runtime via AgentRuntimeClient.
"""
import json
import logging
import os
import sys
import threading
import time as _time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Ensure project root directory is in Python path for direct or package execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from backend.agent_runtime_client import AgentRuntimeClient
    from backend.bq_client import BigQueryClient
    from backend.config import Config
    from backend.skill_registry import SkillRegistry
except ImportError:
    from agent_runtime_client import AgentRuntimeClient
    from bq_client import BigQueryClient
    from config import Config
    from skill_registry import SkillRegistry

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_platform_backend")

# OpenTelemetry Cloud Trace Initialization
try:
    from opentelemetry import trace
    from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    tracer_provider = TracerProvider()
    cloud_exporter = CloudTraceSpanExporter(project_id=Config.GCP_PROJECT_ID)
    tracer_provider.add_span_processor(BatchSpanProcessor(cloud_exporter))
    trace.set_tracer_provider(tracer_provider)
    logger.info(f"OpenTelemetry CloudTraceSpanExporter initialized for project '{Config.GCP_PROJECT_ID}'")
except Exception as e:
    logger.warning(f"Could not initialize OpenTelemetry CloudTraceSpanExporter: {e}")

app = FastAPI(
    title="Google Cloud Agent Platform API",
    description="Backend API for Vertex AI Agent Runtime, Agent Registry Skills, BigQuery, and OpenTelemetry.",
    version="1.0.0"
)

try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor.instrument_app(app)
except Exception as e:
    logger.warning(f"FastAPIInstrumentor warning: {e}")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
bq_client = BigQueryClient()
runtime_client = AgentRuntimeClient()
skill_registry = SkillRegistry()

class ChatRequest(BaseModel):
    prompt: str
    target_segment: str | None = None
    session_id: str | None = None
    user_id: str | None = None

class GenerateSuggestionsRequest(BaseModel):
    messages: list[dict[str, Any]] = []
    current_segment: str | None = "All Cohorts (Full Dataset)"

class SimulatorToggleRequest(BaseModel):
    active: bool

# ─── Synthetic Traffic Simulator ──────────────────────────────────────────────

SYNTHETIC_PROMPTS = [
    {"prompt": "What is the average monetary value for Champions segment?", "segment": "Champions", "agent": "analytics"},
    {"prompt": "Show customer distribution by RFM segment.", "segment": "All Cohorts (Full Dataset)", "agent": "analytics"},
    {"prompt": "What are the top 5 customer segments by total revenue?", "segment": "All Cohorts (Full Dataset)", "agent": "analytics"},
    {"prompt": "How many customers have recency over 90 days?", "segment": "All Cohorts (Full Dataset)", "agent": "analytics"},
    {"prompt": "Analyze churn risk for At-Risk Premium customers and recommend retention tactics.", "segment": "At-Risk Premium", "agent": "strategy"},
    {"prompt": "Create a VIP loyalty rewards strategy for Champions.", "segment": "Champions", "agent": "strategy"},
    {"prompt": "Generate a win-back email campaign for Hibernating customers.", "segment": "Hibernating", "agent": "full_campaign"},
    {"prompt": "Draft a re-engagement SMS sequence for At-Risk customers.", "segment": "At-Risk Premium", "agent": "full_campaign"},
]

_AGENT_LABELS = {
    "analytics": "Analytics Agent",
    "strategy": "Strategy Agent",
    "full_campaign": "Full Campaign (Content Agent)",
}

def _new_agent_stats():
    return {"requests": 0, "successful": 0, "failed": 0, "avg_latency_ms": 0, "_latencies": []}

simulator_state = {
    "active": False,
    "total_requests": 0,
    "successful": 0,
    "failed": 0,
    "avg_latency_ms": 0,
    "recent_requests": [],
    "per_agent": {
        "analytics": {**_new_agent_stats(), "label": _AGENT_LABELS["analytics"]},
        "strategy": {**_new_agent_stats(), "label": _AGENT_LABELS["strategy"]},
        "full_campaign": {**_new_agent_stats(), "label": _AGENT_LABELS["full_campaign"]},
    },
}
_simulator_thread = None
_simulator_lock = threading.Lock()


def _run_simulator_loop():
    """Background loop: sends synthetic prompts to Agent Runtime until stopped."""
    idx = 0
    latencies = []
    while simulator_state["active"]:
        prompt_data = SYNTHETIC_PROMPTS[idx % len(SYNTHETIC_PROMPTS)]
        idx += 1
        agent_key = prompt_data["agent"]
        start = _time.time()
        entry = {
            "prompt": prompt_data["prompt"][:60] + "...",
            "segment": prompt_data["segment"],
            "agent": agent_key,
            "agent_label": _AGENT_LABELS.get(agent_key, agent_key),
            "status": "PENDING",
            "latency_ms": 0,
            "timestamp": _time.strftime("%H:%M:%S"),
        }
        try:
            result = runtime_client.query(
                prompt=prompt_data["prompt"],
                target_segment=prompt_data["segment"],
            )
            elapsed_ms = round((_time.time() - start) * 1000)
            entry["latency_ms"] = elapsed_ms
            entry["status"] = "SUCCESS" if result.get("summary") else "EMPTY"
            latencies.append(elapsed_ms)

            with _simulator_lock:
                simulator_state["total_requests"] += 1
                simulator_state["successful"] += 1
                simulator_state["avg_latency_ms"] = round(sum(latencies) / len(latencies))
                simulator_state["recent_requests"] = ([entry] + simulator_state["recent_requests"])[:15]
                # Per-agent tracking
                ag = simulator_state["per_agent"][agent_key]
                ag["requests"] += 1
                ag["successful"] += 1
                ag["_latencies"].append(elapsed_ms)
                ag["avg_latency_ms"] = round(sum(ag["_latencies"]) / len(ag["_latencies"]))

            logger.info(f"Simulator [{idx}] {entry['status']} [{agent_key}] in {elapsed_ms}ms: {prompt_data['prompt'][:50]}")
        except Exception as e:
            elapsed_ms = round((_time.time() - start) * 1000)
            entry["latency_ms"] = elapsed_ms
            entry["status"] = "ERROR"
            entry["error"] = str(e)[:100]

            with _simulator_lock:
                simulator_state["total_requests"] += 1
                simulator_state["failed"] += 1
                simulator_state["recent_requests"] = ([entry] + simulator_state["recent_requests"])[:15]
                ag = simulator_state["per_agent"][agent_key]
                ag["requests"] += 1
                ag["failed"] += 1

            logger.warning(f"Simulator [{idx}] ERROR [{agent_key}] in {elapsed_ms}ms: {e}")

        # Wait 5 seconds between requests (if still active)
        for _ in range(50):
            if not simulator_state["active"]:
                break
            _time.sleep(0.1)

    logger.info("Simulator loop stopped.")


@app.get("/api/simulator/status")
def get_simulator_status():
    with _simulator_lock:
        # Return a clean copy without internal _latencies lists
        state = dict(simulator_state)
        state["per_agent"] = {}
        for key, ag in simulator_state["per_agent"].items():
            state["per_agent"][key] = {k: v for k, v in ag.items() if not k.startswith("_")}
        return state


@app.post("/api/simulator/toggle")
def toggle_simulator(req: SimulatorToggleRequest):
    global _simulator_thread

    if req.active and not simulator_state["active"]:
        # Start — reset all metrics
        simulator_state["active"] = True
        simulator_state["total_requests"] = 0
        simulator_state["successful"] = 0
        simulator_state["failed"] = 0
        simulator_state["avg_latency_ms"] = 0
        simulator_state["recent_requests"] = []
        simulator_state["per_agent"] = {
            "analytics": {**_new_agent_stats(), "label": _AGENT_LABELS["analytics"]},
            "strategy": {**_new_agent_stats(), "label": _AGENT_LABELS["strategy"]},
            "full_campaign": {**_new_agent_stats(), "label": _AGENT_LABELS["full_campaign"]},
        }
        _simulator_thread = threading.Thread(target=_run_simulator_loop, daemon=True)
        _simulator_thread.start()
        logger.info("Synthetic Traffic Simulator STARTED")
    elif not req.active and simulator_state["active"]:
        # Stop
        simulator_state["active"] = False
        logger.info("Synthetic Traffic Simulator STOPPED")

    return {"status": "SUCCESS", "simulator_active": simulator_state["active"]}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "gcp-agent-platform-backend",
        "version": Config.APP_VERSION,
        "environment": Config.ENVIRONMENT,
        "gcp_project": Config.GCP_PROJECT_ID,
        "region": Config.GCP_REGION,
        "cloud_mode": Config.USE_GCP_CLOUD,
        "agent_runtime_configured": runtime_client.is_configured,
    }

@app.get("/api/version")
def get_version_info():
    return {
        "app_version": Config.APP_VERSION,
        "environment": Config.ENVIRONMENT,
        "gcp_project_id": Config.GCP_PROJECT_ID,
        "gcp_region": Config.GCP_REGION,
        "bigquery_dataset": Config.BIGQUERY_DATASET,
        "agent_runtime_id": Config.AGENT_RUNTIME_ID or "Not Configured",
        "agent_gateway_url": Config.AGENT_GATEWAY_URL or "Not Configured",
        "model_armor_floor_id": Config.MODEL_ARMOR_FLOOR_ID,
        "model_armor_template_id": Config.MODEL_ARMOR_TEMPLATE_ID,
        "use_gcp_cloud": Config.USE_GCP_CLOUD
    }

@app.get("/api/agents")
def list_agents():
    """Lists registered agents in the platform and their active bound skills."""
    return {
        "agents": runtime_client.get_agent_metadata()
    }

@app.get("/api/agent_engine/manifest")
def get_agent_engine_manifest():
    """Returns Vertex AI Agent Runtime deployment manifest."""
    import json
    metadata_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "deployment_metadata.json"))
    if os.path.exists(metadata_path):
        with open(metadata_path, encoding="utf-8") as f:
            return json.load(f)
    return {
        "deployment_target": "agent_runtime",
        "agent_directory": "app",
        "status": "NOT_DEPLOYED" if not runtime_client.is_configured else "DEPLOYED",
        "remote_agent_runtime_id": runtime_client.runtime_id or "Not Available",
    }

@app.get("/api/skills")
def list_skills():
    """Lists skills registered in the Agent Registry."""
    return {
        "skills": skill_registry.list_registered_skills()
    }

@app.get("/api/skills/{skill_id}")
def get_skill_detail(skill_id: str):
    """Returns content for a specific skill in the registry."""
    return skill_registry.get_skill_content(skill_id)

@app.get("/api/bigquery/tables")
def list_bigquery_tables():
    """Lists available BigQuery analytics tables."""
    return {
        "tables": [
            {"id": "customer_rfm_summary", "name": "Customer RFM Segmentation Summary"},
            {"id": "customer_demographics_360", "name": "Customer Demographics & 360 Profiles"},
            {"id": "customer_transactions", "name": "Real-time Customer Transaction Stream"}
        ]
    }

@app.get("/api/bigquery/sample")
def get_bigquery_sample(table_name: str = "customer_rfm_summary"):
    """Returns sample BigQuery customer rows and total live row count for specified table."""
    sample_rows = bq_client.get_sample_customers(table_name=table_name)
    total_rows = bq_client.get_table_total_rows(table_name=table_name)
    return {
        "dataset": Config.BIGQUERY_DATASET,
        "table": table_name,
        "total_rows": total_rows,
        "sample_data": sample_rows,
        "rows": sample_rows
    }

@app.post("/api/chat")
def process_chat(req: ChatRequest):
    """Processes user marketing prompts via Agent Gateway → Agent Runtime.

    Traffic flow: Client → Backend → Agent Gateway (Model Armor governance) → Agent Runtime.
    Model Armor security screening is enforced at the Agent Gateway infrastructure level
    via the :streamQuery governed endpoint — no application-level pre-flight needed.
    """
    logger.info(f"Received chat request: '{req.prompt}' (session_id={req.session_id})")

    result = runtime_client.query(
        prompt=req.prompt,
        target_segment=req.target_segment or "All Cohorts (Full Dataset)",
        session_id=req.session_id,
        user_id=req.user_id,
    )
    result["agent_gateway"] = {
        "resource": Config.AGENT_GATEWAY_URL,
        "governed_access_path": "CLIENT_TO_AGENT",
        "model_armor_enforcement": "AGENT_GATEWAY",
        "model_armor_floor_id": Config.MODEL_ARMOR_FLOOR_ID,
    }
    return result

@app.post("/api/chat/stream")
def process_chat_stream(req: ChatRequest):
    """Streams real-time agent background execution steps, tool calls, and final response via SSE."""
    logger.info(f"Received streaming chat request: '{req.prompt}' (session_id={req.session_id})")

    def event_generator():
        for chunk in runtime_client.query_stream(
            prompt=req.prompt,
            target_segment=req.target_segment or "All Cohorts (Full Dataset)",
            session_id=req.session_id,
            user_id=req.user_id,
        ):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/stream_reasoning_engine")
@app.post("/api/query_reasoning_engine")
def stream_reasoning_engine(request: dict[str, Any]):
    """Vertex AI Agent Runtime streaming endpoint."""
    input_data = request.get("input", {})
    prompt = input_data.get("prompt") or request.get("prompt", "Analyze customer segment performance")
    segment = input_data.get("target_segment") or request.get("target_segment", "All Cohorts (Full Dataset)")

    return runtime_client.query(
        prompt=prompt,
        target_segment=segment
    )

# ─── A2A Protocol Proxy Endpoints ────────────────────────────────────────────

class A2AMessageRequest(BaseModel):
    prompt: str

@app.get("/api/a2a/agent-card")
def get_a2a_agent_card():
    """Proxy the A2A agent card from the deployed Agent Runtime."""
    import requests as http_requests
    if not runtime_client._base_url:
        raise HTTPException(status_code=503, detail="Agent Runtime not configured")
    card_url = f"{runtime_client._base_url}/a2a/app/.well-known/agent-card.json"
    resp = http_requests.get(card_url, headers=runtime_client._get_auth_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()

@app.post("/api/a2a/send-message")
def send_a2a_message(req: A2AMessageRequest):
    """Send a message to the agent via the A2A JSON-RPC protocol."""
    import uuid

    import requests as http_requests
    if not runtime_client._base_url:
        raise HTTPException(status_code=503, detail="Agent Runtime not configured")
    rpc_url = f"{runtime_client._base_url}/a2a/app"
    payload = {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": "SendMessage",
        "params": {
            "message": {
                "messageId": str(uuid.uuid4()),
                "role": "ROLE_USER",
                "parts": [{"text": req.prompt}],
            },
            "configuration": {"acceptedOutputModes": ["text/plain"]},
        },
    }
    headers = runtime_client._get_auth_headers()
    headers["A2A-Version"] = "1.0"
    resp = http_requests.post(rpc_url, headers=headers, json=payload, timeout=120)
    resp.raise_for_status()
    raw = resp.json()
    # Parse the A2A response
    result = raw.get("result", raw)
    status = result.get("status", {})
    state = status.get("state", "")
    if not state and "task" in result:
        task = result["task"]
        status = task.get("status", {})
        state = status.get("state", "")
        result = task
    # Extract response text
    response_text = ""
    for artifact in result.get("artifacts", []):
        for part in artifact.get("parts", []):
            if part.get("text"):
                response_text += part["text"]
    if not response_text:
        message = status.get("message", {})
        if message:
            for part in message.get("parts", []):
                if part.get("text"):
                    response_text += part["text"]
    return {
        "state": state or "COMPLETED",
        "response_text": response_text,
        "raw_response": raw,
    }

# ─── Evaluation Endpoint ─────────────────────────────────────────────────────

@app.post("/api/eval/run")
def run_evaluation():
    """Runs the local evaluation suite against the deployed Agent Runtime.

    Sends golden prompts from eval/dataset/golden_marketing_prompts.json to the
    Agent Runtime and evaluates safety correctness and response quality.
    """
    try:
        from eval.local_eval import run_local_evaluation
        logger.info("Starting local evaluation suite...")
        result = run_local_evaluation()
        logger.info(f"Evaluation complete: {result.get('benchmark_score_pct', 0)}% ({result.get('passed_cases', 0)}/{result.get('total_cases', 0)})")
        return result
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Dynamic AI Follow-Up Suggestions Endpoint ──────────────────────────────

@app.post("/api/suggestions/generate")
def generate_suggestions(req: GenerateSuggestionsRequest):
    """Calls Gemini 3.6 Flash on Vertex AI to inspect conversation context
    and dynamically generate 6 hyper-relevant follow-up marketing questions.
    """
    try:
        from backend.suggestions_generator import generate_dynamic_followups
        questions = generate_dynamic_followups(
            messages=req.messages,
            current_segment=req.current_segment or "All Cohorts (Full Dataset)"
        )
        return {
            "questions": questions,
            "count": len(questions),
            "source": "gemini-3.6-flash"
        }
    except Exception as e:
        logger.error(f"Error generating dynamic suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=Config.PORT, reload=True)
