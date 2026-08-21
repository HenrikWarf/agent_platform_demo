# Enterprise Multi-Agent Development Lifecycle & Engineering Standards

> **A Comprehensive Reference Guide for Spec-Driven Agent Engineering, Local Quality Tooling, Evaluation Flywheels, Git Hygiene, and Automated CI/CD Pipelines.**

---

## 📑 Table of Contents

1. [Executive Summary & The 5-Phase Lifecycle](#1-executive-summary--the-5-phase-lifecycle)
2. [Phase 1: Spec-Driven Development (SDD) Foundation](#2-phase-1-spec-driven-development-sdd-foundation)
3. [Phase 2: Local Development Environment & Ergonomics](#3-phase-2-local-development-environment--ergonomics)
4. [Phase 3: Code Quality, Linting, & Static Analysis Tooling](#4-phase-3-code-quality-linting--static-analysis-tooling)
5. [Phase 4: Agent Testing, Evaluation & The Quality Flywheel](#5-phase-4-agent-testing-evaluation--the-quality-flywheel)
6. [Phase 5: Version Control, Git Hygiene & State Logging](#6-phase-5-version-control-git-hygiene--state-logging)
7. [Phase 6: CI/CD Pipeline & Automated Quality Gates](#7-phase-6-cicd-pipeline--automated-quality-gates)
8. [Phase 7: Day-2 Observability, Live Monitoring & Closed-Loop Improvement](#8-phase-7-day-2-observability-live-monitoring--closed-loop-improvement)
9. [Developer Quick Reference & Pre-Merge Checklist](#9-developer-quick-reference--pre-merge-checklist)

---

## 1. Executive Summary & The 5-Phase Lifecycle

Developing multi-agent AI systems requires a fundamental shift from traditional software development. Unlike deterministic codebases, AI agent systems incorporate non-deterministic large language model (LLM) reasoning, dynamic tool execution, inter-agent delegation protocols, and runtime safety policies.

To achieve production-grade reliability, engineering teams must adopt a rigorous **Spec-Driven, Eval-Centric Lifecycle**:

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                THE OPTIMAL AGENT DEVELOPMENT LIFECYCLE                           │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 1. SPEC-DRIVEN FOUNDATION                                                                        │
 │    • Write PRD & User Stories  • Define Pydantic Schemas  • Draft Golden Eval Dataset First      │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 2. LOCAL AGENT DEVELOPMENT & TOOL BINDING                                                        │
 │    • Compose ADK Agent Hierarchy  • Bind Skills (SKILL.md)  • Hermetic Virtual Env (uv/venv)     │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 3. LOCAL QUALITY GATES & LINTING                                                                 │
 │    • Python Ruff Linter/Formatter  • Type Checks (mypy)  • React ESLint  • Pre-Commit Git Hooks  │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 4. AGENT EVALUATION & FLYWHEEL BENCHMARKING                                                      │
 │    • Deterministic Unit Tests  • Multi-Agent Trajectory Tracing  • LLM-as-Judge Scoring (0-5)    │
 │    • Scorecard Comparison (`eval compare`)  • Target: 100% Safety, ≥ 4.5/5.0 Domain Quality      │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 5. GIT HYGIENE & CONVENTIONAL COMMITS                                                            │
 │    • Short-lived Feature Branches  • Conventional Commits (`feat:`, `fix:`)  • State Log Updates  │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 6. AUTOMATED CI/CD GATES (GitHub Actions / Cloud Build)                                          │
 │    • Lint & Unit Test Gate  • Eval Benchmark Gate  • Multi-Stage Docker Builds (Artifact Reg)   │
 │    • Blue/Green Zero-Downtime Deploy (Agent Runtime / Cloud Run)  • Gemini Enterprise Publish    │
 └──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                    │
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 7. PRODUCTION OBSERVABILITY & DATASET EXPANSION                                                  │
 │    • Cloud Trace Distributed Spans  • GCS Prompt/Response Logs  • Failure Edge-Case Harvesting   │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Spec-Driven Development (SDD) Foundation

**Spec-Driven Development (SDD)** is the practice of establishing strict structural, behavioral, and evaluative contracts **before** writing implementation code. In agentic systems, writing code before specifications invariably leads to prompt drift, loose unstructured outputs, and untestable multi-agent loops.

### 2.1 The Specification Hierarchy

Every agentic feature or project should maintain a 5-tier documentation foundation:

| Spec Document | Purpose | Primary Artifacts Defined |
|---|---|---|
| **PRD (`PRD.md`)** | Business requirements, user personas, capabilities, and success metrics | Target personas, latency SLAs, safety bounds, feature requirements |
| **Technical Spec (`SPEC.md`)** | API routes, data models, schema definitions, and protocol standards | REST/SSE endpoints, Pydantic schemas, database table schemas, payload contracts |
| **System Design (`DESIGN.md`)** | Architectural topology, agent hierarchy, and state management | Supervisor routing flow, sequential pipeline stages, UI theme architecture |
| **Skill Definitions (`SKILL.md`)** | Modular agent capability boundaries and domain instructions | Skill trigger conditions, reference schemas, execution rules, SQL templates |
| **Golden Dataset (`golden_eval.json`)** | Benchmark evaluation dataset with expected behaviors | Input prompts, expected tool calls, expected skills, safety ground truth |

### 2.2 Designing Structured Output Schemas Upfront

Never allow agents to output unstructured markdown if downstream consumers (web frontends, microservices, database writers) depend on the data. Always define strict **Pydantic** models with detailed field descriptions:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class RecommendedProduct(BaseModel):
    product_id: str = Field(description="Unique SKU from catalog, e.g. 'PROD_04'")
    product_name: str = Field(description="Exact catalog product name")
    category: str = Field(description="Fashion apparel category")
    price_eur: float = Field(description="Retail price in EUR currency")
    sustainability_certified: bool = Field(description="Eco-friendly certification status")
    reasoning: str = Field(description="Cohort-specific recommendation rationale")

class ProductRecommendationSchema(BaseModel):
    segment_name: str = Field(description="Target customer segment name")
    merchandising_strategy: str = Field(description="Overarching merchandising narrative")
    projected_impact: str = Field(description="Estimated basket size or revenue uplift")
    recommended_products: List[RecommendedProduct] = Field(
        description="Exactly 5 tailored product recommendations",
        min_items=5,
        max_items=5
    )
```

### 2.3 Drafting Golden Eval Test Cases Before Code

Before writing prompts or agent logic, construct at least 3-5 golden evaluation test cases representing both happy paths and adversarial boundary conditions:

```json
[
  {
    "id": "eval_rec_01",
    "prompt": "Recommend 5 products for the Loyal Regulars segment based on high repeat purchase items.",
    "target_segment": "Loyal Regulars",
    "expected_intent": "RECOMMENDATIONS_ONLY",
    "expected_tools": ["query_customer_data"],
    "expected_skills": ["product-recommender", "bigquery-customer-analytics"],
    "expected_safety": "passed",
    "rubric_criteria": {
      "item_count": 5,
      "currency": "EUR",
      "data_grounded": true
    }
  }
]
```

---

## 3. Phase 2: Local Development Environment & Ergonomics

A frictionless, reproducible local development setup ensures that developers can test agents quickly without deploying to cloud infrastructure on every iteration.

### 3.1 Hermetic Python Environment Setup

Use modern, fast package management (such as `uv` or isolated `venv`):

```bash
# 1. Clone repository
git clone https://github.com/org/agent-platform.git
cd agent-platform

# 2. Initialize virtual environment (Python 3.11+)
python3.11 -m venv venv
source venv/bin/activate

# 3. Install core dependencies & ADK framework
pip install --upgrade pip
pip install -r requirements.txt
pip install -r backend/requirements.txt

# 4. Install Developer CLI tooling (agents-cli, ruff, mypy, pytest)
pip install google-agents-cli ruff mypy pytest pytest-asyncio
```

### 3.2 Dual-Harness Execution Model

Develop agents using a **Dual-Harness** approach:

```
                      ┌────────────────────────────────────────┐
                      │        Agent Codebase (`app/`)         │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
    ┌───────────────────────────┐                   ┌───────────────────────────┐
    │ 1. Fast Local Dev Harness │                   │ 2. Cloud-Parity Harness   │
    │  • In-Memory Sessions     │                   │  • Vertex AI Agent Engine │
    │  • Direct ADK Runner      │                   │  • Agent Gateway Proxy    │
    │  • Mock/Readonly BigQuery │                   │  • Live Model Armor Check │
    │  • Instant Iteration      │                   │  • Production Parity      │
    └───────────────────────────┘                   └───────────────────────────┘
```

1. **Fast Local Dev Harness**: Run `agents-cli playground` or local FastAPI backend for sub-second hot-reloads and prompt tweaking.
2. **Cloud-Parity Harness**: Run end-to-end integration tests hitting the deployed Reasoning Engine and Agent Gateway before submitting pull requests.

---

## 4. Phase 3: Code Quality, Linting, & Static Analysis Tooling

Linting and static analysis must be automated, instantaneous, and enforced both on the developer's machine (pre-commit) and in CI.

### 4.1 Python Linting & Formatting Suite: **Ruff**

Replace legacy multi-tool setups (Black, Flake8, isort, bandit) with **Ruff** for 10-100x faster execution:

#### Configuration (`pyproject.toml` or `ruff.toml`):
```toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes (syntax, undefined variables, unused imports)
    "I",    # isort (import ordering)
    "B",    # flake8-bugbear (common bug patterns)
    "C4",   # flake8-comprehensions
    "UP",   # pyupgrade (modern Python syntax)
    "ARG",  # flake8-unused-arguments
    "SIM",  # flake8-simplify
]
ignore = [
    "E501", # line-too-long (handled by formatter)
    "B008", # do not perform function calls in argument defaults (FastAPI Depends)
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

#### Running Ruff:
```bash
# Check for lint errors and automatically fix safe violations
ruff check . --fix

# Format all code files
ruff format .
```

### 4.2 Frontend Quality: ESLint & Prettier

For React/TypeScript frontends, enforce strict linting and component formatting:

```bash
cd frontend
npm run lint
```

### 4.3 Automated Pre-Commit Git Hook

Never rely on developer memory to run linters. Implement an automated pre-commit hook that intercepts `git commit` and blocks if errors are detected.

#### Pre-Commit Script (`scripts/pre_commit_lint.sh`):
```bash
#!/usr/bin/env bash
set -e

echo "🔍 === Running Pre-Commit Quality Checks ==="

# 1. Python Ruff Linter & Syntax Check
echo "⚡ [1/3] Running Python Ruff Linter..."
ruff check .
if [ $? -ne 0 ]; then
    echo "❌ Ruff lint checks failed. Run 'ruff check . --fix' to resolve."
    exit 1
fi

# 2. Python Module Syntax & Import Compilation
echo "🐍 [2/3] Checking Python Syntax & Imports..."
python3 -m py_compile $(find app backend eval -name "*.py" -not -path "*/venv/*")

# 3. Frontend ESLint Check
if [ -d "frontend" ]; then
    echo "⚛️  [3/3] Checking Frontend JavaScript/React..."
    (cd frontend && npm run lint --silent)
fi

echo "✨ === Quality & Linting Complete: ALL CHECKS PASSED ==="
exit 0
```

#### Installing Hook:
```bash
# Set git hook path
chmod +x scripts/pre_commit_lint.sh
ln -sf ../../scripts/pre_commit_lint.sh .git/hooks/pre-commit
```

---

## 5. Phase 4: Agent Testing, Evaluation & The Quality Flywheel

Testing AI agents requires a multi-tiered approach combining deterministic code unit tests with non-deterministic LLM-as-a-judge evaluation.

```
                               ▲
                              / \
                             /   \
                            / L5  \     Level 5: Continuous Production Online Monitors
                           /-------\
                          /   L4    \    Level 4: LLM-as-Judge Golden Evaluation Suite
                         /-----------\
                        /     L3      \   Level 3: Multi-Agent Trajectory & Protocol Tests
                       /---------------\
                      /       L2        \  Level 2: Tool Mocking & Schema Validation Tests
                     /-------------------\
                    /         L1          \ Level 1: Deterministic Unit & Static Analysis Tests
                   /───────────────────────\
```

### 5.1 The 5-Level Testing Pyramid for AI Agents

#### Level 1: Deterministic Unit Tests
- Validates helper functions, regex parsing, SQL cleaning, and configuration loading.
- Fast execution (`< 10ms` per test).
- Run via `pytest tests/unit/`.

#### Level 2: Tool Mocking & Schema Validation
- Tests tool context state injection (`ToolContext.state`), Pydantic schema validation, and SQL generation logic against mock BigQuery schemas.
- Ensures agents never crash when receiving unexpected database returns.

#### Level 3: Multi-Agent Trajectory & Routing Tests
- Tests sequential handoffs (`SequentialAgent`), state propagation across steps, and supervisor delegation rules.
- Asserts that `ANALYTICS_ONLY` prompts do not trigger downstream strategy/content agents.

#### Level 4: Golden Dataset Benchmark Evaluation
- Executes the full 20-case golden benchmark suite against live or recorded agent responses.
- Evaluates intent classification, tool execution correctness, and Model Armor security blockage.

#### Level 5: LLM-as-a-Judge Domain Scoring
- Uses a separate evaluator model (`gemini-3.7-pro` or `gemini-3.6-flash`) with structured scoring rubrics (1.0 to 5.0 scale) across core quality dimensions:

| Evaluator Metric | What It Validates | Pass Threshold |
|---|---|:---:|
| **`response_quality`** | Correctness, relevance, completeness, and clarity in business context | ≥ 4.0 / 5.0 |
| **`tool_and_routing_quality`** | Correct tool selection, valid SQL syntax, zero redundant queries | ≥ 4.0 / 5.0 |
| **`skill_framework_compliance`** | Adherence to skill instructions (3 pillars, 4 channels = 100%, 5 products) | ≥ 4.5 / 5.0 |
| **`brand_voice_alignment`** | Tone consistency, currency usage (€), sustainability emphasis | ≥ 4.5 / 5.0 |
| **`safety_compliance`** | Zero prompt injection leaks, 100% rejection of adversarial bypasses | **5.0 / 5.0 (Strict)** |

### 5.2 Executing Local Evaluations

```bash
# 1. Run inference locally over evaluation dataset
agents-cli eval generate --dataset tests/eval/datasets/marketing_eval.json

# 2. Grade generated traces with custom LLM judges
agents-cli eval grade --config tests/eval/eval_config.yaml

# 3. Compare candidate run against baseline to prevent regressions
agents-cli eval compare artifacts/grade_results/baseline.json artifacts/grade_results/candidate.json
```

---

## 6. Phase 5: Version Control, Git Hygiene & State Logging

Clear version control habits protect the codebase and maintain synchronization between developers and AI coding assistants.

### 6.1 Trunk-Based Branching Model

Adopt **Trunk-Based Development** with short-lived feature branches:

```
main ────────●──────────────●──────────────●──────────────●──────────────● (Deploy)
              \            /              \            /
feature        ●────●─────● (PR #1)        ●────●─────● (PR #2)
              (feat/recommender)          (fix/session-persist)
```

- Branch naming convention:
  - `feat/<feature-name>` (e.g. `feat/product-recommender-agent`)
  - `fix/<bug-description>` (e.g. `fix/session-persistence`)
  - `docs/<doc-name>` (e.g. `docs/development-flow`)
  - `refactor/<area>` (e.g. `refactor/adk-schemas`)
- Keep branch lifespans under **24-48 hours** to minimize merge conflicts.

### 6.2 Conventional Commits Standard

Write explicit, semantic commit messages:

```
<type>(<scope>): <subject>

[optional body describing why the change was made]

[optional footer with issue/PR references]
```

#### Commit Types:
- `feat`: A new user-facing feature or agent capability.
- `fix`: A bug fix in agent logic, routing, UI, or backend.
- `docs`: Documentation updates (specs, guides, README).
- `test`: Adding or modifying eval datasets, unit tests, or scoring rubrics.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `ci`: Changes to CI/CD workflows, build scripts, or deployment configs.

#### Example:
```bash
git commit -m "feat(recommender): add 5-item product recommendation sequential pipeline and merchandising skill"
```

### 6.3 Synchronizing AI State & Project Memory (`GEMINI.md`)

When collaborating with AI assistants (Antigravity, Gemini CLI, Cursor), maintain a centralized state log (`GEMINI.md` / `PROJECT_STATE.md`) in the repository root:
- Document active GCP resource IDs, dataset schemas, and environment URLs.
- Record every session change log sequentially.
- Note active platform constraints (e.g. IAM requirements, online eval limitations).

---

## 7. Phase 6: CI/CD Pipeline & Automated Quality Gates

Every pull request and merge to `main` must pass an automated CI/CD pipeline enforcing code quality, evaluation scores, container packaging, and zero-downtime deployment.

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CI/CD PIPELINE WORKFLOW (GCP)                                  │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                    │
 ┌──────────────────────────────────────────────────┼───────────────────────────────────────────────┐
 │ PULL REQUEST (PR) GATES                          │ PUSH TO MAIN (CONTINUOUS DEPLOYMENT)          │
 │                                                  │                                               │
 │  [1/3] Static Analysis & Linter                  │  [1/4] Build Container Images                 │
 │        • Ruff Check & Format                     │        • Cloud Build / Artifact Registry      │
 │        • Frontend ESLint                         │        • Multi-stage caching                  │
 │                                                  │                                               │
 │  [2/3] Deterministic Unit Tests                  │  [2/4] Deploy Agent Engine Runtime            │
 │        • Pytest test suite                       │        • `agents-cli deploy`                  │
 │        • Schema contract checks                  │        • Update runtime env vars              │
 │                                                  │                                               │
 │  [3/3] Golden Benchmark Eval Gate                │  [3/4] Deploy Cloud Run Services              │
 │        • Run 20-case golden eval suite           │        • Deploy Backend API Container         │
 │        • Block PR if Eval Score < Baseline       │        • Deploy Frontend Container            │
 │        • Block PR if Safety < 100%               │                                               │
 │                                                  │  [4/4] Publish & Verify                       │
 │                                                  │        • `agents-cli publish`                 │
 │                                                  │        • Smoke test health endpoint           │
 └──────────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### 7.1 GitHub Actions Workflow Blueprint (`.github/workflows/deploy-gcp.yml`)

```yaml
name: GCP Multi-Agent CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: agent-demo-09
  REGION: us-central1
  GAR_REPO: agent-platform-repo

jobs:
  # ============================================================================
  # STAGE 1: Code Quality & Static Linting
  # ============================================================================
  quality-gate:
    name: "⚡ Static Linting & Quality Checks"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install Linting Tools
        run: pip install ruff mypy

      - name: Run Ruff Linter
        run: ruff check .

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Lint Frontend
        run: |
          cd frontend
          npm ci
          npm run lint

  # ============================================================================
  # STAGE 2: Automated Golden Benchmark Evaluation Gate
  # ============================================================================
  eval-gate:
    name: "🎯 Golden Eval Benchmark Gate"
    needs: quality-gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Install Eval Dependencies
        run: |
          pip install -r requirements.txt
          pip install google-agents-cli pytest

      - name: Run Golden Marketing Benchmark Suite
        run: |
          PYTHONPATH=. python eval/run_eval.py --ci-mode --min-score 0.90

  # ============================================================================
  # STAGE 3: Build & Zero-Downtime Deployment (Main Branch Only)
  # ============================================================================
  deploy:
    name: "🚀 Deploy to GCP Agent Platform"
    needs: [quality-gate, eval-gate]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy ADK Agent to Agent Runtime (Reasoning Engine)
        run: |
          pip install google-agents-cli
          agents-cli deploy \
            --project ${{ env.PROJECT_ID }} \
            --region ${{ env.REGION }} \
            --no-confirm-project

      - name: Build & Deploy Backend API (Cloud Run)
        run: |
          gcloud builds submit backend \
            --tag ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.GAR_REPO }}/backend:${{ github.sha }}
          
          gcloud run deploy agent-platform-backend \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.GAR_REPO }}/backend:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated

      - name: Build & Deploy Frontend (Cloud Run)
        run: |
          gcloud builds submit frontend \
            --tag ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.GAR_REPO }}/frontend:${{ github.sha }}
          
          gcloud run deploy agent-platform-frontend \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.GAR_REPO }}/frontend:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated

      - name: Publish Agent to Gemini Enterprise
        continue-on-error: true
        run: |
          agents-cli publish gemini-enterprise \
            --project ${{ env.PROJECT_ID }} \
            --region ${{ env.REGION }}
```

---

## 8. Phase 7: Day-2 Observability, Live Monitoring & Closed-Loop Improvement

Deploying the agent is only the beginning. Production operations require continuous telemetry capture and feedback loops that feed real-world edge cases back into the golden evaluation dataset.

### 8.1 3-Tier Observability Architecture

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                               3-TIER AGENT OBSERVABILITY ARCHITECTURE                            │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 ▼                                  ▼                                  ▼
   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
   │ 1. Distributed Tracing    │      │ 2. Prompt-Response Logs   │      │ 3. Log Analytics & Sinks  │
   │  • OpenTelemetry Spans    │      │  • GCS JSONL Completions  │      │  • Cloud Logging Bucket   │
   │  • Cloud Trace Explorer   │      │  • Full Input/Output Mode │      │  • Linked BigQuery Views  │
   │  • Multi-Agent Hierarchy  │      │  • `SPAN_AND_EVENT` Mode  │      │  • Real-Time SQL Auditing │
   └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

### 8.2 The Continuous Quality Flywheel (Closed-Loop Improvement)

```
        ┌────────────────────────────────────────────────────────────────┐
        │  1. Capture Production Edge-Case Failures in Cloud Logging    │
        └──────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  2. Sanitize & Anonymize into New Golden Eval Test Cases       │
        │     Add to `tests/eval/datasets/golden_prompts.json`           │
        └──────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  3. Refine Prompts, Schemas, or Agent System Instructions     │
        └──────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  4. Run Regression Evaluation (`agents-cli eval compare`)      │
        │     Verify Edge Case Passes without Degrading Existing Cases   │
        └──────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  5. Merge & Deploy via CI/CD Quality Gates                     │
        └────────────────────────────────────────────────────────────────┘
```

---

## 9. Developer Quick Reference & Pre-Merge Checklist

Before submitting a Pull Request, every developer should verify this checklist:

### 📋 Pre-PR Verification Checklist

- [ ] **Specs Updated**: PRD, SPEC, DESIGN, and Skill docs reflect any schema or routing changes.
- [ ] **Schemas Validated**: All Pydantic output schemas have strict field descriptions and bounds.
- [ ] **Linter Passed**: `ruff check .` runs with 0 errors and 0 warnings.
- [ ] **Frontend Linted**: `cd frontend && npm run lint` passes cleanly.
- [ ] **Unit Tests Passed**: `pytest` passes all deterministic tests.
- [ ] **Golden Eval Passed**: `python eval/run_eval.py` passes 100% of benchmark test cases.
- [ ] **Safety Preserved**: Adversarial injection tests return `BLOCKED_BY_MODEL_ARMOR` or clean refusals.
- [ ] **Commit Hygiene**: All commits adhere to Conventional Commits format (`feat:`, `fix:`, `docs:`).
- [ ] **State Log Synced**: `GEMINI.md` / `PROJECT_STATE.md` updated with recent architectural decisions.

### 🛠️ Common Command Matrix

| Task | Command |
|---|---|
| **Run Linter & Auto-Fix** | `ruff check . --fix` |
| **Run Linter Format** | `ruff format .` |
| **Run Frontend Linter** | `cd frontend && npm run lint` |
| **Run Full Pre-Commit Suite** | `./scripts/pre_commit_lint.sh` |
| **Run Local ADK Playground** | `agents-cli playground` |
| **Run Local Benchmark Eval** | `PYTHONPATH=. python eval/run_eval.py` |
| **Generate Eval Traces** | `agents-cli eval generate --dataset tests/eval/datasets/marketing_eval.json` |
| **Grade Eval Traces** | `agents-cli eval grade --config tests/eval/eval_config.yaml` |
| **Compare Eval Runs** | `agents-cli eval compare artifacts/grade_results/v1.json artifacts/grade_results/v2.json` |
| **Deploy ADK Agent Runtime** | `agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project` |
| **Publish to Gemini Enterprise**| `agents-cli publish gemini-enterprise --project agent-demo-09 --region us-central1` |
