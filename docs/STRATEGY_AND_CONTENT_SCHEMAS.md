# Strategy & Content Schemas Documentation
## Crazy Fashion Multi-Agent Marketing Platform

---

## 1. Overview & Architectural Separation of Concerns

The **Crazy Fashion Multi-Agent Marketing Platform** uses the **Google Agent Development Kit (ADK)** to separate strategic campaign planning from creative copy generation. 

Rather than overloading a single agent with both strategy and copywriting, the platform decouples these responsibilities into two specialized sequential pipelines:

```
                                    +-----------------------+
                                    |     User Request      |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    | marketing_orchestrator|
                                    |    (Root Supervisor)  |
                                    +-----------+-----------+
                                                |
                      +-------------------------+-------------------------+
                      | (Analytics Context)                               | (Strategic Formulation)
                      v                                                   v
          +-----------------------+                           +-----------------------+
          |    analytics_agent    |                           |   strategy_pipeline   |
          | (BigQuery SQL Queries)| ────────────────────────> | (SequentialAgent)     |
          +-----------------------+   (Passes Cohort Data)    +-----------+-----------+
                                                                          | (Passes Strategy Context)
                                                                          v
                                                              +-----------------------+
                                                              |   content_pipeline    |
                                                              | (SequentialAgent)     |
                                                              +-----------+-----------+
                                                                          |
                                                                          v
                                                              +-----------------------+
                                                              |  Structured Payloads  |
                                                              | StrategySchema (JSON) |
                                                              | ContentSchema  (JSON) |
                                                              +-----------------------+
```

| Pipeline | Sequential Agents | Skill Bound | Output Schema | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Recommendation Pipeline** | `recommendation_reasoner` ➔ `recommendation_formatter` | `skills/product-recommender/` | `ProductRecommendationSchema` | Segment-aligned merchandising: exactly 5 curated products from BigQuery catalog with prices in EUR, eco-status, and data-driven rationale. |
| **Strategy Pipeline** | `strategy_reasoner` ➔ `strategy_formatter` | `skills/campaign-framework/` | `StrategySchema` | High-level strategy: campaign pillars, channel mix weights, dispatch cadence, EUR projections, and A/B test hypotheses. |
| **Content Pipeline** | `content_reasoner` ➔ `content_formatter` | `skills/brand-voice-craft/` | `ContentSchema` | Channel-selective creative copy: Email template, Social media posts, and SMS messages aligned with Crazy Fashion brand voice. |

---

## 2. Product Recommendation Schema (`ProductRecommendationSchema`)

### 2.1 Pydantic Model Definition ([`app/schemas.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/schemas.py))

```python
from pydantic import BaseModel, Field

class RecommendedProduct(BaseModel):
    product_id: str = Field(description="Product ID from product_catalog, e.g. 'PROD-001'")
    product_name: str = Field(description="Full product name, e.g. 'FRÖST Recycled Puffer Jacket'")
    category: str = Field(description="Product category, e.g. 'Outerwear'")
    price_eur: float = Field(description="Product retail price in EUR")
    sustainability_certified: bool = Field(description="Whether the product is certified sustainable")
    recommendation_reason: str = Field(
        description="2-3 sentence data-driven explanation of why this product fits the segment's attributes and preferences"
    )


class ProductRecommendationSchema(BaseModel):
    target_segment: str = Field(description="Customer segment name, e.g. 'VIP Fashionistas'")
    segment_profile_summary: str = Field(description="2-3 sentence summary of the segment's key attributes, spend capacity, and purchasing patterns")
    recommended_products: list[RecommendedProduct] = Field(description="Exactly 5 curated products from the Crazy Fashion catalog")
    overall_curation_strategy: str = Field(description="2-3 sentence overview of the merchandising curation strategy for this segment")
```

### 2.2 Recommendation Validation Rules
1. **Exactly 5 Products**: Must curate exactly 5 items from `agent-demo-09.marketing_analytics.product_catalog`.
2. **Data-Driven Grounding**: Each product recommendation must be justified with segment-specific traits (e.g. AOV, loyalty tier, preferred category, eco-consciousness).
3. **Currency & Accuracy**: Prices must be numeric floats in **EUR (€)** accurately reflecting the product catalog.
4. **Assortment Balance**: Merchandising strategy must balance anchor hero pieces with accessible accessories or seasonal layers.

### 2.3 Example Recommendation JSON Output

```json
{
  "target_segment": "VIP Fashionistas",
  "segment_profile_summary": "High-spending tier with average AOV exceeding €140 and Platinum loyalty status. Shows strong preference for tailored Outerwear, sustainable materials, and luxury styling.",
  "recommended_products": [
    {
      "product_id": "PROD-001",
      "product_name": "FRÖST Recycled Puffer Jacket",
      "category": "Outerwear",
      "price_eur": 129.99,
      "sustainability_certified": true,
      "recommendation_reason": "Aligns with VIP spend capacity and high interest in premium sustainable outerwear for the Nordic autumn season."
    },
    {
      "product_id": "PROD-008",
      "product_name": "NORDIC Wool Tailored Coat",
      "category": "Outerwear",
      "price_eur": 179.99,
      "sustainability_certified": true,
      "recommendation_reason": "Hero tailoring piece matching Platinum tier preference for timeless Stockholm showroom aesthetics."
    },
    {
      "product_id": "PROD-014",
      "product_name": "FJORD Silk Blend Midi Dress",
      "category": "Womenswear",
      "price_eur": 89.99,
      "sustainability_certified": false,
      "recommendation_reason": "High-margin occasion wear frequently paired with outerwear in VIP transaction baskets."
    },
    {
      "product_id": "PROD-022",
      "product_name": "BERGEN Organic Cashmere Knit",
      "category": "Knitwear",
      "price_eur": 119.99,
      "sustainability_certified": true,
      "recommendation_reason": "Premium layering piece with certified organic fibers, offering high perceived value for loyalty point redemption."
    },
    {
      "product_id": "PROD-035",
      "product_name": "STOCKHOLM Minimalist Leather Tote",
      "category": "Accessories",
      "price_eur": 99.99,
      "sustainability_certified": false,
      "recommendation_reason": "Complementary luxury accessory with high repeat purchase frequency among Scandinavian urban shoppers."
    }
  ],
  "overall_curation_strategy": "Focus on high-AOV, eco-certified outerwear and premium knitwear layered with iconic accessories to reinforce Crazy Fashion's modern Scandinavian brand image."
}
```

---

## 3. Strategy Schema (`StrategySchema`)

### 3.1 Pydantic Model Definition ([`app/schemas.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/schemas.py))

```python
from pydantic import BaseModel, Field

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
    projected_revenue_recovery: str = Field(description="Projected revenue figure, e.g. '€45,000'")
    campaign_pillars: list[CampaignPillar] = Field(description="Exactly 3 campaign pillars")
    channel_mix: list[ChannelMix] = Field(description="Exactly 4 channel allocations summing to 100%")
    ab_testing_hypotheses: list[str] = Field(description="Exactly 3 A/B testing hypotheses")
```

### 3.2 Strategy Validation Rules
1. **Pillars**: Must produce **exactly 3** campaign pillars leveraging Crazy Fashion strengths (Sustainability, Crazy Club Loyalty, Seasonal Drops, Inclusivity).
2. **Channel Mix**: Must define **exactly 4** marketing channels with percentage weights summing to 100% and specific send cadences (e.g. `2x per week`, `Day 1, Day 14`).
3. **Currency**: All monetary targets and revenue recovery projections must be denominated in **EUR (€)**.
4. **No Raw Copy**: The Strategy pipeline does **not** write raw email copy or social captions; it defines the architecture that informs the Content pipeline.

### 3.3 Example Strategy JSON Output

```json
{
  "campaign_title": "Dormant At-Risk Nordic Autumn Reactivation",
  "business_goal": "Re-engage 20% of lapsed customers with sustainable autumn essentials within 30 days.",
  "target_cohort": "Dormant At-Risk",
  "projected_revenue_recovery": "€48,500",
  "campaign_pillars": [
    {
      "pillar": "Personalized Incentive Win-Back",
      "description": "Offer tiered Crazy Club voucher rewards tailored to historical spend to drive first re-engagement.",
      "channels": ["Email", "SMS"]
    },
    {
      "pillar": "Sustainable Essentials Showcase",
      "description": "Highlight certified eco-friendly outerwear and knitwear collections to appeal to conscious Scandinavian shoppers.",
      "channels": ["Instagram & Social", "Email"]
    },
    {
      "pillar": "Frictionless Omnichannel Re-Entry",
      "description": "Promote click-and-collect in local Nordic flagship stores with double loyalty points on return visits.",
      "channels": ["App Push Notifications", "SMS"]
    }
  ],
  "channel_mix": [
    {
      "channel": "Email",
      "weight": "40%",
      "cadence": "2x per week"
    },
    {
      "channel": "Instagram & Social",
      "weight": "25%",
      "cadence": "3x per week"
    },
    {
      "channel": "SMS",
      "weight": "20%",
      "cadence": "Day 1 and Day 14"
    },
    {
      "channel": "App Push Notifications",
      "weight": "15%",
      "cadence": "Weekly flash alerts"
    }
  ],
  "ab_testing_hypotheses": [
    "A €15 voucher incentive produces 18% higher reactivation CTR than a flat 20% discount code.",
    "Subject lines highlighting circular sustainability achieve higher open rates than general sale announcements.",
    "SMS alerts delivered on Saturday morning yield 2.4x higher conversion than weekday afternoon dispatches."
  ]
}
```

---

## 4. Content Schema (`ContentSchema`)

### 4.1 Pydantic Model Definition ([`app/schemas.py`](file:///Users/henrikw/Projects/agent_platform_demo/app/schemas.py))

The `ContentSchema` is designed with **optional fields** to support **strict channel selectivity**:

```python
from pydantic import BaseModel, Field

class EmailTemplate(BaseModel):
    subject: str = Field(description="Email subject line, max 10 words")
    preview_text: str = Field(description="Preview/preheader text, one sentence")
    body: str = Field(description="Email body, 3-4 sentences with clear value proposition")
    cta_button: str = Field(description="Call-to-action button text, max 5 words")


class SocialPost(BaseModel):
    platform: str = Field(description="Social media platform, e.g. 'Instagram', 'LinkedIn'")
    post_copy: str = Field(description="Post copy, max 2 sentences", alias="copy")


class ContentSchema(BaseModel):
    email_template: EmailTemplate | None = Field(
        default=None,
        description="Email marketing template, populated when email copy is requested or for full campaigns"
    )
    social_posts: list[SocialPost] | None = Field(
        default=None,
        description="Social media posts, populated when social copy is requested or for full campaigns"
    )
    sms_copy: str | None = Field(
        default=None,
        description="SMS message (max 160 characters), populated when SMS copy is requested or for full campaigns"
    )
```

---

## 5. Channel Selection Rules & Payload Examples

The Content Agent inspects the user prompt to determine whether to generate a single channel or the complete multi-channel suite:

### 5.1 Email Only Request
*Prompt*: *"Draft a win-back email template only for our Dormant At-Risk customers."*

```json
{
  "email_template": {
    "subject": "We miss you! Take €15 off your next look",
    "preview_text": "Rediscover our newest sustainable arrivals with an exclusive gift waiting in your account.",
    "body": "It’s been a while since your last visit, and your wardrobe is missing our latest sustainable essentials like the versatile NOVA Blazer (now €79.99). We’ve added an exclusive €15 voucher directly to your Crazy Club account to help you refresh your everyday style with confident, conscious fashion. Discover our trend-forward arrivals today and enjoy complimentary carbon-neutral shipping on your return order.",
    "cta_button": "Claim Your €15 Voucher"
  },
  "social_posts": null,
  "sms_copy": null
}
```

### 5.2 SMS Only Request
*Prompt*: *"Draft an SMS flash reward text message only for Platinum VIP members under 160 characters with promo code PLATINUM50."*

```json
{
  "email_template": null,
  "social_posts": null,
  "sms_copy": "Platinum VIP Exclusive: Your €50 flash reward is live! Take €50 off your next order with code PLATINUM50. Ends tonight → crazyfa.com/vip"
}
```

### 5.3 Social Media Only Request
*Prompt*: *"Create 2 Instagram social media posts only highlighting our Circular Garment Collecting initiative."*

```json
{
  "email_template": null,
  "social_posts": [
    {
      "platform": "Instagram",
      "copy": "Bring your pre-loved garments to any Crazy Fashion store and give them a second life while earning Crazy Club rewards. Small steps lead to big shifts in sustainable style."
    },
    {
      "platform": "Instagram",
      "copy": "Consciously designed and crafted with certified organic and recycled fibers, our new Sustainable Capsule Collection proves high fashion and eco-conscious design belong together. Discover effortless, timeless wardrobe essentials starting from €39.99."
    }
  ],
  "sms_copy": null
}
```

### 5.4 Full Omnichannel Request
*Prompt*: *"Generate all multi-channel marketing creative assets for our Autumn Collection launch."*

```json
{
  "email_template": {
    "subject": "Nordic Autumn Arrives: Sustainable Warmth & Effortless Style",
    "preview_text": "Explore recycled-wool coats and cozy knitwear made for Nordic seasons.",
    "body": "Crisp mornings call for conscious layering. Our new Autumn Collection combines modern tailoring with certified sustainable materials, from the recycled-wool FRÖST Puffer (€129.99) to organic cotton knits. Crazy Club members earn 2x points on all outerwear this week.",
    "cta_button": "Shop Autumn Collection"
  },
  "social_posts": [
    {
      "platform": "Instagram",
      "copy": "Nordic autumn styling, consciously crafted. Discover the new FRÖST Puffer made from 100% recycled polyester (#CrazyFashion #SustainableStyle)."
    },
    {
      "platform": "LinkedIn",
      "copy": "Crazy Fashion is proud to launch our Autumn 2026 line with 85% certified sustainable materials across all collections."
    }
  ],
  "sms_copy": "Crazy Fashion: Autumn Drop is here! Enjoy 2x Crazy Club points on outerwear today with code AUTUMN2X → crazyfa.com/autumn"
}
```

---

## 6. UI Deliverable Cards ([`frontend/src/components/ChatInterface.jsx`](file:///Users/henrikw/Projects/agent_platform_demo/frontend/src/components/ChatInterface.jsx))

In the frontend chat interface, deliverable cards render conditionally based on which payload fields are populated:

1. **Product Recommendation Card**:
   - Header with `ShoppingBag` icon, segment badge, cohort summary, and merchandising strategy banner.
   - Responsive Grid of 5 Product Cards with EUR price, category, eco-certified tag, product ID, and rationale.
2. **Campaign Strategy Card**:
   - Header with `TrendingUp` icon, campaign title, and projected EUR recovery badge.
   - 3 Column Grid for **Campaign Pillars** (with channel badges).
   - 4 Column Grid for **Channel Mix & Cadence**.
   - Collapsible Accordion for **A/B Testing Hypotheses**.
3. **Creative Assets Card**:
   - **Email Preview**: Subject line, preview subtitle, formatted body box, and gradient CTA button (`👉 Claim Voucher`).
   - **Social Posts**: Side-by-side cards for Instagram / LinkedIn with platform tags and captions.
   - **SMS / Mobile Push**: Mobile preview container with `MessageSquare` icon and character counter (`N / 160 chars`).

---

## 7. Local Evaluation & Verification

To verify that the Strategy and Content pipelines adhere strictly to their schemas and channel-selection rules:

```bash
# 1. Run local inference and generate execution traces across all 18 cases
agents-cli eval generate --dataset tests/eval/datasets/crazy_fashion_eval.json -o artifacts/traces/

# 2. Grade traces against LLM-as-judge metrics
agents-cli eval grade --traces artifacts/traces/<latest_trace>.json --config tests/eval/eval_config.yaml
```

### Benchmark Results
- **`custom_response_quality`**: 4.83 / 5.0
- **`tool_and_routing_quality`**: 4.67 / 5.0
- **`skill_framework_compliance`**: 4.61 / 5.0
- **`brand_voice_alignment`**: 5.00 / 5.0
- **`safety_compliance`**: 5.00 / 5.0
