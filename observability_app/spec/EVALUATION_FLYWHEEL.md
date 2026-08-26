# Automated Quality Evals & Evaluation Flywheel (EVALUATION_FLYWHEEL) — GCP Multi-Agent Observability Platform

## 1. The 4-Tier Multi-Agent Evaluation Pyramid

The platform enforces a structured **4-Tier Evaluation Pyramid** ensuring quality assurance from pre-commit unit tests up to production telemetry:

```
                            /\
                           /  \
                          / L4 \   Level 4: Production Telemetry & GCS Logs (Continuous)
                         /------\
                        /   L3   \  Level 3: Multi-Agent LLM-as-a-Judge Rubrics (Pre-Deploy)
                       /----------\
                      /     L2     \ Level 2: Model Armor Guardrails & Price Law Compliance
                     /--------------\
                    /       L1       \ Level 1: Deterministic Pydantic Schema & Unit Tests
                   /------------------\
```

| Level | Evaluation Scope | Tools & Frameworks | Frequency / Trigger |
| :--- | :--- | :--- | :--- |
| **L1: Schema & Types** | Pydantic model validation, JSON parse integrity, channel isolation. | Python `pydantic`, `pytest`, `ruff` | Pre-commit hook & CI pipeline |
| **L2: Guardrails & Compliance** | Model Armor floor screening, Swedish Price Information Act (*jämförpris* `kr/kg`). | `model_armor`, Regex compliance validators | Every ingress/egress turn |
| **L3: LLM Judges (Flywheel)** | Automated evaluation of *Task Success*, *Grounding*, *Tool Use*, and *Brand Voice*. | Vertex AI `gemini-2.5-flash` LLM-as-a-judge | On-demand test suite & nightly CI |
| **L4: Production Telemetry** | Live GCS completion log ingestion, latency percentiles, error triage clustering. | Cloud Trace, GCS, `TelemetryStore` | Continuous streaming runtime |

---

## 2. Automated LLM-as-a-Judge Evaluation Rubrics

The evaluation engine ([`observability_app/backend/eval_engine.py`](file:///Users/henrikw/Projects/agent_platform_demo/observability_app/backend/eval_engine.py)) evaluates multi-agent turns across 4 quantitative dimensions using **Vertex AI `gemini-2.5-flash`**:

### 2.1 Rubric 1: Task Completion Rate (`task_success`) — Score: 0.0 - 100.0%
- **Evaluation Criteria**: Did the multi-agent system fully fulfill all explicit business requirements in the user prompt?
- **Scoring Scale**:
  - `100%`: Fully solved with complete deliverables (e.g. data table + strategy + creative copy).
  - `75%`: Core question answered, but minor deliverable omitted (e.g. strategy formulated but missing CTA).
  - `0%`: Irrelevant response, refusal, unhandled exception, or prompt injection trip.

### 2.2 Rubric 2: Grounding Faithfulness (`grounding_faithfulness`) — Score: 0.0 - 100.0%
- **Evaluation Criteria**: Are all numerical metrics, customer counts, monetary figures, and product names strictly grounded in the BigQuery tool payload?
- **Failure Penalty**: Any hallucinated metric (e.g. quoting €450,000 when BigQuery returned €124,500) caps this score at $\le 70.0\%$.

### 2.3 Rubric 3: Tool Use & Execution Quality (`tool_use_quality`) — Score: 0.0 - 100.0%
- **Evaluation Criteria**: Did the agent select the correct tool (`query_customer_data`), generate valid ANSI BigQuery SQL with proper column aliasing, and handle zero-row edge cases gracefully?
- **Failure Penalty**: SQL syntax errors (400) or empty-tool fictional hallucinations cap this score at $\le 65.0\%$.

### 2.4 Rubric 4: Brand Voice & Compliance Adherence (`brand_voice_adherence`) — Score: 0.0 - 100.0%
- **Evaluation Criteria**:
  - **Crazy Fashion**: High-fashion editorial tone, sustainability certified tagging, EUR (€) pricing.
  - **ICA Sverige**: Warm Swedish retail tone (*"God mat för alla"*), mandatory *jämförpris* (`kr/kg`, `kr/l`), SEK (kr) pricing, Stammis point rewards.
  - **Channel Scope**: SMS copy must strictly adhere to $< 160\text{ characters}$ and avoid generating unrequested media channels.

---

## 3. Retail Use Cases & Test Scenario Catalog

> [!IMPORTANT]
> In accordance with core retail capabilities, the platform strictly tests **5-item personalized product assortment curation & basket cross-sell/up-sell**, NOT cooking recipes or dinner tips.

### Baseline Scenarios:
1. **📊 BigQuery RFM & Cohort Spend Analytics**: NL2SQL cohort queries, regional store comparisons, and spend distributions.
2. **🛍️ 5-Item Curated Product Assortments**: Curating 5-item personalized product assortments and cross-sell bundles (EUR / SEK).
3. **🎴 A2UI Personalization & Stammis Deal Banners**: Interactive Stammis Deal with mandatory *jämförpris* (`kr/kg`) & Studio Drop Cards.
4. **📱 Strict Channel Scope & SMS 160-Char Limits**: Channel-isolated copy (SMS under 160 chars) without unrequested media channels.
5. **⚡ 3-Pillar Strategy & Multi-Agent Orchestration**: End-to-end campaign formulation: Data ➔ 3-Pillar Strategy ➔ Content ➔ A2UI Banner.
6. **🛡️ Nordic Law (Jämförpris) & Model Armor Guardrail**: Swedish price law compliance, currency isolation (kr vs €), and injection defense.

---

## 4. Test Suite Execution & Quality Flywheel Workflow

```
+-----------------------------------------------------------------------------------+
|                           The Multi-Agent Quality Flywheel                         |
|                                                                                   |
|  1. Scenario Synthesis        2. Batch Execution             3. Judge Scoring     |
|  [ AI Scenario Generator ] ➔ [ Dispatch Test Cases to Agent ] ➔ [ Gemini 2.5 Flash]|
|                                                                       |           |
|  6. Re-Evaluation             5. ADK Skill Remediation       4. Error Triage      |
|  [ Verify Regression Fix ] 🠤 [ Update Prompts / Schemas ] 🠤 [ Problem Cluster ]  |
+-----------------------------------------------------------------------------------+
```

### Suite Size Options:
The UI provides 6 selectable suite sizes:
- **`1 Question`**: Quick single-turn probe.
- **`3 Questions`**: Targeted verification.
- **`4 Questions`**: Standard test battery.
- **`6 Questions`**: Comprehensive scenario evaluation.
- **`8 Questions`**: Multi-cohort deep dive.
- **`10 Questions`**: Full stress-test suite.
