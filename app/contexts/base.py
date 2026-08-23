"""
Base class for Multi-Tenant Client Contexts.

Defines the contract for company profiles, brand guidelines, BigQuery mappings,
and prompt context injections across different retail clients.
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ClientContext:
    client_id: str
    client_name: str
    tagline: str
    industry: str
    currency_symbol: str
    currency_code: str
    loyalty_program_name: str
    bigquery_dataset: str
    primary_color: str
    accent_color: str
    logo_text: str
    icon_name: str
    headquarters: str
    annual_revenue: str
    store_count: str
    customer_count: str
    product_categories: list[str]
    customer_segments: list[str]
    company_prompt: str
    sample_questions: list[dict[str, Any]] = field(default_factory=list)
    badge_tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert client context to dictionary format for JSON serialization."""
        return {
            "client_id": self.client_id,
            "client_name": self.client_name,
            "tagline": self.tagline,
            "industry": self.industry,
            "currency_symbol": self.currency_symbol,
            "currency_code": self.currency_code,
            "loyalty_program_name": self.loyalty_program_name,
            "bigquery_dataset": self.bigquery_dataset,
            "primary_color": self.primary_color,
            "accent_color": self.accent_color,
            "logo_text": self.logo_text,
            "icon_name": self.icon_name,
            "headquarters": self.headquarters,
            "annual_revenue": self.annual_revenue,
            "store_count": self.store_count,
            "customer_count": self.customer_count,
            "product_categories": self.product_categories,
            "customer_segments": self.customer_segments,
            "sample_questions": self.sample_questions,
            "badge_tags": self.badge_tags,
        }
