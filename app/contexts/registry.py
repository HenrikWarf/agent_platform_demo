"""
Client Context Registry & Factory.

Manages active client workspaces (Crazy Fashion, ICA Sverige) and provides
lookup methods to resolve company profiles, prompts, and database targets.
"""

from app.contexts.base import ClientContext
from app.contexts.crazy_fashion import CRAZY_FASHION_CONTEXT
from app.contexts.ica_sweden import ICA_SWEDEN_CONTEXT

CLIENT_REGISTRY: dict[str, ClientContext] = {
    "crazy_fashion": CRAZY_FASHION_CONTEXT,
    "ica_sweden": ICA_SWEDEN_CONTEXT,
}

DEFAULT_CLIENT_ID = "crazy_fashion"


def list_clients() -> list[dict]:
    """Return serialized metadata for all available client contexts."""
    return [ctx.to_dict() for ctx in CLIENT_REGISTRY.values()]


def get_client_context(client_id: str | None = None) -> ClientContext:
    """Retrieve a ClientContext by client_id, falling back to default."""
    if not client_id or client_id not in CLIENT_REGISTRY:
        return CLIENT_REGISTRY[DEFAULT_CLIENT_ID]
    return CLIENT_REGISTRY[client_id]


def get_company_prompt(client_id: str | None = None) -> str:
    """Get the injected system prompt for a specific client."""
    return get_client_context(client_id).company_prompt
