"""ADK FastAPI Entrypoint for Observability Agent."""

import contextlib
import os
from collections.abc import AsyncIterator

import google.auth
from dotenv import load_dotenv
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.runners import Runner

from app.app_utils import services
from app.app_utils.reasoning_engine_adapter import attach_reasoning_engine_routes

load_dotenv()
otel_to_cloud = os.environ.get(
    "GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY", ""
).lower() in ("true", "1")
_, project_id = google.auth.default()

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    from observability_app.agent.agent import app as adk_app

    _ = Runner(
        app=adk_app,
        session_service=services.get_session_service(),
        artifact_service=services.get_artifact_service(),
        auto_create_session=True,
    )
    yield


app = get_fast_api_app(
    agent_dir=AGENT_DIR,
    lifespan=lifespan,
    otel_to_cloud=otel_to_cloud,
)

attach_reasoning_engine_routes(app)
