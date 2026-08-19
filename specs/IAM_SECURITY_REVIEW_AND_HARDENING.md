# IAM Security Review & Least-Privilege Hardening Guide

> **Project:** `agent-demo-09` · **Project Number:** `1047232371360` · **Region:** `us-central1`  
> **Source Spec Reviewed:** [`specs/IAM_AND_ACCESS_CONTROL.md`](file:///Users/henrikw/Projects/agent_platform_demo/specs/IAM_AND_ACCESS_CONTROL.md)  
> **Date:** 2026-08-19 · **Status:** Recommended Hardening Blueprint

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Risk & Threat Analysis](#2-risk--threat-analysis)
3. [Principal-by-Principal Access Rights Audit](#3-principal-by-principal-access-rights-audit)
   - [3.1 Agent Identity (Reasoning Engine Workload Identity)](#31-agent-identity-reasoning-engine-workload-identity)
   - [3.2 Application Service Account (`agent-platform-sa`)](#32-application-service-account-agent-platform-sa)
   - [3.3 Default Compute Service Account](#33-default-compute-service-account)
   - [3.4 Google-Managed Service Agents (P4SAs)](#34-google-managed-service-agents-p4sas)
   - [3.5 GCS Logs Bucket IAM](#35-gcs-logs-bucket-iam)
   - [3.6 Cross-Project Access](#36-cross-project-access)
4. [Permission Redundancies & Overlaps](#4-permission-redundancies--overlaps)
5. [Target Architecture: Runtime SA vs. Deployer SA](#5-target-architecture-runtime-sa-vs-deployer-sa)
6. [Remediation & Migration Plan](#6-remediation--migration-plan)
7. [Production Hardening Checklist](#7-production-hardening-checklist)

---

## 1. Executive Summary

An in-depth review of [`specs/IAM_AND_ACCESS_CONTROL.md`](file:///Users/henrikw/Projects/agent_platform_demo/specs/IAM_AND_ACCESS_CONTROL.md) was conducted to evaluate whether all documented access rights are necessary, identify over-provisioned or redundant permissions, and establish a hardened least-privilege baseline for the GCP Agent Platform.

### Key Findings:
- **Critical Privilege Escalation Risks:** The application service account (`agent-platform-sa@...`) currently holds `roles/resourcemanager.projectIamAdmin`, `roles/aiplatform.admin`, and `roles/run.admin`. If the web-facing Cloud Run backend were compromised (e.g. via SSRF or remote code execution), an attacker would have full project-level administrative control.
- **Over-Privileged Agent Identity:** The Reasoning Engine Agent Identity principal holds `roles/bigquery.admin` and `roles/bigquery.dataEditor`. The marketing agents only require **read-only** query access (`roles/bigquery.dataViewer` and `roles/bigquery.jobUser`) via the BigQuery MCP server.
- **Conflation of Runtime & Deployment:** A single service account currently handles both real-time HTTP request processing in Cloud Run and CI/CD infrastructure deployment.
- **Redundant Observability & BigQuery Roles:** Multiple overlapping roles (e.g., `observability.admin` + `logging.admin` + `logging.logWriter` + `monitoring.admin` + `monitoring.metricWriter`) are assigned simultaneously to the same principals.
- **Unrestricted Storage Admin:** Full `roles/storage.admin` is assigned to multiple identities where bucket-level object creation or viewing (`roles/storage.objectCreator` / `roles/storage.objectViewer`) is sufficient.

---

## 2. Risk & Threat Analysis

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THREAT MATRIX & BLAST RADIUS                           │
├─────────────────────────┬──────────────────────────────┬──────────┬────────────────────┤
│ Principal               │ Over-Privileged Role         │ Severity │ Potential Impact   │
├─────────────────────────┼──────────────────────────────┼──────────┼────────────────────┤
│ agent-platform-sa       │ resourcemanager.projectIamAdmin│ CRITICAL │ Full GCP project   │
│                         │                              │          │ takeover           │
│ agent-platform-sa       │ aiplatform.admin, run.admin  │ HIGH     │ Deploy/delete any  │
│                         │                              │          │ model or service   │
│ Agent Identity (RE)     │ bigquery.admin               │ HIGH     │ Modify/drop any BQ │
│                         │                              │          │ dataset or table   │
│ Agent Identity (RE)     │ bigquery.dataEditor          │ MEDIUM   │ Unauthorized table │
│                         │                              │          │ writes / tampering │
│ Default Compute SA      │ aiplatform.admin, BQ admin   │ HIGH     │ Unrestricted VM/CE │
│                         │                              │          │ lateral movement   │
│ All Identities on GCS   │ storage.admin (bucket level) │ MEDIUM   │ Bucket deletion /  │
│                         │                              │          │ policy tampering   │
└─────────────────────────┴──────────────────────────────┴──────────┴────────────────────┘
```

---

## 3. Principal-by-Principal Access Rights Audit

### 3.1 Agent Identity (Reasoning Engine Workload Identity)

**Principal:** `principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936`

| Role | Necessary? | Risk Level | Action & Rationale |
|---|:---:|:---:|---|
| `roles/mcp.toolUser` | **YES** | Low | **Keep.** Required to call tools exposed by the managed BigQuery MCP server. |
| `roles/agentregistry.viewer` | **YES** | Low | **Keep.** Required by `AgentRegistry.get_mcp_toolset()` to discover MCP tool definitions and schemas. |
| `roles/aiplatform.user` | **YES** | Low | **Keep.** Required to invoke Gemini models (`gemini-3.6-flash`) on Vertex AI. |
| `roles/bigquery.jobUser` | **YES** | Low | **Keep.** Required to submit and execute SQL query jobs in the BigQuery engine. |
| `roles/bigquery.dataViewer` | **YES** | Low | **Keep (Scope to Dataset).** Required to read customer data in `agent-demo-09.marketing_analytics`. |
| `roles/agentregistry.user` | **NO** | Low | **Remove.** The agent only reads registered tools at runtime; it does not publish or modify agent definitions. |
| `roles/bigquery.admin` | **NO** | **High** | **Remove.** Full control over all BigQuery datasets and configuration. Never required by an agent. |
| `roles/bigquery.dataEditor` | **NO** | Medium | **Remove.** The marketing agent only runs `SELECT` queries; it must not be permitted to alter or delete customer records. |

---

### 3.2 Application Service Account (`agent-platform-sa`)

**Email:** `agent-platform-sa@agent-demo-09.iam.gserviceaccount.com`  
**Used By:** Cloud Run Backend, Cloud Run Frontend

| Role | Necessary for Runtime? | Risk Level | Action & Rationale |
|---|:---:|:---:|---|
| `roles/aiplatform.user` | **YES** | Low | **Keep.** Needed to call Reasoning Engine (`:streamQuery` / `:query`) and Gemini APIs. |
| `roles/modelarmor.user` | **YES** | Low | **Keep.** Needed to execute prompt and response sanitization templates. |
| `roles/agentregistry.viewer` | **YES** | Low | **Keep.** Needed for backend API endpoints (`/api/skills`, `/api/agents`) to display registered assets in UI. |
| `roles/bigquery.dataViewer` | **YES** | Low | **Keep.** Needed for BigQuery Data Inspector endpoints (`/api/bigquery/sample`). |
| `roles/bigquery.jobUser` | **YES** | Low | **Keep.** Needed to execute sample table queries for UI exploration. |
| `roles/cloudtrace.agent` | **YES** | Low | **Keep.** Required to send OpenTelemetry trace spans to Cloud Trace. |
| `roles/logging.logWriter` | **YES** | Low | **Keep.** Required to write structured application logs to Cloud Logging. |
| `roles/monitoring.metricWriter` | **YES** | Low | **Keep.** Required to emit custom OpenTelemetry metric counters to Cloud Monitoring. |
| `roles/resourcemanager.projectIamAdmin` | **NO** | **CRITICAL** | **Remove immediately.** Allows modifying any project IAM policy. Should only be held by elevated CI/CD or Terraform pipelines. |
| `roles/aiplatform.admin` | **NO** | **High** | **Remove.** The backend only queries existing Reasoning Engines; it does not deploy, update, or delete them. |
| `roles/run.admin` | **NO** | **High** | **Remove.** The Cloud Run service does not deploy other Cloud Run services. |
| `roles/networkservices.admin` | **NO** | Medium | **Remove.** The backend connects to the Agent Gateway as a client; it does not manage gateway infra. |
| `roles/storage.admin` | **NO** | Medium | **Narrow Down.** Replace project-wide storage admin with `roles/storage.objectViewer` specifically on `gs://agent-demo-09-agent-platform-logs`. |
| `roles/bigquery.dataEditor` | **NO** | Medium | **Remove.** The backend only reads BigQuery table samples; it performs no data mutations. |
| `roles/agentregistry.editor` | **NO** | Medium | **Move to CI/CD.** Used only during deployment when running `register_skills.py`. |
| `roles/artifactregistry.writer` | **NO** | Medium | **Move to CI/CD.** Used only during container build steps (`docker push`). |
| `roles/iam.serviceAccountUser` | **NO** | **High** | **Move to CI/CD.** Used only when deploying Cloud Run services attached to specific identities. |
| `roles/logging.admin` | **NO** | Low | **Remove (Redundant).** `roles/logging.logWriter` is already granted. |
| `roles/monitoring.admin` | **NO** | Low | **Remove (Redundant).** `roles/monitoring.metricWriter` is already granted. |
| `roles/observability.admin` | **NO** | Low | **Remove (Redundant).** Superceded by specific writer roles. |
| `roles/logging.viewAccessor` | **NO** | Low | **Remove.** Backend doesn't need to read other services' logs at runtime. |

---

### 3.3 Default Compute Service Account

**Email:** `1047232371360-compute@developer.gserviceaccount.com`

- **Current State:** Holds `aiplatform.admin`, `bigquery.admin`, `storage.admin`, `monitoring.admin`, `observability.admin`, `cloudtrace.agent`, etc.
- **Risk Assessment:** The default compute service account is frequently targeted in cloud lateral movement attacks because Compute Engine instances or unconfigured services default to this identity.
- **Recommendation:**
  1. Strip all project-level administrative and data roles from this service account.
  2. Enforce the organization policy constraint `constraints/iam.automaticIamGrantsForDefaultServiceAccounts`.
  3. Ensure all Cloud Run instances explicitly specify `service_account = "agent-platform-sa@..."`.

---

### 3.4 Google-Managed Service Agents (P4SAs)

Google creates and manages these control-plane service accounts automatically. However, custom role grants were added during setup:

| Service Agent | Unnecessary / Over-Provisioned Roles | Hardening Recommendation |
|---|---|---|
| **Vertex AI P4SA** (`service-1047232371360@gcp-sa-aiplatform...`) | `roles/bigquery.admin`, `roles/bigquery.dataEditor`, `roles/storage.admin`, `roles/monitoring.admin`, `roles/aiplatform.admin` | **Remove excessive roles.** Keep standard `roles/aiplatform.serviceAgent`, plus `roles/storage.objectViewer` on `gs://agent-demo-09-agent-platform-logs` (needed by Vertex AI Console session viewer) and `roles/cloudtrace.agent`. |
| **Reasoning Engine SA** (`service-1047232371360@gcp-sa-aiplatform-re...`) | `roles/agentregistry.admin`, `roles/observability.admin`, `roles/bigquery.user` | **Clean up.** Keep `roles/aiplatform.reasoningEngineServiceAgent`, `roles/aiplatform.user`, `roles/mcp.toolUser`, and `roles/modelarmor.user`. |
| **Data Extension Processing SA** (`service-1047232371360@gcp-sa-dep...`) | `roles/observability.admin`, `roles/logging.viewAccessor` | **Clean up.** Keep `roles/modelarmor.calloutUser`, `roles/serviceextensions.serviceAgent`, and `roles/serviceusage.serviceUsageConsumer`. |
| **Discovery Engine SA** (`service-1047232371360@gcp-sa-discoveryengine...`) | `roles/bigquery.user` | **Clean up.** Keep `roles/discoveryengine.serviceAgent`, `roles/aiplatform.user`, and `roles/bigquery.dataViewer`. |

---

### 3.5 GCS Logs Bucket IAM

**Bucket:** `gs://agent-demo-09-agent-platform-logs`  
**Purpose:** Stores JSONL completion logs emitted by the ADK Reasoning Engine.

| Principal | Current Role | Least-Privilege Recommendation |
|---|---|---|
| Agent Identity (RE `3829020106671783936`) | `roles/storage.admin` | **Change to `roles/storage.objectCreator` / `roles/storage.objectUser`** scoped to the bucket. The agent writes JSONL files; it must not be able to delete the bucket or alter bucket IAM policies. |
| Application SA (`agent-platform-sa@...`) | `roles/storage.admin` | **Change to `roles/storage.objectViewer`** scoped to the bucket. |
| RE Service Agent SA (`service-...@gcp-sa-aiplatform-re...`) | `roles/storage.admin` | **Change to `roles/storage.objectAdmin`** scoped to the bucket. |
| Vertex AI P4SA (`service-...@gcp-sa-aiplatform...`) | `roles/storage.objectViewer` | **Keep.** Required by Vertex AI Console session history viewer. |
| Vertex AI API Robot (`cloud-aiplatform-api-robot-prod@...`) | `roles/storage.objectViewer` | **Keep.** Required by Vertex AI rapid evaluation monitors. |

---

### 3.6 Cross-Project Access

**Origin Project:** `984884844367` (Gemini Enterprise Tenant)

| Principal | Role Granted | Purpose & Validity |
|---|---|---|
| `service-984884844367@gcp-sa-aiplatform.iam.gserviceaccount.com` | `roles/aiplatform.user` | **Valid.** Allows Gemini Enterprise to discover and call the Reasoning Engine across projects. |
| `service-984884844367@gcp-sa-discoveryengine.iam.gserviceaccount.com` | `roles/aiplatform.user` | **Valid.** Allows Discovery Engine search agents in tenant project to delegate to `agent-demo-09`. |

---

## 4. Permission Redundancies & Overlaps

The following table summarizes role redundancies identified in the current setup:

| Category | Redundant Role Grants | Recommended Single Source of Truth |
|---|---|---|
| **Observability** | `roles/observability.admin` + `roles/logging.admin` + `roles/logging.viewAccessor` + `roles/monitoring.admin` | Grant only: <br>• `roles/logging.logWriter`<br>• `roles/monitoring.metricWriter`<br>• `roles/cloudtrace.agent` |
| **BigQuery** | `roles/bigquery.admin` + `roles/bigquery.dataEditor` + `roles/bigquery.user` | Grant only: <br>• `roles/bigquery.dataViewer` (dataset level)<br>• `roles/bigquery.jobUser` (project level) |
| **Agent Registry** | `roles/agentregistry.admin` + `roles/agentregistry.editor` + `roles/agentregistry.user` + `roles/agentregistry.viewer` | Grant `roles/agentregistry.viewer` to runtime agents; grant `roles/agentregistry.editor` only to CI/CD deployer. |
| **Storage** | `roles/storage.admin` (project-wide) | Grant bucket-level `roles/storage.objectUser` or `roles/storage.objectViewer`. |

---

## 5. Target Architecture: Runtime SA vs. Deployer SA

To achieve production-grade least privilege, decouple runtime identity from build/deploy identity:

```
                               ┌────────────────────────────────────────┐
                               │       GitHub Actions / Cloud Build     │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │   CI/CD Deployer Service Account       │
                               │   agent-platform-deployer@...          │
                               ├────────────────────────────────────────┤
                               │ • roles/run.admin                      │
                               │ • roles/aiplatform.admin               │
                               │ • roles/artifactregistry.writer        │
                               │ • roles/agentregistry.editor           │
                               │ • roles/iam.serviceAccountUser         │
                               │ • roles/storage.admin (deploy bucket)  │
                               └───────────────────┬────────────────────┘
                                                   │ provisions / deploys
                                                   ▼
        ┌──────────────────────────────────────────────────────────────────────────────────┐
        │                              RUNTIME ENVIRONMENT                                 │
        │                                                                                  │
        │   ┌──────────────────────────────────┐    ┌──────────────────────────────────┐   │
        │   │ Cloud Run Backend / Frontend     │    │ Vertex AI Reasoning Engine (ADK) │   │
        │   │ Identity: agent-platform-runtime │    │ Identity: Agent Identity (RE)    │   │
        │   ├──────────────────────────────────┤    ├──────────────────────────────────┤   │
        │   │ • roles/aiplatform.user          │    │ • roles/mcp.toolUser             │   │
        │   │ • roles/modelarmor.user          │    │ • roles/agentregistry.viewer     │   │
        │   │ • roles/agentregistry.viewer     │    │ • roles/aiplatform.user          │   │
        │   │ • roles/bigquery.dataViewer      │    │ • roles/bigquery.dataViewer      │   │
        │   │ • roles/bigquery.jobUser         │    │ • roles/bigquery.jobUser         │   │
        │   │ • roles/logging.logWriter        │    │ • roles/storage.objectCreator    │   │
        │   │ • roles/monitoring.metricWriter  │    │   (on logs bucket only)          │   │
        │   │ • roles/cloudtrace.agent         │    └──────────────────────────────────┘   │
        │   │ • roles/storage.objectViewer     │                                           │
        │   │   (on logs bucket only)          │                                           │
        │   └──────────────────────────────────┘                                           │
        └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Remediation & Migration Plan

### Step 1: Strip Project IAM Admin & High-Risk Roles from Runtime SA
```bash
PROJECT_ID="agent-demo-09"
RUNTIME_SA="agent-platform-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Remove critical admin roles from runtime SA
gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/resourcemanager.projectIamAdmin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/aiplatform.admin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/run.admin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/networkservices.admin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/bigquery.dataEditor"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.admin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/observability.admin"
```

### Step 2: Strip Admin/Editor Roles from RE Agent Identity
```bash
AGENT_IDENTITY="principal://agents.global.org-481945953452.system.id.goog/resources/aiplatform/projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936"

# Remove write and admin roles from agent workload identity
gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="${AGENT_IDENTITY}" \
  --role="roles/bigquery.admin"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="${AGENT_IDENTITY}" \
  --role="roles/bigquery.dataEditor"

gcloud projects remove-iam-policy-binding "${PROJECT_ID}" \
  --member="${AGENT_IDENTITY}" \
  --role="roles/agentregistry.user"
```

### Step 3: Scope BigQuery Permissions to Dataset Level
Instead of granting `roles/bigquery.dataViewer` across the entire GCP project, bind it directly to the dataset:
```bash
# Grant BigQuery read access scoped only to marketing_analytics dataset
bq add-iam-policy-binding \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/bigquery.dataViewer" \
  "${PROJECT_ID}:marketing_analytics"

bq add-iam-policy-binding \
  --member="${AGENT_IDENTITY}" \
  --role="roles/bigquery.dataViewer" \
  "${PROJECT_ID}:marketing_analytics"
```

### Step 4: Scope GCS Logs Bucket Access
```bash
LOGS_BUCKET="gs://agent-demo-09-agent-platform-logs"

# Grant specific object permissions on the bucket rather than storage.admin
gcloud storage buckets add-iam-policy-binding "${LOGS_BUCKET}" \
  --member="${AGENT_IDENTITY}" \
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding "${LOGS_BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectViewer"
```

---

## 7. Production Hardening Checklist

- [ ] **1. Strip `roles/resourcemanager.projectIamAdmin`** from all runtime service accounts.
- [ ] **2. Strip `roles/bigquery.admin` and `roles/bigquery.dataEditor`** from the Reasoning Engine Agent Identity.
- [ ] **3. Replace project-level `roles/storage.admin`** on the logs bucket with `roles/storage.objectCreator` (for RE) and `roles/storage.objectViewer` (for backend/console).
- [ ] **4. Deprecate and clean up Default Compute SA** (`1047232371360-compute@...`) admin roles.
- [ ] **5. Split CI/CD Deployer SA from Runtime SA** in Terraform and GitHub Actions workflows.
- [ ] **6. Scope BigQuery `dataViewer`** directly to the `marketing_analytics` dataset rather than project-level.
- [ ] **7. Remove redundant observability roles** (`observability.admin`, `logging.admin`, `monitoring.admin`) in favor of specific writer roles (`logWriter`, `metricWriter`, `cloudtrace.agent`).
- [ ] **8. Update [`specs/IAM_AND_ACCESS_CONTROL.md`](file:///Users/henrikw/Projects/agent_platform_demo/specs/IAM_AND_ACCESS_CONTROL.md)** to document the hardened roles as the active baseline.
