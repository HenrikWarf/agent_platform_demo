# System & UI/UX Design Architecture
## GCP Multi-Agent Marketing Platform

---

## 1. High-Level Architecture Topology

The application follows a microservice multi-agent topology powered by the **Google Agent Development Kit (ADK)**, **Agent Runtime (Agent Engine Reasoning Engine)**, React (Vite), Google BigQuery, Model Armor, Agent Gateway, and Gemini Enterprise.

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|    Light/Dark Mode | Chat | A2A Explorer | Simulator & OTel | BigQuery  |
+------------------------------------+------------------------------------+
                                     | (REST HTTP JSON)
                                     v
+-------------------------------------------------------------------------+
|                       CLOUD RUN BACKEND (API Layer)                     |
|                     (backend/app.py — Port 8080)                        |
|              AgentRuntimeClient → Agent Runtime               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    AGENT RUNTIME (Container)                            |
|          app/fast_api_app.py → ADK FastAPI + Reasoning Engine           |
|       :streamQuery / :query ← Gemini Enterprise / Console Playground    |
+------------------------------------+------------------------------------+
|                                    |
|       Agent Gateway & Model Armor  |  (Prompt Shield Inspection)
|                                    |
+----+--------------------+----------+----------+--------------------+----+
     | (LLM delegation)   | (LLM delegation)    | (LLM delegation)   | (LLM delegation)
     v                    v                     v                    v
+------------------+ +------------------+ +------------------+ +------------------+
| Analytics Agent  | | Recommender Pipe | | Strategy Pipeline| | Content Pipeline |
| (BigQuery SQL)   | | (SequentialAgent)| | (SequentialAgent)| | (SequentialAgent)|
+--------+---------+ +--------+---------+ +------------------+ +------------------+
         |                    |
         +----------+---------+
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

### 3.2 Governed vs Ungoverned API Paths

> [!IMPORTANT]
> Agent Gateway **only governs** the `:query` and `:streamQuery` Reasoning Engine methods.
> The `/api` passthrough bypasses gateway governance entirely — no Model Armor screening,
> no gateway traffic logs, no observability data.

| API Path | Endpoint Pattern | Governed? | Use Case |
|----------|-----------------|-----------|----------|
| `:streamQuery` | `v1beta1/{RE_ID}:streamQuery` | ✅ Yes | Agent prompt/response — screened by Model Armor |
| `:query` | `v1beta1/{RE_ID}:query` | ✅ Yes | Sync calls (session mgmt via AdkApp only) |
| `/api` passthrough | `reasoningEngines/v1/{RE_ID}/api/...` | ❌ No | Direct container access: `/run_sse`, `/apps/...` |

The backend uses a **hybrid approach**:
- **Session management** → `/api` passthrough (no governance needed for session CRUD)
- **Agent queries** → `:streamQuery` with `class_method: "stream_query"` (governed)

```
Client → :streamQuery → Agent Gateway → Model Armor (request screen)
       → Container (agent executes) → Model Armor (response screen) → Client
```

### 3.3 `:streamQuery` Request Format
The governed `:streamQuery` endpoint requires a specific JSON body format with `class_method` and `input` fields:

```json
{
  "class_method": "stream_query",
  "input": {
    "app_name": "app",
    "user_id": "user-123",
    "session_id": "session-456",
    "new_message": {
      "role": "user",
      "parts": [{"text": "How many customers do we have?"}]
    }
  }
}
```

Valid `class_method` values are registered by `AdkApp.register_operations()`:
- **Streaming**: `stream_query`, `async_stream_query`, `streaming_agent_run_with_events`
- **Sync**: `create_session`, `get_session`, `list_sessions`, `delete_session`

### 3.4 Model Armor Security Policy
- **Template**: `projects/agent-demo-09/locations/us-central1/templates/marketing-security-template`
- **RAI Filters**: Hate Speech (MEDIUM+), Harassment (MEDIUM+), Dangerous (MEDIUM+), Sexually Explicit (HIGH)
- **PI & Jailbreak Filter**: ENABLED, confidence level `MEDIUM_AND_ABOVE`
- **Malicious URI Filter**: ENABLED

> [!WARNING]
> Setting PI & Jailbreak to `LOW_AND_ABOVE` will block legitimate marketing content
> (persuasive language triggers false positives). Use `MEDIUM_AND_ABOVE` for marketing agents.

### 3.5 IAM Requirements for Model Armor
```bash
# Reasoning Engine service agent needs Model Armor access
gcloud projects add-iam-policy-binding agent-demo-09 \
  --member="serviceAccount:service-1047232371360@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
  --role="roles/modelarmor.user"

# Dep service agent (manages gateway-to-MA integration)
gcloud projects add-iam-policy-binding agent-demo-09 \
  --member="serviceAccount:service-1047232371360@gcp-sa-dep.iam.gserviceaccount.com" \
  --role="roles/modelarmor.calloutUser"
```

---

## 4. Multi-Agent Design & A2A Protocol

### 4.1 Orchestrator & Intent Classifier
The **Root Orchestrator** (`app/agent.py: marketing_orchestrator`) classifies user intent via LLM delegation across four specialized routing paths:

| Intent | Execution Flow | Output |
|--------|---------------|--------|
| `ANALYTICS_ONLY` | Orchestrator → AnalyticsAgent | Data summary + SQL accordion |
| `RECOMMENDATIONS_ONLY` | Orchestrator → AnalyticsAgent → RecommendationPipeline | + 5 curated products with EUR pricing & reasoning |
| `STRATEGY_ONLY` | Orchestrator → AnalyticsAgent → StrategyPipeline | + Strategic pillars, 100% channel mix, ROI |
| `FULL_CAMPAIGN` | Orchestrator → AnalyticsAgent → StrategyPipeline → ContentPipeline | + Channel-scoped creative copy |

### 4.2 Subagent Architecture
- **Analytics Agent** (`app/agent.py: analytics_agent`): Single-tool agent with `query_customer_data`. Generates BigQuery SQL from instructions (full table schema across 5 tables) and executes in one tool call. Skill: `bigquery-customer-analytics`.
- **Product Recommendation Pipeline** (`app/agent.py: recommendation_pipeline`): SequentialAgent — `recommendation_reasoner` → `recommendation_formatter` (Pydantic structured output using `ProductRecommendationSchema`). Curates 5 data-aligned items from `product_catalog` with EUR pricing and sustainability certification. Skill: `product-recommender`.
- **Strategy Pipeline** (`app/agent.py: strategy_pipeline`): SequentialAgent — `strategy_reasoning_agent` → `strategy_json_agent` (Pydantic structured output using `StrategySchema`). Skill: `campaign-framework`.
- **Content Pipeline** (`app/agent.py: content_pipeline`): SequentialAgent — `content_reasoning_agent` → `content_json_agent` (Pydantic structured output using `ContentSchema`). Formats deliverables selectively to requested channels (Email, Instagram, SMS). Skill: `brand-voice-craft`.

### 4.3 ADK Root Agent (`app/agent.py`)
The `app/agent.py` defines the `root_agent` using `google.adk.agents.Agent`. This is the ADK entry point that Agent Runtime discovers and serves. It delegates to the orchestrator agent's tools.

### 4.4 Analytics Tool Design (`app/tools.py`)
The analytics agent uses a single `query_customer_data(sql_query)` tool that:
1. Validates the SQL contains a `SELECT` statement
2. Cleans any markdown formatting the LLM may wrap around SQL
3. Executes the query against BigQuery
4. Stores results in `tool_context.state["analytics_result"]` for downstream agents
5. Returns up to 20 rows with status, summary, and the executed SQL

The agent's system instruction contains the full BigQuery table schema so it generates SQL directly — no nested Gemini calls. This keeps execution to exactly **1 tool call** per analytics query.

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

### 5.2 Visual Agent Identity & Themed Step Tracing
Each executing agent and security boundary features distinct, vibrant colors, active glow accents, and 4px left-border indicators:
- **Marketing Orchestrator** (`#4f46e5`): Royal Indigo accent stripe, badge, and supervisor icons.
- **Analytics Agent** (`#0284c7`): Sky Cyan accent stripe and database telemetry badge.
- **Product Recommendation Pipeline** (`#059669`): Emerald Mint accent stripe and product catalog badge.
- **Omnichannel Strategy Pipeline** (`#7c3aed`): Electric Violet accent stripe and framework metrics badge.
- **Brand Voice Content Pipeline** (`#d97706`): Warm Amber accent stripe and creative copy badge.
- **Agent Gateway & Model Armor** (`#e11d48`): Rose Coral accent stripe and security shield badge.

### 5.3 Stateful Session Management
- **Multi-Turn Context Preservation**: React frontend and backend client maintain `sessionId` across turns, preventing cold restarts and retaining prior conversational context.
- **Session Status Pill**: Active session badge (`🟢 Session: 46608506...`) rendered in the chat header.
- **Explicit Lifecycle Reset**: Sessions persist until the user clicks **Clear Chat** or reloads the browser.

### 5.4 Response & Interactive UI Components
- **Live Background Execution & Skill Trace**: Real-time SSE streaming visualizer showing active sub-agents, skill bindings, BigQuery SQL tool invocations, and Model Armor security checks.
- **Collapsible SQL Accordion**: BigQuery SQL queries rendered in clean, flush-left collapsible `<details><summary>` accordions (`🔍 View Executed BigQuery SQL Query`).
- **Dynamic AI Follow-Up Suggestions**: Server-side suggestions engine using Gemini 3.6 Flash on Vertex AI (`POST /api/suggestions/generate`) to inspect conversation turns and generate 6 context-rich follow-up prompts with target agent mappings.
- **Interactive Objective Steering Accordion**: Objective categories (Dynamic Follow-ups, BigQuery Data, Product Recommendations, Campaign Strategy, Creative Copy, Full Omnichannel), shuffle button, and "✨ Generate AI Follow-ups" trigger button.
- **Full-Screen Chat Focus View**: Seamless distraction-free expansion (`Maximize2` / `Minimize2` toggle with `Escape` key shortcut) that covers navigation headers and side panels in a full viewport overlay.
- **Selective Deliverable Cards**: Recommendation, Strategy, and Content cards render only when real payload data is returned by downstream sub-agents.
- **Agent Graph Visualizer**: Interactive A2A routing topology display.

### 5.5 Component Architecture
| Component | Responsibility |
|-----------|---------------|
| `ChatInterface.jsx` | Main chat with SSE live background execution trace, markdown rendering, SQL accordion, Dynamic AI Follow-ups, full-screen focus view, session management |
| `A2AExplorer.jsx` | A2A protocol explorer with full-screen agent card modal |
| `AgentGraphVisualizer.jsx` | Agent interaction flow graph with agent-specific color identities |
| `SimulatorControls.jsx` | Real traffic simulator with per-agent KPI breakdown |
| `BigQueryDataViewer.jsx` | Live BigQuery table sampling & inspection across all 5 tables |
| `SkillsInspector.jsx` | Skill registry browser (filters CLI dev skills) |

---

## 6. Observability & Telemetry

### 6.1 Scaffolded Telemetry (`app/app_utils/telemetry.py`)
- Cloud Trace span export (gated on `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY`)
- Prompt-response logging to GCS (`SPAN_AND_EVENT` full content capture mode)
- GenAI instrumentation with `OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK=upload`
- GCS completions bucket: `gs://agent-demo-09-agent-platform-logs/completions`

### 6.2 Cloud Logging & Log Analytics
- Log Analytics enabled on global `_Default` bucket (`analyticsEnabled: true`)
- Linked BigQuery dataset: `defaultLink` (location: US)
- Queries filter against the `_AllLogs` view for Agent Gateway, Model Armor, and Agent Engine logs

> [!NOTE]
> The Log Analytics view path `global._Default._AllLogs` is only queryable from the
> **Observability Analytics** page in Cloud Console, NOT from BigQuery Studio directly.
> To query logs from BigQuery Studio, use the linked dataset: `agent-demo-09.defaultLink._AllLogs`.

### 6.3 Model Armor Audit Logs
Model Armor screening activity is logged as audit logs with:
- Service: `modelarmor.googleapis.com`
- Methods: `SanitizeModelResponse`, `SanitizeUserPrompt`
- Enabled via Data Access audit log configuration for the `modelarmor.googleapis.com` service

### 6.4 Pre-Commit Quality Linter
Automated Git hook (`scripts/pre_commit_lint.sh`):
- Python Ruff Linter (`ruff check .`) for style and code formatting
- Python module compilation & syntax verification across `agents/`, `backend/`, `deploy/`, `eval/`, `app/`
- React ESLint check (`cd frontend && npm run lint`)
