# Technical Specification (SPEC) — GCP Multi-Agent Observability Platform

## 1. System Architecture & Component Topology

The Observability Platform operates as a standalone microservice stack alongside the primary multi-agent marketing application:

```
                                  +--------------------------------------------------+
                                  |                 React Frontend                   |
                                  |     (Vite + React 18 + Lucide Icons, Port 3001)   |
                                  +------------------------+-------------------------+
                                                           |
                                                           v  (REST JSON / CORS)
+----------------------------------------------------------------------------------------------------+
|                                    FastAPI Backend (Port 8081)                                      |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                  app.py (REST API Router)                                    |  |
|  +-------------------------------+------------------------------+-------------------------------+  |
|                                  |                              |                                  |
|                                  v                              v                                  v
|  +------------------------------------------------+  +----------------------+  +----------------+  |
|  |           TelemetryStore (Singleton)           |  |  QualityEvalEngine   |  | ADK Observ.    |  |
|  |  - Ingests GCS completion blobs                |  |  - Vertex AI GenAI   |  | Agent Runtime  |  |
|  |  - Local snapshot caching (<2ms)               |  |  - Gemini 2.5 Flash  |  | - Reasoning    |  |
|  |  - 7-dimension error clustering                |  |  - 4 Rubric Judges   |  |   Engine App   |  |
|  |  - Contiguous OpenTelemetry span builder       |  |  - Scenario Gen      |  | - Telemetry    |  |
|  +-----------------------+------------------------+  +----------+-----------+  |   Analysis     |  |
|                          |                                      |              |   Skill        |  |
|                          v                                      v              +----------------+  |
|  +------------------------------------------------+  +----------------------+                      |
|  | telemetry_snapshot_cache.json (Local Snapshot) |  | Vertex AI Gemini API |                      |
|  +------------------------------------------------+  +----------------------+                      |
|                          ^                                                                         |
+--------------------------|-------------------------------------------------------------------------+
                           | (Live Sync via POST /api/obs/sync)
                           |
+--------------------------+------------------------+
| Google Cloud Storage Completions Bucket           |
| gs://agent-demo-09-agent-platform-logs/completions|
+---------------------------------------------------+
```

---

## 2. Core Backend Data Models (Python / Pydantic / Dataclasses)

### 2.1 `SpanRecord`
Represents an individual OpenTelemetry span within a conversation turn.
```python
@dataclass
class SpanRecord:
    span_id: str
    parent_span_id: Optional[str]
    name: str  # invoke_workflow, check_prompt_guardrail, route_intent, invoke_agent, call_llm, execute_tool, format_structured_output, finalize_response
    agent_name: str  # marketing_orchestrator, analytics_agent, recommendation_pipeline, a2ui_pipeline, strategy_pipeline, content_pipeline, model_armor
    start_time_ms: int
    duration_ms: int
    status: str = "OK"  # "OK" | "ERROR"
    attributes: Dict[str, Any] = field(default_factory=dict)
```

### 2.2 `ConversationTurn`
Represents a single exchange between user and multi-agent system.
```python
@dataclass
class ConversationTurn:
    turn_id: str
    user_prompt: str
    agent_response: str
    routed_agents: List[str]
    tools_executed: List[Dict[str, Any]]
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    latency_ms: int
    quality_score: float
    task_success: bool = True
    grounding_score: float = 95.0
    tool_use_score: float = 95.0
    brand_voice_score: float = 95.0
    spans: List[SpanRecord] = field(default_factory=list)
```

### 2.3 `ConversationSession`
Represents a complete multi-turn conversation session.
```python
@dataclass
class ConversationSession:
    session_id: str
    tenant_id: str  # "crazy_fashion" | "ica_sweden"
    client_name: str  # "Crazy Fashion" | "ICA Sverige"
    user_id: str
    started_at: str  # ISO 8601
    updated_at: str  # ISO 8601
    turns: List[ConversationTurn] = field(default_factory=list)
    overall_quality_score: float = 95.0
    has_errors: bool = False
    error_message: Optional[str] = None
    tags: List[str] = field(default_factory=list)
```

### 2.4 `ErrorCluster`
Represents a grouped problem cluster across the 7 enterprise failure dimensions.
```python
@dataclass
class ErrorCluster:
    cluster_id: str
    tenant_id: str
    client_name: str
    category: str  # DATA_HALLUCINATION_DRIFT, ROUTING_DELEGATION_LOOP, EMPTY_TOOL_HANDOFF, etc.
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    status: str  # OPEN, INVESTIGATING, RESOLVED
    cluster_name: str
    error_signature: str
    affected_agent: str
    first_seen: str
    last_seen: str
    total_occurrences: int
    root_cause_diagnostic: str
    adk_remediation: str
    sample_sessions: List[str]
    notes: List[Dict[str, str]] = field(default_factory=list)
```

---

## 3. REST API Specification

### 3.1 Service Health
- **`GET /api/health`**
  - **Response `200 OK`**:
    ```json
    {
      "status": "ok",
      "service": "observability_backend",
      "version": "1.0.0"
    }
    ```

### 3.2 Telemetry & Global Metrics
- **`GET /api/obs/overview`**
  - **Description**: Returns global fleet KPIs, SLA metrics, radar dimensions, and tenant comparisons.
  - **Response `200 OK`**:
    ```json
    {
      "global_quality_score": 96.4,
      "task_completion_rate": 97.8,
      "grounding_faithfulness": 97.1,
      "hallucination_rate": 0.8,
      "average_latency_ms": 2140,
      "total_analyzed_turns": 49,
      "total_active_sessions": 49,
      "total_tokens_consumed": 98450,
      "open_triage_issues": 6,
      "error_rate_percentage": 1.4,
      "radar_health_dimensions": {
        "tool_use_accuracy": 97.2,
        "grounding_faithfulness": 97.1,
        "brand_voice_adherence": 96.8,
        "task_completion": 97.8,
        "latency_sla_health": 93.5
      },
      "failure_taxonomy_distribution": [
        {"category": "DATA_HALLUCINATION_DRIFT", "label": "Grounding & Data Drift", "count": 2, "percentage": 25.0},
        {"category": "ROUTING_DELEGATION_LOOP", "label": "Routing Delegation Loop", "count": 1, "percentage": 12.5}
      ],
      "tenant_comparison": {
        "crazy_fashion": {
          "client_name": "Crazy Fashion",
          "currency": "EUR",
          "sessions_count": 28,
          "quality_score": 96.8,
          "avg_latency_ms": 2080,
          "error_count": 3
        },
        "ica_sweden": {
          "client_name": "ICA Sverige",
          "currency": "SEK",
          "sessions_count": 21,
          "quality_score": 95.9,
          "avg_latency_ms": 2220,
          "error_count": 3
        }
      }
    }
    ```

- **`POST /api/obs/sync`**
  - **Description**: Triggers on-demand polling against GCS completions bucket.
  - **Response `200 OK`**:
    ```json
    {
      "status": "success",
      "synced_files": 12,
      "new_sessions_added": 4,
      "total_sessions": 49,
      "message": "Successfully synchronized live GCP completion traces."
    }
    ```

### 3.3 Error Triage & Problem Matrix
- **`GET /api/obs/triage`** / **`GET /api/obs/clusters`**
  - **Query Parameters**:
    - `status` (optional): `OPEN`, `INVESTIGATING`, `RESOLVED`
    - `category` (optional): Filter by failure category
  - **Response `200 OK`**: Array of `ErrorCluster` objects.

- **`POST /api/obs/triage/{cluster_id}/status`**
  - **Request Body**:
    ```json
    {
      "status": "INVESTIGATING",
      "note": "Prompt schema constraint added to brand-voice-craft.",
      "author": "Henrik (AI Platform Lead)"
    }
    ```
  - **Response `200 OK`**: Updated `ErrorCluster` object.

### 3.4 Conversation Sessions & Waterfall Spans
- **`GET /api/obs/sessions`**
  - **Query Parameters**:
    - `tenant_id` (optional): `crazy_fashion` | `ica_sweden`
    - `agent_name` (optional): `marketing_orchestrator`, `analytics_agent`, etc.
    - `limit` (default: 100)
  - **Response `200 OK`**: Array of session summaries.

- **`GET /api/obs/sessions/{session_id}`**
  - **Response `200 OK`**: Detailed `ConversationSession` object including turns and `spans` array.

### 3.5 Agent Fleet Profiling
- **`GET /api/obs/agents`**
  - **Response `200 OK`**:
    ```json
    [
      {
        "agent_id": "marketing_orchestrator",
        "agent_name": "Marketing Orchestrator",
        "description": "Root Supervisor & Routing",
        "color": "#4f46e5",
        "call_count": 49,
        "p50_latency_ms": 320,
        "p90_latency_ms": 480,
        "p99_latency_ms": 720,
        "avg_tokens": 1450,
        "error_rate_pct": 0.8,
        "sla_status": "HEALTHY"
      }
    ]
    ```

### 3.6 Evaluation Suite Endpoints
- **`POST /api/obs/eval/generate-scenarios`**
  - **Request Body**: `{"tenant_id": "ica_sweden", "count": 4}`
  - **Response `200 OK`**: Array of `{"id": "...", "name": "...", "desc": "..."}`.

- **`POST /api/obs/eval/generate-suite`**
  - **Request Body**: `{"scenario_theme": "curated_5item_assortment", "tenant_id": "ica_sweden", "count": 4}`
  - **Response `200 OK`**: `{"scenario_id": "...", "test_cases": [...]}`.

- **`POST /api/obs/eval/batch`**
  - **Request Body**: `{"test_cases": [...], "tenant_id": "ica_sweden"}`
  - **Response `200 OK`**: Batch verdict summary with pass rate, rubric scores, and evaluated cases.

- **`POST /api/obs/chat`**
  - **Request Body**: `{"message": "What open errors do we have?", "conversation_history": []}`
  - **Response `200 OK`**: `{"response": "...", "tools_executed": [...]}`.

---

## 4. State Management & Ingestion Strategy

```
1. Server Boot
   └── Check telemetry_snapshot_cache.json
       ├── Found -> Load 49 sessions in < 2ms
       └── Not Found -> Connect to GCS bucket -> Ingest blobs -> Write snapshot cache

2. User Dispatches Live Query to Marketing Agent
   └── Vertex AI Reasoning Engine writes completion blob to GCS

3. User Clicks "Sync GCP Telemetry"
   └── Backend polls GCS bucket for new blobs
   └── Parses prompt & response payloads
   └── Derives deterministic latency, tokens, and sequential OpenTelemetry spans
   └── Updates in-memory sessions & rewrites telemetry_snapshot_cache.json
   └── Returns incremental sync count to frontend
```
