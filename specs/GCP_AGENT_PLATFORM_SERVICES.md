# GCP Agent Platform Services & Architecture Deep-Dive Guide

This document provides a comprehensive, service-by-service architectural guide for building, securing, executing, evaluating, and monitoring multi-agent AI applications on **Google Cloud Platform (GCP)**. 

It details the core **GCP Services** and **Agent Platform Infrastructure Components** used in this project, explaining their features, operational roles, configuration parameters, and implementation code.

---

## 🏛️ GCP & Agent Platform Service Stack Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. SERVERLESS HOSTING & API LAYER                                                      │
│    • Google Cloud Run (run.googleapis.com) ──> FastAPI Backend & React Frontend            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            v (REST HTTP/JSON)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. SECURITY & GOVERNANCE LAYER                                                         │
│    • GCP Agent Gateway (networkservices.googleapis.com) ──> Ingress Access Policies     │
│    • Vertex AI Model Armor (modelarmor.googleapis.com) ──> PII Masking & Jailbreak Defense │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            v (Governed :streamQuery API)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. AGENT ENGINE RUNTIME & PLATFORM SERVICES                                             │
│    • Vertex AI Agent Engine (aiplatform.googleapis.com/reasoningEngines)               │
│      ├── Agent Runtime Container ──> Hosts Google ADK Multi-Agent Executable             │
│      ├── Vertex AI Session Service ──> Stateful Session Persistence                      │
│      ├── Vertex AI Memory Service (MemoryBankConfig) ──> Semantic Memory Bank           │
│      └── GCS Artifact Service ──> Campaign Asset & Document Storage                      │
│    • Agent Registry & Skills (agentregistry.googleapis.com) ──> Dynamic Skill Binding   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                      ┌─────────────────────┼─────────────────────┐
                      │                     │                     │
                      v                     v                     v
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│ 4. DATA LAYER            │  │ 5. OBSERVABILITY         │  │ 6. EVALUATION            │
│  • Google BigQuery       │  │  • Cloud Trace           │  │  • Vertex AI Rapid Eval  │
│    (marketing_analytics) │  │  • Cloud Logging Bucket  │  │    (evaluateInstances)   │
│    NL2SQL Analytics      │  │    (defaultLink Dataset) │  │  • Local Grounding Eval  │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

---

## 0. Google Cloud Run (`run.googleapis.com`) — Frontend & Backend Hosting

### 0.1 GCP Service Features & Capabilities
**Google Cloud Run** is GCP's fully managed serverless container runtime built on Knative:
* **Serverless Container Execution**: Executes stateless HTTP containers automatically scaling from zero to N instances based on incoming request concurrency (`--concurrency`).
* **Built-in Security & Transport**: Automatic HTTPS TLS certificate management, custom domain mapping, and IAM invoker access controls (`--allow-unauthenticated`).
* **Artifact Registry Integration**: Seamlessly pulls and deploys container images stored in GCP Artifact Registry (`{region}-docker.pkg.dev/{project}/{repo}/{image}:{tag}`).

---

### 0.2 Application Implementation & Code Examples

#### A. Deploying FastAPI Backend Container to Cloud Run ([`deploy/deploy_cloud_run.sh`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/deploy_cloud_run.sh))

```bash
#!/usr/bin/env bash
set -e

PROJECT_ID="agent-demo-09"
REGION="us-central1"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-platform/backend:latest"

# 1. Build Backend Docker Image via Cloud Build
gcloud builds submit --tag "${IMAGE_TAG}" -f deploy/Dockerfile.backend .

# 2. Deploy to Cloud Run with OpenTelemetry environment variables
gcloud run deploy "agent-platform-backend" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --service-account="agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},USE_GCP_CLOUD=true,GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_TRACES_EXPORTER=google_cloud_trace"
```

#### B. Deploying React Frontend Container to Cloud Run ([`deploy/deploy_frontend.sh`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/deploy_frontend.sh))

```bash
#!/usr/bin/env bash
set -e

PROJECT_ID="agent-demo-09"
REGION="us-central1"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/agent-platform/frontend:latest"

# 1. Build Frontend Nginx Container
gcloud builds submit --tag "${IMAGE_TAG}" ./frontend

# 2. Deploy Frontend Service to Cloud Run
gcloud run deploy "agent-platform-frontend" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated
```

#### C. Backend Dockerfile ([`deploy/Dockerfile.backend`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/Dockerfile.backend))

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

ENV PORT=8080
EXPOSE 8080

# Execute FastAPI server using Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 1. Vertex AI Agent Engine (`aiplatform.googleapis.com/reasoningEngines`)

### 1.1 GCP Service Features & Capabilities
**Vertex AI Agent Engine** (managed resource `reasoningEngines`) is Google Cloud's enterprise runtime for orchestrating, executing, and scaling autonomous AI agent applications built with frameworks like the **Google Agent Development Kit (ADK)** and LangChain.

#### Core Sub-Services:
1. **Agent Runtime Container**: Managed serverless container environment executing ADK agent logic with automatic scaling, container concurrency (default: 8), and IAM identity validation (`identityType: AGENT_IDENTITY`).
2. **Vertex AI Session Service (`VertexAiSessionService`)**: Built-in stateful session manager handling user turn history, multi-turn context preservation, and state key-value dictionaries.
3. **Vertex AI Memory Service (`MemoryBankConfig`)**: Episodic and semantic memory bank for long-term customer context retrieval across separate sessions.
4. **Artifact Service (`GcsArtifactService`)**: Cloud Storage-backed artifact service for persisting campaign documents, images, and tool outputs (`LOGS_BUCKET_NAME`).

---

### 1.2 Code & Implementation Details

#### A. Reasoning Engine Spec & Deployment Config ([`app/agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py))

```python
import os
import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from . import tools

# Ensure Vertex AI configuration
_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id or "agent-demo-09")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

# Sub-Agent Definitions
analytics_agent = Agent(
    name="analytics_agent",
    model="gemini-3.6-flash",
    description="Executes BigQuery customer data analysis.",
    instruction="Write BigQuery SQL queries using table `agent-demo-09.marketing_analytics.customer_rfm_summary`.",
    tools=[tools.query_customer_data],
)

strategy_agent = Agent(
    name="strategy_agent",
    model="gemini-3.6-flash",
    description="Designs omnichannel marketing campaign frameworks.",
    tools=[tools.generate_campaign_strategy],
)

content_agent = Agent(
    name="content_agent",
    model="gemini-3.6-flash",
    description="Generates email, social, and SMS marketing assets.",
    tools=[tools.generate_marketing_content],
)

# Root Orchestrator Agent
root_agent = Agent(
    name="marketing_orchestrator",
    model="gemini-3.6-flash",
    description="Supervises multi-agent workflow and routes user intent.",
    sub_agents=[analytics_agent, strategy_agent, content_agent],
)

app = App(root_agent=root_agent, name="app")
```

#### B. Session & Artifact Service Integration ([`app/app_utils/services.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/app_utils/services.py))

```python
import os
from google.adk.services import (
    InMemorySessionService,
    VertexAiSessionService,
    InMemoryArtifactService,
    GcsArtifactService,
)

def get_session_service():
    """Initializes VertexAiSessionService when deployed to Agent Engine Runtime."""
    engine_id = os.environ.get("GOOGLE_CLOUD_AGENT_ENGINE_ID")
    if engine_id:
        # Stateful session management managed by Vertex AI Agent Engine
        return VertexAiSessionService(
            project=os.environ.get("GCP_PROJECT_ID", "agent-demo-09"),
            location=os.environ.get("GCP_REGION", "us-central1"),
            reasoning_engine_id=engine_id,
        )
    return InMemorySessionService()

def get_artifact_service():
    """Initializes Cloud Storage GcsArtifactService for persistent asset storage."""
    bucket_name = os.environ.get("LOGS_BUCKET_NAME")
    if bucket_name:
        return GcsArtifactService(bucket_name=bucket_name)
    return InMemoryArtifactService()
```

#### C. Deploying ADK Agent to Agent Engine via CLI

```bash
# Install CLI tool
uv tool install google-agents-cli

# Deploy ADK agent to Vertex AI Agent Engine with Agent Identity
agents-cli deploy \
  --project agent-demo-09 \
  --region us-central1 \
  --agent-identity \
  --no-confirm-project \
  --update-env-vars "GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true,OTEL_TRACES_EXPORTER=google_cloud_trace,OTEL_METRICS_EXPORTER=google_cloud_monitoring,OTEL_LOGS_EXPORTER=google_cloud_logging"
```

---

## 2. GCP Agent Gateway & Security Governance (`networkservices.googleapis.com`)

### 2.1 GCP Service Features & Capabilities
**GCP Agent Gateway** is a managed networking security proxy designed specifically for AI-native agent applications:
* **Ingress Governance (`CLIENT_TO_AGENT`)**: Secures prompts flowing from clients or API servers to agent containers.
* **Egress Governance (`AGENT_TO_ANYWHERE`)**: Governs outbound tool calls, database connections, and external API requests.
* **Protocol Proxying**: Supports Model Context Protocol (MCP) and HTTP/JSON streaming (`:streamQuery`).
* **IAM & Identity-Aware Proxy (IAP)**: Validates caller identities and enforces Agent Identity service accounts (`AGENT_IDENTITY`).

---

### 2.2 Code & Implementation Details

#### A. Gateway Resource Definition ([`deploy/agent_gateway.yaml`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/agent_gateway.yaml))

```yaml
name: projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway
description: Enterprise Agent Gateway enforcing Model Armor security policies and governed routing.
protocols:
  - MCP
registries:
  - //agentregistry.googleapis.com/projects/agent-demo-09/locations/us-central1
googleManaged:
  governedAccessPath: CLIENT_TO_AGENT
```

#### B. Attaching Gateway Config to Reasoning Engine Spec ([`deploy/bind_agent_gateway.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/bind_agent_gateway.py))

```python
import subprocess, json, requests

def bind_gateway_to_reasoning_engine(engine_resource: str, gateway_resource: str):
    token = subprocess.check_output(["gcloud", "auth", "print-access-token"]).decode().strip()
    
    url = f"https://us-central1-aiplatform.googleapis.com/v1beta1/{engine_resource}?updateMask=spec.deploymentSpec.agentGatewayConfig"
    
    payload = {
        "spec": {
            "deploymentSpec": {
                "agentGatewayConfig": {
                    "clientToAgentConfig": {
                        "agentGateway": gateway_resource,
                    }
                }
            }
        }
    }
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    response = requests.patch(url, headers=headers, json=payload)
    print("Response Code:", response.status_code)
    print("✅ Agent Gateway bound to Reasoning Engine ingress!")
```

---

## 3. Vertex AI Model Armor & Security Policy (`modelarmor.googleapis.com`)

### 3.1 GCP Service Features & Capabilities
**Vertex AI Model Armor** is Google Cloud's AI safety and guardrail service:
* **Prompt & Response Sanitization**: In-line security callouts (`SanitizeUserPrompt`, `SanitizeModelResponse`) filtering prompts and generated content before model execution or output rendering.
* **Responsible AI Filters**: Configurable thresholds for Hate Speech, Harassment, Sexual Content, and Dangerous Content.
* **PII & Injection Defense**: Automated PII masking (emails, SSNs, credit card numbers), prompt jailbreak detection, and malicious URI filtering.

---

### 3.2 Code & Implementation Details

#### A. Pre-Flight Security Guard ([`backend/safety.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/safety.py))

```python
import re

class PromptSafetyGuard:
    """Application-level safety guard simulating Model Armor pre-flight checks."""

    INJECTION_PATTERNS = [
        r"ignore\s+previous\s+instructions",
        r"bypass\s+safety",
        r"system\s*:\s*override",
        r"<script>",
    ]

    def inspect_and_sanitize(self, prompt: str) -> dict:
        # Check prompt injection patterns
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return {
                    "passed": False,
                    "filter_reason": "PROMPT_INJECTION_DETECTED",
                    "sanitized_prompt": prompt
                }

        # Mask sensitive PII (Email addresses)
        sanitized = re.sub(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "[REDACTED_EMAIL]",
            prompt
        )

        return {
            "passed": True,
            "filter_reason": "NONE",
            "sanitized_prompt": sanitized
        }
```

#### B. Model Armor Audit Log Query (Cloud Logging)

```logql
# Query Model Armor prompt and response sanitization audit logs
logName:"cloudaudit.googleapis.com" AND protoPayload.serviceName="modelarmor.googleapis.com"
```

---

## 4. Agent Registry & Skills Catalog (`agentregistry.googleapis.com`)

### 4.1 GCP Service Features & Capabilities
**Agent Registry** is Google Cloud's discovery and governance catalog for agent skills, tool definitions, and MCP servers:
* **Skill Packaging & Revisions**: Packages skill markdown instructions (`SKILL.md`) into ZIP payloads, creating versioned revisions (`revisions.create`).
* **Dynamic Binding**: Registers skills under `projects/{project}/locations/{location}/skills/{skill_id}` for runtime discovery.

---

### 4.2 Code & Implementation Details

#### A. Registering Skills via Script ([`deploy/register_skills.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/register_skills.py))

```python
import subprocess

def register_skill(skill_id: str, display_name: str, payload_path: str):
    prefixed_id = f"private-{skill_id}"
    
    # Step 1: Create skill draft
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "create", skill_id,
        "--location", "global",
        "--display-name", display_name,
        "--target-state", "draft",
        "--project", "agent-demo-09",
        "--quiet"
    ])
    
    # Step 2: Create revision with ZIP payload containing SKILL.md
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "revisions", "create", "rev-1",
        "--skill", prefixed_id,
        "--location", "global",
        "--payload", payload_path,
        "--project", "agent-demo-09",
        "--quiet"
    ])
    
    # Step 3: Set default revision & activate
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
        "--location", "global",
        "--target-state", "active",
        "--project", "agent-demo-09",
        "--quiet"
    ])
    print(f"✅ Registered and activated skill: {skill_id}")
```

---

## 5. Google BigQuery Data Layer (`bigquery.googleapis.com`)

### 5.1 GCP Service Features & Capabilities
**Google BigQuery** is GCP's serverless, highly scalable enterprise data warehouse. In this platform, it acts as the primary data store for customer analytics, RFM segmentation, and transaction streams.

---

### 5.2 Code & Implementation Details

#### A. NL2SQL Execution Tool ([`app/tools.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/tools.py))

```python
import re
from google.adk.tools import ToolContext
from google.cloud import bigquery

def query_customer_data(sql_query: str, tool_context: ToolContext) -> dict:
    """Executes BigQuery SQL query generated by Analytics Agent."""
    if not sql_query or "SELECT" not in sql_query.upper():
        return {"status": "ERROR", "summary": "Invalid SQL query."}

    # Clean LLM markdown fences
    clean_sql = re.sub(r"```(?:sql)?\s*(.*?)\s*```", r"\1", sql_query, flags=re.DOTALL).strip()

    client = bigquery.Client(project="agent-demo-09")
    query_job = client.query(clean_sql)
    results = [dict(row) for row in query_job.result()]

    # Preserve results in session state for downstream strategy agent
    tool_context.state["analytics_result"] = {
        "summary": f"Query returned {len(results)} rows.",
        "sql_executed": clean_sql,
    }

    return {
        "status": "SUCCESS",
        "sql_executed": clean_sql,
        "row_count": len(results),
        "results": results[:20],
    }
```

#### B. Batch Data Seeding Script ([`deploy/seed_bigquery_data.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/seed_bigquery_data.py))

```python
from google.cloud import bigquery

def seed_bigquery(project_id: str, dataset_id: str):
    client = bigquery.Client(project=project_id)
    dataset_ref = client.dataset(dataset_id)

    rfm_rows = [
        {"customer_id": "CUST-001", "rfm_segment": "At-Risk Premium", "recency_days": 85, "frequency_orders": 12, "total_monetary": 4250.00},
        {"customer_id": "CUST-002", "rfm_segment": "Champions", "recency_days": 5, "frequency_orders": 34, "total_monetary": 12800.50},
    ]

    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )

    job = client.load_table_from_json(rfm_rows, dataset_ref.table("customer_rfm_summary"), job_config=job_config)
    job.result()
    print("✅ Seeded customer_rfm_summary table in BigQuery!")
```

---

## 6. Vertex AI Rapid Evaluation API & Evaluation Framework (`aiplatform.googleapis.com`)

### 6.1 GCP Service Features & Capabilities
**Vertex AI Rapid Evaluation API** (`evaluateInstances`) provides automated LLM-as-a-Judge evaluators for measuring model performance across key quality metrics:
* **Grounding / Faithfulness**: Measures whether responses are backed by retrieved BigQuery analytical facts.
* **Safety & Toxicity**: Measures safety adherence and toxic content avoidance.
* **Instruction Following & Fulfillment**: Measures tool call correctness and multi-agent intent routing.

---

### 6.2 Code & Implementation Details

#### A. Vertex AI Evaluation Service Integration ([`eval/vertex_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/vertex_eval.py))

```python
import os, json, requests
import google.auth
import google.auth.transport.requests

def run_vertex_evaluation(eval_dataset_path: str):
    """Runs Rapid Evaluation via Vertex AI evaluateInstances API."""
    credentials, project_id = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    
    location = "us-central1"
    url = f"https://{location}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}:evaluateInstances"
    
    with open(eval_dataset_path, "r") as f:
        eval_cases = json.load(f)
        
    payload = {
        "exactMatchInput": {
            "instances": [
                {
                    "prediction": case.get("response", ""),
                    "reference": case.get("expected_output", "")
                }
                for case in eval_cases
            ]
        }
    }
    
    headers = {"Authorization": f"Bearer {credentials.token}", "Content-Type": "application/json"}
    resp = requests.post(url, headers=headers, json=payload)
    print("Vertex Eval Response:", resp.status_code)
    return resp.json()
```

#### B. Local Evaluation Runner ([`eval/local_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/local_eval.py))

## 8. Gemini Enterprise Integration & Agent Publishing (`discoveryengine.googleapis.com`)

### 8.1 GCP Service Features & Capabilities
**Gemini Enterprise** (formerly Vertex AI Search & Conversation / DiscoveryEngine Apps) allows enterprise organizations to register agents deployed on **Vertex AI Agent Engine** as corporate AI assistants and extension tools inside the **Gemini Enterprise UI**:
* **Enterprise Extension Registration**: Registers deployed ADK Reasoning Engines as accessible tools or agents within Gemini Enterprise apps (`discoveryengine.googleapis.com/v1alpha/projects/{project}/locations/global/collections/default_collection/engines/{app}/assistants/default_assistant/agents`).
* **Registration Modes**:
  * **ADK Registration Mode (`--registration-type adk`)**: Auto-detects the deployed Reasoning Engine ID from `deployment_metadata.json` (`remote_agent_runtime_id`) and binds its `:streamQuery` endpoint directly to the Gemini Enterprise assistant.
  * **A2A Registration Mode (`--registration-type a2a`)**: Publishes the agent via an Agent-to-Agent (A2A) protocol card URL (`--agent-card-url`).
* **User Impact**: Enterprise employees chatting inside Gemini Enterprise can trigger the **Marketing Campaign Orchestrator** directly in their natural language chat interface to run BigQuery analytics, omnichannel strategies, and brand copywriting.

---

### 8.2 Application Implementation & Code Examples

#### A. Automated Publishing Script ([`deploy/publish_agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/publish_agent.py))

```python
#!/usr/bin/env python3
import os
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("publish_agent")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
GEMINI_APP_ID = os.getenv(
    "GEMINI_ENTERPRISE_APP_ID",
    f"projects/{PROJECT_ID}/locations/global/collections/default_collection/engines/marketing-app"
)

def publish_to_gemini_enterprise():
    """Publish deployed Agent Engine Reasoning Engine to Gemini Enterprise App."""
    logger.info(f"Publishing agent to Gemini Enterprise app: {GEMINI_APP_ID}")
    
    cmd = [
        "agents-cli", "publish", "gemini-enterprise",
        "--gemini-enterprise-app-id", GEMINI_APP_ID,
        "--display-name", "Marketing Campaign Orchestrator",
        "--description", "Multi-agent marketing platform: BigQuery analytics, omnichannel strategy, and creative content generation",
        "--tool-description", "Analyzes customer segments in BigQuery, generates omnichannel marketing strategies, and creates brand-aligned creative content",
        "--registration-type", "adk",
        "--project-id", PROJECT_ID,
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        logger.info("✅ Successfully published Agent to Gemini Enterprise!")
        logger.info(result.stdout)
    else:
        logger.error(f"❌ Publish failed (code {result.returncode}):\n{result.stdout}\n{result.stderr}")
        return False
    return True

if __name__ == "__main__":
    success = publish_to_gemini_enterprise()
    sys.exit(0 if success else 1)
```

#### B. GitHub Actions CI/CD Pipeline Publishing Step ([`.github/workflows/deploy-gcp.yml`](file:///Users/henrikw/Projects/agent_platform_demo/.github/workflows/deploy-gcp.yml#L248-L260))

```yaml
      # --- 5. Publish Agent to Gemini Enterprise ---
      - name: Publish Agent to Gemini Enterprise
        if: needs.changes.outputs.agents == 'true'
        continue-on-error: true
        run: |
          echo "🚀 Publishing Agent to Gemini Enterprise..."
          python3 deploy/publish_agent.py
```


---

## 7. GCP Observability & Telemetry Stack (Cloud Trace & Cloud Logging)

### 7.1 GCP Service Features & Capabilities
* **Google Cloud Trace** (`cloudtrace.googleapis.com`): Captures OpenTelemetry span hierarchies (`invoke_workflow` → `call_llm` → `execute_tool`) for performance and latency profiling.
* **Cloud Logging Log Analytics** (`logging.googleapis.com`): Stores logs in `_Default` bucket with Log Analytics enabled (`enableAnalytics: true`) linked to BigQuery dataset `defaultLink`.

---

### 7.2 Code & Implementation Details

#### A. OpenTelemetry Instrumentation in FastAPI ([`backend/app.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/app.py))

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Set up Cloud Trace Exporter
tracer_provider = TracerProvider()
cloud_exporter = CloudTraceSpanExporter(project_id="agent-demo-09")
tracer_provider.add_span_processor(BatchSpanProcessor(cloud_exporter))
trace.set_tracer_provider(tracer_provider)

app = FastAPI(title="Google Cloud Agent Platform API")
FastAPIInstrumentor.instrument_app(app)
```

#### B. Log Analytics & IAM Permissions Setup ([`deploy/enable_observability_permissions.sh`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/enable_observability_permissions.sh))

```bash
#!/usr/bin/env bash
set -e

# Enable GCP Telemetry APIs
gcloud services enable \
  aiplatform.googleapis.com \
  agentregistry.googleapis.com \
  networkservices.googleapis.com \
  modelarmor.googleapis.com \
  cloudtrace.googleapis.com \
  logging.googleapis.com --project="agent-demo-09"

# Enable Log Analytics on _Default log bucket
gcloud logging buckets update _Default --location=global --project="agent-demo-09" --enable-analytics

# Link BigQuery dataset defaultLink
gcloud logging links create defaultLink --bucket=_Default --location=global --project="agent-demo-09"
```
