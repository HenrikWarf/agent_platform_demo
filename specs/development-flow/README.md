# Development Flow & Engineering Standards

This folder contains the authoritative engineering guides for developing, testing, evaluating, versioning, and deploying multi-agent AI systems on Google Cloud Platform.

---

## 📚 Documents in this Directory

* **[`OPTIMAL_DEVELOPMENT_FLOW.md`](OPTIMAL_DEVELOPMENT_FLOW.md)**:
  * **Phase 1: Spec-Driven Development (SDD)** — Establishing PRD, Technical Spec, Data Schemas, and Golden Eval Datasets before writing agent code.
  * **Phase 2: Local Development Environment & Ergonomics** — Fast local dev harnesses (`agents-cli playground`), virtual environments, and dual-harness execution.
  * **Phase 3: Code Quality, Linting & Static Analysis** — Ruff (Python), ESLint (React/TS), and automated pre-commit git hooks.
  * **Phase 4: Agent Testing, Evaluation & The Quality Flywheel** — 5-level testing pyramid, trajectory tracing, LLM-as-a-judge scoring rubrics, and regression analysis (`agents-cli eval compare`).
  * **Phase 5: Version Control, Git Hygiene & State Logging** — Trunk-based development, Conventional Commits, and maintaining AI state sync (`GEMINI.md`).
  * **Phase 6: Automated CI/CD Pipeline** — GitHub Actions quality gates, container packaging, zero-downtime deployment (`agents-cli deploy`, Cloud Run), and workplace publishing (`agents-cli publish gemini-enterprise`).
  * **Phase 7: Day-2 Observability & Closed-Loop Improvement** — Distributed Cloud Trace spans, GCS completions, and edge-case harvesting.
  * **Developer Quick Reference & Pre-Merge Checklist** — Common commands matrix and pre-PR verification checklist.

---

## ⚡ Quick Command Cheat Sheet

```bash
# 1. Run full linting & syntax verification
./scripts/pre_commit_lint.sh

# 2. Run local golden marketing evaluation suite
PYTHONPATH=. ./venv/bin/python eval/run_eval.py

# 3. Launch local ADK developer playground
agents-cli playground

# 4. Deploy agent to Vertex AI Agent Runtime
agents-cli deploy --project agent-demo-09 --region us-central1 --no-confirm-project
```
