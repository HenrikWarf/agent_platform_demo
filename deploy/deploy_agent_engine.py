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
PROJECT_NUMBER = os.environ.get("GCP_PROJECT_NUMBER", "1047232371360")
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
    Deploys new revisions in-place to the 4 canonical Google ADK Agent Runtime instances:
    1. agent-orchestrator (projects/1047232371360/locations/us-central1/reasoningEngines/4762742973165207552)
    2. agent-analytics    (projects/1047232371360/locations/us-central1/reasoningEngines/5406757719879188480)
    3. agent-strategy     (projects/1047232371360/locations/us-central1/reasoningEngines/2731619541221113856)
    4. agent-content      (projects/1047232371360/locations/us-central1/reasoningEngines/1358021654873112576)
    """
    init_vertex_sdk()

    canonical_agents = [
        {
            "display_name": "agent-analytics",
            "resource_id": f"projects/{PROJECT_NUMBER}/locations/{REGION}/reasoningEngines/5406757719879188480",
            "description": "Vertex AI Agent Engine: Customer Insights & Analytics Agent",
            "class_name": "AnalyticsAgent",
            "module": "agents.analytics_agent",
            "skills": ["marketing_analytics"]
        },
        {
            "display_name": "agent-strategy",
            "resource_id": f"projects/{PROJECT_NUMBER}/locations/{REGION}/reasoningEngines/2731619541221113856",
            "description": "Vertex AI Agent Engine: Marketing Strategy Agent",
            "class_name": "StrategyAgent",
            "module": "agents.strategy_agent",
            "skills": ["omnichannel_strategy"]
        },
        {
            "display_name": "agent-content",
            "resource_id": f"projects/{PROJECT_NUMBER}/locations/{REGION}/reasoningEngines/1358021654873112576",
            "description": "Vertex AI Agent Engine: Content & Creative Copywriting Agent",
            "class_name": "ContentAgent",
            "module": "agents.content_agent",
            "skills": ["brand_voice"]
        },
        {
            "display_name": "agent-orchestrator",
            "resource_id": f"projects/{PROJECT_NUMBER}/locations/{REGION}/reasoningEngines/4762742973165207552",
            "description": "Vertex AI Agent Engine: Supervisor Orchestrator Agent",
            "class_name": "OrchestratorAgent",
            "module": "agents.orchestrator_agent",
            "skills": []
        }
    ]

    deployed_manifest = {}
    print("\n🚀 Deploying Revisions to Canonical Google ADK Agent Runtime Instances...")
    print("======================================================================")

    from vertexai.preview import reasoning_engines

    common_requirements = [
        "google-cloud-aiplatform[agent_engines]>=1.45.0",
        "google-cloud-bigquery>=3.18.0",
        "google-genai>=1.0.0",
        "opentelemetry-api>=1.23.0",
        "opentelemetry-sdk>=1.23.0",
        "opentelemetry-exporter-gcp-trace>=1.6.0",
        "pydantic>=2.6.0",
        "requests>=2.31.0",
        "cloudpickle>=3.0.0"
    ]

    # Signal to BaseAgent.__init__ to skip telemetry init during cloudpickle serialization
    # (BatchSpanProcessor creates threads that cannot be pickled)
    os.environ["AGENT_ENGINE_DEPLOY_MODE"] = "true"

    for agent_spec in canonical_agents:
        name = agent_spec["display_name"]
        resource_id = agent_spec["resource_id"]
        print(f"📦 Deploying Revision to Canonical Agent: [{name}] ({resource_id})...")

        try:
            # Dynamically load class
            module = __import__(agent_spec["module"], fromlist=[agent_spec["class_name"]])
            agent_cls = getattr(module, agent_spec["class_name"])
            # OrchestratorAgent requires a BigQuery client for analytics queries
            if agent_spec["class_name"] == "OrchestratorAgent":
                try:
                    from backend.bq_client import BigQueryClient
                    bq_client = BigQueryClient(project_id=PROJECT_ID)
                    instance = agent_cls(bq_client=bq_client)
                except Exception as bq_err:
                    logger.warning(f"Could not initialize BigQuery client for OrchestratorAgent: {bq_err}")
                    instance = agent_cls()
            elif agent_spec["class_name"] == "AnalyticsAgent":
                try:
                    from backend.bq_client import BigQueryClient
                    bq_client = BigQueryClient(project_id=PROJECT_ID)
                    instance = agent_cls(bq_client=bq_client)
                except Exception as bq_err:
                    logger.warning(f"Could not initialize BigQuery client for AnalyticsAgent: {bq_err}")
                    instance = agent_cls()
            else:
                instance = agent_cls()

            # Retrieve canonical ADK instance
            try:
                engine = reasoning_engines.ReasoningEngine(resource_id)
            except Exception:
                # Fallback list search if exact ID lookup fails
                engine = None
                for e in reasoning_engines.ReasoningEngine.list():
                    if e.display_name == name:
                        engine = e
                        break

            if engine:
                logger.info(f"🔄 Deploying new revision to canonical instance [{name}] ({engine.resource_name})...")
                try:
                    remote_agent = engine.update(
                        reasoning_engine=instance,
                        requirements=common_requirements,
                        extra_packages=["agents"],
                        display_name=name,
                        description=agent_spec["description"]
                    )
                    res_name = remote_agent.resource_name
                except Exception as update_err:
                    err_str = str(update_err)
                    if "deployment_source" in err_str or "package_spec" in err_str or "400" in err_str:
                        logger.warning(f"Engine [{name}] was built with deployment_source. Cleanly recreating as package_spec Reasoning Engine...")
                        try:
                            engine.delete()
                        except Exception as del_err:
                            logger.warning(f"Could not delete old deployment_source engine: {del_err}")
                        
                        remote_agent = reasoning_engines.ReasoningEngine.create(
                            reasoning_engine=instance,
                            requirements=common_requirements,
                            extra_packages=["agents"],
                            display_name=name,
                            description=agent_spec["description"]
                        )
                        res_name = remote_agent.resource_name
                    else:
                        raise update_err
            else:
                logger.info(f"✨ Initializing canonical ADK instance [{name}]...")
                remote_agent = reasoning_engines.ReasoningEngine.create(
                    reasoning_engine=instance,
                    requirements=common_requirements,
                    extra_packages=["agents"],
                    display_name=name,
                    description=agent_spec["description"]
                )
                res_name = remote_agent.resource_name

            deployed_manifest[name] = {
                "resource_name": res_name,
                "display_name": name,
                "skills": agent_spec["skills"],
                "status": "ACTIVE"
            }
            logger.info(f"✅ Revision Deployed [{name}] -> {res_name}")

        except Exception as e:
            logger.error(f"⚠️ Cloud Agent Engine revision deploy failed for [{name}]: {e}")
            deployed_manifest[name] = {
                "resource_name": resource_id,
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
