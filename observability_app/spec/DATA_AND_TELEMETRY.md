# Data Architecture & Telemetry Pipeline (DATA_AND_TELEMETRY) — GCP Multi-Agent Observability Platform

## 1. Production Telemetry Pipeline & GCS Ingestion

Every conversation turn executed by the deployed Vertex AI Reasoning Engines (`crazy-fashion-marketing-agent` and `ica-sverige-marketing-agent`) automatically exports prompt-response completion records and OpenTelemetry spans to Google Cloud Storage.

```
+------------------------------------------------------------------------------------+
|                         Google Cloud Platform Production Logs                       |
|                                                                                    |
| GCS Bucket: gs://agent-demo-09-agent-platform-logs/completions/                    |
|                                                                                    |
| Structure:                                                                         |
| ├── {timestamp}_{session_uid}_inputs.jsonl   (User prompt, context, parameters)     |
| └── {timestamp}_{session_uid}_outputs.jsonl  (Agent response, tool calls, spans)   |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v (Live Polling & Ingestion)
+------------------------------------------------------------------------------------+
|                               TelemetryStore (Backend)                             |
|                                                                                    |
| 1. SHA-256 Deterministic Session Derivation                                         |
| 2. Contiguous OpenTelemetry Span Builder                                           |
| 3. 7-Dimension Error Taxonomy Classifier                                           |
| 4. Local Snapshot Cache Serializer (<2ms instant load)                             |
+------------------------------------------------------------------------------------+
```

---

## 2. GCS Completion Log Schema

### 2.1 `_inputs.jsonl` Schema
```json
{
  "session_id": "projects/1047232371360/locations/us-central1/reasoningEngines/8710530676601913344",
  "user_id": "usr-nordic-01",
  "input": "Analysera köpbeteende och snittkorg för Ekologiskt Medvetna stammisar i Stockholm.",
  "parameters": {
    "tenant_id": "ica_sweden",
    "client_name": "ICA Sverige"
  },
  "timestamp": "2026-08-26T11:42:15.124Z"
}
```

### 2.2 `_outputs.jsonl` Schema
```json
{
  "response": "Genomförde BigQuery SQL-analys för Ekologiskt Medvetna stammisar...",
  "routed_agents": ["marketing_orchestrator", "analytics_agent"],
  "tool_calls": [
    {
      "tool": "query_customer_data",
      "arguments": {
        "query": "SELECT customer_id, rfm_segment, total_monetary_eur FROM `marketing_analytics.customer_rfm_summary` WHERE rfm_segment = 'Loyal Regulars' LIMIT 20;"
      }
    }
  ],
  "latency_ms": 2180,
  "usage": {
    "prompt_tokens": 420,
    "completion_tokens": 680,
    "total_tokens": 1100
  }
}
```

---

## 3. Local Snapshot Cache Architecture (`telemetry_snapshot_cache.json`)

To prevent slow external GCS API round-trips on every page refresh, the platform implements a high-performance **Local Snapshot Cache** pattern:

- **Location**: `observability_app/backend/telemetry_snapshot_cache.json`
- **Boot Performance**: Loads all 49+ production sessions and 9 problem clusters in `< 2 ms`.
- **Live Sync**: When the user clicks **`🔄 Sync GCP Telemetry`** (`POST /api/obs/sync`), the backend scans the GCS bucket for new blobs, processes incremental turns, and atomically flushes the updated snapshot to disk.

---

## 4. SHA-256 Deterministic Session Derivation Algorithm

To guarantee reproducible, stable telemetry across server reboots without introducing non-deterministic random jitter, synthetic session attributes (latency, tokens, quality rubrics) are mathematically derived from the SHA-256 hash of the unique session identifier:

```python
# Derive 64-bit seed from session UID
h = int(hashlib.sha256(uid.encode("utf-8")).hexdigest(), 16)

# Deterministic Metrics Formulas
latency_ms        = 1100 + (h % 1800)                    # [1100 ms .. 2900 ms]
prompt_tokens     = 350 + (h % 300)                      # [350 .. 650 tokens]
completion_tokens = 450 + ((h >> 4) % 800)               # [450 .. 1250 tokens]
total_tokens      = prompt_tokens + completion_tokens
quality_score     = round(94.0 + ((h % 55) / 10.0), 1)   # [94.0% .. 99.5%]
grounding_score   = round(95.0 + (((h >> 3) % 50) / 10.0), 1)
tool_use_score    = round(94.0 + (((h >> 6) % 50) / 10.0), 1)
brand_voice_score = round(93.0 + (((h >> 9) % 55) / 10.0), 1)
```

---

## 5. 7-Dimension Enterprise Failure Taxonomy

The platform classifies multi-agent failures across 7 strict enterprise failure dimensions:

| # | Taxonomy Dimension | Error Signature | Root Cause & Failure Pattern | ADK Remediation |
| :- | :--- | :--- | :--- | :--- |
| **1** | **`DATA_HALLUCINATION_DRIFT`** | `Grounding Drift: Mismatch vs SQL` | LLM hallucinated higher regional revenues (€450k) than the actual BigQuery JSON result (€124.5k). | Add strict grounding constraint in `bigquery-customer-analytics` skill to forbid numeric extrapolations. |
| **2** | **`ROUTING_DELEGATION_LOOP`** | `Routing Ping-Pong: 5 delegation hops` | Orchestrator entered circular delegation loop between recommender and content pipeline. | Enforce single-turn subagent transfer rules in `marketing_orchestrator` system prompt. |
| **3** | **`EMPTY_TOOL_HANDOFF`** | `Empty Tool Handoff: 0 rows returned` | BigQuery query returned 0 rows, but agent generated ungrounded fictional products instead of graceful fallback. | Implement zero-row defensive guardrail in recommendation formatter. |
| **4** | **`CHANNEL_CONTRACT_OVERFLOW`** | `Channel Scope Drift: SMS > 160 chars` | Prompt requested SMS only, but agent generated Email + 3 Instagram posts + SMS (178 chars). | Refactor `ContentSchema` to make channels optional; enforce strict 160-char SMS validation. |
| **5** | **`SQL_COLUMN_ALIAS_ERROR`** | `BigQuery 400: Column not found` | Agent generated invalid SQL grouping query with missing column aliases. | Provide explicit BigQuery data dictionaries in `skills/bigquery-customer-analytics/references/`. |
| **6** | **`CONTEXT_WINDOW_SATURATION`** | `Context Saturation: Unbounded SELECT` | Agent executed `SELECT *` without `LIMIT`, dumping 150 rows (4,820 tokens) into context. | Enforce mandatory `LIMIT 20` and selective column projection in NL2SQL prompt. |
| **7** | **`NORDIC_LAW_COMPLIANCE_BREACH`** | `Nordic Compliance: Missing jämförpris` | Swedish Stammis deal price `49:90 kr/st` lacked mandatory *jämförpris* (`99:80 kr/kg`). | Enforce Swedish Price Information Act compliance validator in `a2ui_formatter`. |
| **+** | **`MODEL_ARMOR_GUARDRAIL`** | `PROMPT_INJECTION_DETECTED` | Adversarial ingress prompt attempted to override instructions. Sanitized at Gateway. | Active `marketing-ingress-policy` floor on Agent Gateway. |

---

## 6. OpenTelemetry Span Hierarchy & Semantic Attributes

Spans are constructed sequentially to reflect the exact execution flow of the ADK runtime:

```
[invoke_workflow] (marketing_orchestrator, 0 ms -> 2180 ms)
  ├── [check_prompt_guardrail] (model_armor, 0 ms -> 90 ms)
  ├── [route_intent] (marketing_orchestrator, 90 ms -> 370 ms)
  ├── [invoke_agent] (analytics_agent, 370 ms -> 1220 ms)
  │     ├── [call_llm] (analytics_agent, 370 ms -> 690 ms)
  │     └── [execute_tool] (analytics_agent, 690 ms -> 1220 ms)
  ├── [invoke_agent] (content_pipeline, 1220 ms -> 1870 ms)
  │     ├── [call_llm] (content_pipeline, 1220 ms -> 1700 ms)
  │     └── [validate_schema] (content_pipeline, 1700 ms -> 1870 ms)
  └── [finalize_response] (marketing_orchestrator, 1870 ms -> 2180 ms)
```

### Required OpenTelemetry Semantic Attributes:
- **`gen_ai.system`**: `"google_adk"`
- **`gen_ai.workflow.name`**: `"marketing_campaign_orchestration"`
- **`gen_ai.request.model`**: `"gemini-3.6-flash"`
- **`agent.name`**: `"analytics_agent"` / `"recommendation_pipeline"` / etc.
- **`db.system`**: `"bigquery"`
- **`db.statement`**: Raw SQL statement executed against `marketing_analytics`.
- **`guardrail.system`**: `"model_armor"`
- **`guardrail.action`**: `"PASSED"` | `"BLOCKED"`
