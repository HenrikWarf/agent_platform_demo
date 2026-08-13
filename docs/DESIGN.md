# System & UI/UX Design Architecture (DESIGN.md)
## GCP Multi-Agent Marketing Platform

---

## 1. High-Level Architecture Topology

The application follows a microservice multi-agent topology powered by FastAPI, React (Vite), Google BigQuery, Model Armor, Agent Gateway, Agent Registry, and Vertex AI Agent Engine using Agent-to-Agent (A2A) protocol.

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|    Light/Dark Mode Theme | Chat & A2A Visualizer | BigQuery Inspector    |
+------------------------------------+------------------------------------+
                                     | (REST HTTP JSON)
                                     v
+-------------------------------------------------------------------------+
|                             FASTAPI BACKEND                             |
|                        (backend/app.py Port 8080)                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         AGENT GATEWAY & MODEL ARMOR                     |
|      governedAccessPath: CLIENT_TO_AGENT | Prompt Shield Inspection     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        ORCHESTRATOR SUPERVISOR                          |
|                  Selective Intent Classification Engine                 |
+-----+------------------------------+------------------------------+-----+
      |                              |                              |
      | (A2A Protocol)               | (A2A Protocol)               | (A2A Protocol)
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

## 2. Agent Gateway & Model Armor Governance Architecture

### 2.1 Agent Gateway (`marketing-agent-gateway`)
- **Resource Identifier**: `projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway`
- **Governed Access Path**: `googleManaged.governedAccessPath: CLIENT_TO_AGENT`
- **Bound Registries**: `//agentregistry.googleapis.com/projects/agent-demo-09/locations/us-central1`
- **Protocols Supported**: `MCP`, `HTTP_JSON`

### 2.2 Model Armor Security Policy
- **Floor Metadata**: `projects/agent-demo-09/locations/us-central1/floors/marketing-floor`
- **Prompt Shield Template**: `projects/agent-demo-09/locations/us-central1/templates/marketing-prompt-shield`
- **Active Safety Filters**:
  - Prompt Injection Defense (detects system override & malicious SQL manipulation).
  - Jailbreak Detection & Redirection.
  - Harmful Content & Data Exfiltration Prevention.

---

## 3. Multi-Agent Design & A2A Protocol Routing

### 3.1 Supervisor & Intent Classifier Engine
The **Orchestrator Agent** ([agents/orchestrator_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/orchestrator_agent.py)) intercepts all incoming requests:
1. **Security Validation**: Passes prompt to Model Armor gateway inspection.
2. **Intent Classification**:
   - `ANALYTICS_ONLY`: Data queries, segment counts, averages, and row listings. Executes `AnalyticsAgent` ONLY.
   - `STRATEGY_ONLY`: Framework and channel allocation prompts without copy assets. Executes `AnalyticsAgent` -> `StrategyAgent`.
   - `FULL_CAMPAIGN`: Creative copywriting and end-to-end campaign prompts. Executes `AnalyticsAgent` -> `StrategyAgent` -> `ContentAgent`.

### 3.2 Subagent Architecture & Responsibilities
- **Analytics Agent** ([agents/analytics_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/analytics_agent.py)):
  - Bound Skill: `bigquery_customer_analytics` ([skills/marketing_analytics/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/marketing_analytics/SKILL.md)).
  - Natural Language to SQL (NL2SQL) engine powered by Vertex AI Gemini (`gemini-3.6-flash`).
  - Executes live SQL against BigQuery tables (`customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`). Zero dummy fallbacks.
- **Strategy Agent** ([agents/strategy_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/strategy_agent.py)):
  - Bound Skill: `omnichannel_strategy` ([skills/omnichannel_strategy/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/omnichannel_strategy/SKILL.md)).
  - Generates campaign title, business goals, channel weights, and ROI projections.
- **Content Agent** ([agents/content_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/content_agent.py)):
  - Bound Skill: `brand_voice` ([skills/brand_voice/SKILL.md](file:///Users/henrikw/Projects/agent_platform_demo/skills/brand_voice/SKILL.md)).
  - Generates subject lines, email templates, and LinkedIn ad copy.

---

## 4. UI/UX Design System & Theme Engine

### 4.1 Design System Tokens (`frontend/src/index.css`)
The UI utilizes CSS custom properties for instant light/dark theme switching without compilation overhead.

```css
:root, [data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.85);
  --color-primary: #2563eb;
  --text-main: #0f172a;
  --code-bg: rgba(226, 232, 240, 0.85);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

[data-theme="dark"] {
  --bg-primary: #090b10;
  --bg-secondary: #111520;
  --bg-card: rgba(18, 23, 37, 0.75);
  --color-primary: #4285f4;
  --text-main: #f8fafc;
  --code-bg: rgba(0, 0, 0, 0.3);
}
```

### 4.2 Formatting Engine & Collapsible SQL Accordion
In [frontend/src/components/ChatInterface.jsx](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx), markdown responses pass through `formatMarkdownText()` and `dedentCode()`:
- **Accordion Container**: Executed BigQuery SQL code blocks are parsed and rendered inside `<details><summary>` containers (`🔍 View Executed BigQuery SQL Query`).
- **Selective Card Visibility**: Strategy & Content UI containers only mount when `Object.keys(msg.data.strategy).length > 0`.

---

## 5. Observability, Telemetry & Code Quality Architecture

### 5.1 Cloud Logging Log Analytics Architecture
For GCP Console Observability Analytics to process Agent Gateway and Agent Engine invocation counts, turn metrics, and latency charts:
- **Log Analytics**: Must be enabled on the global `_Default` log bucket (`gcloud logging buckets update _Default --location=global --enable-analytics`).
- **Log Views**: Log queries filter against the default `_AllLogs` view.

### 5.2 Service Account Telemetry IAM Bindings
Provisions metric writing and tracing permissions to service accounts via [deploy/enable_observability_permissions.sh](file:///Users/henrikw/Projects/agent_platform_demo/deploy/enable_observability_permissions.sh):
- **Service Accounts**: `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`, Compute Engine SA (`1047232371360-compute`), and Vertex AI Service Agent (`service-1047232371360@gcp-sa-aiplatform.iam.gserviceaccount.com`).
- **Roles**: `roles/cloudtrace.agent`, `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/monitoring.admin`, `roles/aiplatform.admin`, `roles/bigquery.dataEditor`, `roles/bigquery.jobUser`.

### 5.3 Automated Code Quality Linter Hook
- **Git Pre-Commit Hook** ([scripts/pre_commit_lint.sh](file:///Users/henrikw/Projects/agent_platform_demo/scripts/pre_commit_lint.sh)): Runs automatically on `git commit` to validate Python syntax/imports and React ESLint rules.
- **IDE Language Server Config**: [.vscode/settings.json](file:///Users/henrikw/Projects/agent_platform_demo/.vscode/settings.json) and [pyrightconfig.json](file:///Users/henrikw/Projects/agent_platform_demo/pyrightconfig.json) direct Pyrefly/Pyright to resolve `venv/lib/python3.14/site-packages` without missing module warnings.


