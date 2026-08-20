"""Local LLM-as-judge for `custom_response_quality` (see eval_config.yaml)."""

import json
import os

from google import genai
from google.genai import types
from pydantic import BaseModel


class _Verdict(BaseModel):
    score: int  # 1-5
    explanation: str


def _summarize_agent_data(agent_data, max_chars=3000):
    if not agent_data:
        return "None"
    if isinstance(agent_data, (dict, list)):
        raw_str = json.dumps(agent_data)
    else:
        raw_str = str(agent_data)
    if len(raw_str) > max_chars:
        return raw_str[:max_chars] + "... [truncated]"
    return raw_str


def evaluate(instance):
    reference = instance.get("reference")
    rubric = (
        "Grade the agent's final response on a 1-5 scale (1 poor, 5 excellent) for "
        "accuracy, relevance, and clarity in the context of Crazy Fashion's marketing operations."
    )
    if reference:
        rubric += (
            " The response should agree with the expected answer below; penalize "
            "factual disagreement with it."
        )

    agent_summary = _summarize_agent_data(instance.get("agent_data", ""))
    prompt = (
        f"You are an expert QA evaluator for Crazy Fashion's AI marketing assistant. {rubric}\n"
        f"User Prompt: {instance.get('prompt', '')}\n"
        f"Final Response: {instance.get('response', '')}\n"
    )
    if reference:
        prompt += f"Expected Answer (ground truth): {reference}\n"
    prompt += f"Agent Trajectory Summary: {agent_summary}\n"

    gemini_location = os.environ.get("GEMINI_LOCATION", "global")
    client = genai.Client(location=gemini_location)
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0,  # deterministic grading
                response_mime_type="application/json",
                response_schema=_Verdict,  # guaranteed schema-valid JSON
            ),
        )
        verdict = response.parsed
        if verdict is None:
            return {"score": 0, "explanation": response.text or ""}
        return {"score": max(1, min(5, verdict.score)), "explanation": verdict.explanation}
    except Exception as exc:
        return {"score": 3, "explanation": f"Evaluation fallback due to API error: {exc}"}
