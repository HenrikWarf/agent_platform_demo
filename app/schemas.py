"""
Pydantic schemas for structured agent output.

Used by formatter sub-agents with output_schema to enforce
valid JSON responses for the Strategy and Content pipelines.
"""

from pydantic import BaseModel, Field

# ─── Strategy Schema ──────────────────────────────────────────────────────────

class CampaignPillar(BaseModel):
    pillar: str = Field(description="Name of the campaign pillar, e.g. 'Personalized Win-Back'")
    description: str = Field(description="One-sentence description of the pillar")
    channels: list[str] = Field(description="2-3 marketing channels for this pillar, e.g. ['Email', 'SMS']")


class ChannelMix(BaseModel):
    channel: str = Field(description="Marketing channel name, e.g. 'Email'")
    weight: str = Field(description="Percentage weight allocation, e.g. '40%'")
    cadence: str = Field(description="Sending cadence, e.g. '2x per week'")


class StrategySchema(BaseModel):
    campaign_title: str = Field(description="Campaign title, max 10 words")
    business_goal: str = Field(description="One-sentence business objective")
    target_cohort: str = Field(description="Target customer segment name")
    projected_revenue_recovery: str = Field(description="Projected revenue figure, e.g. '$1.2M'")
    campaign_pillars: list[CampaignPillar] = Field(description="Exactly 3 campaign pillars")
    channel_mix: list[ChannelMix] = Field(description="Exactly 4 channel allocations")
    ab_testing_hypotheses: list[str] = Field(description="Exactly 3 A/B testing hypotheses")


# ─── Content Schema ──────────────────────────────────────────────────────────

class EmailTemplate(BaseModel):
    subject: str = Field(description="Email subject line, max 10 words")
    preview_text: str = Field(description="Preview/preheader text, one sentence")
    body: str = Field(description="Email body, 3-4 sentences")
    cta_button: str = Field(description="Call-to-action button text, max 5 words")


class SocialPost(BaseModel):
    platform: str = Field(description="Social media platform, e.g. 'LinkedIn', 'Instagram'")
    post_copy: str = Field(description="Post copy, max 2 sentences", alias="copy")


class ContentSchema(BaseModel):
    email_template: EmailTemplate | None = Field(
        default=None,
        description="Email marketing template, provided when email copy is requested or for full campaigns"
    )
    social_posts: list[SocialPost] | None = Field(
        default=None,
        description="Social media posts (e.g. Instagram/LinkedIn), provided when social copy is requested or for full campaigns"
    )
    sms_copy: str | None = Field(
        default=None,
        description="SMS message (max 160 characters), provided when SMS copy is requested or for full campaigns"
    )


# ─── Product Recommendation Schema ──────────────────────────────────────────

class RecommendedProduct(BaseModel):
    product_id: str = Field(description="Product identifier, e.g. 'PROD-001'")
    product_name: str = Field(description="Product title, e.g. 'NOVA Oversized Blazer'")
    category: str = Field(description="Product category, e.g. 'Womenswear', 'Menswear', 'Accessories'")
    price_eur: float = Field(description="Price in EUR (€), e.g. 89.99")
    sustainability_certified: bool = Field(description="Whether the item is certified sustainable/recycled")
    recommendation_reason: str = Field(description="2-3 sentence data-driven reasoning why this product fits the target customer segment attributes")


class ProductRecommendationSchema(BaseModel):
    target_segment: str = Field(description="Name of the customer segment analyzed, e.g. 'VIP Fashionistas', 'Dormant At-Risk'")
    segment_profile_summary: str = Field(description="2-3 sentence summary of the segment's demographic profile, spend capacity, and category affinity")
    recommended_products: list[RecommendedProduct] = Field(description="Exactly 5 curated product recommendations from the catalog")
    overall_curation_strategy: str = Field(description="2-3 sentence summary of the overall merchandising and pricing strategy for this cohort")

