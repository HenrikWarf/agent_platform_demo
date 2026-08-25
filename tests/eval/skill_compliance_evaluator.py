"""Custom LLM-as-judge evaluating adherence to skill frameworks and structural guidelines."""

import os

from google import genai
from google.genai import types
from pydantic import BaseModel


class _SkillComplianceVerdict(BaseModel):
    score: int  # 1-5 scale (5 = strict adherence to all relevant skill guidelines)
    strategy_skill_compliant: bool
    content_skill_compliant: bool
    analytics_skill_compliant: bool
    recommendation_skill_compliant: bool
    explanation: str


def _extract_text(content):
    if not content:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        parts = content.get("parts", [])
        if isinstance(parts, list):
            texts = []
            for p in parts:
                if isinstance(p, dict) and "text" in p:
                    texts.append(p["text"])
                elif isinstance(p, str):
                    texts.append(p)
            if texts:
                return "\n".join(texts)
        return str(content)
    return str(content)


def evaluate(instance):
    """Evaluates whether the agent output conforms to Crazy Fashion's 4 skills."""
    prompt_text = _extract_text(instance.get("prompt", ""))
    response_text = _extract_text(instance.get("response", ""))

    tenant = os.environ.get("TENANT_ID", "crazy_fashion")
    client_name = "ICA Sverige" if tenant == "ica_sweden" else "Crazy Fashion"
    currency = "SEK (kr)" if tenant == "ica_sweden" else "EUR (€)"

    eval_prompt = f"""You are the Multi-Agent Skill Compliance Officer for {client_name}.
Evaluate whether the agent's response strictly adheres to the relevant skill specifications:

Skill Rules:
1. `campaign-framework` (for strategy tasks):
   - Exactly 3 campaign pillars with name, description, and channel assignments.
   - Exactly 4 channel mix entries with percentage weights summing to 100%.
   - Exactly 3 testable A/B testing hypotheses.
   - Projected revenue recovery in {currency}.
2. `brand-voice` (for copywriting tasks):
   - Scopes output strictly to the requested channel(s) (Email, Social, or SMS). For multi-channel requests, outputs all three.
   - Email template (when requested): subject line, preview text, body, CTA button.
   - Social media posts (when requested): platform name and copy.
   - SMS copy (when requested): strictly max 160 characters.
   - Brand voice: aligned with {client_name} and pricing in {currency}.
3. `customer-analytics` (for data tasks):
   - Data summaries are fact-grounded in BigQuery query results without fabricated numbers.
   - Monetary values in {currency}.
4. `product-recommender` (for merchandise recommendation tasks):
   - Curates exactly 5 products from catalog with valid product_id, product_name, category, price, and sustainability status.
   - Provides clear 2-3 sentence data-driven reasoning for each recommended item linked to segment attributes.
   - Outlines an overarching merchandising strategy for the segment in {currency}.
5. Direct Q&A / Safety:
   - For direct questions or adversarial requests, skill rules that do not apply should be marked compliant.

User Prompt: {prompt_text}
Agent Response: {response_text[:3500]}

Return JSON with score (1 to 5), strategy_skill_compliant (bool), content_skill_compliant (bool), analytics_skill_compliant (bool), recommendation_skill_compliant (bool), and explanation."""

    gemini_location = os.environ.get("GEMINI_LOCATION", "global")
    client = genai.Client(location=gemini_location)

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=eval_prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                response_schema=_SkillComplianceVerdict,
            ),
        )

        verdict = response.parsed
        if verdict is None:
            return {"score": 3, "explanation": "Skill compliance evaluation returned unparseable verdict"}

        return {
            "score": max(1, min(5, verdict.score)),
            "explanation": (
                f"[Strategy Compliant: {verdict.strategy_skill_compliant} | "
                f"Content Compliant: {verdict.content_skill_compliant} | "
                f"Analytics Compliant: {verdict.analytics_skill_compliant} | "
                f"Recommendation Compliant: {verdict.recommendation_skill_compliant}] {verdict.explanation}"
            ),
        }
    except Exception as exc:
        return {"score": 3, "explanation": f"Skill compliance evaluation fallback: {exc}"}
