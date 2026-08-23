"""
Client Context Engine Package.
"""
from app.contexts.base import ClientContext
from app.contexts.crazy_fashion import CRAZY_FASHION_CONTEXT
from app.contexts.ica_sweden import ICA_SWEDEN_CONTEXT
from app.contexts.registry import (
    CLIENT_REGISTRY,
    DEFAULT_CLIENT_ID,
    get_client_context,
    get_company_prompt,
    list_clients,
)

__all__ = [
    "ClientContext",
    "CRAZY_FASHION_CONTEXT",
    "ICA_SWEDEN_CONTEXT",
    "CLIENT_REGISTRY",
    "DEFAULT_CLIENT_ID",
    "get_client_context",
    "get_company_prompt",
    "list_clients",
]
