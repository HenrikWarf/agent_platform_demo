"""
Dynamic AI Follow-Up Question Generator
Uses Gemini 3.6 Flash on Vertex AI to inspect conversation context and generate
6 hyper-relevant, actionable next-step follow-up objectives for Crazy Fashion marketing.
"""
import logging
import os
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from backend.config import Config

logger = logging.getLogger("suggestions_generator")


class SuggestionItem(BaseModel):
    title: str = Field(description="Short 3-5 word punchy question title")
    prompt: str = Field(description="The full actionable prompt to execute against the multi-agent system")
    agent: str = Field(description="Target agent: 'Analytics Agent', 'Strategy Pipeline', 'Content Pipeline', or 'Multi-Agent Orchestrator'")
    badge: str = Field(description="Short badge tag: 'SQL Drill-Down', 'Pillar 1 Copy', 'A/B Testing', 'VIP Flow', etc.")
    color: str = Field(description="Color code: 'var(--color-success)', 'var(--color-purple)', 'var(--color-warning)', or '#3b82f6'")
    category: str = Field(description="Category key: 'analytics', 'strategy', 'content', or 'campaign'")
    segment: str = Field(default="", description="Optional customer segment mentioned in the question")


class DynamicSuggestionsResult(BaseModel):
    questions: list[SuggestionItem] = Field(description="List of 6 distinct follow-up questions")


def _format_conversation_context(messages: list[dict[str, Any]], max_turns: int = 5) -> str:
    """Extracts compact chronological context from the last N message turns."""
    if not messages:
        return "No prior conversation. User is starting a new marketing session."

    formatted_turns = []
    # Take the last max_turns messages
    recent = messages[-max_turns:]
    for msg in recent:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        # Compact text if very long
        if len(content) > 600:
            content = content[:600] + "... [truncated]"

        extra_info = []
        if msg.get("data"):
            data = msg["data"]
            if data.get("strategy"):
                strat = data["strategy"]
                extra_info.append(f"Strategy Generated: {strat.get('campaign_title', '')}")
            if data.get("content"):
                extra_info.append("Creative Content Assets Generated")
            if data.get("analytics_data") or data.get("sql_executed"):
                extra_info.append("BigQuery SQL Analytics Executed")

        tag = f"[{role.upper()}]"
        if extra_info:
            tag += f" ({', '.join(extra_info)})"
        formatted_turns.append(f"{tag}: {content}")

    return "\n".join(formatted_turns)


def generate_dynamic_followups(
    messages: list[dict[str, Any]],
    current_segment: str = "All Cohorts (Full Dataset)"
) -> list[dict[str, Any]]:
    """Calls Gemini 3.6 Flash to generate 6 dynamic follow-up marketing questions based on context."""
    context_str = _format_conversation_context(messages)

    system_instruction = (
        "You are an expert AI Marketing Director for 'Crazy Fashion', a leading Nordic fashion retailer "
        "(Stockholm HQ, omni-channel retail across Sweden, Norway, Denmark, Finland, EUR currency).\n\n"
        "Your role is to inspect the recent conversation history between the marketer and our multi-agent AI assistant, "
        "and generate exactly 6 high-value, deep, actionable follow-up questions to steer the marketer to their next logical steps.\n\n"
        "Multi-Agent Capabilities Available:\n"
        "1. Analytics Agent: Executes BigQuery SQL queries on customer_rfm_summary, customer_demographics_360, "
        "customer_transactions, product_catalog, and customer_events.\n"
        "2. Recommendation Pipeline: Curates 5 data-driven product recommendations from product_catalog matched to segment traits and past purchases.\n"
        "3. Strategy Pipeline: Builds 3-pillar omnichannel campaign frameworks, 100% channel mix weightings, "
        "projected revenue recoveries in EUR, and testable A/B hypotheses.\n"
        "4. Content Pipeline: Crafts brand-aligned Nordic creative copy (email template, social media posts, SMS under 160 chars).\n"
        "5. Multi-Agent Orchestrator: End-to-end full pipeline execution connecting data -> recommendations -> strategy -> creative.\n\n"
        "Distribution Requirements for the 6 Questions:\n"
        "- 1-2 BigQuery SQL drill-down questions (agent: 'Analytics Agent', category: 'analytics', color: 'var(--color-success)')\n"
        "- 1 Product recommendation question (agent: 'Recommendation Pipeline', category: 'recommendation', color: '#10b981')\n"
        "- 1-2 Campaign strategy / A/B testing questions (agent: 'Strategy Pipeline', category: 'strategy', color: 'var(--color-purple)')\n"
        "- 1 Creative copy asset generation question (agent: 'Content Pipeline', category: 'content', color: 'var(--color-warning)')\n"
        "- 1 End-to-end multi-agent orchestration question (agent: 'Multi-Agent Orchestrator', category: 'campaign', color: '#3b82f6')\n\n"
        "All questions must directly build upon the topics, customer segments, collections, and insights discussed in the conversation."
    )

    prompt = (
        f"Recent Conversation History:\n{context_str}\n\n"
        "Generate 6 diverse, hyper-relevant follow-up questions for the marketer."
    )

    gemini_location = os.environ.get("GEMINI_LOCATION", Config.GEMINI_LOCATION)
    client = genai.Client(location=gemini_location)

    try:
        response = client.models.generate_content(
            model=Config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=DynamicSuggestionsResult,
            ),
        )
        if response.parsed and response.parsed.questions:
            return [q.model_dump() for q in response.parsed.questions]
    except Exception as e:
        logger.warning(f"Dynamic suggestions call failed ({e}). Using smart fallbacks.")

    # Context-aware fallback templates
    segment = current_segment if current_segment != "All Cohorts (Full Dataset)" else "VIP Fashionistas"
    return [
        {
            "title": f"Drill-down on {segment}",
            "prompt": f"Analyze the top product categories and average order value for our '{segment}' cohort in BigQuery.",
            "agent": "Analytics Agent",
            "badge": "BigQuery SQL",
            "color": "var(--color-success)",
            "category": "analytics",
            "segment": segment
        },
        {
            "title": "5-Product Segment Curation",
            "prompt": f"Recommend 5 curated products for our '{segment}' cohort based on their demographics and purchase history.",
            "agent": "Recommendation Pipeline",
            "badge": "Curated Assortment",
            "color": "#10b981",
            "category": "recommendation",
            "segment": segment
        },
        {
            "title": "3-Pillar Retention Strategy",
            "prompt": f"Formulate a 3-pillar omnichannel campaign framework for '{segment}' with 4 channel mix weights summing to 100%.",
            "agent": "Strategy Pipeline",
            "badge": "Strategy",
            "color": "var(--color-purple)",
            "category": "strategy",
            "segment": segment
        },
        {
            "title": "A/B Testing Conversion Test",
            "prompt": f"Propose 3 testable A/B testing hypotheses to boost checkout conversion and app adoption for '{segment}'.",
            "agent": "Strategy Pipeline",
            "badge": "A/B Hypotheses",
            "color": "var(--color-purple)",
            "category": "strategy",
            "segment": segment
        },
        {
            "title": "Creative Asset Suite (Email + Social)",
            "prompt": f"Draft creative marketing copy for '{segment}': email template, 2 Instagram posts, and SMS under 160 characters.",
            "agent": "Content Pipeline",
            "badge": "Creative Copy",
            "color": "var(--color-warning)",
            "category": "content",
            "segment": segment
        },
        {
            "title": "End-to-End Campaign Execution",
            "prompt": f"Run full pipeline for '{segment}': Extract customer metrics -> recommend products -> develop 3-pillar strategy -> craft creative assets.",
            "agent": "Multi-Agent Orchestrator",
            "badge": "Full Flow",
            "color": "#3b82f6",
            "category": "campaign",
            "segment": segment
        }
    ]
