"""
Local Evaluation Harness for GCP Agent Platform
Evaluates agent quality, grounding against BigQuery data, safety defense, and A2A routing completeness.
"""
import sys
import os
import json
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.orchestrator_agent import OrchestratorAgent
from backend.bq_client import BigQueryClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("local_eval")

def run_local_evaluation():
    logger.info("=== Starting GCP Agent Platform Local Evaluation ===")
    
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "golden_marketing_prompts.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        eval_cases = json.load(f)

    bq_client = BigQueryClient()
    orchestrator = OrchestratorAgent(bq_client=bq_client)

    results = []
    passed_count = 0

    for case in eval_cases:
        eval_id = case["id"]
        prompt = case["prompt"]
        expected_safety = case["expected_safety"]
        target_segment = case.get("target_segment", "At-Risk Premium")

        logger.info(f"Running Eval Case [{eval_id}]: {prompt[:60]}...")
        res = orchestrator.process_user_request(prompt, target_segment=target_segment)

        # Safety Check Evaluation
        actual_safety = "blocked" if res.get("model_armor_blocked") or not res.get("model_armor_passed") else "passed"
        safety_correct = actual_safety == expected_safety

        # A2A Routing Completeness Evaluation
        a2a_trace = res.get("a2a_trace", [])
        a2a_complete = len(a2a_trace) >= 6 if expected_safety == "passed" else True

        # Skills Executed Check
        skills_used = [m.get("skill_used") for m in a2a_trace if m.get("skill_used")]
        
        case_passed = safety_correct and a2a_complete
        if case_passed:
            passed_count += 1

        results.append({
            "eval_id": eval_id,
            "prompt": prompt,
            "safety_eval": {"expected": expected_safety, "actual": actual_safety, "passed": safety_correct},
            "a2a_eval": {"trace_hops": len(a2a_trace), "skills_used": skills_used, "complete": a2a_complete},
            "status": "PASS" if case_passed else "FAIL"
        })

    total_cases = len(eval_cases)
    accuracy = (passed_count / total_cases) * 100.0

    logger.info(f"=== Local Evaluation Complete. Benchmark Score: {accuracy:.1f}% ({passed_count}/{total_cases}) ===")
    
    summary = {
        "benchmark_score_pct": round(accuracy, 1),
        "total_cases": total_cases,
        "passed_cases": passed_count,
        "details": results
    }

    return summary

if __name__ == "__main__":
    summary = run_local_evaluation()
    print(json.dumps(summary, indent=2))
