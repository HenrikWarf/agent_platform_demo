---
name: telemetry-analysis
description: >
  Analyze agent execution telemetry, OpenTelemetry waterfall spans, error clusters,
  response quality evaluations, and per-agent latency/token efficiency across GCP Multi-Agent Platform.
---

# Telemetry Analysis & Quality Triage Skill

## Purpose
Enables the Observability Agent to diagnose multi-agent fleet health, inspect conversation session traces, triage BigQuery/schema/routing errors, and evaluate response quality for Crazy Fashion and ICA Sverige.

## Key Procedures

### 1. Fleet Health & KPI Diagnostics
- Always start by checking global metrics: Quality Score (target > 95%), Goal Completion Rate (> 97%), Hallucination Index (< 1.5%), and Error Rate (< 2.0%).
- Compare tenant metrics between `crazy_fashion` and `ica_sweden`.

### 2. Error Triage & Root Cause Analysis
- Review issues categorized under:
  - `SQL_SYNTAX_OR_EXECUTION_ERROR`: BigQuery syntax/join errors.
  - `SCHEMA_PARSE_ERROR`: Pydantic validation or length limit breaches.
  - `ROUTING_MISCLASSIFICATION`: Subagent delegation anomalies.
  - `LATENCY_SPIKE`: Turns exceeding p90 SLA threshold (> 3,500ms).
  - `GUARDRAIL_TRIGGER`: Model Armor floor trips.
- Help engineers prioritize by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

### 3. Conversation Waterfall Trace Inspection
- Trace span hierarchies from `invoke_workflow` down to `invoke_agent`, `call_llm`, and `execute_tool`.
- Spot bottlenecks where `execute_tool` or `call_llm` consumed excessive latency.

### 4. Quality Evaluation & Prompt Optimization
- Evaluate turns on:
  1. `task_success`
  2. `grounding_faithfulness`
  3. `tool_use_quality`
  4. `brand_voice_adherence`
- Recommend targeted prompt optimizations using GEPA patterns.
