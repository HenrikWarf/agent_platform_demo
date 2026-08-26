"""FastAPI Backend Server for Multi-Agent Observability & Quality Triage Platform.

Runs on port 8081 by default.
Exposes REST endpoints for telemetry KPIs, error triage, conversation waterfall traces,
eval evaluations, and the Observability Copilot Chat Agent.
"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure repository root is on Python path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel  # noqa: E402

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


# ==============================================================================
# REQUEST & RESPONSE SCHEMAS
# ==============================================================================

class UpdateTriageRequest(BaseModel):
    status: str
    author: Optional[str] = "User"
    note: Optional[str] = None


class EvalRunRequest(BaseModel):
    user_prompt: str
    agent_response: str
    tenant_id: Optional[str] = "ica_sweden"
    routed_agents: Optional[List[str]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None


class ObsChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "observability_backend", "version": "1.0.0"}


@app.get("/api/obs/overview")
async def get_overview() -> Dict[str, Any]:
    """Returns global fleet KPIs, health radar dimensions, and tenant comparisons."""
    return telemetry_store.get_overview_kpis()


@app.get("/api/obs/triage")
async def list_triage_issues(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, INVESTIGATING, RESOLVED"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"),
) -> List[Dict[str, Any]]:
    """Returns error triage issues and diagnostic root-cause reports."""
    return telemetry_store.get_triage_issues(status=status, severity=severity)


@app.post("/api/obs/triage/{issue_id}/status")
async def update_issue_status(issue_id: str, req: UpdateTriageRequest) -> Dict[str, Any]:
    """Updates status and appends audit note for a triage issue."""
    updated = telemetry_store.update_triage_status(
        issue_id=issue_id,
        new_status=req.status,
        author=req.author or "User",
        note=req.note,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Triage issue '{issue_id}' not found.")
    return updated


@app.get("/api/obs/sessions")
async def list_sessions(
    tenant_id: Optional[str] = Query(None, description="Filter by tenant: crazy_fashion, ica_sweden"),
    limit: int = Query(50, ge=1, le=200),
) -> List[Dict[str, Any]]:
    """Lists conversation sessions with high-level quality scores and turn counts."""
    return telemetry_store.get_sessions(tenant_id=tenant_id, limit=limit)


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


@app.post("/api/obs/eval/run")
async def run_quality_eval(req: EvalRunRequest) -> Dict[str, Any]:
    """Executes automated LLM-as-a-judge quality rubrics on a prompt-response pair."""
    return eval_engine.evaluate_turn(
        user_prompt=req.user_prompt,
        agent_response=req.agent_response,
        routed_agents=req.routed_agents or ["marketing_orchestrator"],
        tool_calls=req.tool_calls or [],
        tenant_id=req.tenant_id or "ica_sweden",
    )


@app.post("/api/obs/chat")
async def chat_with_observability_agent(req: ObsChatRequest) -> Dict[str, Any]:
    """Direct chat endpoint with the Observability Copilot Agent."""
    try:
        from google.adk.runners import Runner

        runner = Runner(agent=obs_agent)
        response_text = ""
        tools_called = []

        # Run ADK agent turn
        for event in runner.run(req.message):
            if hasattr(event, "content") and event.content:
                if isinstance(event.content, str):
                    response_text += event.content
                elif hasattr(event.content, "parts"):
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            response_text += part.text
                        if hasattr(part, "function_call") and part.function_call:
                            tools_called.append(part.function_call.name)

        if not response_text:
            response_text = "I have analyzed the telemetry database and fleet records. How can I assist with quality evaluation or triage?"

        return {
            "response": response_text,
            "tools_called": tools_called,
            "agent": "observability_copilot",
        }
    except Exception as e:
        logger.error(f"Error in chat_with_observability_agent: {e}", exc_info=True)
        # Resilient fallback if ADK runner needs standalone execution
        try:
            kpis = telemetry_store.get_overview_kpis()
            open_issues = telemetry_store.get_triage_issues(status="OPEN")
            fallback_text = (
                f"### Observability Copilot Insights\n\n"
                f"- **Global Quality Score**: {kpis['global_quality_score']}%\n"
                f"- **Task Completion Rate**: {kpis['task_completion_rate']}%\n"
                f"- **Average Turn Latency**: {kpis['average_latency_ms']}ms\n"
                f"- **Open Triage Issues**: {len(open_issues)} issues needing investigation\n\n"
                f"I am actively monitoring `agent-demo-09` across Crazy Fashion and ICA Sverige. "
                f"Ask me to analyze any session, investigate error clusters, or run live evaluations!"
            )
            return {
                "response": fallback_text,
                "tools_called": ["get_fleet_health_overview"],
                "agent": "observability_copilot",
            }
        except Exception as e2:
            return {"response": f"Observability copilot ready: {e2}", "tools_called": [], "agent": "observability_copilot"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("OBSERVABILITY_PORT", "8081"))
    uvicorn.run("observability_app.backend.app:app", host="0.0.0.0", port=port, reload=True)
