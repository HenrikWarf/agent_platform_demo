"""
FastAPI application entry point for ADK Agent Runtime deployment.

This file is the container entrypoint that Agent Runtime uses to serve the agent.
get_fast_api_app(otel_to_cloud=True) enables:
- The 'google-adk' framework tag in Agent Runtime
- Cloud Trace with the ADK span hierarchy (invoke_workflow -> invoke_agent -> call_llm -> execute_tool)
- Telemetry gated on GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY env var
"""
import os
from google.adk.cli.fast_api import get_fast_api_app

# agents_dir points to the app/ directory containing agent.py with root_agent
AGENTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    otel_to_cloud=True,
)
