# Product Requirements Document (PRD)
## GCP Multi-Agent Marketing Platform

---

## 1. Executive Summary & Vision
The **GCP Multi-Agent Marketing Platform** is an enterprise-grade AI solution designed to automate data analytics, strategy formulation, and creative copywriting for modern marketing teams. By combining **Google Agent Development Kit (ADK)**, **Agent-to-Agent (A2A) Protocol**, **Vertex AI Agent Engine**, **Model Armor Prompt Security**, **Network Services Agent Gateway**, **Agent Registry**, and **Google BigQuery**, the platform provides actionable insights and campaign generation through autonomous, specialized subagents while guaranteeing strict enterprise safety guardrails.

---

## 2. Target User Personas & Interactivity

| Persona | Role | Key Objectives | Primary Platform Interactivity |
| :--- | :--- | :--- | :--- |
| **Chief Marketing Officer (CMO)** | Strategic Executive | High-level ROI projections, cohort analysis, omnichannel campaign alignment | Full Campaign strategy generation, high-level KPI dashboards |
| **Data Analyst & BI Engineer** | Data Intelligence | Natural Language to SQL querying, RFM segment distribution, raw BigQuery SQL inspection | Natural language BigQuery data queries, SQL accordion inspection, live table sampling |
| **Lifecycle Marketing Specialist** | Content & Execution | Drafting targeted email copy, subject lines, ad channels, win-back flows | Creative asset generation, brand voice customization |
| **Security & Risk Officer** | Governance & Security | Preventing prompt injection, unvetted SQL execution, data leak protection | Model Armor prompt shield verification, governed access path tracking, policy logs |
| **DevOps & MLOps Engineer** | Infrastructure & CI/CD | Monitoring agent latency, OpenTelemetry trace spans, Cloud Run deployment | GCP Cloud Trace visualizer, traffic load simulator, version health checks |

---

## 3. Core Functional Requirements & Feature Parameters

### 3.1 Selective Intent-Based Workflow Routing
The platform MUST dynamically classify incoming user prompts into three distinct execution paths to prevent unnecessary subagent calls and optimize response latency:

1. **`ANALYTICS_ONLY`**:
   - **Trigger Conditions**: User asks data questions (e.g., *"How many customers do we have in total?"*, *"What is the average spend of Champions?"*, *"Show top 5 high risk customers"*).
   - **Execution Flow**: Supervisor -> `AnalyticsAgent` ONLY.
   - **Output Payload**: Returns natural language summary + dynamic executed BigQuery SQL query inside a collapsible accordion. Strategy and Content UI cards are strictly suppressed.
2. **`STRATEGY_ONLY`**:
   - **Trigger Conditions**: User requests strategic frameworks or channel allocation without creative assets (e.g., *"Formulate a retention strategy for At-Risk Premium customers"*).
   - **Execution Flow**: Supervisor -> `AnalyticsAgent` -> `StrategyAgent`.
   - **Output Payload**: Returns BigQuery data analytics + strategy framework card. Creative Content copy cards are suppressed.
3. **`FULL_CAMPAIGN`**:
   - **Trigger Conditions**: General campaign requests or creative copywriting prompts (e.g., *"Create a win-back campaign with email copy for At-Risk Premium"*).
   - **Execution Flow**: Supervisor -> `AnalyticsAgent` -> `StrategyAgent` -> `ContentAgent`.
   - **Output Payload**: End-to-end deliverable including BigQuery metrics, marketing strategy framework, and creative copy assets.

### 3.2 Natural Language to BigQuery SQL Engine (NL2SQL)
- **Schema Awareness**: `AnalyticsAgent` leverages Vertex AI Gemini (`gemini-3.6-flash`) with complete schema knowledge of 3 BigQuery tables (`customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`).
- **Direct Live Query Execution**: Generated SQL is executed directly against Google BigQuery without returning dummy fallback data. If a query fails, the exact runtime exception is reported transparently.
- **Collapsible Code Accordion**: SQL code blocks render inside a left-aligned `<details><summary>` accordion labeled `🔍 View Executed BigQuery SQL Query`.

### 3.3 Model Armor Security & Governed Gateway
- **Prompt Shield Inspection**: Prompts undergo real-time validation via Model Armor template `marketing-prompt-shield` to detect prompt injection, jailbreak attempts, and system prompt override attacks before subagent routing.
- **Governed Access Path**: Agent Gateway (`marketing-agent-gateway`) enforces `googleManaged.governedAccessPath: CLIENT_TO_AGENT` routing across all agent interactions.

### 3.4 Skill Store & Agent Registry
- **Production Skill Filtering**: Developer CLI skills (`google-agents-cli-*`) are automatically filtered out from the web UI skill registry to display application marketing skills only (`bigquery_customer_analytics`, `omnichannel_strategy`, `brand_voice`).

### 3.5 UI/UX Aesthetic & Design System
- **Default Theme**: System initializes in **Light Mode** by default (`data-theme="light"`), with an accessible Dark Mode toggle switch.
- **Selective UI Rendering**: Strategy & Content response cards render strictly when data payload is present (`Object.keys(...).length > 0`).

---

## 4. Non-Functional Requirements (NFRs)

| Category | Requirement | Target Metric / Standard |
| :--- | :--- | :--- |
| **Performance** | End-to-end response latency | `< 3.5s` for `ANALYTICS_ONLY`, `< 7.0s` for `FULL_CAMPAIGN` |
| **Data Integrity** | Zero Mock Data Rule | All BigQuery queries execute against live GCP tables; errors raise explicit exceptions |
| **Scalability** | Cloud Run Backend Concurrency | Auto-scaling `0..10` instances via GCP Cloud Run managed infrastructure |
| **Security Compliance** | Model Armor Prompt Shield | 100% prompt injection detection score on Golden Benchmark suite |
| **Observability** | OpenTelemetry & Log Analytics | Full Cloud Trace, Monitoring metric writer, and Log Analytics `--enable-analytics` on `_Default` bucket |
| **Code Quality** | Automated Git Pre-Commit Linter | 100% Python `py_compile` & React ESLint validation on `git commit` via `scripts/pre_commit_lint.sh` |
| **Accessibility** | UI Color Contrast & Typography | Compliant with WCAG 2.1 AA standards; JetBrains Mono for code blocks |

