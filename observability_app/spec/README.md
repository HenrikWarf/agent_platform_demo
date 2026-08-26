# GCP Multi-Agent Observability & Quality Platform — Specification Suite

## 📌 Executive Overview
This specification suite contains the complete, authoritative product, architectural, design, data, and evaluation blueprints for the **GCP Multi-Agent Observability & Quality Platform** (`observability_app`).

The documentation is structured to allow any engineering or design team to **rebuild the entire observability platform from scratch** with exact architectural fidelity, backend API parity, and identical frontend UI/UX aesthetics.

---

## 🗂️ Specification Documentation Sitemap

| Specification Document | Focus Area | Description |
| :--- | :--- | :--- |
| [**PRD.md**](./PRD.md) | **Product Requirements** | Target personas, business objectives, problem statements, core feature requirements, and KPI / SLA benchmarks. |
| [**SPEC.md**](./SPEC.md) | **Technical Architecture** | Backend architecture (FastAPI port `8081`), data models, REST API endpoints, schemas, and state management. |
| [**DESIGN.md**](./DESIGN.md) | **UI/UX & Design System** | Glassmorphism aesthetic, 6-agent color palette, typography, layout grids, SVG visualizations, and interactive component specs. |
| [**DATA_AND_TELEMETRY.md**](./DATA_AND_TELEMETRY.md) | **Data & OpenTelemetry** | GCS completion log schemas, snapshot caching, SHA-256 derivation, 7-dimension failure taxonomy, and trace span structures. |
| [**EVALUATION_FLYWHEEL.md**](./EVALUATION_FLYWHEEL.md) | **Evaluation Flywheel** | 4-tier eval pyramid, Vertex AI `gemini-2.5-flash` LLM judges, rubrics, test suite generator, and remediation loop. |
| [**AGENT_ASSISTANT.md**](./AGENT_ASSISTANT.md) | **ADK Observability Agent** | In-app AI assistant agent, `telemetry-analysis` skill manifest, deterministic Python toolset, and chat interface overlay. |

---

## 🏗️ System High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                           GCP Agent Platform Ecosystem                             |
|                                                                                   |
|  +--------------------------------+       +------------------------------------+  |
|  | Vertex AI Reasoning Engine 1   |       | Vertex AI Reasoning Engine 2       |  |
|  | (Crazy Fashion Marketing Agent)|       | (ICA Sverige Marketing Agent)      |  |
|  +---------------+----------------+       +-----------------+------------------+  |
|                  |                                          |                     |
|                  +--------------------+---------------------+                     |
|                                       |                                           |
|                                       v (:streamQuery completions)                |
|                    +-------------------------------------+                        |
|                    | Google Cloud Storage Logs Bucket    |                        |
|                    | gs://agent-demo-09-agent-platform... |                        |
|                    +------------------+------------------+                        |
+---------------------------------------|-------------------------------------------+
                                        | (Live Sync / Snapshots)
                                        v
+-----------------------------------------------------------------------------------+
|                        Observability Platform (Port 8081)                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             FastAPI Backend                                 |  |
|  |  - TelemetryStore (Singleton)              - QualityEvalEngine (Gemini 2.5) |  |
|  |  - Ingestion & Snapshot Cache (<2ms)       - ADK Observability Agent App    |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|                                        v (REST HTTP / JSON)                       |
|  +-----------------------------------------------------------------------------+  |
|  |                       React + Vite Frontend (Port 3001)                     |  |
|  |  [ Fleet Quality Index ]    [ 7-Dimension Error Triage Board ]              |  |
|  |  [ OpenTelemetry Waterfall Trace ]  [ Agent Fleet Deep Dive Profiler ]      |  |
|  |  [ Quality Evals Test Suite ]        [ ✨ In-App AI Assistant Overlay ]     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Quickstart & Reproduction Commands

### 1. Prerequisites
- **Python**: 3.11+ or 3.12+ with Google ADK (`google-adk`), Google GenAI (`google-genai`), `fastapi`, `uvicorn`, and `pydantic`.
- **Node.js**: 18+ or 20+ with `npm` or `pnpm`.
- **Google Cloud SDK**: Authenticated via Application Default Credentials (`gcloud auth application-default login`).

### 2. Starting the Backend (Port 8081)
```bash
# From repository root
PYTHONPATH=. ./venv/bin/uvicorn observability_app.backend.app:app --host 0.0.0.0 --port 8081 --reload
```

### 3. Starting the Frontend (Port 3001)
```bash
# Navigate to frontend directory
cd observability_app/frontend
npm install
npm run dev -- --port 3001
```

### 4. Running Unified Startup Script
```bash
./start_observability.sh
```

---

## 🔑 Key Invariant Principles
1. **Direct GCS Ingestion**: Production metrics and session logs MUST originate from Google Cloud Storage (`gs://agent-demo-09-agent-platform-logs/completions/`), written by the deployed Vertex AI Reasoning Engine instances.
2. **Deterministic Snapshot Cache**: The store loads instantly on boot (< 2ms) using local SHA-256 snapshot caching (`telemetry_snapshot_cache.json`), while supporting on-demand live polling via `POST /api/obs/sync`.
3. **True Gantt Waterfall Flow**: Spans in the Conversation Trace view are placed at their exact chronological start offset, displaying clear visual handoffs when one agent finishes and the next takes over.
4. **Strict Retail Scenarios (No Recipes)**: Evaluator scenarios and test suites focus strictly on retail capabilities: **5-item personalized product assortment curation & basket cross-sell/up-sell**, BigQuery NL2SQL cohort analytics, A2UI deal banners, and SMS channel limits.
