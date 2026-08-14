# System & UI/UX Design Architecture
## GCP Multi-Agent Marketing Platform

---

## 1. High-Level Architecture Topology

The application follows a microservice multi-agent topology powered by the **Google Agent Development Kit (ADK)**, **Agent Runtime (Vertex AI Reasoning Engine)**, React (Vite), Google BigQuery, Model Armor, Agent Gateway, and Gemini Enterprise.

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|    Light/Dark Mode Theme | Chat & A2A Visualizer | BigQuery Inspector    |
+------------------------------------+------------------------------------+
                                     | (REST HTTP JSON)
                                     v
+-------------------------------------------------------------------------+
|                       CLOUD RUN BACKEND (API Layer)                     |
|                     (backend/app.py — Port 8080)                        |
|              AgentRuntimeClient → Vertex AI Agent Runtime               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    VERTEX AI AGENT RUNTIME (Container)                   |
|          app/fast_api_app.py → ADK FastAPI + Reasoning Engine           |
|       :streamQuery / :query ← Gemini Enterprise / Console Playground    |
+------------------------------------+------------------------------------+
|                                    |
|       Agent Gateway & Model Armor  |  (Prompt Shield Inspection)
|                                    |
+-----+------------------------------+------------------------------+-----+
      |                              |                              |
      | (A2A Protocol)               | (A2A Protocol)               | (A2A)
      v                              v                              v
+------------------+         +------------------+         +------------------+
| Analytics Agent  |         |  Strategy Agent  |         |  Content Agent   |
|  (NL2SQL Engine) |         | (omnichannel_str)|         |  (brand_voice)   |
+--------+---------+         +------------------+         +------------------+
         |
         v
+-------------------------------------------------------------------------+
|                             GOOGLE BIGQUERY                             |
|               (agent-demo-09:marketing_analytics.tables)                |
+-------------------------------------------------------------------------+
```

---

## 2. Container & Serving Architecture

### 2.1 Agent Runtime Container (`app/fast_api_app.py`)
The scaffolded `app/fast_api_app.py` is the container entrypoint, created by `agents-cli scaffold`. It serves three route families:

| Route Family | Endpoints | Consumer |
|-------------|-----------|----------|
| **ADK Web UI** | `/run_sse`, `/apps/{app}/...` | `agents-cli playground`, dev UI |
| **Reasoning Engine** | `/api/reasoning_engine`, `/api/stream_reasoning_engine` | Vertex AI `:query`/`:streamQuery`, Console Playground, Gemini Enterprise |
| **A2A Protocol** | `/a2a/{app_name}/...` | Agent-to-Agent JSON-RPC |

The `lifespan` builds a shared `Runner` with session/artifact services (`app/app_utils/services.py`) and mounts A2A routes. `attach_reasoning_engine_routes(app)` adds the Vertex AI contract.

### 2.2 Agent Runtime App (`app/agent_runtime_app.py`)
The `AgentEngineApp(AdkApp)` entry point wraps the ADK agent for the non-container Agent Engine deployment path. It initializes `vertexai`, telemetry, and Cloud Logging.

### 2.3 Session & Artifact Services (`app/app_utils/services.py`)
- **Sessions**: In-memory locally; upgrades to `VertexAiSessionService` on Agent Runtime (when `GOOGLE_CLOUD_AGENT_ENGINE_ID` is set)
- **Artifacts**: `GcsArtifactService` when `LOGS_BUCKET_NAME` is set; otherwise `InMemoryArtifactService`

---

## 3. Agent Gateway & Model Armor Governance

### 3.1 Agent Gateway (`marketing-agent-gateway`)
- **Resource**: `projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway`
- **Governed Access Path**: `googleManaged.governedAccessPath: CLIENT_TO_AGENT`
- **Protocols**: `MCP`, `HTTP_JSON`

### 3.2 Model Armor Security Policy
- **Prompt Shield Template**: `projects/agent-demo-09/locations/us-central1/templates/marketing-prompt-shield`
- **Active Filters**: Prompt Injection Defense, Jailbreak Detection, Harmful Content Prevention

---

## 4. Multi-Agent Design & A2A Protocol

### 4.1 Orchestrator & Intent Classifier
The **Orchestrator Agent** (`agents/orchestrator_agent.py`) classifies user intent:

| Intent | Execution Flow | Output |
|--------|---------------|--------|
| `ANALYTICS_ONLY` | Orchestrator → AnalyticsAgent | Data summary + SQL accordion |
| `STRATEGY_ONLY` | Orchestrator → AnalyticsAgent → StrategyAgent | + Strategy framework |
| `FULL_CAMPAIGN` | Orchestrator → AnalyticsAgent → StrategyAgent → ContentAgent | + Creative copy |

### 4.2 Subagent Architecture
- **Analytics Agent** (`agents/analytics_agent.py`): NL2SQL engine with `bigquery_customer_analytics` skill. Queries live BigQuery tables.
- **Strategy Agent** (`agents/strategy_agent.py`): `omnichannel_strategy` skill. Campaign frameworks, channel mix, ROI projections.
- **Content Agent** (`agents/content_agent.py`): `brand_voice` skill. Subject lines, email templates, ad copy.

### 4.3 ADK Root Agent (`app/agent.py`)
The `app/agent.py` defines the `root_agent` using `google.adk.agents.Agent`. This is the ADK entry point that Agent Runtime discovers and serves. It delegates to the orchestrator agent's tools.

---

## 5. UI/UX Design System

### 5.1 Theme Engine (`frontend/src/index.css`)
CSS custom properties for instant light/dark theme switching:
```css
:root, [data-theme="light"] {
  --bg-primary: #f8fafc;
  --color-primary: #2563eb;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
[data-theme="dark"] {
  --bg-primary: #090b10;
  --color-primary: #4285f4;
}
```

### 5.2 Response Rendering
- **Collapsible SQL Accordion**: BigQuery SQL in `<details><summary>` containers (`🔍 View Executed BigQuery SQL Query`)
- **Selective Card Visibility**: Strategy & Content cards render only when payload is present
- **Agent Graph Visualizer**: Interactive A2A routing topology display

### 5.3 Component Architecture
| Component | Responsibility |
|-----------|---------------|
| `ChatInterface.jsx` | Main chat with markdown rendering, SQL accordion |
| `AgentGraphVisualizer.jsx` | A2A protocol routing visualization |
| `BigQueryDataViewer.jsx` | Live BigQuery table sampling & inspection |
| `SimulatorControls.jsx` | Traffic load simulator for telemetry |
| `SkillsInspector.jsx` | Skill registry browser (filters CLI dev skills) |

---

## 6. Observability & Telemetry

### 6.1 Scaffolded Telemetry (`app/app_utils/telemetry.py`)
- Cloud Trace span export (gated on `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY`)
- Prompt-response logging to GCS (`NO_CONTENT` metadata-only mode)
- GenAI instrumentation with `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload`

### 6.2 Cloud Logging & Log Analytics
- Log Analytics enabled on global `_Default` bucket
- Queries filter against the `_AllLogs` view for Agent Gateway, Model Armor, and Agent Engine logs

### 6.3 Pre-Commit Quality Linter
Automated Git hook (`scripts/pre_commit_lint.sh`):
- Python `py_compile` syntax & module import verification
- React ESLint check (`cd frontend && npm run lint`)
