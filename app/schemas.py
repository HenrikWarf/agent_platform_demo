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


# ─── A2UI Offer Banner Schema (ICA Sweden / Retail Personalization) ─────────

class A2UIProductInfo(BaseModel):
    name: str = Field(description="Product name in Swedish, e.g. 'Ekologisk Svensk Mellanmjölk'")
    brand_line: str = Field(description="Brand or private label line, e.g. 'ICA I love eco', 'ICA Gott Liv', 'Arla'")
    volume_weight: str = Field(description="Volume or weight, e.g. '1.5 Liter', '500g', '1 kg'")
    origin_badge: str = Field(default="Från Sverige 🇸🇪", description="Origin certification, e.g. 'Från Sverige 🇸🇪'")
    eco_badge: str | None = Field(default="KRAV 🌿", description="Eco certification, e.g. 'KRAV 🌿', 'Ekologisk', or None")
    category: str = Field(description="Product grocery category, e.g. 'Mejeri & Ägg', 'Frukt & Grönt', 'Kött & Chark'")
    icon: str = Field(default="shopping-bag", description="Icon identifier, e.g. 'milk', 'apple', 'coffee', 'meat', 'shopping-bag'")


class A2UIPricing(BaseModel):
    deal_price_major: str = Field(description="Deal price major digits, e.g. '24', '29', '45'")
    deal_price_minor: str = Field(default="90", description="Deal price minor/öre digits, e.g. '90', '00', ':-'")
    unit: str = Field(default="kr/st", description="Unit of sale, e.g. 'kr/st', 'kr/kg', 'för 2st'")
    regular_price: str = Field(description="Regular price with unit, e.g. '34:90 kr/st'")
    savings_text: str = Field(description="Savings summary, e.g. 'Spara 10:00 (29% rabatt)'")
    comparison_price: str = Field(description="Comparison price (jfr-pris), e.g. 'Jfr-pris 16:60/l'")
    limit_text: str = Field(default="Max 2 köp/stammis", description="Purchase limitation per customer")


class A2UIRecipe(BaseModel):
    title: str = Field(description="Recipe title in Swedish matching the ingredient")
    prep_time: str = Field(default="25 min", description="Cooking/prep time, e.g. '25 min'")
    servings: str = Field(default="4 port", description="Number of servings, e.g. '4 port'")
    difficulty: str = Field(default="Enkel", description="Difficulty level, e.g. 'Enkel', 'Medel'")


class A2UIOfferBannerSchema(BaseModel):
    brand: str = Field(default="ICA", description="Retailer brand name, e.g. 'ICA'")
    store_format: str = Field(default="ICA Maxi Stormarknad", description="Store format, e.g. 'ICA Maxi', 'ICA Kvantum', 'ICA Supermarket', 'ICA Nära'")
    store_name: str = Field(default="ICA Maxi Lindhagen, Stockholm", description="Store location name")
    badge_type: str = Field(default="Stammispris", description="Badge type, e.g. 'Stammispris', 'Personligt Erbjudande', 'HelgKlipp!'")
    personalization_reason: str = Field(description="Personalization reason in Swedish explaining why this customer received the deal")
    target_persona: str = Field(default="Ekologiskt Medveten", description="Target customer persona, e.g. 'Barnfamilj', 'Ekologiskt Medveten', 'Prisjägare', 'Gourmet'")
    product: A2UIProductInfo = Field(description="Product information")
    pricing: A2UIPricing = Field(description="Deal pricing and savings calculations")
    valid_until: str = Field(default="Söndag 24 aug", description="Expiry date in Swedish, e.g. 'Söndag 24 aug'")
    days_remaining: int = Field(default=3, description="Days remaining on the offer")
    recipe_suggestion: A2UIRecipe | None = Field(default=None, description="Optional matching recipe pairing")


