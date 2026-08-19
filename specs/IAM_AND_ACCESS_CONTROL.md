# IAM & Access Control — GCP Agent Platform

> **Project:** `agent-demo-09` · **Project Number:** `1047232371360` · **Region:** `us-central1`  
> **Last Updated:** 2026-08-19

---

## Table of Contents

1. [Service Identity Overview](#1-service-identity-overview)
2. [Agent Identity (Reasoning Engine)](#2-agent-identity-reasoning-engine)
3. [Application Service Account](#3-application-service-account)
4. [Google-Managed Service Agents](#4-google-managed-service-agents)
5. [Default Compute Service Account](#5-default-compute-service-account)
6. [Cloud Build Service Account](#6-cloud-build-service-account)
7. [Cross-Project Access](#7-cross-project-access)
8. [GCS Bucket Policies](#8-gcs-bucket-policies)
9. [Agent Gateway & Model Armor](#9-agent-gateway--model-armor)
10. [Enabled APIs](#10-enabled-apis)
11. [Environment Variables (Auth-Related)](#11-environment-variables-auth-related)
12. [Troubleshooting Reference](#12-troubleshooting-reference)

---

## 1. Service Identity Overview

The platform uses three tiers of identity:

| Tier | Identity | Used By |
|------|----------|---------|
| **Agent Identity** | `principal://agents.global.org-…/reasoningEngines/3829020106671783936` | Reasoning Engine container at runtime |
| **Application SA** | `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com` | Cloud Run Backend & Frontend |
| **Platform Service Agents** | `service-1047232371360@gcp-sa-*.iam.gserviceaccount.com` | Google-managed control plane SAs |

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│    Cloud Run Backend     │     │    Reasoning Engine (ADK)     │
│  agent-platform-sa@...   │────▶│  Agent Identity (principal)   │
│                          │     │  + RE Service Agent SA        │
└─────────────────────────┘     └──────────────────────────────┘
         │                                    │
         ▼                                    ▼
  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
  │  BigQuery    │    │Agent Registry│   │    GCS Logs  │
  └──────────────┘    └──────────────┘   └──────────────┘
```

---

## 2. Agent Identity (Reasoning Engine)

The **active** Reasoning Engine instance uses an **Agent Identity** principal — a workload identity specific to the RE container. This is distinct from traditional service accounts.

### Principal
```
principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936
```

### IAM Roles (Project-Level)

| Role | Purpose |
|------|---------|
| `roles/agentregistry.user` | Register/update agents in Agent Registry |
| `roles/agentregistry.viewer` | Read MCP server configs from Agent Registry |
| `roles/aiplatform.user` | Call Gemini models via Vertex AI |
| `roles/bigquery.admin` | Full BigQuery access (legacy, can be narrowed) |
| `roles/bigquery.dataEditor` | Write to BigQuery tables |
| `roles/bigquery.dataViewer` | Read BigQuery tables |
| `roles/bigquery.jobUser` | Execute BigQuery query jobs |
| `roles/mcp.toolUser` | Invoke MCP tools (BigQuery MCP server) |

### Platform-Wide Default Access
All Reasoning Engines in this project also receive:
```
principalSet://agents.global.org-481945953452.system.id.goog/attribute.platformContainer/aiplatform/projects/1047232371360
→ roles/aiplatform.agentDefaultAccess
```

> **Important:** The Agent Identity is NOT the same as the RE Service Agent SA (`service-…@gcp-sa-aiplatform-re`). The Agent Identity is a workload identity principal; the RE Service Agent SA is a Google-managed SA that provisions infrastructure. Both need appropriate roles.

---

## 3. Application Service Account

**Email:** `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`  
**Used By:** Cloud Run Backend, Cloud Run Frontend, CI/CD deploy operations

### IAM Roles (Project-Level)

| Role | Purpose |
|------|---------|
| **Agent Registry** | |
| `roles/agentregistry.editor` | Manage agent registrations |
| `roles/agentregistry.viewer` | Read agent/MCP server configs |
| **AI Platform** | |
| `roles/aiplatform.admin` | Deploy/manage Reasoning Engines |
| `roles/aiplatform.user` | Call Gemini models |
| **Artifact Registry** | |
| `roles/artifactregistry.writer` | Push container images |
| **BigQuery** | |
| `roles/bigquery.dataEditor` | Write to marketing_analytics tables |
| `roles/bigquery.dataViewer` | Read marketing_analytics tables |
| `roles/bigquery.jobUser` | Execute queries |
| **MCP** | |
| `roles/mcp.toolUser` | Invoke managed MCP tools |
| **Model Armor** | |
| `roles/modelarmor.user` | Sanitize prompts/responses |
| **Networking** | |
| `roles/networkservices.admin` | Manage Agent Gateway |
| **Observability** | |
| `roles/cloudtrace.agent` | Export trace spans |
| `roles/logging.admin` | Full logging access |
| `roles/logging.logWriter` | Write log entries |
| `roles/logging.viewAccessor` | Read log entries |
| `roles/monitoring.admin` | Full monitoring access |
| `roles/monitoring.metricWriter` | Write metrics |
| `roles/observability.admin` | Full observability suite access |
| **Storage** | |
| `roles/storage.admin` | Read/write GCS (logs bucket) |
| **IAM** | |
| `roles/iam.serviceAccountUser` | Impersonate other SAs (for deployment) |
| `roles/resourcemanager.projectIamAdmin` | Manage IAM bindings |
| **Cloud Run** | |
| `roles/run.admin` | Deploy Cloud Run services |

---

## 4. Google-Managed Service Agents

These are automatically created and managed by Google. They provide control-plane access for each service.

### Reasoning Engine Service Agent
**Email:** `service-1047232371360@gcp-sa-aiplatform-re.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/agentregistry.admin` | Manage agent registrations on behalf of RE |
| `roles/agentregistry.viewer` | Read MCP server configs for RE |
| `roles/aiplatform.reasoningEngineServiceAgent` | Core RE service agent role |
| `roles/aiplatform.user` | Call Gemini models for RE workloads |
| `roles/bigquery.dataViewer` | Read BigQuery data |
| `roles/bigquery.jobUser` | Execute BigQuery jobs |
| `roles/bigquery.user` | General BigQuery usage |
| `roles/logging.viewAccessor` | Read logs |
| `roles/mcp.toolUser` | Invoke MCP tools |
| `roles/modelarmor.calloutUser` | Model Armor callout integration |
| `roles/modelarmor.user` | Model Armor prompt/response sanitization |
| `roles/observability.admin` | Full observability access |

### Vertex AI Service Agent (P4SA)
**Email:** `service-1047232371360@gcp-sa-aiplatform.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/agentregistry.viewer` | Read agent configs |
| `roles/aiplatform.admin` | Full AI Platform management |
| `roles/aiplatform.serviceAgent` | Core Vertex AI service agent |
| `roles/bigquery.admin` | BigQuery management |
| `roles/bigquery.dataEditor` | Write BigQuery data |
| `roles/bigquery.dataViewer` | Read BigQuery data |
| `roles/bigquery.jobUser` | Execute BigQuery jobs |
| `roles/cloudtrace.agent` | Export traces |
| `roles/logging.logWriter` | Write logs |
| `roles/logging.viewAccessor` | Read logs |
| `roles/mcp.toolUser` | Invoke MCP tools |
| `roles/monitoring.admin` | Monitoring management |
| `roles/monitoring.metricWriter` | Write metrics |
| `roles/observability.admin` | Full observability |
| `roles/storage.admin` | GCS bucket access |

### Agent Gateway Service Agent
**Email:** `service-1047232371360@gcp-sa-agentgateway.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/agentgateway.serviceAgent` | Core Agent Gateway service agent |
| `roles/logging.logWriter` | Write gateway access logs |

### Discovery Engine Service Agent
**Email:** `service-1047232371360@gcp-sa-discoveryengine.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/agentregistry.user` | Agent Registry access |
| `roles/agentregistry.viewer` | Read agent configs |
| `roles/aiplatform.user` | Call Gemini models |
| `roles/bigquery.dataViewer` | Read BigQuery data |
| `roles/bigquery.user` | General BigQuery usage |
| `roles/discoveryengine.serviceAgent` | Core Discovery Engine service agent |
| `roles/mcp.toolUser` | Invoke MCP tools |

### Data Extension Processing (DEP) Service Agent
**Email:** `service-1047232371360@gcp-sa-dep.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/logging.viewAccessor` | Read logs |
| `roles/modelarmor.calloutUser` | Model Armor callouts |
| `roles/modelarmor.user` | Model Armor sanitization |
| `roles/observability.admin` | Observability access |
| `roles/serviceextensions.serviceAgent` | Service Extensions management |
| `roles/serviceusage.serviceUsageConsumer` | API usage quota |

### Other Service Agents

| Service Agent | Role |
|--------------|------|
| `@gcp-sa-aiplatform-cc` | `roles/aiplatform.customCodeServiceAgent` |
| `@gcp-sa-vertex-eval` | `roles/aiplatform.rapidevalServiceAgent` |
| `@gcp-sa-artifactregistry` | `roles/artifactregistry.serviceAgent` |
| `@gcp-sa-cloudaicompanion` | `roles/cloudaicompanion.serviceAgent` |
| `@gcp-sa-cloudbuild` | `roles/cloudbuild.serviceAgent` |
| `@gcp-sa-logging` | `roles/logging.serviceAgent` |
| `@gcp-sa-modelarmor` | `roles/modelarmor.serviceAgent` |
| `@gcp-sa-monitoring-notification` | `roles/monitoring.notificationServiceAgent` |
| `@gcp-sa-networkactions` | `roles/networkactions.serviceAgent` |
| `@gcp-sa-ns-authz` | `roles/networksecurity.authzServiceAgent` |
| `@gcp-sa-pubsub` | `roles/pubsub.serviceAgent` |
| `@containerregistry` | `roles/containerregistry.ServiceAgent` |
| `@serverless-robot-prod` | `roles/run.serviceAgent` |

---

## 5. Default Compute Service Account

**Email:** `1047232371360-compute@developer.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/agentregistry.viewer` | Read agent configs |
| `roles/aiplatform.admin` | AI Platform management |
| `roles/bigquery.admin` | BigQuery management |
| `roles/bigquery.dataEditor` | Write BigQuery data |
| `roles/bigquery.jobUser` | Execute BigQuery jobs |
| `roles/cloudtrace.agent` | Export traces |
| `roles/logging.logWriter` | Write logs |
| `roles/logging.viewAccessor` | Read logs |
| `roles/mcp.toolUser` | Invoke MCP tools |
| `roles/monitoring.admin` | Monitoring management |
| `roles/monitoring.metricWriter` | Write metrics |
| `roles/observability.admin` | Full observability |
| `roles/storage.admin` | GCS access |

> **Note:** The default compute SA has broad permissions inherited from early project setup. In production, prefer the dedicated `agent-platform-sa` account.

---

## 6. Cloud Build Service Account

**Email:** `1047232371360@cloudbuild.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/artifactregistry.admin` | Manage container images |
| `roles/artifactregistry.writer` | Push images to GAR |
| `roles/cloudbuild.builds.builder` | Execute Cloud Build steps |

---

## 7. Cross-Project Access

Two service agents from project `984884844367` have been granted `roles/aiplatform.user` in this project:

| Principal | Role |
|-----------|------|
| `service-984884844367@gcp-sa-aiplatform.iam.gserviceaccount.com` | `roles/aiplatform.user` |
| `service-984884844367@gcp-sa-discoveryengine.iam.gserviceaccount.com` | `roles/aiplatform.user` |

These enable cross-project Gemini Enterprise integration.

---

## 8. GCS Bucket Policies

### Logs Bucket: `gs://agent-demo-09-agent-platform-logs`

Purpose: Stores JSONL prompt-response completion logs from the Reasoning Engine.

| Role | Principal | Purpose |
|------|-----------|---------|
| `roles/storage.admin` | Agent Identity (RE 3829…) | Write completion logs |
| `roles/storage.admin` | `agent-platform-sa@…` | Admin access |
| `roles/storage.admin` | RE Service Agent SA | Infrastructure access |
| `roles/storage.admin` | Vertex AI P4SA | Infrastructure access |
| `roles/storage.objectViewer` | `cloud-aiplatform-api-robot-prod@…` | Online evaluation reads |
| `roles/storage.objectViewer` | Vertex AI P4SA | Console session viewer |

---

## 9. Agent Gateway & Model Armor

### Agent Gateway
**Resource:** `projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway`

| Property | Value |
|----------|-------|
| Protocols | `MCP` |
| Access Path | `CLIENT_TO_AGENT` (Google Managed) |
| Registry | `//agentregistry.googleapis.com/projects/agent-demo-09/locations/us-central1` |

The Agent Gateway enforces Model Armor security policies on all governed traffic. The `:streamQuery` endpoint routes through the gateway before reaching the Reasoning Engine.

### Model Armor

| Service Agent | Role |
|--------------|------|
| RE Service Agent | `roles/modelarmor.calloutUser`, `roles/modelarmor.user` |
| DEP Service Agent | `roles/modelarmor.calloutUser`, `roles/modelarmor.user` |
| Model Armor SA | `roles/modelarmor.serviceAgent` |

**Template:** `marketing-security-template` — PI/Jailbreak filter ENABLED.

---

## 10. Enabled APIs

The following APIs relevant to the platform are enabled:

| API | Purpose |
|-----|---------|
| `agentregistry.googleapis.com` | Agent Registry (MCP servers, agent registration) |
| `aiplatform.googleapis.com` | Vertex AI (Reasoning Engines, Gemini models) |
| `artifactregistry.googleapis.com` | Container image storage (GAR) |
| `bigquery.googleapis.com` | Customer analytics data warehouse |
| `bigqueryconnection.googleapis.com` | BigQuery external connections |
| `cloudtrace.googleapis.com` | Distributed tracing |
| `logging.googleapis.com` | Cloud Logging |
| `modelarmor.googleapis.com` | Prompt/response security screening |
| `monitoring.googleapis.com` | Cloud Monitoring |
| `networkservices.googleapis.com` | Agent Gateway infrastructure |
| `run.googleapis.com` | Cloud Run (backend/frontend hosting) |

---

## 11. Environment Variables (Auth-Related)

These environment variables control authentication and mTLS behavior. They must be set **before** importing `google.auth` in `app/agent.py`.

| Variable | Value | Purpose |
|----------|-------|---------|
| `GOOGLE_API_USE_MTLS_ENDPOINT` | `never` | Prevents SDK from using `.mtls.googleapis.com` endpoints |
| `GOOGLE_API_USE_CLIENT_CERTIFICATE` | `false` | Prevents SDK from configuring mTLS client cert channels |
| `GOOGLE_GENAI_USE_VERTEXAI` | `True` | Routes Gemini calls through Vertex AI (not AI Studio) |

### Critical: Do NOT Set
| Variable | Reason |
|----------|--------|
| `GEMINI_API_KEY` | Conflicts with Vertex AI ADC auth, causes 401 errors |

### Observability Env Vars (Agent Runtime)
| Variable | Value |
|----------|-------|
| `GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY` | `true` |
| `OTEL_TRACES_EXPORTER` | `google_cloud_trace` |
| `OTEL_METRICS_EXPORTER` | `google_cloud_monitoring` |
| `OTEL_LOGS_EXPORTER` | `google_cloud_logging` |
| `ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS` | `true` |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `SPAN_AND_EVENT` |

---

## 12. Troubleshooting Reference

### Common 401 Errors

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| `401 Unauthorized for url: https://agentregistry.googleapis.com/…` | AgentRegistry SDK using mTLS inside RE container | Set `GOOGLE_API_USE_CLIENT_CERTIFICATE=false` before `import google.auth` |
| `401 Unauthorized for url: https://bigquery.mtls.googleapis.com/mcp` | MCP toolset connecting via mTLS endpoint | Set `GOOGLE_API_USE_MTLS_ENDPOINT=never` before imports |
| `MCP session connection lost: Client error '401 Unauthorized'` | RE SA missing `roles/mcp.toolUser` | Grant `roles/mcp.toolUser` to RE Service Agent SA |
| `mcp.tools.call permission required` | Agent Identity missing MCP role | Grant `roles/mcp.toolUser` to the Agent Identity principal |
| `UNAUTHENTICATED` when calling Gemini models | RE SA missing `roles/aiplatform.user` | Grant `roles/aiplatform.user` to RE Service Agent SA |
| Deployment fails with `GEMINI_API_KEY` present | API key overrides ADC, breaks SA auth | Remove `GEMINI_API_KEY` from all env configs |

### IAM Propagation
After granting IAM roles, allow **60–120 seconds** for propagation before redeploying or retesting. Reasoning Engine deployments create new container instances that pick up IAM changes immediately, but existing instances may cache stale tokens.

### Identity Chain for a BigQuery Query

```
User Request
  → Cloud Run Backend (agent-platform-sa)
    → Agent Gateway (:streamQuery)
      → Reasoning Engine Container
        → Agent Identity principal (workload identity)
          → AgentRegistry.get_mcp_toolset() [needs agentregistry.viewer]
            → MCP BigQuery Server [needs mcp.toolUser]
              → BigQuery API [needs bigquery.jobUser + bigquery.dataViewer]
```

Each hop in the chain requires its own set of permissions. A missing role at any level produces a 401 or 403.
