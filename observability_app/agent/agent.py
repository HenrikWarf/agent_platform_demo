"""Observability & Quality Triage Copilot Agent for GCP Multi-Agent Platform.

Deployable to Vertex AI Agent Runtime (Reasoning Engine) using Google ADK.
Provides tools to inspect fleet health, trace waterfall spans, triage errors,
evaluate response quality, and optimize multi-agent execution.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure repository root is on Python path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from google.adk.agents import Agent  # noqa: E402
from google.adk.apps import App  # noqa: E402
from google.adk.skills import load_skill_from_dir  # noqa: E402
from google.adk.tools.skill_toolset import SkillToolset  # noqa: E402

from observability_app.backend.eval_engine import eval_engine  # noqa: E402
from observability_app.backend.telemetry_store import telemetry_store  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("observability_agent")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


# ==============================================================================
# TOOL DEFINITIONS
# ==============================================================================

def get_fleet_health_overview() -> str:
    """Retrieves the global fleet health KPIs, Quality Score, task completion rate,

    error rates, and tenant comparison across Crazy Fashion and ICA Sverige.
    """
    kpis = telemetry_store.get_overview_kpis()
    return json.dumps(kpis, indent=2)


def get_error_clusters(status: Optional[str] = None, severity: Optional[str] = None) -> str:
    """Retrieves grouped error triage issues filtered by status (OPEN, INVESTIGATING, RESOLVED)

    and severity (CRITICAL, HIGH, MEDIUM, LOW).
    """
    issues = telemetry_store.get_triage_issues(status=status, severity=severity)
    return json.dumps(issues, indent=2)


def get_conversation_trace(session_id: str) -> str:
    """Retrieves full conversation turns and OpenTelemetry waterfall spans

    (invoke_workflow, call_llm, execute_tool) for a specific session ID.
    """
    detail = telemetry_store.get_session_detail(session_id)
    if not detail:
        return json.dumps({"error": f"Session '{session_id}' not found."}, indent=2)
    return json.dumps(detail, indent=2)


def get_agent_metrics() -> str:
    """Retrieves latency percentiles (p50, p90, p99), token consumption, call counts,

    and failure rates across all 6 agents in the fleet.
    """
    metrics = telemetry_store.get_agent_fleet_metrics()
    return json.dumps(metrics, indent=2)


def run_live_quality_eval(user_prompt: str, agent_response: str, tenant_id: str = "ica_sweden") -> str:
    """Runs automated LLM-as-a-judge quality rubrics on a prompt-response pair

    evaluating task_success, grounding_faithfulness, tool_use_quality, and brand_voice_adherence.
    """
    eval_result = eval_engine.evaluate_turn(
        user_prompt=user_prompt,
        agent_response=agent_response,
        routed_agents=["marketing_orchestrator"],
        tenant_id=tenant_id,
    )
    return json.dumps(eval_result, indent=2)


def update_triage_issue(issue_id: str, status: str, note: Optional[str] = None) -> str:
    """Updates the status of an error triage issue (e.g.

    OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE) and logs an audit note.
    """
    updated = telemetry_store.update_triage_status(
        issue_id=issue_id,
        new_status=status,
        author="Observability Copilot",
        note=note,
    )
    if not updated:
        return json.dumps({"error": f"Issue '{issue_id}' not found."}, indent=2)
    return json.dumps(updated, indent=2)


# ==============================================================================
# SKILL TOOLSET BINDING
# ==============================================================================
skill_path = Path(__file__).parent / "skills" / "telemetry-analysis"
telemetry_skill = load_skill_from_dir(skill_path)
telemetry_skillset = SkillToolset(skills=[telemetry_skill])


# ==============================================================================
# AGENT DEFINITION
# ==============================================================================
obs_agent = Agent(
    name="observability_copilot",
    model=MODEL_NAME,
    description="Enterprise Observability & Quality Triage Copilot for the GCP Multi-Agent Marketing Platform.",
    instruction="""You are the AI Observability & Quality Triage Copilot for the GCP Multi-Agent Marketing Platform.

Your role is to help engineering, product, and QA teams monitor agent quality, analyze OpenTelemetry waterfall traces, diagnose BigQuery/schema/routing errors, and track triage resolution.

## Instructions:
1. Always consult and follow the attached `telemetry-analysis` skill for analytical procedures and diagnostic workflows.
2. Use `get_fleet_health_overview` when users ask about overall fleet quality, success rates, latency, or tenant health.
3. Use `get_error_clusters` when users ask about failing queries, open errors, bugs, or triage issues.
4. Use `get_conversation_trace` to inspect full turn traces, tool executions, and waterfall spans for specific session IDs.
5. Use `get_agent_metrics` to examine per-agent latency percentiles (p50/p90/p99) and token consumption.
6. Use `run_live_quality_eval` to run LLM-as-a-judge scoring on prompt-response pairs.
7. Use `update_triage_issue` when asked to update status or record notes on a triage issue.
8. Be concise, technical, and data-driven. Highlight specific root causes and actionable remediations.
""",
    tools=[
        get_fleet_health_overview,
        get_error_clusters,
        get_conversation_trace,
        get_agent_metrics,
        run_live_quality_eval,
        update_triage_issue,
        telemetry_skillset,
    ],
)

app = App(root_agent=obs_agent, name="marketing_observability_agent")
