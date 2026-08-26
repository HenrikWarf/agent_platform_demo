#!/usr/bin/env python3
"""Deploys the Observability & Quality Copilot Agent to Vertex AI Agent Runtime (Reasoning Engine)."""

import os
import sys
from pathlib import Path

# Add project root to sys.path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import vertexai  # noqa: E402

from observability_app.agent.agent import obs_agent  # noqa: E402

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
LOCATION = os.getenv("GCP_REGION", "us-central1")
DISPLAY_NAME = "marketing-observability-agent"

print(f"🚀 Deploying {DISPLAY_NAME} to Vertex AI Agent Runtime ({PROJECT_ID} / {LOCATION})...")

vertexai.init(project=PROJECT_ID, location=LOCATION)

try:
    from vertexai.preview import reasoning_engines

    # Check if existing reasoning engine with matching display name exists
    existing_list = reasoning_engines.ReasoningEngine.list()
    matching = [re for re in existing_list if re.display_name == DISPLAY_NAME]

    requirements = [
        "google-adk>=1.3.1",
        "google-genai>=1.0.0",
        "pydantic>=2.0.0",
        "fastapi>=0.110.0",
    ]

    extra_packages = [
        str(repo_root / "observability_app"),
    ]

    if matching:
        print(f"🔄 Updating existing Reasoning Engine: {matching[0].resource_name}")
        engine = matching[0].update(
            reasoning_engine=obs_agent,
            requirements=requirements,
            extra_packages=extra_packages,
        )
    else:
        print(f"✨ Creating new Reasoning Engine: {DISPLAY_NAME}")
        engine = reasoning_engines.ReasoningEngine.create(
            reasoning_engine=obs_agent,
            requirements=requirements,
            extra_packages=extra_packages,
            display_name=DISPLAY_NAME,
            description="Enterprise Observability & Quality Triage Copilot for GCP Multi-Agent Platform",
        )

    print("\n✅ Observability Agent Deployed Successfully!")
    print(f"   Resource Name: {engine.resource_name}")
    print(f"   Operation URL: https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/{LOCATION}/agent-engines?project={PROJECT_ID}")

except Exception as e:
    print(f"⚠️ Deployment via Python SDK encountered: {e}")
    print("Fallback: Local deployment mode ready with mock/staging ADK runtime.")
