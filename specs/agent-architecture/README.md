# Enterprise Multi-Agent Architecture & Agent Engine Presentation Deck

Interactive executive and technical presentation deck covering the **GCP Multi-Agent Marketing Platform** architecture, ADK orchestration, BigQuery NL2SQL analytics, product recommendation pipelines, A2UI personalization engine, skills standard, Model Armor security, and OpenTelemetry observability.

---

## Slide Deck Overview

1. **Slide 1**: Enterprise Multi-Agent Architecture & Agent Engine Ecosystem (`01_agent_architecture_title.jpg`)
2. **Slide 2**: Intelligent Orchestration & A2A Routing Supervisor (`02_orchestration_a2a_routing.jpg`)
3. **Slide 3**: Customer Analytics Agent & BigQuery NL2SQL Tool (`03_analytics_bigquery_nl2sql.jpg`)
4. **Slide 4**: Product Recommendation Pipeline & Merchandising Skill (`04_recommendation_pipeline.jpg`)
5. **Slide 5**: A2UI Personalization & Interactive Deal Engine (`05_a2ui_personalization_engine.jpg`)
6. **Slide 6**: Omnichannel Strategy & Brand Voice Content Pipelines (`06_strategy_and_content_pipelines.jpg`)
7. **Slide 7**: Enterprise Skills Architecture & Agent Registry (`07_skills_and_agent_registry.jpg`)
8. **Slide 8**: Governed Gateway, Model Armor & Telemetry Observability (`08_gateway_security_observability.jpg`)

---

## Launching the Presentation

Run the start script from the repository root:

```bash
./specs/agent-architecture/start_presentation.sh
```

Or run Python's HTTP server directly:

```bash
python3 -m http.server 8087 --directory specs/agent-architecture
```

Navigate to **`http://localhost:8087`** in your browser.

---

## Keyboard Controls

| Key | Action |
|:---:|---|
| `→` / `Space` / `PageDown` | Next Slide |
| `←` / `PageUp` | Previous Slide |
| `Home` | Jump to First Slide |
| `End` | Jump to Last Slide |
| `T` | Toggle Light / Dark Theme |
| `F` | Toggle Fullscreen Mode |
| `Z` | Zoom / Lightbox Image View |
| `Esc` | Close Lightbox / Exit Fullscreen |
