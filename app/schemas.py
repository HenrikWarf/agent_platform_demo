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
    email_template: EmailTemplate = Field(description="Email marketing template")
    social_posts: list[SocialPost] = Field(description="Exactly 2 social media posts")
    sms_copy: str = Field(description="SMS message, max 160 characters")
