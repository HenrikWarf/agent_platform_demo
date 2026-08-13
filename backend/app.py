"""
Google Cloud Agent Platform Demo - FastAPI Server
Exposes Model Armor safety, Agent Engine, Agent Registry Skills, BigQuery, and Evaluation endpoints.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
import os
import sys

# Ensure project root directory is in Python path for direct or package execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from agents.orchestrator_agent import OrchestratorAgent
    from backend.config import Config
    from backend.bq_client import BigQueryClient
    from backend.safety import PromptSafetyGuard as AgentGateway
    from backend.skill_registry import SkillRegistry
except ImportError:
    from agents.orchestrator_agent import OrchestratorAgent
    from config import Config
    from bq_client import BigQueryClient
    from safety import PromptSafetyGuard as AgentGateway
    from skill_registry import SkillRegistry

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_platform_backend")

# OpenTelemetry Cloud Trace Initialization
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter

    tracer_provider = TracerProvider()
    cloud_exporter = CloudTraceSpanExporter(project_id=Config.GCP_PROJECT_ID)
    tracer_provider.add_span_processor(BatchSpanProcessor(cloud_exporter))
    trace.set_tracer_provider(tracer_provider)
    logger.info(f"OpenTelemetry CloudTraceSpanExporter initialized for project '{Config.GCP_PROJECT_ID}'")
except Exception as e:
    logger.warning(f"Could not initialize OpenTelemetry CloudTraceSpanExporter: {e}")

app = FastAPI(
    title="Google Cloud Agent Platform API",
    description="Backend API for Vertex AI Agent Engine, A2A Protocol, Agent Registry Skills, Model Armor, BigQuery, and OpenTelemetry.",
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
orchestrator = OrchestratorAgent(bq_client=bq_client)
gateway = AgentGateway()
skill_registry = SkillRegistry()

# Global simulator state
simulator_state = {"active": False, "generated_count": 0}

class ChatRequest(BaseModel):
    prompt: str
    target_segment: Optional[str] = "At-Risk Premium"

class SimulatorToggleRequest(BaseModel):
    active: bool

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
        "cloud_mode": Config.USE_GCP_CLOUD
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
        "agents": [
            orchestrator.get_metadata(),
            orchestrator.analytics_agent.get_metadata(),
            orchestrator.strategy_agent.get_metadata(),
            orchestrator.content_agent.get_metadata(),
        ]
    }

@app.get("/api/agent_engine/manifest")
def get_agent_engine_manifest():
    """Returns Vertex AI Agent Engine deployed instances manifest."""
    manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agent_engine_manifest.json"))
    if os.path.exists(manifest_path):
        import json
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "agent-orchestrator": {"display_name": "agent-orchestrator", "status": "IN_MEMORY_INSTANCE"},
        "agent-analytics": {"display_name": "agent-analytics", "status": "IN_MEMORY_INSTANCE"},
        "agent-strategy": {"display_name": "agent-strategy", "status": "IN_MEMORY_INSTANCE"},
        "agent-content": {"display_name": "agent-content", "status": "IN_MEMORY_INSTANCE"}
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
    """Processes user marketing prompts through Model Armor and Orchestrator Agent."""
    logger.info(f"Received chat request: '{req.prompt}' for segment '{req.target_segment}'")
    
    # 1. Model Armor Gateway Check
    armor_res = gateway.inspect_and_sanitize(req.prompt)
    if not armor_res["passed"]:
        return {
            "status": "BLOCKED_BY_MODEL_ARMOR",
            "model_armor": armor_res,
            "summary": f"Security Alert: Request blocked by Model Armor. Reason: {armor_res['filter_reason']}",
            "a2a_trace": []
        }

    # 2. Process via Multi-Agent Orchestrator
    result = orchestrator.process_user_request(
        user_prompt=armor_res["sanitized_prompt"],
        target_segment=req.target_segment
    )
    result["model_armor"] = armor_res
    return result

@app.post("/api/stream_reasoning_engine")
@app.post("/api/query_reasoning_engine")
def stream_reasoning_engine(request: Dict[str, Any]):
    """Vertex AI Agent Engine Reasoning Engine streaming endpoint."""
    input_data = request.get("input", {})
    prompt = input_data.get("prompt") or request.get("prompt", "Analyze customer segment performance")
    segment = input_data.get("target_segment") or request.get("target_segment", "All Cohorts (Full Dataset)")
    
    # Check Model Armor
    armor_res = gateway.inspect_and_sanitize(prompt)
    if not armor_res["passed"]:
        return {
            "status": "BLOCKED_BY_MODEL_ARMOR",
            "model_armor": armor_res,
            "summary": f"Security Alert: Request blocked by Model Armor. Reason: {armor_res['filter_reason']}",
            "a2a_trace": []
        }

    result = orchestrator.process_user_request(
        user_prompt=armor_res["sanitized_prompt"],
        target_segment=segment
    )
    result["model_armor"] = armor_res
    return result

@app.get("/api/simulator/status")
def get_simulator_status():
    return simulator_state

@app.post("/api/simulator/toggle")
def toggle_simulator(req: SimulatorToggleRequest):
    simulator_state["active"] = req.active
    logger.info(f"Traffic Simulator state set to: {req.active}")
    return {"status": "SUCCESS", "simulator_active": simulator_state["active"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=Config.PORT, reload=True)
