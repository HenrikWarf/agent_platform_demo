"""
Global Configuration for GCP Agent Platform Demo
Supports seamless switching between GCP Cloud mode and Local Mock mode.
"""
import os

from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Config:
    APP_VERSION: str = os.getenv("APP_VERSION", "v1.2.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "local")

    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "marketing_analytics")

    # Gemini / Vertex API Keys & Model
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    GEMINI_LOCATION: str = os.getenv("GEMINI_LOCATION", "global")

    # Agent Engine & Agent Gateway
    AGENT_RUNTIME_ID: str = os.getenv("AGENT_RUNTIME_ID", "")
    AGENT_GATEWAY_URL: str = os.getenv("AGENT_GATEWAY_URL", "projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway")
    GEMINI_ENTERPRISE_APP_ID: str = os.getenv("GEMINI_ENTERPRISE_APP_ID", "projects/ml-developer-project-fe07/locations/global/collections/default_collection/engines/crazy-furniture-app-dev_1770975798363")

    # Model Armor configuration
    MODEL_ARMOR_FLOOR_ID: str = os.getenv("MODEL_ARMOR_FLOOR_ID", "projects/agent-demo-09/locations/us-central1/floors/marketing-floor")
    MODEL_ARMOR_TEMPLATE_ID: str = os.getenv("MODEL_ARMOR_TEMPLATE_ID", "projects/agent-demo-09/locations/us-central1/templates/marketing-prompt-shield")

    # Enable cloud vs mock fallback
    USE_GCP_CLOUD: bool = os.getenv("USE_GCP_CLOUD", "false").lower() in ("true", "1")

    # API Port
    PORT: int = int(os.getenv("PORT", "8080"))

