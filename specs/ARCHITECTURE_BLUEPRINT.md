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
* **React / Vite Frontend**: Modern single-page web app supporting light & dark modes, live A2A visualizer, interactive BigQuery SQL accordion, and agent skill store inspector.
* **Synthetic Traffic Simulator**: Automated traffic generator simulating continuous marketing prompt load for telemetry analysis.

### 2. Backend & API Gateway Layer
* **FastAPI Backend Server** ([`backend/app.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/app.py)): Exposes REST API endpoints (`/api/chat`, `/api/health`, `/api/skills`, `/api/bigquery/sample`).
* **Prompt Safety Guard** ([`backend/safety.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/safety.py)): Application-level pre-flight safety check for PII masking and prompt injection filtering.
* **Agent Runtime Client** ([`backend/agent_runtime_client.py`](file:///Users/henrikw/Projects/agent_platform_demo/backend/agent_runtime_client.py)): Proxies user prompts to deployed Reasoning Engine instances via `:streamQuery` governed endpoints.

### 3. Security & Governance Layer (GCP Infrastructure)
* **GCP Agent Gateway** (`networkservices.googleapis.com`): Governed ingress routing enforcing client-to-agent access policies.
* **Model Armor** (`modelarmor.googleapis.com`): Enterprise security guardrails enforcing hate speech, harassment, PII masking, and jailbreak protection on both user inputs and agent responses.

### 4. Agent Orchestration Engine (Agent Engine)
Built with **Google Agent Development Kit (ADK)** and powered by **Gemini 3.6 Flash**:
* **Root Orchestrator Agent (`marketing_orchestrator`)**: Intent classifier delegating via Agent-to-Agent (A2A) protocol.
* **Customer Insights & Analytics Agent (`analytics_agent`)**: Direct BigQuery Standard SQL generator and query executor.
* **Omnichannel Strategy Agent (`strategy_agent`)**: Marketing strategy, channel mix allocation, and ROI projection generator.
* **Brand Voice Content Agent (`content_agent`)**: Email templates, social media posts, and SMS copy generator.

### 5. Agent Registry & Skills Store
* **Agent Registry** (`agentregistry.googleapis.com`): Centralized store for dynamically bound marketing skills:
  * `marketing_analytics`: BigQuery customer data analytics & SQL templates.
  * `omnichannel_strategy`: Campaign frameworks & channel mix allocations.
  * `brand_voice`: Brand tone & creative copywriting rules.

### 6. Tools & Data Layer (Google BigQuery)
* **Google BigQuery** (`agent-demo-09:marketing_analytics`):
  * `customer_rfm_summary`: Recency, frequency, and monetary analytics.
  * `customer_demographics_360`: Demographic, income, and churn risk metrics.
  * `customer_transactions`: Real-time streaming transaction history.

### 7. Observability & Evaluation Layer
* **OpenTelemetry Cloud Trace**: Distributed tracing capturing span hierarchies (`invoke_workflow` → `call_llm` → `execute_tool`).
* **Cloud Logging & Log Analytics**: Centralized log bucket (`_Default`) and linked BigQuery dataset (`defaultLink`).
* **Evaluation Engine**: Local evaluation suite ([`eval/local_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/local_eval.py)) and Agent Platform Rapid Evaluation API integration ([`eval/vertex_eval.py`](file:///Users/henrikw/Projects/agent_platform_demo/eval/vertex_eval.py)).
