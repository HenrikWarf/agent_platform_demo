# GCP Multi-Agent Marketing Platform Architecture Blueprint

This document outlines the end-to-end system architecture and GCP deployment topology for the **GCP Multi-Agent Marketing Platform**.

### Simplified Linear Flow Blueprint Diagram
![GCP Multi-Agent Marketing Platform Simplified Architecture Diagram](file:///Users/henrikw/Projects/agent_platform_demo/specs/architecture/gcp_agent_platform_architecture_simplified.jpg)

### Dark Theme Blueprint Diagram
![GCP Multi-Agent Marketing Platform Architecture Diagram (Dark Mode)](file:///Users/henrikw/Projects/agent_platform_demo/specs/architecture/gcp_agent_platform_architecture.jpg)

### Light Theme Blueprint Diagram (Detailed Backend & Gateway Focus)
![GCP Multi-Agent Marketing Platform Architecture Diagram (Light Mode)](file:///Users/henrikw/Projects/agent_platform_demo/specs/architecture/gcp_agent_platform_architecture_white.jpg)

### GCP Agent Gateway Core Capabilities
![GCP Agent Gateway Core Capabilities Infographic](file:///Users/henrikw/Projects/agent_platform_demo/specs/architecture/gcp_agent_gateway_capabilities.jpg)

---

## 🏛️ System Components Breakdown

### 1. User Interface & Traffic Generation Layer (GCP Cloud Run)
* **React / Vite Frontend**: Modern single-page web app supporting light & dark modes, live A2A visualizer, interactive BigQuery SQL accordion, Dynamic AI Follow-up suggestions (powered by Gemini 3.6 Flash), category-steering objective accordion, Full-Screen Focus Mode, and agent skill store inspector.
* **Synthetic Traffic Simulator**: Automated traffic generator simulating continuous marketing prompt load for telemetry analysis.

### 2. Backend & API Gateway Layer
* **FastAPI Backend Server** ([`backend/app.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/app.py)): Exposes REST API endpoints (`/api/chat`, `/api/suggestions/generate`, `/health`, `/api/version`, `/api/simulator/*`, `/api/a2a/*`).
* **Agent Runtime Client** ([`backend/agent_runtime_client.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/agent_runtime_client.py)): Proxies user prompts to deployed Reasoning Engine instances via `:streamQuery` governed endpoints. Also provides the synthetic traffic simulator and A2A proxy.

### 3. Security & Governance Layer (GCP Infrastructure)
* **GCP Agent Gateway** (`networkservices.googleapis.com`): Governed ingress routing enforcing client-to-agent access policies.
* **Model Armor** (`modelarmor.googleapis.com`): Enterprise security guardrails enforcing hate speech, harassment, PII masking, and jailbreak protection on both user inputs and agent responses.

### 4. Agent Orchestration Engine (Agent Engine)
Built with **Google Agent Development Kit (ADK)** and powered by **Gemini 3.6 Flash**:
* **Root Orchestrator Agent (`marketing_orchestrator`)**: LLM-driven delegation to specialized sub-agents.
* **Customer Insights & Analytics Agent (`analytics_agent`)**: Direct BigQuery Standard SQL generator and query executor using `skills/bigquery-customer-analytics`.
* **Omnichannel Strategy Pipeline (`strategy_pipeline`)**: SequentialAgent generating strategic pillars, 100% channel mix weightings, and ROI projections using `skills/campaign-framework`.
* **Brand Voice Content Pipeline (`content_pipeline`)**: SequentialAgent crafting brand-aligned Nordic emails, social posts, and SMS using `skills/brand-voice-craft`.

### 5. Agent Registry & Skills Store
* **Agent Registry** (`agentregistry.googleapis.com`): Centralized store for dynamically bound marketing skills:
  * `bigquery-customer-analytics`: BigQuery customer data analytics & SQL templates.
  * `campaign-framework`: Campaign frameworks & channel mix allocations.
  * `brand-voice-craft`: Brand tone & creative copywriting rules.

### 6. Tools & Data Layer (Google BigQuery — Crazy Fashion Nordic Retail)
* **Google BigQuery** (`agent-demo-09:marketing_analytics`):
  * `customer_rfm_summary`: Recency, frequency, and EUR monetary metrics across 300 customers.
  * `customer_demographics_360`: Demographic, income, loyalty tier, and churn risk metrics.
  * `customer_transactions`: 900 line items spanning Online, In-Store, and App channels.
  * `product_catalog`: 50 Nordic fashion items with EUR prices and sustainability certifications.
  * `customer_events`: 1500 behavioral events (cart abandon, purchase, wishlist add, app opens).

### 7. Observability & Evaluation Layer
* **OpenTelemetry Cloud Trace**: Distributed tracing capturing span hierarchies (`invoke_workflow` → `call_llm` → `execute_tool`).
* **Prompt-Response Logging**: Full content capture to GCS (`gs://agent-demo-09-agent-platform-logs`), Cloud Trace spans (`SPAN_AND_EVENT`), and Cloud Logging events.
* **Cloud Logging & Log Analytics**: Centralized log bucket (`_Default`) and linked BigQuery dataset (`defaultLink`).
* **Evaluation Engine**: ADK eval framework (`agents-cli eval`) and per-trace manual evaluation in Cloud Console.

> **Known Limitation**: Online evaluation monitors do not work with multi-agent systems due to non-uniform `gen_ai.system_instructions` across sub-agent traces.
