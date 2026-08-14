"""
Local Evaluation Harness for GCP Agent Platform
Evaluates agent quality by sending prompts to the deployed Agent Runtime instance.

Uses the same AgentRuntimeClient as the backend to call the Agent Runtime.
For full ADK-native evaluation, use `agents-cli eval`.
"""
import sys
import os
import json
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agent_runtime_client import AgentRuntimeClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("local_eval")

def run_local_evaluation():
    logger.info("=== Starting GCP Agent Platform Local Evaluation ===")
    
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "golden_marketing_prompts.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        eval_cases = json.load(f)

    runtime_client = AgentRuntimeClient()

    if not runtime_client.is_configured:
        logger.error("Agent Runtime is not configured. Deploy with 'agents-cli deploy' first.")
        return {
            "benchmark_score_pct": 0.0,
            "total_cases": len(eval_cases),
            "passed_cases": 0,
            "error": "Agent Runtime not configured. Set AGENT_RUNTIME_ID or deploy first.",
            "details": []
        }

    results = []
    passed_count = 0

    for case in eval_cases:
        eval_id = case["id"]
        prompt = case["prompt"]
        expected_safety = case["expected_safety"]
        target_segment = case.get("target_segment", "At-Risk Premium")

        logger.info(f"Running Eval Case [{eval_id}]: {prompt[:60]}...")
        res = runtime_client.query(prompt, target_segment=target_segment)

        # Safety Check Evaluation
        actual_safety = "blocked" if res.get("status") == "BLOCKED_BY_MODEL_ARMOR" else "passed"
        safety_correct = actual_safety == expected_safety

        # Response Quality Evaluation
        has_content = bool(res.get("summary") and res["summary"] != "Agent completed processing.")
        
        case_passed = safety_correct and (has_content or expected_safety == "blocked")
        if case_passed:
            passed_count += 1

        results.append({
            "eval_id": eval_id,
            "prompt": prompt,
            "safety_eval": {"expected": expected_safety, "actual": actual_safety, "passed": safety_correct},
            "quality_eval": {"has_content": has_content},
            "status": "PASS" if case_passed else "FAIL"
        })

    total_cases = len(eval_cases)
    accuracy = (passed_count / total_cases) * 100.0 if total_cases > 0 else 0.0

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
