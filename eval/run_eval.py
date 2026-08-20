#!/usr/bin/env python3
"""
Evaluation Runner Entrypoint for GCP Agent Platform
Executes golden benchmark prompts and outputs accuracy summary for CI/CD.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eval.local_eval import run_local_evaluation

if __name__ == "__main__":
    summary = run_local_evaluation()
    score = summary.get("benchmark_score_pct", 0.0)
    print(f"\nFinal Benchmark Score: {score}%")
    if score < 50.0:
        print("❌ Benchmark evaluation score below 50% threshold.")
        sys.exit(1)
    else:
        print("✅ Benchmark evaluation passed.")
        sys.exit(0)
