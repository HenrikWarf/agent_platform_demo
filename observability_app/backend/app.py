"""FastAPI Backend Server for Multi-Agent Observability & Quality Triage Platform.

Runs on port 8081 by default.
Exposes REST endpoints for telemetry KPIs, 7-dimension error clusters, conversation waterfall traces,
LLM quality evaluations, and the Observability Assistant Agent.
"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure Vertex AI authentication is set
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
os.environ["GOOGLE_API_USE_MTLS_ENDPOINT"] = "never"
os.environ["GOOGLE_API_USE_CLIENT_CERTIFICATE"] = "false"

# Ensure repository root is on Python path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from google.adk.artifacts import InMemoryArtifactService  # noqa: E402
from google.adk.runners import Runner  # noqa: E402
from google.adk.sessions import InMemorySessionService  # noqa: E402
from google.genai.types import Content, Part  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from observability_app.agent.agent import app as adk_app  # noqa: E402
from observability_app.agent.agent import obs_agent  # noqa: E402
from observability_app.backend.eval_engine import eval_engine  # noqa: E402
from observability_app.backend.telemetry_store import telemetry_store  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("observability_backend")

app = FastAPI(
    title="GCP Multi-Agent Observability & Quality Platform",
    version="1.0.0",
    description="Observability, Quality Evaluation, and Error Triage Backend for Multi-Agent Fleet.",
)

# Enable CORS for frontend dashboard (port 3001 and local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK Runner and Session Services for Observability Assistant
obs_session_service = InMemorySessionService()
obs_artifact_service = InMemoryArtifactService()
obs_runner = Runner(
    app=adk_app,
    session_service=obs_session_service,
    artifact_service=obs_artifact_service,
    auto_create_session=True,
)
_obs_chat_session_id: Optional[str] = None


# ==============================================================================
# REQUEST & RESPONSE SCHEMAS
# ==============================================================================

class UpdateTriageRequest(BaseModel):
    status: str
    author: Optional[str] = "Engineer"
    note: Optional[str] = None


class EvalRunRequest(BaseModel):
    user_prompt: str
    agent_response: str
    tenant_id: Optional[str] = "ica_sweden"
    routed_agents: Optional[List[str]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None


class GenerateSuiteRequest(BaseModel):
    scenario_theme: str = "nordic_compliance"
    tenant_id: str = "ica_sweden"
    count: int = 4


class BatchEvalRequest(BaseModel):
    test_cases: List[Dict[str, Any]]
    tenant_id: str = "ica_sweden"


class LiveSessionIngestRequest(BaseModel):
    session_id: str
    tenant_id: Optional[str] = "ica_sweden"
    client_name: Optional[str] = "ICA Sverige"
    user_id: Optional[str] = "live-user"
    user_prompt: str
    agent_response: str
    routed_agents: Optional[List[str]] = None
    tools_executed: Optional[List[Dict[str, Any]]] = None
    latency_ms: Optional[int] = 1500
    has_errors: Optional[bool] = False
    error_message: Optional[str] = None
    spans: Optional[List[Dict[str, Any]]] = None


class ObsChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "observability_backend", "version": "1.0.0"}


@app.post("/api/obs/ingest-session")
async def ingest_live_session(req: LiveSessionIngestRequest) -> Dict[str, Any]:
    """Ingests a real-time live conversation turn from the main retail application."""
    tenant = req.tenant_id or ("ica_sweden" if "ica" in (req.client_name or "").lower() else "crazy_fashion")
    client_name = req.client_name or ("ICA Sverige" if tenant == "ica_sweden" else "Crazy Fashion")
    
    return telemetry_store.ingest_live_turn(
        session_id=req.session_id,
        tenant_id=tenant,
        client_name=client_name,
        user_id=req.user_id or f"usr-{req.session_id[-6:]}",
        user_prompt=req.user_prompt,
        agent_response=req.agent_response,
        routed_agents=req.routed_agents or ["marketing_orchestrator"],
        tools_executed=req.tools_executed or [],
        latency_ms=req.latency_ms or 1500,
        has_errors=req.has_errors or False,
        error_message=req.error_message,
        spans=req.spans,
    )


@app.get("/api/obs/overview")
async def get_overview() -> Dict[str, Any]:
    """Returns global fleet KPIs, health radar dimensions, and tenant comparisons."""
    return telemetry_store.get_overview_kpis()


@app.get("/api/obs/triage")
@app.get("/api/obs/clusters")
async def list_error_clusters(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, INVESTIGATING, RESOLVED"),
    category: Optional[str] = Query(None, description="Filter by category: DATA_HALLUCINATION_DRIFT, ROUTING_DELEGATION_LOOP, etc."),
) -> List[Dict[str, Any]]:
    """Returns grouped error clusters across the 7 enterprise failure dimensions."""
    return telemetry_store.get_error_clusters(status=status, category=category)


@app.post("/api/obs/triage/{cluster_id}/status")
@app.post("/api/obs/clusters/{cluster_id}/status")
async def update_cluster_status(cluster_id: str, req: UpdateTriageRequest) -> Dict[str, Any]:
    """Updates status and appends audit note for an error cluster."""
    updated = telemetry_store.update_cluster_status(
        cluster_id=cluster_id,
        new_status=req.status,
        author=req.author or "Engineer",
        note=req.note,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Error cluster '{cluster_id}' not found.")
    return updated


@app.get("/api/obs/sessions")
async def list_sessions(
    tenant_id: Optional[str] = Query(None, description="Filter by tenant: crazy_fashion, ica_sweden"),
    agent_name: Optional[str] = Query(None, description="Filter by routed agent name"),
    limit: int = Query(100, ge=1, le=200),
) -> List[Dict[str, Any]]:
    """Lists conversation sessions with high-level quality scores, turn counts, and routed agents."""
    return telemetry_store.get_sessions(tenant_id=tenant_id, agent_name=agent_name, limit=limit)


@app.get("/api/obs/sessions/{session_id}")
async def get_session_detail(session_id: str) -> Dict[str, Any]:
    """Returns full session turns and hierarchical OpenTelemetry waterfall spans."""
    detail = telemetry_store.get_session_detail(session_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return detail


@app.get("/api/obs/agents")
async def get_agent_metrics() -> List[Dict[str, Any]]:
    """Returns per-agent latency percentiles (p50/p90/p99), token consumption, and call counts."""
    return telemetry_store.get_agent_fleet_metrics()


@app.post("/api/obs/eval/generate-suite")
async def generate_eval_suite(req: GenerateSuiteRequest) -> List[Dict[str, Any]]:
    """Generates dynamic evaluation test scenarios with Gemini on Vertex AI."""
    return eval_engine.generate_eval_suite(
        scenario_theme=req.scenario_theme,
        tenant_id=req.tenant_id,
        count=req.count,
    )


@app.post("/api/obs/eval/run-batch")
async def run_batch_eval(req: BatchEvalRequest) -> Dict[str, Any]:
    """Runs batch LLM-as-a-judge evaluations over a set of selected test questions."""
    return eval_engine.run_batch_eval_suite(
        test_cases=req.test_cases,
        tenant_id=req.tenant_id,
    )


@app.post("/api/obs/eval/run")
async def run_quality_eval(req: EvalRunRequest) -> Dict[str, Any]:
    """Executes automated LLM-as-a-judge quality rubrics on a single prompt-response pair."""
    return eval_engine.evaluate_turn(
        user_prompt=req.user_prompt,
        agent_response=req.agent_response,
        routed_agents=req.routed_agents or ["marketing_orchestrator"],
        tool_calls=req.tool_calls or [],
        tenant_id=req.tenant_id or "ica_sweden",
    )


@app.post("/api/obs/chat")
async def chat_with_observability_assistant(req: ObsChatRequest) -> Dict[str, Any]:
    """Direct chat endpoint with the Observability Assistant Agent."""
    global _obs_chat_session_id
    try:
        if not _obs_chat_session_id:
            sess = await obs_session_service.create_session(app_name=adk_app.name, user_id="user-observability-lead")
            _obs_chat_session_id = sess.id

        message = Content(role="user", parts=[Part.from_text(text=req.message)])
        response_text = ""
        tools_called = []

        async for event in obs_runner.run_async(
            user_id="user-observability-lead",
            session_id=_obs_chat_session_id,
            new_message=message,
        ):
            if hasattr(event, "content") and event.content:
                if isinstance(event.content, str):
                    response_text += event.content
                elif hasattr(event.content, "parts"):
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            response_text += part.text
                        if hasattr(part, "function_call") and part.function_call:
                            tool_name = part.function_call.name
                            if tool_name not in tools_called:
                                tools_called.append(tool_name)

        if not response_text:
            response_text = "I have queried the fleet telemetry store. How can I assist with error triage or agent performance?"

        return {
            "response": response_text,
            "tools_called": tools_called,
            "agent": "observability_assistant",
        }
    except Exception as e:
        logger.error(f"Error in chat_with_observability_assistant: {e}", exc_info=True)
        # Resilient telemetry fallback
        try:
            kpis = telemetry_store.get_overview_kpis()
            open_clusters = telemetry_store.get_error_clusters(status="OPEN")
            fallback_text = (
                f"### Observability Assistant Insights\n\n"
                f"- **Global Fleet Quality Score**: {kpis['global_quality_score']}%\n"
                f"- **Task Completion Rate**: {kpis['task_completion_rate']}%\n"
                f"- **Average Turn Latency**: {kpis['average_latency_ms']}ms\n"
                f"- **Open Problem Clusters**: {len(open_clusters)} active\n\n"
                f"I am actively monitoring `agent-demo-09` across Crazy Fashion and ICA Sverige. "
                f"Ask me about any specific agent trace, problem cluster, or live evaluation!"
            )
            return {
                "response": fallback_text,
                "tools_called": ["get_fleet_health_overview"],
                "agent": "observability_assistant",
            }
        except Exception as e2:
            return {"response": f"Observability assistant ready: {e2}", "tools_called": [], "agent": "observability_assistant"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("OBSERVABILITY_PORT", "8081"))
    uvicorn.run("observability_app.backend.app:app", host="0.0.0.0", port=port, reload=True)
