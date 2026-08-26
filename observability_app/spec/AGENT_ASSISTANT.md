# In-App AI Observability Assistant (AGENT_ASSISTANT) — GCP Multi-Agent Observability Platform

## 1. Overview & Architecture

The **AI Observability Assistant** is an autonomous Google ADK agent running inside the observability platform. It allows engineers, platform leads, and evaluators to interact with telemetry, error clusters, and waterfall traces using natural language.

```
+------------------------------------------------------------------------------------+
|                         React Frontend Chat Overlay                                 |
|                         (ObservabilityAssistantChat.jsx)                           |
+------------------------------------------+-----------------------------------------+
                                           |
                                           v  (POST /api/obs/chat)
+------------------------------------------------------------------------------------+
|                         ADK Observability Agent (`observability_ai_assistant`)     |
|                         Model: Vertex AI Gemini 3.6 Flash / 2.5 Flash              |
|                                                                                    |
|  +------------------------------------------------------------------------------+  |
|  | Skill: telemetry-analysis (agent/skills/telemetry-analysis/SKILL.md)         |  |
|  +------------------------------------------------------------------------------+  |
|                                          |                                         |
|                                          v (Function Tool Calls)                   |
|  +------------------------------------------------------------------------------+  |
|  | 1. get_fleet_health_overview()     4. get_agent_metrics()                    |  |
|  | 2. get_error_clusters()            5. run_live_quality_eval()                |  |
|  | 3. get_conversation_trace()        6. update_cluster_triage()                 |  |
|  +---------------------------------------+--------------------------------------+  |
|                                          |                                         |
+------------------------------------------|-----------------------------------------+
                                           v
+------------------------------------------------------------------------------------+
|                         TelemetryStore & QualityEvalEngine                         |
+------------------------------------------------------------------------------------+
```

---

## 2. Skill Definition (`agent/skills/telemetry-analysis/SKILL.md`)

```yaml
---
name: telemetry-analysis
description: >
  Analyze agent execution telemetry, OpenTelemetry waterfall spans, error clusters,
  response quality evaluations, and per-agent latency/token efficiency across GCP Multi-Agent Platform.
---
```

### Skill Instructions:
1. **Fleet Health Diagnostics**: Inspect global Quality Score (target > 95%), Goal Completion Rate (> 97%), and Error Rate (< 2.0%). Compare tenant metrics between `crazy_fashion` and `ica_sweden`.
2. **Error Triage & Root Cause Analysis**: Group and prioritize issues by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) across the 7 enterprise failure dimensions.
3. **Trace Waterfall Inspection**: Trace span hierarchies from `invoke_workflow` down to `invoke_agent`, `call_llm`, and `execute_tool` to pinpoint latency spikes and failed tool payloads.
4. **Quality Evaluation**: Run live LLM rubrics on prompt-response pairs and recommend prompt optimizations.

---

## 3. ADK Tool Implementations

### 3.1 `get_fleet_health_overview() -> str`
Retrieves global KPIs, 5-axis health radar dimensions, tenant comparison metrics, and overall SLA adherence.

### 3.2 `get_error_clusters(status: Optional[str], category: Optional[str]) -> str`
Retrieves grouped error clusters with error signatures, root cause diagnostics, sample session IDs, and ADK remediations.

### 3.3 `get_conversation_trace(session_id: str) -> str`
Retrieves full conversation turns, prompt/response text, and OpenTelemetry waterfall spans (`invoke_workflow`, `check_prompt_guardrail`, `invoke_agent`, `call_llm`, `execute_tool`) for a specific session ID.

### 3.4 `get_agent_metrics() -> str`
Retrieves p50, p90, and p99 latency distributions, invocation counts, token overhead, and error percentages across all 6 fleet agents.

### 3.5 `run_live_quality_eval(user_prompt: str, agent_response: str, tenant_id: str) -> str`
Executes automated Vertex AI `gemini-2.5-flash` LLM judges on a prompt-response pair, returning scores for *Task Completion*, *Grounding*, *Tool Use*, and *Brand Voice*.

### 3.6 `update_cluster_triage(cluster_id: str, status: str, note: Optional[str]) -> str`
Updates the operational status of an error cluster (`OPEN`, `INVESTIGATING`, `RESOLVED`) and records an audit log note with timestamp and author.

---

## 4. Frontend Chat Overlay Experience (`ObservabilityAssistantChat.jsx`)

### Key Interaction Features:
1. **Floating Trigger Button**: Positioned at bottom-right (`position: fixed; bottom: 2rem; right: 2rem; z-index: 1000`) with vibrant indigo glow and `✨ AI Assistant` label.
2. **Full-Screen Expand Toggle**: Maximize / minimize button (`Maximize2` / `Minimize2`) to expand the chat overlay into a focused full-screen investigation window.
3. **Multi-Step Reasoning Indicator**: Animates real-time diagnostic thought progression:
   - *"Analyzing prompt intent & loading telemetry-analysis skill..."*
   - *"Querying BigQuery traces & 7-dimension error clusters..."*
   - *"Evaluating agent latencies & synthesizing diagnostic report..."*
4. **Quick Prompt Steerers**: 4 one-click starter questions:
   - *"What open problem clusters do we currently have?"*
   - *"What is our global fleet quality score and SLA latency?"*
   - *"Which agent has the highest latency and why?"*
   - *"How does Crazy Fashion compare with ICA Sverige?"*
5. **Rich Markdown & Tool Badges**: Formatted tables, collapsible tool execution badges, and syntax-highlighted SQL statements.
