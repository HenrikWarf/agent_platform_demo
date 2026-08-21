# Product Requirements Document (PRD)
## GCP Multi-Agent Marketing Platform

---

## 1. Executive Summary & Vision

The **GCP Multi-Agent Marketing Platform** is an enterprise-grade AI solution that automates customer data analytics, omnichannel strategy formulation, and creative copywriting for marketing teams. Built on the **Google Agent Development Kit (ADK)** with a scaffolded project structure (`agents-cli 1.3.1`), it deploys to **Agent Runtime** as a container-based Reasoning Engine and integrates with **Gemini Enterprise**, **Model Armor**, **Agent Gateway**, and **Google BigQuery**.

The platform processes marketing objectives through an intent-classified multi-agent workflow, runs live BigQuery NL2SQL analytics, formulates campaign frameworks, and generates brand-aligned content — all governed by prompt safety guardrails.

---

## 2. Target User Personas

| Persona | Key Objectives | Primary Platform Interaction |
|---------|---------------|------------------------------|
| **CMO** | ROI projections, cohort analysis, campaign alignment | Full campaign generation, KPI dashboards |
| **Data Analyst** | NL2SQL querying, RFM segments, raw SQL inspection | Natural language BigQuery queries, SQL accordion |
| **Marketing Specialist** | Targeted email copy, subject lines, channel strategies | Creative asset generation, brand voice customization |
| **Security Officer** | Prompt injection prevention, governed access tracking | Model Armor verification, policy logs |
| **DevOps Engineer** | Agent latency, trace spans, deployment health | Cloud Trace, traffic simulator, `agents-cli` workflows |

---

## 3. Core Functional Requirements

### 3.1 Selective Intent-Based Workflow Routing
The platform dynamically classifies user prompts into four specialized execution paths:

| Intent | Trigger | Execution Flow | Output |
|--------|---------|---------------|--------|
| `ANALYTICS_ONLY` | Data queries ("How many customers in VIP?", "Show revenue by city") | Orchestrator → AnalyticsAgent | Summary + SQL accordion. Strategy/Content/Rec cards suppressed. |
| `RECOMMENDATIONS_ONLY` | Assortment curation ("Recommend products for Loyal Regulars") | Orchestrator → Analytics → Recommender | + 5 curated products card (EUR prices, sustainability, reasoning). |
| `STRATEGY_ONLY` | Framework requests without creative assets | Orchestrator → Analytics → Strategy | + Strategy framework (3 pillars, 100% channel mix, ROI). |
| `FULL_CAMPAIGN` | End-to-end campaign or launch prompts | Orchestrator → Analytics → Strategy → Content | End-to-end: metrics + strategy + channel-selective creative copy. |

### 3.2 Natural Language to BigQuery SQL (NL2SQL)
- **Schema-Aware**: AnalyticsAgent uses Gemini (`gemini-3.6-flash`) with schema knowledge of 5 Crazy Fashion BigQuery tables (`customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`, `product_catalog`, `customer_events`).
- **Live Execution**: SQL runs directly against BigQuery in EUR (€) — no mock or dummy fallbacks.
- **SQL Accordion**: Executed SQL renders cleanly in collapsible `<details><summary>` containers (`🔍 View Executed BigQuery SQL Query`).

### 3.3 Product Recommendation Pipeline & Merchandising Skill
- **Assortment Curation**: `recommendation_pipeline` (SequentialAgent combining reasoning and schema formatting) powered by `skills/product-recommender/SKILL.md`.
- **Deterministic 5-Item Output**: Curates exactly 5 items from `product_catalog` with EUR pricing, sustainability badges, merchandising strategies, and cohort alignment rationale.

### 3.4 Channel-Selective Creative Copy Generation
- **Scope-Constrained Output**: The Content Pipeline formats output strictly to the marketing channel(s) requested (e.g. Email-only, Social-only, SMS-only under 160 characters), generating the full suite only when requested.
- **Dedicated Channel UI Cards**: Distinct, clean cards for Email templates, Instagram post copy with hashtags, and SMS copy with real-time character counters.

### 3.5 Model Armor Security & Governed Gateway
- **Prompt Shield**: Real-time validation via Model Armor (`marketing-prompt-shield` template)
- **Agent Gateway**: `marketing-agent-gateway` with `CLIENT_TO_AGENT` governed access path

### 3.6 Skill Store
- Production marketing skills: `bigquery-customer-analytics`, `product-recommender`, `campaign-framework`, `brand-voice-craft`
- CLI dev skills (`google-agents-cli-*`) automatically filtered from the web UI

### 3.7 UI/UX & Interactive Capabilities
- **Theme Engine**: Light Mode default (`data-theme="light"`) with Dark Mode toggle switch.
- **Persistent Multi-Turn Session Management**: Active sessions persist across user questions, maintaining context and message history until the user clicks **Clear Chat** or reloads the page. Includes active session badge indicator.
- **Visual Agent Identity & Themed Step Tracing**: Distinct vibrant colors, active glow accents, and 4px left-border indicators for all 6 agents (Orchestrator `#4f46e5`, Analytics `#0284c7`, Recommender `#059669`, Strategy `#7c3aed`, Content `#d97706`, Model Armor `#e11d48`).
- **Dynamic AI Follow-Up Generator**: Server-side contextual suggestions engine (`/api/suggestions/generate`) powered by Gemini 3.6 Flash on Vertex AI.
- **Live Background Execution & Skill Trace**: Real-time SSE streaming indicator displaying step-by-step agent transitions, skill bindings, BigQuery SQL tool executions, and Model Armor security checks.
- **Interactive Objective Steering Accordion**: Categorized sample objectives (Dynamic Follow-ups, BigQuery Data, Product Recommendations, Campaign Strategy, Creative Copy, Full Omnichannel) with shuffle and "✨ Generate AI Follow-ups" button.
- **Full-Screen Chat Focus View**: Top control bar toggle (`Maximize2` / `Minimize2` and `Escape` key) expanding the chat view into a distraction-free full viewport overlay.
- **Clean Contextual Dispatch**: Direct prompt transmission without artificial cohort prefix/suffix strings.
- **Selective Rendering**: Deliverable cards render strictly when payload data is present.
- **Agent Graph**: Interactive A2A routing topology visualizer.

---

## 4. Deployment Architecture Requirements

### 4.1 Agent Runtime (Primary Agent Hosting)
- ADK agent deploys as a container-based Reasoning Engine via `agents-cli deploy`
- Container serves ADK web routes, A2A protocol, AND Reasoning Engine contract routes
- Scaffolded by `agents-cli 1.3.1` — infrastructure files are auto-generated

### 4.2 Cloud Run (API Layer & Frontend)
- **Backend** (`agent-platform-backend`): Thin API layer with `AgentRuntimeClient` proxy, BigQuery data browsing, Model Armor safety, and skill registry
- **Frontend** (`agent-platform-frontend`): React/Vite SPA with chat, data viewer, and observability

### 4.3 Gemini Enterprise Integration
- Agent registered via `agents-cli publish gemini-enterprise`
- Target app: `crazy-furniture-app-dev_1770975798363` in `ml-developer-project-fe07`

### 4.4 CI/CD Pipeline
- GitHub Actions on push to `main`
- Selective deployment (only changed services rebuild)
- Non-blocking Gemini Enterprise registration

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|------------|--------|
| **Performance** | End-to-end response latency | `< 3.5s` (ANALYTICS_ONLY), `< 7.0s` (FULL_CAMPAIGN) |
| **Data Integrity** | Zero mock data | All queries execute against live BigQuery (5 tables, 300 customers) |
| **Security** | Model Armor prompt shield | 100% injection detection on benchmark suite |
| **Observability** | OpenTelemetry + Log Analytics | Cloud Trace spans, structured logging, GenAI telemetry |
| **Code Quality** | Pre-commit linter | Python Ruff linter + syntax compilation + React ESLint on every commit |
| **Scaffolding** | `agents-cli` managed | All infrastructure files auto-generated and upgradeable |
| **Accessibility** | WCAG 2.1 AA | Color contrast, Inter/JetBrains Mono typography |
