# GCP Multi-Agent Marketing Platform: Comprehensive Architecture & Implementation Walkthrough

This document provides an end-to-end, detailed technical walkthrough of every layer in the **GCP Multi-Agent Marketing Platform**. It covers the functions and features of each **Google Cloud Platform (GCP)** service and **Agent Platform component**, detailing how they are designed, integrated, and implemented with actual code snippets from the codebase.

---

## 🏛️ 1. High-Level Architecture Diagram

```
                                    +-----------------------+
                                    |     React Frontend    |
                                    | (Light/Dark Mode, Vite)|
                                    +-----------+-----------+
                                                |
                                                v (REST HTTP/JSON)
                                    +-----------------------+
                                    |    FastAPI Backend    |
                                    |   (Cloud Run / Local) |
                                    +-----------+-----------+
                                                |
                                                v (:streamQuery)
                                    +-----------------------+
                                    |    Agent Gateway      |
                                    | (Model Armor Enforce) |
                                    +-----------+-----------+
                                                |
                                    +-----------------------+
                                    | Agent Engine (ADK)    |
                                    | marketing_orchestrator|
                                    +-----------+-----------+
                                                |
                      +-------------------------+-------------------------+-------------------------+
                      | (LLM delegation)        | (LLM delegation)       | (LLM delegation)        | (LLM delegation)
                      v                         v                         v                         v
          +-----------------------+ +-----------------------+ +-----------------------+ +-----------------------+
          |    Analytics Agent    | |   Recommender Pipe    | |  Strategy Pipeline    | |  Content Pipeline     |
          | (BigQuery SQL tool)   | | (SequentialAgent)     | | (SequentialAgent)     | | (SequentialAgent)     |
          +-----------+-----------+ +-----------+-----------+ +-----------------------+ +-----------------------+
                      |                         |
                      +------------+------------+
                                   |
                                   v
                      +-----------------------+
                      |    Google BigQuery    |
                      |  (agent-demo-09)      |
                      +-----------------------+
```

---

## 🌐 2. Frontend Layer (React 18 / Vite on GCP Cloud Run)

### 2.1 GCP Component: Cloud Run
* **Feature & Function**: **Google Cloud Run** is a fully managed serverless container runtime that automatically scales HTTP containers from zero to handle incoming web traffic.
* **Role in App**: Hosts the compiled static React/Vite single-page application inside an Nginx container.

### 2.2 Application Implementation
The frontend is built with **React 18**, **Vite**, and **Lucide Icons**. It uses CSS custom properties for instant light/dark mode theme toggling without page reloads. The application includes 6 tabs: **Chat**, **Agent Graph**, **Skills Inspector**, **BigQuery Data**, **A2A Explorer**, and **Traffic Simulator & OTel**.

#### Core Interactive Chat Capabilities
- **Live Background Execution & Skill Trace**: Real-time SSE streaming indicator displaying step-by-step agent transitions, skill bindings (`bigquery-customer-analytics`, `campaign-framework`, `brand-voice-craft`), BigQuery SQL tool executions, and Model Armor security checks.
- **Dynamic AI Follow-Up Generator**: Calls `/api/suggestions/generate` (powered by Gemini 3.6 Flash on Vertex AI) to inspect recent conversation turns and propose 6 hyper-relevant, structured follow-up questions mapped to target agents (`Analytics Agent`, `Strategy Pipeline`, `Content Pipeline`, `Multi-Agent Orchestrator`).
- **Interactive Objective Steering Accordion**: Categorized questions (BigQuery Data, Campaign Strategy, Creative Copy, Full Omnichannel) with shuffle and "✨ Generate AI Follow-ups" button. Clicking any question populates the prompt box smoothly.
- **Full-Screen Chat Focus View**: A top control bar toggle (`Maximize2` / `Minimize2` and `Escape` key shortcut) expands the chat into a distraction-free full viewport overlay covering all menus and side panels.
- **Direct Context Dispatch**: User prompts are sent directly without artificial cohort prefix/suffix strings, ensuring clean context for Gemini.
- **Collapsible SQL Accordion**: BigQuery SQL queries render inside collapsible `🔍 View Executed BigQuery SQL Query` accordions.
- **Selective Deliverable Cards**: Campaign Strategy frameworks and Ready-to-deploy Creative Assets render rich UI components strictly when payload data is present.

#### Code Snippet: State & Theme Switching ([`frontend/src/App.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/App.jsx))

```javascript
import React, { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, Database, Activity, Cpu, Sun, Moon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [theme, setTheme] = useState('light');

  // React effect synchronizing data-theme attribute on root DOM element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'dark' ? <Sun size={15} color="#fbbc04" /> : <Moon size={15} color="#4285f4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </header>
    </div>
  );
}
```

#### Code Snippet: Collapsible SQL Accordion & Selective Rendering ([`frontend/src/components/ChatInterface.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx))

```javascript
{/* Render BigQuery SQL Query inside a collapsible left-aligned accordion */}
{msg.sql_executed && (
  <details className="sql-accordion">
    <summary className="sql-accordion-summary">
      <Code size={14} />
      <span>🔍 View Executed BigQuery SQL Query</span>
    </summary>
    <div className="sql-accordion-content">
      <pre className="sql-code-block"><code>{msg.sql_executed}</code></pre>
    </div>
  </details>
)}

{/* Selective Rendering: Strategy card renders strictly when payload is present */}
{msg.strategy && Object.keys(msg.strategy).length > 0 && (
  <div className="strategy-card">
    <h3>{msg.strategy.campaign_title}</h3>
    <p>Projected Recovery: {msg.strategy.projected_revenue_recovery}</p>
  </div>
)}
```

---

## ⚡ 3. Backend API Layer (FastAPI on GCP Cloud Run)

### 3.1 GCP Component: FastAPI + OpenTelemetry Cloud Trace Exporter
* **Feature & Function**: Provides lightweight, asynchronous REST API endpoints while exporting OpenTelemetry span traces directly to **Google Cloud Trace**.
* **Role in App**: Receives user prompts from the frontend, proxies requests to Agent Runtime via the governed `:streamQuery` endpoint (where Agent Gateway enforces Model Armor), executes Dynamic AI Follow-up generation via Gemini 3.6 Flash on Vertex AI, and surfaces BigQuery customer data tables.

### 3.2 Application Implementation
The backend entry point is [`backend/app.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/app.py). It initializes OpenTelemetry tracing and defines `/api/chat`, `/api/suggestions/generate`, `/health`, and `/api/version` endpoints.

#### Code Snippet: Server Initialization & Chat Handler ([`backend/app.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/app.py))

```python
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
from backend.config import Config
from backend.agent_runtime_client import AgentRuntimeClient
from backend.suggestions_generator import generate_dynamic_followups

# Initialize OpenTelemetry exporter for Google Cloud Trace
tracer_provider = TracerProvider()
cloud_exporter = CloudTraceSpanExporter(project_id=Config.GCP_PROJECT_ID)
tracer_provider.add_span_processor(BatchSpanProcessor(cloud_exporter))
trace.set_tracer_provider(tracer_provider)

app = FastAPI(title="Google Cloud Agent Platform API", version="1.2.0")
runtime_client = AgentRuntimeClient()

@app.post("/api/chat")
def process_chat(req: ChatRequest):
    """Proxies prompt to Agent Runtime via governed :streamQuery endpoint.
    Model Armor security screening is enforced at the Agent Gateway
    infrastructure level — no application-level pre-flight needed."""
    result = runtime_client.query(prompt=req.prompt)
    result["agent_gateway"] = {
        "resource": Config.AGENT_GATEWAY_URL,
        "governed_access_path": "CLIENT_TO_AGENT",
        "model_armor_enforcement": "AGENT_GATEWAY",
        "model_armor_floor_id": Config.MODEL_ARMOR_FLOOR_ID,
    }
    return result

@app.post("/api/suggestions/generate")
def generate_suggestions(req: SuggestionsRequest):
    """Generates 6 contextual follow-up marketing questions via Gemini 3.6 Flash."""
    questions = generate_dynamic_followups(messages=req.messages)
    return {"questions": questions}
```

---

## 🛡️ 4. Security & Governance Layer (GCP Agent Gateway & Model Armor)

### 4.1 GCP Component: GCP Agent Gateway & Model Armor
* **GCP Agent Gateway** (`networkservices.googleapis.com`): Programmable network proxy providing governed ingress/egress access policies for AI agents.
* **Model Armor** (`modelarmor.googleapis.com`): Security engine filtering prompt injections, masking sensitive PII (emails, SSNs), and enforcing Responsible AI safety thresholds.

### 4.2 Application Implementation
Model Armor security screening is enforced **exclusively at the Agent Gateway infrastructure level** via the `:streamQuery` governed endpoint. The backend does **not** perform any application-level pre-flight safety checks — all prompt injection detection, PII masking, and Responsible AI filtering is handled by the managed Agent Gateway and its bound Model Armor floor policy.

Governance is configured via declarative YAML ([`deploy/agent_gateway.yaml`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/agent_gateway.yaml)) and bound to the Reasoning Engine spec via API patch ([`deploy/bind_agent_gateway.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/bind_agent_gateway.py)).

#### Code Snippet: Agent Gateway Resource Spec ([`deploy/agent_gateway.yaml`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/agent_gateway.yaml))

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

#### Code Snippet: Binding Gateway to Reasoning Engine ([`deploy/bind_agent_gateway.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/bind_agent_gateway.py))

```python
import requests

def bind_gateway(engine_resource: str, gateway_resource: str, token: str):
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
    resp = requests.patch(url, headers=headers, json=payload)
    resp.raise_for_status()
    print("✅ Agent Gateway bound to Reasoning Engine!")
```

> **Note**: The backend previously included a `PromptSafetyGuard` class (`backend/safety.py`) that performed application-level regex-based pre-flight checks (injection pattern detection, PII masking). This was **removed** because Model Armor screening is enforced at the Agent Gateway infrastructure level, making the application-level check redundant. The Agent Gateway should always be bound to the Reasoning Engine — all prompt traffic passes through Model Armor automatically via the `:streamQuery` governed endpoint.

---

## 🤖 5. Agent Execution Engine (Agent Engine & ADK Framework)

### 5.1 GCP Component: Agent Engine (Reasoning Engines)
* **Feature & Function**: Vertex AI managed runtime for deploying, hosting, and executing autonomous multi-agent applications packaged via Google ADK.
* **Role in App**: Executes the root orchestrator agent and specialized sub-agents inside managed containers with Cloud Trace telemetry.

### 5.2 Application Implementation
The multi-agent system is defined in [`app/agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py) using `google.adk.agents.Agent`. The backend proxies prompts to the deployed Reasoning Engine via [`backend/agent_runtime_client.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/agent_runtime_client.py).

#### Code Snippet: ADK Agent Definitions ([`app/agent.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/agent.py))

```python
import os
import pathlib
from google.adk.agents import Agent, SequentialAgent
from google.adk.apps import App
from google.adk.skills import load_skill_from_dir
from google.adk.tools.skill_toolset import SkillToolset
from app.company_context import COMPANY_CONTEXT
from app.schemas import StrategySchema, ContentSchema

# Load skills
skills_dir = pathlib.Path(__file__).parent.parent / "skills"
analytics_skill = load_skill_from_dir(skills_dir / "bigquery-customer-analytics")
strategy_skill = load_skill_from_dir(skills_dir / "campaign-framework")
content_skill = load_skill_from_dir(skills_dir / "brand-voice-craft")

# 1. Analytics Agent (BigQuery NL2SQL)
analytics_agent = Agent(
    name="analytics_agent",
    model="gemini-3.6-flash",
    description="Executes BigQuery customer data analysis and RFM segmentation for Crazy Fashion.",
    instruction=ANALYTICS_INSTRUCTION,
    tools=[mcp_toolset, SkillToolset(skills=[analytics_skill])],
)

# 2. Product Recommendation Pipeline (SequentialAgent: reasoning -> Pydantic structured output)
recommendation_pipeline = SequentialAgent(
    name="recommendation_pipeline",
    description="Curates exactly 5 personalized product recommendations from product_catalog based on segment attributes.",
    sub_agents=[recommendation_reasoner, recommendation_formatter],
)

# 3. Strategy Pipeline (SequentialAgent: reasoning -> Pydantic structured output)
strategy_pipeline = SequentialAgent(
    name="strategy_pipeline",
    description="Builds 3-pillar omnichannel marketing frameworks, channel mix weights, and EUR revenue recovery.",
    sub_agents=[strategy_reasoning_agent, strategy_json_agent],
)

# 4. Content Pipeline (SequentialAgent: reasoning -> Pydantic structured output)
content_pipeline = SequentialAgent(
    name="content_pipeline",
    description="Produces channel-selective email templates, social media posts, and SMS copy aligned with Nordic brand voice.",
    sub_agents=[content_reasoning_agent, content_json_agent],
)

# 5. Root Orchestrator Agent
root_agent = Agent(
    name="marketing_orchestrator",
    model="gemini-3.6-flash",
    description="Marketing Campaign Supervisor — routes objectives to sub-agents.",
    instruction="Route data queries -> analytics_agent; recommendations -> recommendation_pipeline; strategy -> strategy_pipeline; campaign -> all agents.",
    sub_agents=[analytics_agent, recommendation_pipeline, strategy_pipeline, content_pipeline],
)

app = App(root_agent=root_agent, name="app")
```

#### Code Snippet: Agent Runtime Client Stateful Stream Processing ([`backend/agent_runtime_client.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/agent_runtime_client.py))

```python
import requests, json

class AgentRuntimeClient:
    def __init__(self):
        self._active_sessions = set()

    def get_or_create_session(self, user_id: str, session_id: str = None) -> tuple[str, bool]:
        """Reuses existing session or initializes a new one in Agent Runtime."""
        if session_id and session_id in self._active_sessions:
            return session_id, False
        new_session = self._create_session(user_id)
        self._active_sessions.add(new_session)
        return new_session, True

    def query_stream(self, prompt: str, session_id: str = None, user_id: str = None):
        user_id = user_id or f"user-{uuid.uuid4().hex[:8]}"
        session_id, is_new = self.get_or_create_session(user_id, session_id)
        
        # Governed endpoint URL
        stream_url = f"{self._governed_url}:streamQuery"
        payload = {
            "class_method": "stream_query",
            "input": {
                "message": prompt,
                "user_id": user_id,
                "session_id": session_id,
            }
        }
        
        resp = requests.post(stream_url, headers=self._get_auth_headers(), json=payload, stream=True)
        for line in resp.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                yield json.loads(line[5:].strip())
```

### 5.3 Agent-to-Agent (A2A) Protocol Support

The deployed agent is a fully compliant **A2A agent**, serving the Agent-to-Agent protocol alongside the native ADK API. This enables any A2A-compatible client (including other agents, Gemini Enterprise, or custom applications) to discover and invoke the agent via a standard protocol.

#### A2A Architecture

The A2A integration is built into the ADK FastAPI app via [`app/app_utils/a2a.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/app_utils/a2a.py) and [`app/fast_api_app.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/fast_api_app.py):

```
A2A Client
    │
    ├── GET  /.well-known/agent-card.json   → Agent Card (capabilities, skills, interfaces)
    │
    └── POST /a2a/app                       → JSON-RPC endpoint (SendMessage / SendMessageStream)
              │
              └── A2aAgentExecutor → Runner → root_agent (marketing_orchestrator)
```

**Key components:**
* **Agent Card** — auto-generated from the ADK agent definition, served at the well-known path. Advertises the agent's name, description, version, skills, supported input/output modes, and JSON-RPC interfaces (v1.0 and v0.3).
* **JSON-RPC Endpoint** — accepts `SendMessage` (sync) and `SendMessageStream` (streaming) methods via the A2A protocol.
* **A2aAgentExecutor** — bridges the A2A request to the ADK `Runner`, sharing the same session and artifact services as the native ADK and `:streamQuery` paths.

#### Code Snippet: A2A Route Registration ([`app/fast_api_app.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/fast_api_app.py))

```python
from a2a.server.tasks import InMemoryTaskStore
from app.app_utils.a2a import attach_a2a_routes

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    from app.agent import app as adk_app
    from app.agent import root_agent

    runner = Runner(
        app=adk_app,
        session_service=services.get_session_service(),
        artifact_service=services.get_artifact_service(),
        auto_create_session=True,
    )
    await attach_a2a_routes(
        app,
        agent=root_agent,
        runner=runner,
        task_store=InMemoryTaskStore(),
        rpc_path=f"/a2a/{adk_app.name}",
    )
    yield
```

#### Code Snippet: Calling the Agent via A2A ([`examples/a2a_client.py`](file:///Users/henrikw/Projects/agent_platform_demo/examples/a2a_client.py))

```python
import requests, json, uuid
import google.auth, google.auth.transport.requests

AGENT_CARD_URL = "https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1/" \
    "projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936" \
    "/api/a2a/app/.well-known/agent-card.json"

RPC_URL = "https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1/" \
    "projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936" \
    "/api/a2a/app"

# 1. Fetch the A2A agent card
credentials, _ = google.auth.default()
credentials.refresh(google.auth.transport.requests.Request())
headers = {"Authorization": f"Bearer {credentials.token}", "Content-Type": "application/json"}

card = requests.get(AGENT_CARD_URL, headers=headers).json()
print(f"Agent: {card['name']} — {card['description']}")

# 2. Send an A2A message via JSON-RPC
payload = {
    "jsonrpc": "2.0",
    "id": str(uuid.uuid4()),
    "method": "SendMessage",
    "params": {
        "message": {
            "messageId": str(uuid.uuid4()),
            "role": "ROLE_USER",
            "parts": [{"text": "How many customers are in the Champions segment?"}],
        },
        "configuration": {"acceptedOutputModes": ["text/plain"]},
    },
}
headers["A2A-Version"] = "1.0"
response = requests.post(RPC_URL, headers=headers, json=payload).json()
# Response: State=TASK_STATE_COMPLETED, "There are 60 customers in the Champions segment."
```

#### Agent Card Response (live)

```json
{
  "name": "marketing_orchestrator",
  "description": "Marketing Campaign Supervisor — routes objectives to Analytics, Strategy, and Content agents.",
  "version": "1.3.0",
  "capabilities": { "streaming": true },
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"],
  "supportedInterfaces": [
    { "protocolBinding": "JSONRPC", "protocolVersion": "1.0" },
    { "protocolBinding": "JSONRPC", "protocolVersion": "0.3" }
  ],
  "skills": [
    { "id": "analytics_agent", "name": "query_customer_data", "description": "Execute BigQuery SQL queries..." },
    { "id": "strategy_pipeline", "name": "workflow", "description": "Designs omnichannel marketing strategies..." },
    { "id": "content_pipeline", "name": "workflow", "description": "Produces email templates, social posts, ad copy..." }
  ]
}
```

---

## 🛠️ 6. Tools Layer (`app/tools.py`)

### 6.1 Function & Purpose
Tools provide Python functions that ADK agents invoke to perform external operations (BigQuery SQL execution, LLM-based strategy generation, creative copy generation).

#### Code Snippet: BigQuery SQL Execution Tool ([`app/tools.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/tools.py))

```python
import re
from google.adk.tools import ToolContext
from google.cloud import bigquery

def query_customer_data(sql_query: str, tool_context: ToolContext) -> dict:
    """Executes a BigQuery Standard SQL query generated by the agent."""
    if not sql_query or "SELECT" not in sql_query.upper():
        return {"status": "ERROR", "summary": "Invalid SQL query."}

    # Clean markdown code fences generated by LLM
    clean_sql = re.sub(r"```(?:sql)?\s*(.*?)\s*```", r"\1", sql_query, flags=re.DOTALL).strip()

    client = bigquery.Client(project="agent-demo-09")
    query_job = client.query(clean_sql)
    results = [dict(row) for row in query_job.result()]

    # Save analytics in session state for downstream strategy/content agents
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

## 📊 7. Data Layer (Google BigQuery)

### 7.1 GCP Component: Google BigQuery
* **Feature & Function**: Enterprise cloud data warehouse supporting SQL queries over petabytes of data with sub-second execution.
* **Role in App**: Stores customer RFM segments, 360 demographic profiles, granular product catalog, transactional history, and real-time behavioral customer events for Nordic retailer **Crazy Fashion** (`agent-demo-09:marketing_analytics`).

#### Code Snippet: BigQuery Data Seeder ([`deploy/seed_bigquery_data.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/seed_bigquery_data.py))

```python
from google.cloud import bigquery

def seed_rfm_table(client: bigquery.Client, dataset_ref: bigquery.DatasetReference):
    table_ref = dataset_ref.table("customer_rfm_summary")
    
    rows = [
        {"customer_id": "CUST_0001", "rfm_segment": "VIP Fashionistas", "recency_days": 4, "frequency_orders": 38, "total_monetary_eur": 4820.50},
        {"customer_id": "CUST_0002", "rfm_segment": "Dormant At-Risk", "recency_days": 210, "frequency_orders": 3, "total_monetary_eur": 310.00},
    ]
    
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )
    
    job = client.load_table_from_json(rows, table_ref, job_config=job_config)
    job.result()
    print("✅ Seeded customer_rfm_summary table in BigQuery!")
```

---

## 📦 8. Agent Registry & Skills Store

### 8.1 GCP Component: Agent Registry (`agentregistry.googleapis.com`)
* **Feature & Function**: Centralized catalog for registering, versioning, and discovering AI agent skills and tool definitions across GCP.

#### Code Snippet: Skill Registration ([`deploy/register_skills.py`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/register_skills.py))

```python
import subprocess

def register_skill(skill_id: str, display_name: str, payload_zip: str):
    prefixed_id = f"private-{skill_id}"
    
    # 1. Create skill draft
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "create", skill_id,
        "--location", "global",
        "--display-name", display_name,
        "--target-state", "draft",
        "--project", "agent-demo-09"
    ])
    
    # 2. Create revision with ZIP payload containing SKILL.md
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "revisions", "create", "rev-1",
        "--skill", prefixed_id,
        "--location", "global",
        "--payload", payload_zip,
        "--project", "agent-demo-09"
    ])
    
    # 3. Activate skill
    subprocess.run([
        "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
        "--location", "global",
        "--target-state", "active",
        "--project", "agent-demo-09"
    ])
    print(f"✅ Skill {skill_id} registered and activated!")
```

---

## 📈 9. Observability & Local Evaluation Framework

### 9.1 GCP Component: Cloud Trace & Log Analytics
* **Google Cloud Trace**: Captures distributed execution spans (`invoke_workflow` → `call_llm` → `execute_tool`).
* **Cloud Logging & Log Analytics**: Stores logs in `_Default` bucket linked to BigQuery dataset `defaultLink`.

#### Code Snippet: Observability IAM & Log Link Setup ([`deploy/enable_observability_permissions.sh`](file:///Users/henrikw/Projects/agent_platform_demo/deploy/enable_observability_permissions.sh))

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

# Create linked BigQuery dataset defaultLink
gcloud logging links create defaultLink --bucket=_Default --location=global --project="agent-demo-09"
```

#### Code Snippet: Local Evaluation Suite ([`eval/local_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/local_eval.py))

```python
def evaluate_response(prompt: str, response: dict) -> dict:
    """Evaluates agent response for grounding, safety, and A2A trace completeness."""
    passed_safety = response.get("status") != "BLOCKED_BY_MODEL_ARMOR"
    has_analytics = bool(response.get("analytics"))
    has_a2a_trace = len(response.get("a2a_trace", [])) > 0

    return {
        "prompt": prompt,
        "metrics": {
            "safety_passed": passed_safety,
            "data_grounded": has_analytics,
            "a2a_trace_complete": has_a2a_trace,
        },
        "score": 1.0 if (passed_safety and has_analytics and has_a2a_trace) else 0.5
    }
```

### 9.2 Prompt-Response Logging (GCS, Cloud Trace & Cloud Logging)

Full prompt-response content logging is enabled on the Agent Runtime. Every GenAI interaction (LLM call → response) is captured and stored in **three destinations simultaneously**:

| Destination | What is Stored | How to Access |
|-------------|---------------|---------------|
| **GCS** (JSONL completions) | Full prompt/response payloads as NDJSON files | `gsutil ls gs://agent-demo-09-agent-platform-logs/completions/` |
| **Cloud Trace** (span attributes) | Prompt/response content embedded in OTel trace spans | Cloud Console → Trace → Trace Explorer |
| **Cloud Logging** (OTel events) | GenAI interaction events with full content | Cloud Console → Logging → Logs Explorer |

#### Infrastructure Provisioned

| Resource | Details |
|----------|---------|
| **GCS Bucket** | `gs://agent-demo-09-agent-platform-logs` — stores completion JSONL files |
| **Bucket Location** | `us-central1` (same region as Agent Runtime) |
| **Uniform Bucket-Level Access** | Enabled |

#### IAM Bindings on the Logs Bucket

Three service accounts require access to the bucket for different operations:

| Service Account | Role | Purpose |
|----------------|------|---------|
| `service-1047232371360@gcp-sa-aiplatform-re.iam.gserviceaccount.com` | `roles/storage.admin` | **Writes** completion files (Reasoning Engine SA) |
| `cloud-aiplatform-api-robot-prod@system.gserviceaccount.com` | `roles/storage.objectViewer` | **Reads** completions for per-trace evaluation |
| `service-1047232371360@gcp-sa-aiplatform.iam.gserviceaccount.com` | `roles/storage.objectViewer` | **Reads** completions for Agent Engine Console session/trace viewer |

> **Note**: Missing any of these IAM bindings causes specific failures:
> - Missing RE SA → completions are not written to GCS
> - Missing API robot SA → "Failed to run evaluation" error when evaluating individual traces
> - Missing Vertex AI P4SA → "Failed to load GenAI data" error in the Console session conversation viewer

#### Environment Variables on Agent Runtime

These are set via `agents-cli deploy --update-env-vars` and control the two independent logging tiers:

**Tier 1: GCS/BigQuery Completions** (full prompt/response upload)

| Variable | Value | Purpose |
|----------|-------|---------|
| `LOGS_BUCKET_NAME` | `agent-demo-09-agent-platform-logs` | GCS bucket for completion files |
| `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK` | `upload` | Enables completion upload to GCS |
| `OTEL_INSTRUMENTATION_GENAI_UPLOAD_BASE_PATH` | `gs://agent-demo-09-agent-platform-logs/completions` | GCS path for uploaded files |
| `OTEL_INSTRUMENTATION_GENAI_UPLOAD_FORMAT` | `jsonl` | Output format (NDJSON) |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | `gen_ai_latest_experimental` | Enable experimental GenAI semantic conventions |

**Tier 2: Trace Spans & Cloud Logging Events** (content in observability signals)

| Variable | Value | Purpose |
|----------|-------|---------|
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `SPAN_AND_EVENT` | Include content in both trace spans and Cloud Logging events |
| `ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS` | `true` | ADK-level control for message content in spans |

> **Content capture modes** (valid values for `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`):
> - `SPAN_AND_EVENT` — content in both traces and Cloud Logging events (current setting)
> - `SPAN_ONLY` — traces only, no Cloud Logging events
> - `EVENT_ONLY` — Cloud Logging events only, no trace spans
> - `NO_CONTENT` — no content in either tier (GCS completions still work independently)
> - `true` / `false` — **invalid** under experimental semconv, falls back to `NO_CONTENT`

#### Verification Commands

```bash
# Check GCS completions are being written
gsutil ls gs://agent-demo-09-agent-platform-logs/completions/

# Read a specific completion file
gsutil cat gs://agent-demo-09-agent-platform-logs/completions/<trace-id>_inputs.jsonl

# Check Cloud Logging for GenAI events
gcloud logging read 'resource.labels.reasoning_engine_id="3829020106671783936"' \
  --project=agent-demo-09 --limit=10 --format=json
```

### 9.3 Online Evaluation — Multi-Agent Limitation

> **⚠️ Known Limitation**: Online evaluation monitors do not currently work with multi-agent systems.

The Agent Engine Evaluation dashboard ("Manage online monitors") reports: `"No online monitor configured, or no matching traces found to evaluate"` despite traces being correctly captured.

**Root Cause**: The online evaluation monitor requires `gen_ai.system_instructions` to be **uniform** (identical) across all log entries within a single trace. In a multi-agent system, a single trace contains LLM calls from multiple agents — each with a **different system instruction**:

| Agent | System Instruction (summary) |
|-------|------------------------------|
| `marketing_orchestrator` | "Route data queries → analytics, strategy → strategy_agent..." |
| `analytics_agent` | "You are the Customer Insights & Analytics Agent. Write BigQuery SQL..." |
| `strategy_agent` | "Generate a comprehensive omnichannel marketing strategy..." |
| `content_agent` | "Draft brand-aligned marketing content..." |

The evaluation monitor fails with:
```
ERROR [labels.error.type: INSUFFICIENT_DATA]
Label 'gen_ai.system_instructions' is not uniform across all log entries.;
Failed to create AgentConfig for trace: <trace-id>
```

**What works vs. what doesn't:**

| Feature | Status | Notes |
|---------|--------|-------|
| Session conversation viewer | ✅ Works | Shows full prompt/response per session |
| Cloud Trace spans | ✅ Works | Full content in span attributes |
| Cloud Logging events | ✅ Works | GenAI events with content |
| GCS completions | ✅ Works | JSONL files per trace |
| Per-trace manual evaluation | ✅ Works | Click trace → Evaluation tab → run eval |
| Batch evaluation (local) | ✅ Works | Frontend "Run Local Evaluation Suite" button |
| **Online evaluation monitors** | ❌ Fails | Platform expects single-agent traces |

This is a platform-side limitation — the online eval would need to support per-agent-span evaluation rather than per-trace evaluation. Use per-trace manual evaluation or batch evaluation as alternatives.
