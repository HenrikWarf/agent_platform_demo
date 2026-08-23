"""
Company Context & Brand Profile Hub.

Centralized company context injected into agent system instructions.
Delegates to app.contexts for multi-tenant client resolution.
"""
from app.contexts.crazy_fashion import CRAZY_FASHION_PROMPT, CURRENT_DATE, CURRENT_YEAR
from app.contexts.registry import get_client_context, get_company_prompt

COMPANY_CONTEXT = CRAZY_FASHION_PROMPT

__all__ = [
    "COMPANY_CONTEXT",
    "CURRENT_DATE",
    "CURRENT_YEAR",
    "get_client_context",
    "get_company_prompt",
]
