#!/usr/bin/env python3
"""
Publish Agent to Gemini Enterprise.

Registers the single ADK orchestrator agent with Gemini Enterprise.
Uses `agents-cli publish gemini-enterprise` with auto-detection from
deployment_metadata.json (written by `agents-cli deploy`).

Usage:
    python deploy/publish_agent.py

Note: Agent Runtime agents are AUTO-REGISTERED in Agent Registry after
`agents-cli deploy` — no manual `gcloud alpha agent-registry` calls needed.
"""
import logging
import os
import subprocess
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("publish_agent")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
GEMINI_ENTERPRISE_APP_ID = os.getenv(
    "GEMINI_ENTERPRISE_APP_ID",
    f"projects/{PROJECT_ID}/locations/global/collections/default_collection/engines/marketing-app"
)

AGENT_DISPLAY_NAME = os.getenv("GEMINI_DISPLAY_NAME", "Marketing Campaign Orchestrator")
AGENT_DESCRIPTION = os.getenv(
    "GEMINI_DESCRIPTION",
    "Multi-agent marketing platform: BigQuery analytics, omnichannel strategy, and creative content generation"
)
TOOL_DESCRIPTION = os.getenv(
    "GEMINI_TOOL_DESCRIPTION",
    "Analyzes customer segments in BigQuery, generates omnichannel marketing strategies, and creates brand-aligned creative content"
)


def publish():
    """Register the ADK agent in Gemini Enterprise via agents-cli."""
    logger.info(f"Publishing agent to Gemini Enterprise app: {GEMINI_ENTERPRISE_APP_ID}")

    cmd = [
        "agents-cli", "publish", "gemini-enterprise",
        "--gemini-enterprise-app-id", GEMINI_ENTERPRISE_APP_ID,
        "--display-name", AGENT_DISPLAY_NAME,
        "--description", AGENT_DESCRIPTION,
        "--tool-description", TOOL_DESCRIPTION,
        "--registration-type", "adk",
        "--project-id", PROJECT_ID,
    ]

    logger.info(f"Executing: {' '.join(cmd)}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        logger.info(f"✅ Agent published successfully:\n{result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Publish failed (code {e.returncode}):\n{e.stderr.strip()}")
        return False
    except FileNotFoundError:
        logger.error("❌ agents-cli not found. Install with: uv tool install google-agents-cli")
        return False


if __name__ == "__main__":
    success = publish()
    sys.exit(0 if success else 1)
