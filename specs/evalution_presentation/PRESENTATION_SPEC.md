# Multi-Agent Evaluation & Quality Flywheel Presentation Deck Spec
## Architecture, Data Model, and Presenter Application Specification

---

## 1. Overview & Purpose

The **Multi-Agent Evaluation & Quality Flywheel Presentation Deck** is a standalone, self-contained interactive web application built with vanilla HTML5, CSS3 custom properties, and modern ES6 JavaScript.

It provides an enterprise-ready visual presenter interface for engineering leaders, AI architects, and stakeholders to understand the continuous quality assurance, LLM-as-judge evaluation, synthetic user simulation, and CI/CD deployment gates powering the **Crazy Fashion Multi-Agent Marketing Platform** on Google Cloud.

```
specs/evalution_presentation/
├── index.html                                # Complete self-contained presentation web app
├── PRESENTATION_SPEC.md                      # This specification and operational guide
├── 01_title_starter_slide.jpg                # Slide 1: Cover & Evaluation Scope
├── 02_quality_flywheel_flow.jpg              # Slide 2: 5-Stage Quality Flywheel
├── 03_multi_agent_tracing_trajectory.jpg     # Slide 3: Multi-Agent Trajectory Tracing
├── 04_llm_judge_metrics_rubrics.jpg          # Slide 4: 5-Pillar LLM-as-Judge Suite
├── 05_channel_selective_validation.jpg       # Slide 5: Channel-Selective Content & Strategy
├── 06_user_simulation_scenarios.jpg          # Slide 6: Synthetic User Simulation
├── 07_vertex_eval_cicd_pipeline.jpg          # Slide 7: Enterprise CI/CD & Cloud Scale
└── 08_evaluation_summary_dashboard.jpg       # Slide 8: Executive Summary & Benchmark Recap
```

---

## 2. Web Application Structure & Layout Architecture

The presentation application follows a 2-column split-stage layout designed for presentation projectors, high-DPI displays, and laptops:

```
+-----------------------------------------------------------------------------------------+
| HEADER BAR (Brand Logo | Jump Dropdown | Slide Counter | Wide/Swap/Theme/Fullscreen)    |
+-----------------------------------------------------------------------------------------+
| PROGRESS BAR (Dynamic completion fill: 0% -> 100%)                                      |
+----------------------------------------------------+------------------------------------+
| LEFT COLUMN (Image Presenter Panel, 1.35x flex)    | RIGHT COLUMN (Content Panel, 1.0x) |
|                                                    |                                    |
| [Prev]                                     [Next]  | [Section Pill] [Slide Badge]       |
|                                                    | # Slide Title                      |
| +------------------------------------------------+ | ## Subtitle                        |
| |                                                | |                                    |
| |               High-Resolution                  | | +--------------------------------+ |
| |              16:9 Slide Canvas                 | | | 💡 Executive Takeaway Card     | |
| |                                                | | +--------------------------------+ |
| |             (Click to Zoom: Z)                 | |                                    |
| |                                                | | 🎙️ Deep-Dive Talking Points     | |
| +------------------------------------------------+ |   • Point 1 (Card)                 |
|                                                    |   • Point 2 (Card)                 |
|                                                    |                                    |
|                                                    | ☁️ GCP Services & Protocols Tags  |
|                                                    |   [Chip] [Chip] [Chip]             |
+----------------------------------------------------+------------------------------------+
| FOOTER (Previous / Next Buttons | Slide Indicator Dots | Keyboard Shortcut Hints)       |
+-----------------------------------------------------------------------------------------+
| LIGHTBOX FULLSCREEN OVERLAY (Fixed Modal, Blur Backdrop, Zoom-Out Esc)                  |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Interactive Presenter Features & Keyboard Shortcuts

| Shortcut | Control | Functionality |
| :---: | :--- | :--- |
| **`→` / `Space`** | **Next Slide** | Advances to the next slide with smooth progress bar update and content re-scroll. |
| **`←`** | **Previous Slide** | Returns to the preceding slide. |
| **`Z` / Click** | **Zoom Lightbox** | Opens high-resolution diagram in a full-screen blurred modal overlay (`cursor: zoom-out`). |
| **`W`** | **Wide Mode** | Expands the image panel to 2.2x flex width for emphasizing architectural diagrams during presentations. |
| **`S`** | **Swap Layout** | Reverses the split stage columns (places image on the right and speaker notes on the left). |
| **`T`** | **Theme Toggle** | Toggles instantly between Google Cloud Light Mode (`data-theme="light"`) and Dark Mode (`data-theme="dark"`). |
| **`F`** | **Fullscreen** | Requests native browser full-screen canvas mode (`document.documentElement.requestFullscreen()`). |
| **`Esc`** | **Close Lightbox** | Exits zoom lightbox view. |

---

## 4. Slide-by-Slide Content & Talking Points Blueprint

### Slide 1: Enterprise Multi-Agent Evaluation & Quality Flywheel
- **Badge**: `Cover`
- **Image**: `01_title_starter_slide.jpg`
- **Executive Takeaway**: Production-grade autonomous multi-agent systems require systematic, end-to-end evaluation spanning intent routing, BigQuery MCP tool calls, skill compliance, and zero-trust safety before cloud deployment.
- **Key Talking Points**:
  - Why single-turn chatbot testing fails for multi-agent reasoning graphs with non-deterministic tool dependencies.
  - The 5 enterprise evaluation pillars: Response Quality, Tool Precision, Skill Compliance, Brand Voice, and Safety.
  - Crazy Fashion production scope: 18 validated evaluation cases covering BigQuery customer segmentation, campaign strategy planning, and channel-selective copywriting.
- **GCP Services**: `google-adk`, `agents-cli eval`, `Vertex AI Evaluation`, `LLM-as-Judge`, `Google BigQuery`, `Model Armor`, `Cloud Trace`

### Slide 2: The 5-Stage Agent Quality Flywheel
- **Badge**: `Section 01`
- **Image**: `02_quality_flywheel_flow.jpg`
- **Executive Takeaway**: Quality is an iterative engineering flywheel: author deterministic benchmarks, generate complete execution traces, score with adaptive LLM judges, cluster failures, and optimize prompts.
- **Key Talking Points**:
  - *Stage 1 (Prepare Data)*: Golden benchmark datasets (`crazy_fashion_eval.json`) and dynamic multi-turn scenarios.
  - *Stage 2 (Run Inference)*: `agents-cli eval generate` boots a local ADK FastAPI server on port 18080 and streams traces.
  - *Stage 3 (Grade Traces)*: `agents-cli eval grade` scores traces against custom LLM-as-judge rubrics and deterministic Python code metrics.
  - *Stage 4 & 5 (Failure Analysis & GEPA Optimization)*: `eval analyze` failure clustering and ADK GEPA automated prompt tuning (`eval optimize`).
- **GCP Services**: `agents-cli`, `ADK Quality Flywheel`, `GEPA Optimization`, `Vertex AI PaLM/Gemini`, `Cloud Storage`

### Slide 3: Multi-Agent Trajectory Tracing & ADK Execution Flow
- **Badge**: `Section 02`
- **Image**: `03_multi_agent_tracing_trajectory.jpg`
- **Executive Takeaway**: Evaluating multi-agent systems requires capturing the complete execution graph—from initial orchestrator intent evaluation to BigQuery tool execution and sub-agent handoffs.
- **Key Talking Points**:
  - Comprehensive trace capture (`events`, `author`, `function_call`, `function_response`, `state_delta`).
  - Orchestrator routing verification (direct Q&A vs. sub-agent delegation to Analytics, Strategy, or Content).
  - BigQuery MCP tool invocation audit against `agent-demo-09.marketing_analytics` tables.
  - Structured schema formatting validation with sequential agents (`strategy_formatter`, `content_formatter`).
- **GCP Services**: `Google ADK`, `SequentialAgent`, `BigQuery MCP Server`, `Pydantic V2`, `Cloud Trace OTel Spans`

### Slide 4: 5-Pillar LLM-as-Judge Evaluation Suite & Adaptive Rubrics
- **Badge**: `Section 03`
- **Image**: `04_llm_judge_metrics_rubrics.jpg`
- **Executive Takeaway**: Hardcoded string matching is fragile; adaptive LLM judges evaluate semantic intent, domain skill compliance, and brand voice adherence with high precision.
- **Key Talking Points**:
  - *Pillar 1 - Response Quality (4.83 / 5.0)*: Factual accuracy, relevance, and actionable marketing intelligence (`response_quality.py`).
  - *Pillar 2 - Tool & Routing Precision (4.67 / 5.0)*: Audits SQL query syntax, target tables, and delegation logic (`tool_and_routing_quality.py`).
  - *Pillar 3 - Skill Framework Compliance (4.61 / 5.0)*: Enforces `campaign-framework`, `brand-voice-craft`, and `bigquery-customer-analytics` rules (`skill_compliance_evaluator.py`).
  - *Pillars 4 & 5 - Brand Voice (5.0 / 5.0) & Safety (5.0 / 5.0)*: Validates Nordic simplicity, circular sustainability, EUR (€) currency, and 100% defense against prompt injections and jailbreaks.
- **GCP Services**: `Gemini 3.6 Flash`, `Vertex AI Evaluation`, `LLM-as-Judge`, `Model Armor`, `Adaptive Rubrics`

### Slide 5: Channel-Selective Content & Strategy Validation
- **Badge**: `Section 04`
- **Image**: `05_channel_selective_validation.jpg`
- **Executive Takeaway**: The content pipeline scopes output strictly to the requested channels (Email-only, SMS-only, Social-only), avoiding unsolicited marketing channels while enabling full multi-channel suites.
- **Key Talking Points**:
  - Flexible Pydantic `ContentSchema` with optional fields (`email_template | None`, `social_posts | None`, `sms_copy | None`).
  - Email-only validation (Eval Case 16): Generates subject, preview text, body, and CTA button while keeping social and SMS null (Score: 5.0/5.0).
  - SMS-only validation (Eval Case 17): Generates punchy SMS copy under 160 characters (138 chars generated) with promo code and link (Score: 5.0/5.0).
  - Social-only (Eval Case 18) and Omnichannel (Eval Case 14) validation.
- **GCP Services**: `Pydantic V2`, `ContentSchema`, `StrategySchema`, `brand-voice-craft`, `campaign-framework`

### Slide 6: Synthetic User Simulation & Dynamic Conversation Testing
- **Badge**: `Section 05`
- **Image**: `06_user_simulation_scenarios.jpg`
- **Executive Takeaway**: Static prompts miss multi-turn conversational edge cases; synthetic user simulation dynamically stress-tests agents across realistic personas and conversational friction.
- **Key Talking Points**:
  - `agents-cli eval dataset synthesize` automatically creates dynamic multi-turn conversation scenarios.
  - Persona generation: VIP Platinum shoppers, price-conscious regulars, and adversarial actors.
  - Multi-turn interaction loop over HTTP `/run_sse` with dynamic conversation steering.
  - Grading-ready synthetic traces produced without manual data annotation.
- **GCP Services**: `ADK User Simulator`, `Synthetic Data Generation`, `Dynamic Multi-Turn Scenarios`, `Vertex AI`

### Slide 7: Enterprise CI/CD & Cloud-Scale Evaluation Pipeline
- **Badge**: `Section 06`
- **Image**: `07_vertex_eval_cicd_pipeline.jpg`
- **Executive Takeaway**: Automated evaluation acts as the definitive quality gate in the CI/CD pipeline—preventing regressions from reaching production Cloud Run environments.
- **Key Talking Points**:
  - Pre-commit quality gate (`scripts/pre_commit_lint.sh`) enforcing fast local evaluation before git commits.
  - GitHub Actions CI/CD workflow (`.github/workflows/deploy-gcp.yml`) executing eval suites as Step 1.
  - Cloud-scale evaluation service (`eval submit`) uploading datasets to Vertex AI managed evaluation service.
  - Automated deployment gate ensuring Cloud Run containers and Agent Engine instances update only when passing benchmarks.
- **GCP Services**: `GitHub Actions`, `Cloud Build`, `Cloud Run`, `Vertex AI Eval Service`, `Cloud Storage`, `Artifact Registry`

### Slide 8: Executive Summary & Continuous Quality Assurance
- **Badge**: `Section 07`
- **Image**: `08_evaluation_summary_dashboard.jpg`
- **Executive Takeaway**: With 18 verified evaluation cases, a 4.82/5.0 overall quality score, and strict safety guardrails, the platform is certified production-ready for Crazy Fashion.
- **Key Talking Points**:
  - *Pillar 1 (5-Stage Quality Flywheel)*: Continuous loop from synthetic dataset preparation to automated execution trace generation, LLM grading, failure clustering, and GEPA prompt optimization.
  - *Pillar 2 (5-Pillar LLM-as-Judge Suite)*: Response Quality: 4.83/5.0, Tool Precision: 4.67/5.0, Skill Adherence: 4.61/5.0, Brand Voice: 5.0/5.0, Safety: 5.0/5.0.
  - *Pillar 3 (Channel-Selective Content Verification)*: Flexible Pydantic schema validation guarantees strict channel scoping for Email-only, SMS-only, and Social-only requests.
  - *Pillar 4 (Production CI/CD Gates & Cloud Monitoring)*: Automated pre-commit checks, GitHub Actions pipelines, Cloud Storage prompt-response logs (`gs://agent-demo-09-agent-platform-logs`), and Cloud Trace spans.
- **GCP Services**: `Google Cloud Vertex AI`, `ADK Runtime`, `BigQuery`, `Cloud Trace`, `Model Armor`, `Gemini Enterprise`

---

## 5. Local Running & Viewing Instructions

To view the interactive presentation deck locally:

```bash
# Option 1: Run the dedicated start script (serves on port 8085 and auto-opens in browser)
./specs/evalution_presentation/start_presentation.sh

# Option 2: Open static file directly in browser
open specs/evalution_presentation/index.html

# Option 3: Manual Python server command
python3 -m http.server 8085 --directory specs/evalution_presentation
```
