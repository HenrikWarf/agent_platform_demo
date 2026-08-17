# GCP Agent Platform Architecture & Services Technical Deep-Dive

This document provides a comprehensive, service-by-service architectural guide for building, securing, executing, evaluating, and monitoring multi-agent AI applications on **Google Cloud Platform (GCP)**.

It details the core **GCP Services** and **Agent Platform Infrastructure Components** used in this application, explaining their features, operational roles, configuration parameters, and implementation code.

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
│    (agent_events_v2)     │  │    (defaultLink Dataset) │  │  • Local Grounding Eval  │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

---

## 1. Google Cloud Run (`run.googleapis.com`) — Ingress & Hosting

### 1.1 GCP Service Features & Capabilities
**Google Cloud Run** is GCP's fully managed serverless container runtime built on Knative:
* **Serverless Container Execution**: Executes stateless HTTP containers automatically scaling from zero to N instances based on request concurrency (`--concurrency`).
* **Built-in Security & Transport**: Automatic HTTPS TLS certificate management, custom domain mapping, and IAM invoker access controls (`--allow-unauthenticated`).
* **Artifact Registry Integration**: Seamlessly pulls and deploys container images stored in GCP Artifact Registry (`{region}-docker.pkg.dev/{project}/{repo}/{image}:{tag}`).

### 1.2 Code & Implementation Details

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

---

## 2. GCP Agent Gateway & Vertex AI Model Armor (`networkservices` & `modelarmor`)

### 2.1 GCP Service Features & Capabilities
* **GCP Agent Gateway** (`networkservices.googleapis.com`): Enterprise network proxy providing governed access control (`CLIENT_TO_AGENT` ingress mode) and protocol translation (MCP & HTTP/JSON).
* **Vertex AI Model Armor** (`modelarmor.googleapis.com`): In-line prompt and response sanitization filtering jailbreaks, toxic language, and masking sensitive PII (emails, SSNs).

### 2.2 Code & Implementation Details

#### A. Agent Gateway Spec ([`deploy/agent_gateway.yaml`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/agent_gateway.yaml))

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

#### B. Pre-Flight Prompt Safety Guard ([`backend/safety.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/safety.py))

```python
import re

class PromptSafetyGuard:
    """Pre-flight safety inspector filtering jailbreak attempts and masking PII."""

    INJECTION_PATTERNS = [
        r"ignore\s+previous\s+instructions",
        r"bypass\s+safety",
        r"system\s*:\s*override",
        r"<script>",
    ]

    def inspect_and_sanitize(self, prompt: str) -> dict:
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return {
                    "passed": False,
                    "filter_reason": "PROMPT_INJECTION_DETECTED",
                    "sanitized_prompt": prompt
                }

        sanitized = re.sub(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "[REDACTED_EMAIL]",
            prompt
        )

        return {"passed": True, "filter_reason": "NONE", "sanitized_prompt": sanitized}
```

---

## 3. Vertex AI Agent Engine & Multi-Agent Architecture (`aiplatform` & `google-adk`)

### 3.1 GCP Service Features & Capabilities
**Vertex AI Agent Engine** (managed resource `reasoningEngines`) is Google Cloud's enterprise runtime for hosting and scaling autonomous multi-agent applications built with the **Google Agent Development Kit (ADK)**:
1. **Agent Runtime Container**: Managed serverless container environment with container concurrency (8) and `AGENT_IDENTITY` validation.
2. **Vertex AI Session Service (`VertexAiSessionService`)**: Stateful session persistence (`/apps/{app}/users/{user}/sessions`).
3. **Vertex AI Memory Service (`MemoryBankConfig`)**: Semantic memory bank for long-term customer context.
4. **Artifact Service (`GcsArtifactService`)**: Cloud Storage persistence for generated documents and images.

### 3.2 ADK Agent Code Definitions ([`app/agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py))

Below is the complete multi-agent system implementation from `app/agent.py` (with MCP toolset integration added):

```python
import os
import pathlib
import google.auth
from google.adk.agents import Agent, SequentialAgent
from google.adk.apps import App
from google.adk.skills import load_skill_from_dir
from google.adk.tools.skill_toolset import SkillToolset
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

from . import tools
from .schemas import StrategySchema, ContentSchema

# Ensure Vertex AI configuration
_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id or "agent-demo-09")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

# ─── 1. Load Skills from local skills/ directory ──────────────────────────────
skills_dir = pathlib.Path(__file__).parent.parent / "skills"

analytics_skill = load_skill_from_dir(skills_dir / "bigquery-customer-analytics")
strategy_skill = load_skill_from_dir(skills_dir / "campaign-framework")
content_skill = load_skill_from_dir(skills_dir / "brand-voice-craft")

analytics_skillset = SkillToolset(skills=[analytics_skill])
strategy_skillset = SkillToolset(skills=[strategy_skill])
content_skillset = SkillToolset(skills=[content_skill])

# ─── 2. Model Context Protocol (MCP) Toolset Definition ───────────────────────
mcp_data_toolset = McpToolset(
    connection_params=SseConnectionParams(
        url="https://agent-gateway.internal/mcp/v1/data-services",
        headers={"X-GCP-Project-ID": "agent-demo-09"}
    ),
    tool_filter=["query_customer_data"]
)

# ─── 3. Analytics Agent (BigQuery Tool + SkillToolset + MCP) ──────────────────
analytics_agent = Agent(
    name="analytics_agent",
    model="gemini-3.6-flash",
    description="Executes BigQuery customer data analysis, cohort extraction, and RFM segmentation.",
    instruction="""You are the Customer Insights & Analytics Agent.

Your role is to answer data questions by writing BigQuery SQL and executing it with the
query_customer_data tool. Write BigQuery Standard SQL queries targeting table `agent-demo-09.marketing_analytics.customer_rfm_summary`.
""",
    tools=[tools.query_customer_data, analytics_skillset, mcp_data_toolset],
)

# ─── 4. Strategy Pipeline (SequentialAgent: reasoning → formatting) ──────────────
strategy_reasoner = Agent(
    name="strategy_agent",
    model="gemini-3.6-flash",
    description="Reasons about marketing strategy based on analytics data.",
    instruction="""You are the Marketing Strategy Agent.
Create a comprehensive omnichannel marketing strategy based on analytics data available in conversation context.""",
    tools=[strategy_skillset],
    output_key="strategy_reasoning",
)

strategy_formatter = Agent(
    name="strategy_formatter",
    model="gemini-3.6-flash",
    description="Formats strategy reasoning into structured JSON.",
    instruction="Convert the marketing strategy from the conversation into the required JSON structure.",
    output_schema=StrategySchema,
    output_key="strategy_result",
)

strategy_pipeline = SequentialAgent(
    name="strategy_pipeline",
    description="Designs omnichannel marketing strategies, campaign timelines, channel mix, and ROI projections.",
    sub_agents=[strategy_reasoner, strategy_formatter],
)

# ─── 5. Content Pipeline (SequentialAgent: reasoning → formatting) ──────────────
content_reasoner = Agent(
    name="content_agent",
    model="gemini-3.6-flash",
    description="Produces marketing creative assets aligned with brand voice.",
    instruction="""You are the Content & Creative Copywriting Agent.
Generate email templates, social media posts, and SMS copy based on campaign strategy.""",
    tools=[content_skillset],
    output_key="content_reasoning",
)

content_formatter = Agent(
    name="content_formatter",
    model="gemini-3.6-flash",
    description="Formats content reasoning into structured JSON.",
    instruction="Convert the marketing content from the conversation into the required JSON structure.",
    output_schema=ContentSchema,
    output_key="content_result",
)

content_pipeline = SequentialAgent(
    name="content_pipeline",
    description="Produces email templates, social media posts, SMS, and ad copy adhering to brand voice guidelines.",
    sub_agents=[content_reasoner, content_formatter],
)

# ─── 6. Root Orchestrator Agent ────────────────────────────────────────────────
root_agent = Agent(
    name="marketing_orchestrator",
    model="gemini-3.6-flash",
    description="Marketing Campaign Supervisor — routes objectives to Analytics, Strategy, and Content agents.",
    instruction="""You are the Marketing Campaign Orchestrator. Route requests to sub-agents efficiently.
- Data questions -> analytics_agent
- Strategy requests -> analytics_agent -> strategy_pipeline
- Content requests -> content_pipeline
- Full campaign -> analytics_agent -> strategy_pipeline -> content_pipeline
""",
    sub_agents=[analytics_agent, strategy_pipeline, content_pipeline],
)

# ─── ADK App Definition ────────────────────────────────────────────────────────
app = App(
    root_agent=root_agent,
    name="app",
)
```

---

## 4. Tools & Model Context Protocol Layer (`app/tools.py` & MCP)

### 4.1 Function & Purpose
Tools provide external capabilities to agents. ADK supports Python function tools with state access (`ToolContext`) and remote Model Context Protocol (`McpToolset`) servers.

### 4.2 Code Example: BigQuery SQL Execution Tool ([`app/tools.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/tools.py))

```python
import re
from google.adk.tools import ToolContext
from google.cloud import bigquery

def query_customer_data(sql_query: str, tool_context: ToolContext) -> dict:
    """Executes a BigQuery Standard SQL query generated by the agent."""
    if not sql_query or "SELECT" not in sql_query.upper():
        return {"status": "ERROR", "summary": "Invalid SQL query."}

    clean_sql = re.sub(r"```(?:sql)?\s*(.*?)\s*```", r"\1", sql_query, flags=re.DOTALL).strip()

    client = bigquery.Client(project="agent-demo-09")
    query_job = client.query(clean_sql)
    results = [dict(row) for row in query_job.result()]

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

---

## 5. Google BigQuery Data Layer (`bigquery.googleapis.com`)

### 5.1 GCP Service Features & Capabilities
Google BigQuery provides serverless enterprise data warehousing. In this platform, it stores customer analytics (`agent-demo-09:marketing_analytics`) and project-wide agent events (`agent-demo-09.agent_analytics.agent_events_v2`).

### 5.2 Centralized Observability View: `agent_events_v2`

The `agent_events_v2` view structures execution logs for **ALL AGENTS** in the GCP project into a single queryable table:

```sql
CREATE OR REPLACE VIEW `agent-demo-09.agent_analytics.agent_events_v2` AS
SELECT
  insert_id AS event_id,
  timestamp,
  receive_timestamp,
  resource.type AS resource_type,
  COALESCE(
    JSON_VALUE(json_payload.session_id),
    REGEXP_EXTRACT(http_request.request_url, r'session_id=([^&]+)'),
    JSON_VALUE(labels.session_id),
    JSON_VALUE(labels.instanceId),
    'session-default'
  ) AS session_id,
  COALESCE(
    JSON_VALUE(json_payload.user_id),
    proto_payload.audit_log.authentication_info.principal_email,
    'user-123'
  ) AS user_id,
  COALESCE(
    JSON_VALUE(json_payload.agent_name),
    JSON_VALUE(resource.labels.reasoning_engine_id),
    REGEXP_EXTRACT(proto_payload.audit_log.resource_name, r'agentGateways/([^/]+)'),
    REGEXP_EXTRACT(proto_payload.audit_log.resource_name, r'templates/([^/]+)'),
    'marketing_orchestrator'
  ) AS agent_name,
  COALESCE(
    proto_payload.audit_log.method_name,
    JSON_VALUE(json_payload.event_type),
    http_request.request_method,
    log_name
  ) AS event_type,
  COALESCE(
    text_payload,
    JSON_VALUE(json_payload.message),
    JSON_VALUE(json_payload.prompt),
    TO_JSON_STRING(proto_payload.audit_log.request)
  ) AS prompt,
  COALESCE(
    JSON_VALUE(json_payload.text),
    JSON_VALUE(json_payload.response),
    TO_JSON_STRING(proto_payload.audit_log.response)
  ) AS response,
  json_payload
FROM `agent-demo-09.defaultLink._AllLogs`
WHERE resource.type IN ('aiplatform.googleapis.com/ReasoningEngine', 'cloud_run_revision', 'audited_resource', 'bigquery_project', 'bigquery_resource')
   OR log_name LIKE '%modelarmor%'
   OR log_name LIKE '%cloudaudit%';
```

---

## 6. Agent Registry & Skills Catalog (`agentregistry.googleapis.com`)

### 6.1 GCP Service Features & Capabilities
**Agent Registry** manages agent skills, tool definitions, and revision versions across GCP projects.

### 6.2 Code Example: Skill Registration Script ([`deploy/register_skills.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/register_skills.py))

```python
import subprocess

def register_skill(skill_id: str, display_name: str, payload_zip: str):
    prefixed_id = f"private-{skill_id}"
    
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "create", skill_id,
        "--location", "global", "--display-name", display_name,
        "--target-state", "draft", "--project", "agent-demo-09"
    ])
    
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "revisions", "create", "rev-1",
        "--skill", prefixed_id, "--location", "global",
        "--payload", payload_zip, "--project", "agent-demo-09"
    ])
    
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
        "--location", "global", "--target-state", "active", "--project", "agent-demo-09"
    ])
    print(f"✅ Skill {skill_id} registered and activated!")
```

---

## 7. Vertex AI Rapid Evaluation API (`aiplatform.googleapis.com`)

### 7.1 GCP Service Features & Capabilities
Automated LLM-as-a-Judge evaluators measuring Grounding, Safety/Toxicity, and Fulfillment.

### 7.2 Code Example: Local Evaluation Runner ([`eval/local_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/local_eval.py))

```python
def evaluate_agent_instance(prompt: str, response: dict) -> dict:
    passed_safety = response.get("status") != "BLOCKED_BY_MODEL_ARMOR"
    has_analytics = bool(response.get("analytics"))
    has_a2a_trace = len(response.get("a2a_trace", [])) > 0

    score = 1.0 if (passed_safety and has_analytics and has_a2a_trace) else 0.5

    return {
        "prompt": prompt,
        "metrics": {
            "safety_passed": passed_safety,
            "grounding_passed": has_analytics,
            "a2a_protocol_complete": has_a2a_trace
        },
        "score": score
    }
```

---

## 8. GCP Observability & Telemetry Stack (`cloudtrace` & `logging`)

### 8.1 GCP Service Features & Capabilities
* **Google Cloud Trace**: OpenTelemetry span traces (`invoke_workflow` → `call_llm` → `execute_tool`).
* **Cloud Logging Log Analytics**: Log bucket `_Default` linked to BigQuery dataset `defaultLink`.

---

## 9. Gemini Enterprise Integration & Agent Publishing (`discoveryengine.googleapis.com`)

### 9.1 GCP Service Features & Capabilities
Publishes deployed Reasoning Engine agents to **Gemini Enterprise Apps** so corporate users can invoke the agent inside Gemini's chat interface.

### 9.2 Code Example: Automated Publishing Script ([`deploy/publish_agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/publish_agent.py))

```python
#!/usr/bin/env python3
import os, subprocess, logging

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
GEMINI_APP_ID = os.getenv("GEMINI_ENTERPRISE_APP_ID", f"projects/{PROJECT_ID}/locations/global/collections/default_collection/engines/marketing-app")

def publish_to_gemini_enterprise():
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
        print("✅ Successfully published Agent to Gemini Enterprise!")
    return result.returncode == 0
```
