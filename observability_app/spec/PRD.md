# Product Requirements Document (PRD) — GCP Multi-Agent Observability Platform

## 1. Product Overview & Vision
The **GCP Multi-Agent Observability & Quality Platform** is an enterprise-grade control plane designed to monitor, triage, trace, and continuously evaluate autonomous multi-agent systems running on **Google Cloud Platform (GCP)** via the **Google Agent Development Kit (ADK)** and **Vertex AI Agent Engine (Reasoning Engines)**.

Autonomous multi-agent architectures introduce non-deterministic execution paths, complex subagent delegations, dynamic tool calls (such as BigQuery NL2SQL), and structured JSON-RPC / A2UI streaming handoffs. Standard APMs (like Datadog or Prometheus) only track basic HTTP server health, completely missing:
- LLM semantic drift and hallucination against BigQuery payloads.
- Multi-agent routing loops and delegation ping-pong.
- Pydantic schema validation failures and channel contract overflows.
- Swedish / Nordic consumer law non-compliance (missing *jämförpris* `kr/kg`).
- Agent Gateway & Model Armor guardrail trigger events.

This platform bridges the gap between low-level telemetry (OpenTelemetry spans & GCS logs) and high-level business assurance (Quality Flywheel & automated LLM-as-a-judge evaluations).

---

## 2. Target User Personas & Use Cases

### 👤 Persona 1: AI Platform & Multi-Agent Engineer
- **Goals**: Monitor latency percentiles (p50/p90/p99), debug multi-agent delegation chains, inspect BigQuery SQL tool payloads, and optimize prompt token consumption.
- **Key Workflow**: Inspect the **Conversation Trace Waterfall** to pinpoint bottlenecks and review failed spans.

### 👤 Persona 2: LLM Quality & Safety Evaluator
- **Goals**: Quantitatively benchmark prompt regressions, ensure grounding faithfulness against database records, and verify Model Armor guardrail enforcement.
- **Key Workflow**: Run automated synthetic test suites in **Quality Evals Suite** and track the **Fleet Quality Index**.

### 👤 Persona 3: Retail Marketing Lead (Crazy Fashion & ICA Sverige)
- **Goals**: Ensure generated campaigns, 5-item product assortment recommendations, and A2UI Stammis deal banners are brand-aligned, legally compliant, and high-converting.
- **Key Workflow**: Audit the **7-Dimension Error Triage Board** and review generated markdown and deal payloads.

### 👤 Persona 4: SecOps & Compliance Officer
- **Goals**: Verify zero-leakage behavior under prompt injection attempts and enforce Nordic Price Information Act (*Prisinformationslagen*) compliance.
- **Key Workflow**: Audit Model Armor floor blocks and verify mandatory *jämförpris* across all Swedish grocery deal cards.

---

## 3. Core Functional Requirements

### 3.1 Tab 1: Fleet Overview & Quality Index
- **Global Health Index Banner**: Live score (%) showing overall system health, SLA adherence pill (`● HEALTHY (SLA MET)`), and aggregate task completion rate.
- **6 Executive KPI Scorecards**:
  1. *Global Quality Score* (Target > 95.0%)
  2. *Task Completion Rate* (Target > 97.0%)
  3. *Grounding Faithfulness* (Target > 97.0%)
  4. *Hallucination Rate* (Target < 1.5%)
  5. *Average Latency (p90)* (Target < 3,500 ms)
  6. *Open Triage Issues* (Active error clusters)
- **SVG Health Radar Visualizer**: 5-axis polygon chart measuring *Tool Use*, *Grounding*, *Brand Voice*, *Task Success*, and *Latency SLA*.
- **7-Dimension Enterprise Failure Taxonomy**: Interactive distribution bar chart breaking down recorded issues across the 7 core failure modes.
- **Tenant Comparison Matrix**: Side-by-side performance cards comparing **Crazy Fashion** (Nordic fashion, EUR) vs **ICA Sverige** (Swedish grocery, SEK).

### 3.2 Tab 2: 7-Dimension Error Triage Board
- **Agent Fleet Overview & Status Matrix (Top Section)**:
  - 6 interactive agent health cards (`marketing_orchestrator`, `analytics_agent`, `recommendation_pipeline`, `a2ui_pipeline`, `strategy_pipeline`, `content_pipeline`, `model_armor`).
  - Displays operational status badge (`● HEALTHY` vs `⚠️ ATTENTION NEEDED`), success rate %, and open issue count.
  - **⚠️ What Could Improve**: Concrete failure modes identified from real traces.
  - **✨ Suggestions on What to Look Into**: Actionable checklist of investigation and prompt remediation steps.
  - **Interactive Filtering**: Clicking any agent card filters the problem clusters below to that specific agent.
- **Multi-Agent Problem Matrix & Clustering**:
  - Filter by Severity (`ALL`, `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Category (7 dimensions), and Status (`OPEN`, `INVESTIGATING`, `RESOLVED`).
  - Each cluster card displays: Error Signature, Affected Agent, Affected Tenant, Total Occurrences, Root Cause Diagnostic, and ADK Remediation guidance.
  - Interactive status update modal with engineer audit logging and timestamped notes.

### 3.3 Tab 3: OpenTelemetry Conversation Trace & Waterfall
- **Session Selector Column (Left)**: Filterable list of sessions by Tenant (`Crazy Fashion`, `ICA Sverige`), Routed Agent, and search query. Displays session ID, user prompt snippet, latency, and agent badges.
- **Traditional Gantt Waterfall View (Right)**:
  - **Horizontal Time Axis Header**: Scale bar showing millisecond intervals (`0 ms`, `+25%`, `+50%`, `+75%`, `+Total ms`) with dashed vertical reference lines extending down through all rows.
  - **Hierarchical Tree & Agent Hierarchy (Left Column)**: Indented tree levels (`├── `, `└── `) showing root workflow, child agents, and grandchild operations (`call_llm`, `execute_tool`, `validate_schema`).
  - **Contiguous Timing Flow Timeline (Right Column)**: Span bars positioned at exact start offset percentages:
    $$\text{left} = \frac{\text{start\_offset\_ms}}{\text{total\_turn\_duration}} \times 100\%$$
    $$\text{width} = \frac{\text{duration\_ms}}{\text{total\_turn\_duration}} \times 100\%$$
    Visually illustrates chronological handoffs when one agent ends and the next begins.
- **Interactive Span Inspector**: Clicking any span opens a detailed attribute drawer displaying OpenTelemetry semantic attributes (`gen_ai.system`, `gen_ai.request.model`, `db.statement`), start/end timestamps, and formatted BigQuery SQL code payloads.

### 3.4 Tab 4: Agent Fleet Deep-Dive & Profiler
- 6 dedicated agent profiling cards with:
  - Latency distribution percentiles: **p50 (Median)**, **p90**, and **p99**.
  - Total call volume (invocations count).
  - Average token consumption per turn.
  - Failure / error percentage rate.
  - SLA operational health badge (`● OPTIMAL` vs `⚠️ ATTENTION`).

### 3.5 Tab 5: Automated Quality Evals Suite & Quality Flywheel
- **Step 1: Scenario & Theme Selection**:
  - 6 baseline scenarios + dynamic AI Scenario Generator (generates clean 1-line scenarios on demand).
  - Reset Scenarios button to restore standard defaults.
  - Dynamic Suite Size buttons: **`1 Question`**, **`3 Questions`**, **`4 Questions`**, **`6 Questions`**, **`8 Questions`**, **`10 Questions`**.
- **Step 2: AI Test Suite Generation**:
  - Invokes Vertex AI Gemini model to synthesize domain-accurate enterprise test cases based on active retail use cases (**5-item product assortments**, BigQuery NL2SQL, A2UI deal banners, SMS 160-char limits).
  - Zero auto-generation on tab navigation; generation is triggered strictly on user button click.
- **Step 3: Automated Batch Evaluation Engine**:
  - Executes batch test cases against Vertex AI `gemini-2.5-flash` LLM-as-a-judge evaluators.
  - Scores 4 core rubrics: *Task Completion*, *Grounding Faithfulness*, *Tool Use Quality*, and *Brand Voice Adherence*.
- **Step 4: Quality Verdict & Test Inspection**:
  - Displays overall batch pass rate %, average quality score %, radar distribution, and test case drilldown showing reasoning explanations and failure diagnostics.

### 3.6 Floating AI Observability Assistant Chat
- Expandable / collapsible floating chat overlay accessible from any tab.
- Powered by ADK Observability Agent (`observability_ai_assistant`) using `telemetry-analysis` skill.
- Direct programmatic tool access to `telemetry_store` to answer natural language questions about fleet health, open error clusters, span bottlenecks, and tenant comparisons.
- Multi-step loading animations showing real-time diagnostic reasoning steps.

---

## 4. Non-Functional Requirements (NFRs)

| Dimension | Requirement | Implementation Target |
| :--- | :--- | :--- |
| **Response Latency** | Instant initial dashboard render | `< 2 ms` via deterministic snapshot cache (`telemetry_snapshot_cache.json`). |
| **Sync Latency** | On-demand GCS telemetry sync | `< 1,500 ms` for 100 GCS completion blobs. |
| **UI Aesthetics** | Glassmorphism & Cyber-Slate Dark Mode | Backdrop-blur (`rgba(30, 41, 59, 0.7)`), 6 distinct agent colors, zero layout shift. |
| **Cross-Platform Compatibility** | Modern browsers | Chrome, Safari, Firefox, Edge with standard ES2022+ & Flex/Grid. |
| **Data Integrity** | Real GCP Telemetry Origin | Telemetry MUST mirror deployed Vertex AI Agent Runtime execution logs. |
| **Security & IAM** | Application Default Credentials | Direct Google ADC auth; zero hardcoded API keys. |

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

- **Fleet Quality Index**: $\ge 95.0\%$ across all production turns.
- **Grounding Faithfulness**: $\ge 97.0\%$ matching underlying BigQuery tables.
- **p90 Turn Latency**: $\le 3,500\text{ ms}$.
- **Multi-Agent Error Rate**: $\le 2.0\%$ across all failure dimensions.
- **Zero Prompt Leakage**: $100\%$ Model Armor block rate on adversarial inputs.
