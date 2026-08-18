"""Agent Runtime deployment entry point.

This module defines the AgentEngineApp that wraps the ADK App for
Vertex AI Agent Engine (Agent Runtime) deployment. It initializes
telemetry and handles the Agent Runtime lifecycle.
"""
import logging
import os

import vertexai
from dotenv import load_dotenv
from google.adk.artifacts import GcsArtifactService, InMemoryArtifactService
from google.cloud import logging as google_cloud_logging
from vertexai.agent_engines.templates.adk import AdkApp

from app.agent import app as adk_app
from app.app_utils.telemetry import setup_telemetry

# Load environment variables from .env file at runtime
load_dotenv()

# Module-level config (must be defined before AgentEngineApp references them)
gemini_location = os.environ.get("GEMINI_LOCATION", "global")
logs_bucket_name = os.environ.get("LOGS_BUCKET_NAME")


class AgentEngineApp(AdkApp):
    def set_up(self) -> None:
        """Initialize the agent engine app with logging and telemetry."""
        vertexai.init()
        setup_telemetry()
        super().set_up()
        logging.basicConfig(level=logging.INFO)
        logging_client = google_cloud_logging.Client()
        self.logger = logging_client.logger(__name__)
        if gemini_location:
            os.environ["GOOGLE_CLOUD_LOCATION"] = gemini_location


agent_runtime = AgentEngineApp(
    app=adk_app,
    enable_tracing=True,
    artifact_service_builder=lambda: (
        GcsArtifactService(bucket_name=logs_bucket_name)
        if logs_bucket_name
        else InMemoryArtifactService()
    ),
)

