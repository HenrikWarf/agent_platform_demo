#!/usr/bin/env python3
"""
Deploy Standalone Agent Engine (Reasoning Engine) Instances to Google Cloud Platform
Deploys each agent (Orchestrator, Analytics, Strategy, Content) as an independent Vertex AI Agent Engine instance.
"""
import os
import sys
import json
import logging
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_engine_deployer")

# Load environment variables
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "agent-demo-09")
REGION = os.environ.get("GCP_REGION", "us-central1")
STAGING_BUCKET = os.environ.get("GCP_STAGING_BUCKET", f"gs://{PROJECT_ID}-agent-engine-staging")

def init_vertex_sdk():
    """Initializes Vertex AI SDK with project and region."""
    try:
        import vertexai
        vertexai.init(project=PROJECT_ID, location=REGION, staging_bucket=STAGING_BUCKET)
        logger.info(f"Initialized Vertex AI Agent Engine SDK for Project: {PROJECT_ID}, Region: {REGION}")
    except Exception as e:
        logger.warning(f"Could not initialize Vertex AI SDK: {e}")

def deploy_agent_instances():
    """
    Deploys 4 distinct Agent Engine instances:
    1. Orchestrator / Supervisor Agent (agent-orchestrator)
    2. Customer Insights & Analytics Agent (agent-analytics)
    3. Marketing Strategy Agent (agent-strategy)
    4. Content & Creative Agent (agent-content)
    """
    init_vertex_sdk()

    agents_to_deploy = [
        {
            "display_name": "agent-analytics",
            "description": "Vertex AI Agent Engine: Customer Insights & Analytics Agent",
            "class_name": "AnalyticsAgent",
            "module": "agents.analytics_agent",
            "skills": ["marketing_analytics"]
        },
        {
            "display_name": "agent-strategy",
            "description": "Vertex AI Agent Engine: Marketing Strategy Agent",
            "class_name": "StrategyAgent",
            "module": "agents.strategy_agent",
            "skills": ["omnichannel_strategy"]
        },
        {
            "display_name": "agent-content",
            "description": "Vertex AI Agent Engine: Content & Creative Copywriting Agent",
            "class_name": "ContentAgent",
            "module": "agents.content_agent",
            "skills": ["brand_voice"]
        },
        {
            "display_name": "agent-orchestrator",
            "description": "Vertex AI Agent Engine: Supervisor Orchestrator Agent",
            "class_name": "OrchestratorAgent",
            "module": "agents.orchestrator_agent",
            "skills": []
        }
    ]

    deployed_manifest = {}
    print("\n🚀 Deploying Standalone Agents to Vertex AI Agent Engine...")
    print("======================================================================")

    # Fetch existing deployed ReasoningEngine instances to prevent creating duplicate orphaned resources
    try:
        from vertexai.preview import reasoning_engines
        existing_engine_map = {e.display_name: e for e in reasoning_engines.ReasoningEngine.list()}
    except Exception as list_err:
        logger.warning(f"Could not fetch existing Reasoning Engines: {list_err}")
        existing_engine_map = {}

    for agent_spec in agents_to_deploy:
        name = agent_spec["display_name"]
        print(f"📦 Deploying Agent Engine Instance: [{name}]...")

        try:
            # Delete old duplicate instance if present to avoid spawning duplicate resources
            if name in existing_engine_map:
                old_engine = existing_engine_map[name]
                print(f"🔄 Found existing Agent Engine instance [{name}] ({old_engine.resource_name}). Replacing with updated container...")
                try:
                    old_engine.delete()
                    logger.info(f"🗑️ Cleanly deleted old instance [{old_engine.resource_name}]")
                except Exception as del_err:
                    logger.warning(f"Could not delete old instance {old_engine.resource_name}: {del_err}")

            # Dynamically load class
            module = __import__(agent_spec["module"], fromlist=[agent_spec["class_name"]])
            agent_cls = getattr(module, agent_spec["class_name"])
            instance = agent_cls()

            remote_agent = reasoning_engines.ReasoningEngine.create(
                reasoning_engine=instance,
                requirements=[
                    "google-cloud-aiplatform[agent_engines]>=1.45.0",
                    "google-cloud-bigquery>=3.18.0",
                    "google-genai>=1.0.0",
                    "opentelemetry-api>=1.23.0",
                    "opentelemetry-sdk>=1.23.0",
                    "opentelemetry-exporter-gcp-trace>=1.6.0",
                    "pydantic>=2.6.0",
                    "requests>=2.31.0",
                    "cloudpickle>=3.0.0"
                ],
                extra_packages=["agents"],
                display_name=name,
                description=agent_spec["description"]
            )

            resource_name = remote_agent.resource_name
            deployed_manifest[name] = {
                "resource_name": resource_name,
                "display_name": name,
                "skills": agent_spec["skills"],
                "status": "ACTIVE"
            }
            logger.info(f"✅ Deployed [{name}] -> {resource_name}")

        except Exception as e:
            logger.error(f"⚠️ Cloud Agent Engine deploy skipped for [{name}] (using local instance fallback): {e}")
            deployed_manifest[name] = {
                "resource_name": f"projects/{PROJECT_ID}/locations/{REGION}/reasoningEngines/mock-{name}",
                "display_name": name,
                "skills": agent_spec["skills"],
                "status": "LOCAL_FALLBACK"
            }

    # Save manifest
    manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agent_engine_manifest.json"))
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(deployed_manifest, f, indent=2)

    print("\n✅ Agent Engine Deployment Manifest Saved:")
    print(f"📄 {manifest_path}")
    print(json.dumps(deployed_manifest, indent=2))
    return deployed_manifest

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deploy individual agents to Vertex AI Agent Engine")
    parser.add_argument("--project", type=str, default=PROJECT_ID, help="GCP Project ID")
    parser.add_argument("--region", type=str, default=REGION, help="GCP Region")
    args = parser.parse_args()

    PROJECT_ID = args.project
    REGION = args.region

    deploy_agent_instances()
