# System & UI/UX Design Architecture (DESIGN.md)
## GCP Multi-Agent Marketing Platform

---

## 1. High-Level Architecture Topology

The application follows a decoupled multi-agent topology powered by FastAPI, React, BigQuery, and Google Agent Development Kit (ADK) using Agent-to-Agent (A2A) protocol.

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|    Light/Dark Mode Theme | Chat & A2A Visualizer | BigQuery Inspector    |
+------------------------------------+------------------------------------+
                                     | (REST HTTP JSON)
                                     v
+-------------------------------------------------------------------------+
|                             FASTAPI BACKEND                             |
|                        (backend/app.py Port 8080)                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        ORCHESTRATOR SUPERVISOR                          |
|         Model Armor Protection | Dynamic Intent Classifier             |
+-----+------------------------------+------------------------------+-----+
      |                              |                              |
      | (A2A Protocol)               | (A2A Protocol)               | (A2A Protocol)
      v                              v                              v
+------------------+         +------------------+         +------------------+
| Analytics Agent  |         |  Strategy Agent  |         |  Content Agent   |
| (bq_analytics)   |         | (omnichannel_str)|         |  (brand_voice)   |
+--------+---------+         +------------------+         +------------------+
         |
         v
+-------------------------------------------------------------------------+
|                             GOOGLE BIGQUERY                             |
|                     (agent-demo-09:marketing_analytics)                 |
+-------------------------------------------------------------------------+
```

---

## 2. Multi-Agent Design & A2A Protocol

### 2.1 Supervisor & Intent Classifier
The **Orchestrator Agent** ([agents/orchestrator_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/orchestrator_agent.py)) intercepts all incoming requests:
1. **Security Inspection**: Invokes `validate_prompt(user_prompt)` through Model Armor.
2. **Intent Classification**: Evaluates user prompt semantics against 3 rules:
   - `ANALYTICS_ONLY`: Intent patterns asking for counts, totals, segment summaries, or raw data queries.
   - `STRATEGY_ONLY`: Prompts requesting strategy, channel allocation, or ROI without copy assets.
   - `FULL_CAMPAIGN`: General marketing campaign goals requiring end-to-end strategy and content generation.

### 2.2 Subagent Responsibilities
- **Analytics Agent** ([agents/analytics_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/analytics_agent.py)): Queries BigQuery tables `customer_rfm_summary` and `customer_demographics_360` via `BigQueryClient`.
- **Strategy Agent** ([agents/strategy_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/strategy_agent.py)): Constructs campaign frameworks, target messaging matrix, and ROI projections.
- **Content Agent** ([agents/content_agent.py](file:///Users/henrikw/Projects/agent_platform_demo/agents/content_agent.py)): Drafts subject lines, email templates, and ad copy aligned with brand voice.

---

## 3. UI/UX Design System & Theme Engine

### 3.1 Design System Tokens (`index.css`)
The UI utilizes CSS custom properties for instant light/dark theme switching without Tailwind compilation overhead.

```css
:root, [data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.85);
  --color-primary: #2563eb;
  --text-main: #0f172a;
  --code-bg: rgba(226, 232, 240, 0.85);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

[data-theme="dark"] {
  --bg-primary: #090b10;
  --bg-secondary: #111520;
  --bg-card: rgba(18, 23, 37, 0.75);
  --color-primary: #4285f4;
  --text-main: #f8fafc;
  --code-bg: rgba(0, 0, 0, 0.3);
}
```

### 3.2 Formatting Engine & Collapsible SQL Accordion
In [frontend/src/components/ChatInterface.jsx](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx), markdown responses pass through `formatMarkdownText()` and `dedentCode()`:

- **Triple Backtick Code Blocks**: Parsed and wrapped inside an HTML5 `<details><summary>` element.
- **Accordion Summary**: `🔍 View Executed BigQuery SQL Query` (styled with `var(--color-primary)` and `var(--chip-bg)`).
- **Code Block Styling**: Left-aligned, `var(--font-mono)`, `var(--code-bg)` container with horizontal scroll handling.

### 3.3 Selective Container Rendering
Response cards for Strategy and Content assets only render when their data payload contains valid entries:
```jsx
{msg.data?.strategy && Object.keys(msg.data.strategy).length > 0 && (
  <StrategyCard data={msg.data.strategy} />
)}
```
This guarantees data-only queries render cleanly without empty or placeholder card containers.
