# Presentation Technical Specification
## Enterprise Multi-Agent Architecture & Agent Engine Ecosystem

---

## 1. Slide Deck Overview & Visual Assets

| Slide | Filename | Topic | Core Takeaway |
|:---:|---|---|---|
| **01** | `01_agent_architecture_title.jpg` | Architecture Overview | Vertex AI Agent Runtime + ADK + BigQuery + Model Armor ecosystem |
| **02** | `02_orchestration_a2a_routing.jpg` | Orchestrator & A2A Routing | Intent classification & A2A JSON-RPC delegation supervisor |
| **03** | `03_analytics_bigquery_nl2sql.jpg` | BigQuery Analytics Agent | Natural language to BigQuery Standard SQL across 5 tables |
| **04** | `04_recommendation_pipeline.jpg` | Product Recommendation Pipeline | SequentialAgent curating 5-product assortments & merchandising strategy |
| **05** | `05_a2ui_personalization_engine.jpg` | A2UI Personalization Engine | Dual-client Swedish Stammis banner with recipes & fashion drop cards |
| **06** | `06_strategy_and_content_pipelines.jpg` | Strategy & Content Pipelines | 3 strategic pillars, 100% channel mix & channel-selective copy |
| **07** | `07_skills_and_agent_registry.jpg` | Skills Architecture & Registry | Modular skill standard (`SKILL.md`) & Google Cloud Agent Registry |
| **08** | `08_gateway_security_observability.jpg` | Security & Observability | Agent Gateway, Model Armor prompt shield & Cloud Trace telemetry |

---

## 2. Interactive Presentation Application Specs

The slide deck viewer is packaged as a standalone web application ([`index.html`](file:///Users/henrikw/Projects/agent_platform_demo/specs/agent-architecture/index.html)) featuring:
- **Responsive 16:9 Presentation Canvas**: Automatic proportional scaling with aspect ratio preservation.
- **Theme Switcher**: Google Cloud Light Mode & High-Contrast Dark Mode.
- **Speaker Notes Drawer**: Detailed talking points, key takeaways, and presenter guidance for each slide.
- **Keyboard Navigation**:
  - `→` / `Space` / `PageDown`: Next Slide
  - `←` / `PageUp`: Previous Slide
  - `Home`: First Slide (Slide 1)
  - `End`: Last Slide (Slide 8)
  - `T`: Toggle Theme (Light/Dark)
  - `N`: Toggle Speaker Notes Drawer
  - `G`: Toggle Slide Thumbnail Grid Drawer
  - `F`: Fullscreen Presentation Mode
  - `Esc`: Exit Fullscreen / Close Drawers
- **Slide Thumbnail Grid Drawer**: Instant visual navigation across all 8 slides.
- **High-Resolution Image Zoom Modal**: Click any slide graphic to inspect architectural diagrams in full fidelity.

---

## 3. Quick Launch

To launch the presentation locally on port `8888`:
```bash
./specs/agent-architecture/start_presentation.sh
```
