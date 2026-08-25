# GCP Multi-Agent Marketing Platform
## Enterprise Multi-Agent Architecture & Agent Engine Ecosystem

> **Executive & Technical Presentation Specification**: A comprehensive deep-dive into the Google Cloud Agent Development Kit (ADK), Vertex AI Agent Runtime, Agent-to-Agent (A2A) Protocol, Dynamic Tool Execution, Skill Stores, and Multi-Pipeline Orchestration.

---

## Executive Summary

The **GCP Multi-Agent Marketing Platform** is an enterprise-grade AI system deployed on **Google Cloud Platform (GCP)**. It integrates **Google Agent Development Kit (ADK)**, **Vertex AI Agent Runtime (Reasoning Engine)**, **Google BigQuery**, **Model Armor**, and **Agent Gateway** into an intelligent, modular multi-agent ecosystem.

Rather than relying on a single monolithic LLM prompt, the platform decomposes complex enterprise marketing workflows across **6 specialized agent pipelines**, each equipped with dedicated system instructions, dynamic tools, registered skills, structured output schemas, and OpenTelemetry distributed tracing.

---

## Complete Slide Deck Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AGENT ARCHITECTURE PRESENTATION SLIDES                          │
├─────────┬─────────────────────────────────────────────────┬────────────────────────────┤
│ Slide # │ Title                                           │ Focus Area                 │
├─────────┼─────────────────────────────────────────────────┼────────────────────────────┤
│ Slide 1 │ Executive Keynote Title Cover                   │ Introduction on GCP        │
│ Slide 2 │ Enterprise Multi-Agent Architecture Ecosystem   │ System Overview & Topology │
│ Slide 3 │ Root Orchestration & A2A Routing Supervisor     │ Intent Routing & Protocols │
│ Slide 4 │ Analytics Agent & BigQuery NL2SQL Tool          │ Live Data Analytics & SQL  │
│ Slide 5 │ Product Recommendation Pipeline                 │ 5-Item Assortment Engine   │
│ Slide 6 │ A2UI Personalization & Offer Banner Engine      │ Stammis & Drop Card UI     │
│ Slide 7 │ Omnichannel Strategy & Content Pipelines        │ Frameworks & Creative Copy │
│ Slide 8 │ Skills Architecture & Agent Registry Overview   │ Dynamic Skill Bindings     │
│ Slide 9 │ Enterprise Multi-File Skill Architecture        │ Scripts, Refs & Examples   │
│ Slide 10│ Agent Gateway, Model Armor & Observability      │ Security & Cloud Trace     │
│ Slide 11│ Key Architectural Takeaways & Enterprise Summary│ Summary & Conclusion       │
└─────────┴─────────────────────────────────────────────────┴────────────────────────────┘
```

---

## Detailed Slide Specifications & Content

### ── Slide 1: Enterprise Multi-Agent Architecture Ecosystem ──
* **Headline**: Enterprise Multi-Agent Architecture & Agent Engine Ecosystem
* **Subhead**: Scalable, Intent-Driven Multi-Agent Framework on Vertex AI & Google Cloud
* **Core Concepts**:
  * Decoupled micro-agent architecture running on Vertex AI Agent Runtime (`reasoningEngines`).
  * End-to-end multi-pipeline delegation: Supervisor ➔ Analytics ➔ Recommender ➔ A2UI ➔ Strategy ➔ Content.
  * Enterprise data ground truth: Zero mock data; live execution against 5 BigQuery retail tables.
  * Security & Compliance: Enterprise Model Armor guardrails and governed Agent Gateway ingress.

---

### ── Slide 2: Root Orchestration & A2A Routing Supervisor ──
* **Headline**: Intelligent Orchestration & A2A Routing Supervisor
* **Subhead**: Dynamic Intent Classification & Inter-Agent Delegation
* **Core Concepts**:
  * **`marketing_orchestrator`**: Master supervisor agent powered by Gemini 3.6 Flash.
  * **Selective Workflow Intent Routing**:
    * `ANALYTICS_ONLY`: Routes strictly to BigQuery Analytics Agent; suppresses downstream generation.
    * `RECOMMENDATIONS_ONLY`: Routes to Analytics ➔ Product Recommendation Pipeline.
    * `A2UI_COMPONENT_ONLY`: Routes to Analytics ➔ A2UI Offer Banner Pipeline.
    * `STRATEGY_ONLY`: Routes to Analytics ➔ Strategy Pipeline.
    * `FULL_CAMPAIGN`: Orchestrates sequential handoffs across all sub-agent pipelines.
  * **Agent-to-Agent (A2A) Protocol**: Standardized JSON-RPC inter-agent communication, discovery at `/.well-known/agent-card.json`, and live A2A message tracing.

---

### ── Slide 3: Analytics Agent & BigQuery NL2SQL Tool ──
* **Headline**: Analytics Agent & BigQuery NL2SQL Tool
* **Subhead**: Deterministic SQL Generation & Multi-Table Retail Telemetry
* **Core Concepts**:
  * **Dynamic Tool Binding**: `query_customer_data` tool executes BigQuery Standard SQL against 5 tables.
  * **Schema-Aware Reasoning**: Real-time join reasoning across RFM segments, demographics, transactions, catalog SKUs, and behavioral events.
  * **Multi-Tenant Context Support**: Seamless switching between Crazy Fashion (`EUR`) and ICA Sverige (`SEK / Stammis`).
  * **Transparency**: Executed SQL queries are surfaced in collapsible UI accordions with full query plans.

---

### ── Slide 4: Product Recommendation Pipeline ──
* **Headline**: Product Recommendation Pipeline & Merchandising Skill
* **Subhead**: Data-Driven Assortment Curation & Strategic Pricing
* **Core Concepts**:
  * **SequentialAgent Architecture**: Two-stage pipeline (`recommendation_reasoner` ➔ `recommendation_formatter`).
  * **Deterministic 5-Item Assortment**: Curates exactly 5 high-affinity products from `product_catalog`.
  * **Cohort Attribute Matching**: Matches customer churn risk, price sensitivity, and eco-preferences with catalog metadata.
  * **Schema Validation**: Validated against `ProductRecommendationSchema` for reliable frontend card rendering.

---

### ── Slide 5: A2UI Personalization & Offer Banner Engine ──
* **Headline**: A2UI Personalization & Interactive Offer Banner Engine
* **Subhead**: Agent-to-User Interface (A2UI) Dynamic Component Generation
* **Core Concepts**:
  * **Dedicated Pipeline**: `a2ui_pipeline` (`SequentialAgent: a2ui_reasoner → a2ui_formatter`).
  * **Dual-Client Component Styling**:
    * **ICA Sverige**: Swedish grocery Stammis deal banner (`24:90 kr/st`, `Jfr-pris`, savings pill, KRAV/Från Sverige badges), interactive Swedish recipe drawer (`ICA Recept`) with ingredient checklist, and multi-deal bundle tabs.
    * **Crazy Fashion**: H&M-inspired high-contrast luxury editorial drop card with size/color selectors, Crazy Club points, and "Complete the Look" pieces.
  * **Interactive Actions**: One-click *"Ladda alla erbjudanden till kortet"*, *"Lägg ingredienser i inköpslistan"*, and in-store self-scanning barcodes.

---

### ── Slide 6: Omnichannel Strategy & Content Pipelines ──
* **Headline**: Omnichannel Strategy & Brand Voice Content Pipelines
* **Subhead**: Structured Campaign Frameworks & Channel-Selective Creative Copy
* **Core Concepts**:
  * **Strategy Pipeline (`strategy_pipeline`)**: Formulates 3 strategic pillars, 100% channel mix weightings, A/B testing hypotheses, and revenue recovery targets.
  * **Content Pipeline (`content_pipeline`)**: Scopes copy strictly to requested channels (Email templates, Instagram social posts with hashtags, and SMS under 160 characters).
  * **Pydantic Validation**: Guaranteed structured JSON payloads via `StrategySchema` and `ContentSchema`.

---

### ── Slide 8: Skills Architecture & Agent Registry Overview ──
* **Headline**: Enterprise Skills Architecture & Agent Registry
* **Subhead**: Modular Domain Knowledge & Declarative Skill Standards
* **Core Concepts**:
  * **Declarative Skills**: Modular directories containing `SKILL.md`, operational guidelines, and domain schemas.
  * **Active Skill Suite**:
    1. `bigquery-customer-analytics`: SQL generation rules and dataset schema mappings.
    2. `product-recommender`: Assortment curation and merchandising heuristics.
    3. `a2ui-personalization`: Retail offer styling, recipe pairings, and deal mathematics.
    4. `campaign-framework`: Omnichannel budgeting and 3-pillar methodologies.
    5. `brand-voice-craft`: Editorial style guides, tone guidelines, and channel constraints.
  * **Agent Registry (`agentregistry.googleapis.com`)**: Managed Google Cloud registry for cataloging and discovering agent skills.
  * **Developer Skill Hygiene**: Automatic filtering of developer CLI skills (`google-agents-cli-*`) from customer-facing business registries.

---

### ── Slide 9: Enterprise Multi-File Skill Architecture ──
* **Headline**: Enterprise Multi-File Skill Architecture & Progressive Disclosure
* **Subhead**: Modular Packages: SKILL.md, Deterministic Python Scripts, Compliance References & Golden Examples
* **Core Concepts**:
  * **Progressive Disclosure Principle**: `SKILL.md` acts as a lean trigger manifest (< 1,200 tokens), preventing prompt bloat while loading deep guides on demand.
  * **Deterministic Scripts (`scripts/`)**:
    * `calculate_campaign_roi.py`: Deterministic financial calculations for revenue uplift, gross profit, and CAC.
    * `basket_optimizer.py` / `capsule_optimizer.py`: 5-item completeness scoring, recipe balancing, and loyalty point multipliers.
    * `validate_sql_query.py`: Read-only safety guard preventing destructive DDL/DML.
  * **Regulatory References (`references/`)**: Swedish advertising laws (*Prisinformationslagen*, *30-dagarsregeln*, *Jämförpris*), EU Green Claims directives, and 5-table BigQuery data dictionaries.
  * **Golden Few-Shot Examples (`examples/`)**: Pre-validated JSON blueprints ensuring zero schema drift.
  * **Agent Registry Versioning**: Automatic packaging into ZIP payloads with content-hashed revisions (`rev-xxxx`) deployed as default active revisions.

---

### ── Slide 10: Agent Gateway, Model Armor & Observability ──
* **Headline**: Governed Gateway, Model Armor & Telemetry Observability
* **Subhead**: Production Security Ingress, Prompt Shielding & Distributed Tracing
* **Core Concepts**:
  * **GCP Agent Gateway**: Managed ingress enforcing `CLIENT_TO_AGENT` routing policies.
  * **Model Armor**: Real-time prompt shielding sanitizing user inputs and screening LLM responses for PII, hate speech, and jailbreaks.
  * **OpenTelemetry Distributed Tracing**: Hierarchical span visualization in Google Cloud Trace (`invoke_workflow` ➔ `call_llm` ➔ `execute_tool`).
  * **Prompt-Response Logging**: Complete JSONL telemetry stored in Cloud Storage (`gs://agent-demo-09-agent-platform-logs`) and Cloud Logging.

---

### ── Slide 11: Key Architectural Takeaways & Enterprise Summary ──
* **Headline**: Key Architectural Takeaways & Enterprise Summary
* **Subhead**: Accelerating Governed, Scalable Multi-Agent AI on Google Cloud
* **Core Concepts**:
  * **Intent-Driven Orchestration**: A2A Supervisor routes prompts selectively, minimizing token overhead and latency.
  * **Grounded Retail Telemetry**: Live BigQuery Standard SQL analytics across 5 tables with zero mock data.
  * **Specialized Multi-Pipelines**: Two-stage SequentialAgents delivering assortments, A2UI deal banners with recipes, and channel copy.
  * **Governed Security & Observability**: Production-ready protection via Agent Gateway, Model Armor, Cloud Trace, and GCS completion logging.
