#!/usr/bin/env python3
from google.cloud import bigquery


def create_agent_events_view():
    client = bigquery.Client(project="agent-demo-09", location="US")

    sql = r"""
CREATE OR REPLACE VIEW `agent-demo-09.agent_analytics.agent_events_v2` AS
WITH trace_spans AS (
  SELECT
    span_id AS event_id,
    start_time AS timestamp,
    end_time AS receive_timestamp,
    'opentelemetry_span' AS resource_type,
    COALESCE(
      JSON_VALUE(attributes['gen_ai.conversation.id']),
      JSON_VALUE(attributes['gcp.vertex.agent.session_id']),
      JSON_VALUE(attributes['session_id']),
      'session-default'
    ) AS session_id,
    COALESCE(
      JSON_VALUE(attributes['enduser.id']),
      JSON_VALUE(attributes['user_id']),
      'user-123'
    ) AS user_id,
    COALESCE(
      JSON_VALUE(attributes['gen_ai.agent.name']),
      JSON_VALUE(attributes['agent_name']),
      'marketing_orchestrator'
    ) AS agent_name,
    CASE
      WHEN name LIKE '%llm%' OR name LIKE '%generate%' THEN 'MODEL_CALLING'
      WHEN name LIKE '%tool%' OR name LIKE '%query%' THEN 'TOOL_EXECUTION'
      WHEN name LIKE '%workflow%' OR name LIKE '%agent%' THEN 'AGENT_DELEGATION'
      ELSE 'TRACE_SPAN'
    END AS event_type,
    name AS activity_name,
    JSON_VALUE(attributes['gen_ai.tool.name']) AS tool_name,
    COALESCE(
      JSON_VALUE(attributes['gen_ai.prompt']),
      JSON_VALUE(attributes['gcp.vertex.agent.llm_request'])
    ) AS user_prompt,
    COALESCE(
      JSON_VALUE(attributes['gen_ai.completion']),
      JSON_VALUE(attributes['gcp.vertex.agent.llm_response'])
    ) AS agent_response,
    REGEXP_EXTRACT(JSON_VALUE(attributes['db.statement']), r'(?i)(SELECT\s+.*)') AS sql_executed,
    TIMESTAMP_DIFF(end_time, start_time, MILLISECOND) AS latency_ms,
    SAFE_CAST(JSON_VALUE(attributes['gen_ai.usage.input_tokens']) AS INT64) AS input_tokens,
    SAFE_CAST(JSON_VALUE(attributes['gen_ai.usage.output_tokens']) AS INT64) AS output_tokens,
    CASE
      WHEN name LIKE '%analytics%' OR name LIKE '%query%' OR JSON_VALUE(attributes['gen_ai.tool.name']) LIKE '%bigquery%' THEN 'bigquery-customer-analytics'
      WHEN name LIKE '%strategy%' THEN 'campaign-framework'
      WHEN name LIKE '%content%' OR name LIKE '%brand%' THEN 'brand-voice-craft'
      ELSE 'omnichannel-orchestration'
    END AS skills_used,
    trace_id,
    span_id
  FROM `agent-demo-09.traceLink._AllSpans`
),
log_audit_events AS (
  SELECT
    insert_id AS event_id,
    timestamp,
    receive_timestamp,
    resource.type AS resource_type,
    COALESCE(
      JSON_VALUE(json_payload.session_id),
      REGEXP_EXTRACT(http_request.request_url, r'session_id=([^&]+)'),
      JSON_VALUE(labels.session_id),
      'session-default'
    ) AS session_id,
    COALESCE(
      JSON_VALUE(json_payload.user_id),
      proto_payload.audit_log.authentication_info.principal_email,
      'user-123'
    ) AS user_id,
    COALESCE(
      JSON_VALUE(json_payload.agent_name),
      JSON_VALUE(resource.labels.reasoning_engine_id),
      REGEXP_EXTRACT(proto_payload.audit_log.resource_name, r'agentGateways/([^/]+)'),
      REGEXP_EXTRACT(proto_payload.audit_log.resource_name, r'templates/([^/]+)'),
      'marketing_orchestrator'
    ) AS agent_name,
    CASE
      WHEN proto_payload.audit_log.method_name LIKE '%ModelArmor%' THEN 'MODEL_ARMOR_SAFETY'
      WHEN http_request.request_url LIKE '%/api/chat%' THEN 'USER_CHAT_REQUEST'
      WHEN proto_payload.audit_log.method_name LIKE '%InsertJob%' THEN 'BIGQUERY_SQL_QUERY'
      ELSE COALESCE(proto_payload.audit_log.method_name, JSON_VALUE(json_payload.event_type), 'AUDIT_EVENT')
    END AS event_type,
    proto_payload.audit_log.method_name AS activity_name,
    CAST(NULL AS STRING) AS tool_name,
    COALESCE(
      JSON_VALUE(json_payload.message),
      JSON_VALUE(json_payload.prompt),
      TO_JSON_STRING(proto_payload.audit_log.request)
    ) AS user_prompt,
    COALESCE(
      JSON_VALUE(json_payload.text),
      JSON_VALUE(json_payload.response),
      TO_JSON_STRING(proto_payload.audit_log.response)
    ) AS agent_response,
    CAST(NULL AS STRING) AS sql_executed,
    CAST(NULL AS INT64) AS latency_ms,
    CAST(NULL AS INT64) AS input_tokens,
    CAST(NULL AS INT64) AS output_tokens,
    CASE
      WHEN JSON_VALUE(json_payload.agent_name) = 'analytics_agent' THEN 'bigquery-customer-analytics'
      WHEN JSON_VALUE(json_payload.agent_name) = 'strategy_agent' THEN 'campaign-framework'
      WHEN JSON_VALUE(json_payload.agent_name) = 'content_agent' THEN 'brand-voice-craft'
      ELSE 'omnichannel-orchestration'
    END AS skills_used,
    trace AS trace_id,
    span_id
  FROM `agent-demo-09.defaultLink._AllLogs`
  WHERE proto_payload.audit_log.service_name IS NOT NULL
     OR log_name LIKE '%modelarmor%'
     OR http_request.request_url LIKE '%/api/chat%'
)
SELECT * FROM trace_spans
UNION ALL
SELECT * FROM log_audit_events
"""
    query_job = client.query(sql, location="US")
    query_job.result()
    print("✅ Created agent_events_v2 view with activity_name, user_prompt, agent_response, and token metrics!")

if __name__ == "__main__":
    create_agent_events_view()
