"""
Agent Registry Skills Manager
Handles registration, metadata extraction, dynamic binding, and inspection of Agent Platform Skills.
"""
import glob
import logging
import os
from typing import Any

logger = logging.getLogger("skill_registry")

class SkillRegistry:
    def __init__(self):
        self.skills_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "skills"))

    def list_registered_skills(self, client_id: str | None = None) -> list[dict[str, Any]]:
        """Scans skills repository and returns registered skills and their metadata tailored to active client."""
        registered = []
        skill_files = glob.glob(os.path.join(self.skills_dir, "*", "SKILL.md"))
        is_ica = (client_id == "ica_sweden")

        client_skill_descriptions = {
            "bigquery-customer-analytics": (
                "Executes BigQuery SQL queries on Swedish grocery customer datasets (`marketing_analytics_ica`) to extract Stammis metrics and basket spend in SEK."
                if is_ica else
                "Executes BigQuery SQL queries on Nordic fashion customer datasets (`marketing_analytics`) to extract RFM cohort metrics and revenue-at-risk in EUR."
            ),
            "campaign-framework": (
                "Designs omnichannel marketing strategies, campaign timelines, and channel mix in SEK for ICA Sverige store formats and Stammis campaigns."
                if is_ica else
                "Designs omnichannel marketing strategies, seasonal collection drop frameworks, and ROI projections in EUR for Crazy Fashion."
            ),
            "brand-voice-craft": (
                "Drafts warm, food-inspiring Swedish marketing copy (Email, Instagram, SMS) with ICA Stammis loyalty integration."
                if is_ica else
                "Drafts contemporary Nordic fashion copy (Email, Instagram, TikTok, SMS) with Crazy Club loyalty integration."
            ),
            "product-recommender": (
                "Curates tailored 5-product grocery assortments and merchandising strategies for ICA customer cohorts."
                if is_ica else
                "Curates tailored 5-product fashion assortments and merchandising strategies for Crazy Fashion customer cohorts."
            ),
            "a2ui-personalization": (
                "Designs personalized Swedish Grocery App Stammis offer banners with meal inspiration and recipe pairings."
                if is_ica else
                "Designs H&M-style high-fashion editorial drop cards with member exclusive pricing and size/color swatches."
            ),
        }

        client_skill_names = {
            "bigquery-customer-analytics": "BigQuery Customer Analytics",
            "campaign-framework": "Omnichannel Campaign Framework",
            "brand-voice-craft": "Brand Voice & Creative Copywriting",
            "product-recommender": "5-Product Assortment Recommender",
            "a2ui-personalization": "A2UI Offer Banner & Drop Card Personalization"
        }

        for sf in skill_files:
            skill_folder = os.path.basename(os.path.dirname(sf))

            # Exclude CLI development skills (e.g. google-agents-cli-*)
            if skill_folder.startswith("google-agents-cli-") or "cli-" in skill_folder:
                continue

            try:
                with open(sf, encoding="utf-8") as f:
                    content = f.read()

                name = client_skill_names.get(skill_folder, skill_folder)
                description = client_skill_descriptions.get(skill_folder, "Domain Skill")
                category = "General"

                # Parse frontmatter if present
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        frontmatter = parts[1]
                        for line in frontmatter.strip().split("\n"):
                            if line.startswith("category:"):
                                category = line.split(":", 1)[1].strip().strip('"')

                registered.append({
                    "skill_id": skill_folder,
                    "name": name,
                    "description": description,
                    "category": category,
                    "file_path": sf,
                    "status": "REGISTERED_IN_AGENT_REGISTRY"
                })
            except Exception as e:
                logger.error(f"Error reading skill at {sf}: {e}")

        # Sort predictably
        skill_order = ["bigquery-customer-analytics", "campaign-framework", "brand-voice-craft", "product-recommender", "a2ui-personalization"]
        registered.sort(key=lambda s: skill_order.index(s["skill_id"]) if s["skill_id"] in skill_order else 99)

        return registered

    def get_skill_content(self, skill_id: str, client_id: str | None = None) -> dict[str, Any]:
        """Returns the full text and metadata of a specific skill tailored to active client."""
        is_ica = (client_id == "ica_sweden")

        crazy_fashion_skills = {
            "bigquery-customer-analytics": """# BigQuery Customer Data Analytics Skill — Crazy Fashion

## Objective
Provide analytical procedures and SQL query patterns for querying Crazy Fashion customer datasets stored in Google BigQuery dataset `agent-demo-09.marketing_analytics` (EUR currency).

## BigQuery Tables & Schema (Crazy Fashion)
1. **`customer_rfm_summary`**:
   - `customer_id` (STRING), `rfm_segment` (STRING), `recency_days` (INT64), `frequency_orders` (INT64), `total_monetary_eur` (NUMERIC)
2. **`customer_demographics_360`**:
   - `customer_id` (STRING), `full_name` (STRING), `age` (INT64), `gender` (STRING), `location_city` (STRING), `location_country` (STRING), `income_bracket` (STRING), `preferred_category` (STRING), `loyalty_tier` (STRING), `crazy_club_points` (INT64), `churn_risk_score` (NUMERIC)
3. **`customer_transactions`**:
   - `transaction_id` (STRING), `customer_id` (STRING), `product_id` (STRING), `product_name` (STRING), `category` (STRING), `amount_eur` (NUMERIC), `quantity` (INT64), `channel` (STRING), `store_city` (STRING)
4. **`product_catalog`**:
   - `product_id` (STRING), `product_name` (STRING), `category` (STRING), `subcategory` (STRING), `price_eur` (NUMERIC), `sustainability_certified` (BOOLEAN), `collection` (STRING)
5. **`customer_events`**:
   - `event_id` (STRING), `customer_id` (STRING), `event_type` (STRING), `event_date` (STRING/DATE), `product_id` (STRING), `channel` (STRING), `device` (STRING)

## Customer Cohorts (Crazy Fashion)
- `VIP Fashionistas` (High spend >€1,500, Platinum tier, high margin apparel)
- `Loyal Regulars` (Frequent monthly buyers, Gold/Silver tier)
- `Seasonal Shoppers` (Capsule collection drop & seasonal sale driven)
- `New Explorers` (Recently acquired, 1st order)
- `Dormant At-Risk` (Churn risk score >0.65, >120 days since last purchase)

## Standard BigQuery SQL Patterns
```sql
SELECT
  rfm_segment,
  COUNT(customer_id) AS customer_count,
  ROUND(AVG(recency_days), 1) AS avg_recency,
  ROUND(AVG(total_monetary_eur), 2) AS avg_monetary_eur,
  ROUND(SUM(total_monetary_eur), 2) AS total_revenue_eur
FROM `agent-demo-09.marketing_analytics.customer_rfm_summary`
GROUP BY rfm_segment
ORDER BY total_revenue_eur DESC;
```
""",
            "campaign-framework": """# Omnichannel Campaign Framework Skill — Crazy Fashion

## Strategic Framework Architecture
Guides the Strategy Pipeline in formulating omnichannel marketing frameworks, ROI projections, channel mix distributions, and A/B test hypotheses for Crazy Fashion (EUR).

### 1. Executive Summary & Financial Goal
- Specific revenue target in EUR (€) (e.g. "Drive €120,000 in incremental revenue from VIP Fashionistas during Autumn Studio Drop").
- Strategic focus on seasonal collections, circular sustainability, and member lifetime value.

### 2. Customer Cohort Segmentation
- **Crazy Fashion Cohorts**: `VIP Fashionistas`, `Loyal Regulars`, `Seasonal Shoppers`, `New Explorers`, `Dormant At-Risk`.

### 3. Exactly 4-Channel Distribution & Cadence
- Balance digital and retail channels: App Push, Email, Instagram/TikTok Social, In-Store Digital Displays (summing to 100%).

### 4. Exactly 3 Core Strategic Pillars
1. **Circular Fashion & Garment Recycling**: Bonus loyalty vouchers for trade-ins.
2. **Member Exclusive Collection Drops**: Early VIP tier access to capsule lines.
3. **Trend-Forward Curated Styling**: Editorial complete-the-look outfit pairings.

### 5. Exactly 3 A/B Testing Hypotheses
- Specific testable statements evaluating subject lines, VIP exclusive perks, and countdown urgency.
""",
            "brand-voice-craft": """# Brand Voice & Creative Copywriting Skill — Crazy Fashion

## Brand Tone & Persona (Nordic Fashion)
- **Confident & Contemporary**: Fashion-forward authority without being pretentious or elitist.
- **Inclusive & Warm**: Welcoming language for all body shapes, styles, and budgets.
- **Sustainability-Aware**: Emphasize 100% recycled materials, GOTS organic fabrics, and circular garment collection.
- **Nordic Simplicity**: Clean, crisp, aesthetic copy.

## Copywriting Formats & Rules (English)
- **Email**: Focused subject lines (40-60 chars), personalized styling, single hero CTA, Crazy Club tier perks.
- **Social Media (Instagram / TikTok)**: Visual-first, styling inspiration, editorial captions, tags `#CrazyFashion #NordicStyle`.
- **SMS & App-Push**: Strictly under 160 characters with promo codes (`CRAZY20`) and urgency.
- **Currency & Pricing**: All pricing strictly in EUR (`€49.99`, `€112.49`).

## Strict Channel Scoping Rule
- If Email Only requested: Generate strictly Email template.
- If Social Only requested: Generate strictly Social posts.
- If SMS Only requested: Generate strictly SMS copy (<160 chars).
- If Full Campaign: Generate all 3 channels.
""",
            "product-recommender": """# Product Recommendation & Merchandising Skill — Crazy Fashion

## Merchandising Matrix (Nordic Fashion Catalog)
Curates tailored 5-product assortments from `agent-demo-09.marketing_analytics.product_catalog` (EUR currency):

1. **VIP Fashionistas** (High Spend >€1,500, Platinum/Gold Tier):
   - `PROD-020` (STONE Wool Overcoat, €199.99)
   - `PROD-001` (NOVA Oversized Blazer, €89.99)
   - `PROD-010` (AURA Silk Slip Dress, €119.99)
2. **Loyal Regulars** (High Frequency, Gold/Silver Tier):
   - `PROD-005` (LYRA Knit Sweater, €39.99)
   - `PROD-013` (FJORD Oxford Shirt, €39.99)
   - `PROD-008` (FREJA High-Rise Denim, €59.99)
3. **Seasonal Shoppers & New Explorers**:
   - Trend-forward capsule drops, transitional outerwear, accessories.
4. **Dormant At-Risk**:
   - Best-selling staples, classic knits paired with Crazy Club reactivation vouchers.

## Output Requirements
- Curate exactly 5 complementary products with IDs, Categories, EUR prices, and data-driven segment affinity rationales.
""",
            "a2ui-personalization": """# A2UI Personalization & Drop Card Skill — Crazy Fashion

## Overview
Guides the A2UI Pipeline in generating interactive H&M-style editorial fashion drop cards for Crazy Fashion.

## Component Specifications (Crazy Fashion)
- `brand`: 'Crazy Fashion'
- `collection_title`: Editorial headline (e.g. 'STUDIO COLLECTION // AUTUMN 2026')
- `drop_badge`: 'MEMBER EXCLUSIVE' | 'TRENDING NOW' | 'CONSCIOUS CHOICE 🌿'
- `product_name`: High-fashion catalog item (e.g. 'NOVA Oversized Wool Blazer')
- `sustainability_tag`: Certified material tag (e.g. '100% Recycled Italian Wool 🌿')
- `color_options`: 3 tasteful color names (e.g. ['Charcoal Melange', 'Oatmeal', 'Midnight Black'])
- `size_options`: ['XS', 'S', 'M', 'L', 'XL']
- `pricing`: Regular price (`€79.99`), member price (`€59.99`), discount (`-25% MEMBER OFFER`), Crazy Club points (`+150 Club Points`), recycling bonus (`Extra -15% with garment recycling voucher`).
- `cta_button`: Interactive "Add to Bag" / "Reserve in Store".

## Cardinality Rules
- Single Item Mode: Generate strictly 1 hero fashion drop item (leave `additional_look_items` null).
- Bundle Mode: Include matching pieces in `additional_look_items` only when explicitly requested.
"""
        }

        ica_skills = {
            "bigquery-customer-analytics": """# BigQuery Customer Data Analytics Skill — ICA Sverige

## Objective
Provide analytical procedures and SQL query patterns for querying ICA Sverige customer datasets stored in Google BigQuery dataset `agent-demo-09.marketing_analytics_ica` (SEK currency).

## BigQuery Tables & Schema (ICA Sverige)
1. **`customer_rfm_summary`**:
   - `customer_id` (STRING), `rfm_segment` (STRING), `recency_days` (INT64), `frequency_orders` (INT64), `total_monetary_sek` (NUMERIC)
2. **`customer_demographics_360`**:
   - `customer_id` (STRING), `full_name` (STRING), `age` (INT64), `gender` (STRING), `location_city` (STRING), `location_country` (STRING), `income_bracket` (STRING), `preferred_category` (STRING), `loyalty_tier` (STRING), `stammis_points` (INT64), `churn_risk_score` (NUMERIC)
3. **`customer_transactions`**:
   - `transaction_id` (STRING), `customer_id` (STRING), `product_id` (STRING), `product_name` (STRING), `category` (STRING), `amount_sek` (NUMERIC), `quantity` (INT64), `channel` (STRING), `store_city` (STRING)
4. **`product_catalog`**:
   - `product_id` (STRING), `product_name` (STRING), `category` (STRING), `subcategory` (STRING), `price_sek` (NUMERIC), `sustainability_certified` (BOOLEAN), `collection` (STRING)
5. **`customer_events`**:
   - `event_id` (STRING), `customer_id` (STRING), `event_type` (STRING), `event_date` (STRING/DATE), `product_id` (STRING), `channel` (STRING), `device` (STRING)

## Customer Cohorts (ICA Sverige)
- `Barnfamiljer Storhandlare` (Large family baskets, high volume staples)
- `Ekologiskt Medvetna` (High organic share, KRAV & Eko affinity)
- `Lojala Veckohandlare` (Weekly grocery shoppers, consistent Stammis spend)
- `Prisjägare & Studenter` (Value/discount seekers, extra price sensitive)
- `Inaktiva Stammisar` (Dormant customers needing re-engagement)

## Standard BigQuery SQL Patterns
```sql
SELECT
  rfm_segment,
  COUNT(customer_id) AS customer_count,
  ROUND(AVG(recency_days), 1) AS avg_recency,
  ROUND(AVG(total_monetary_sek), 2) AS avg_monetary_sek,
  ROUND(SUM(total_monetary_sek), 2) AS total_revenue_sek
FROM `agent-demo-09.marketing_analytics_ica.customer_rfm_summary`
GROUP BY rfm_segment
ORDER BY total_revenue_sek DESC;
```
""",
            "campaign-framework": """# Omnichannel Campaign Framework Skill — ICA Sverige

## Strategic Framework Architecture
Guides the Strategy Pipeline in formulating omnichannel marketing frameworks, ROI projections, channel mix distributions, and A/B test hypotheses for ICA Sverige (SEK).

### 1. Executive Summary & Financial Goal
- Specific revenue target in SEK (kr) (e.g. "Drive 450 000 kr in basket spend from Barnfamiljer Storhandlare").
- Strategic focus on seasonal dinner inspiration, local store formats, and Stammis prices.

### 2. Customer Cohort Segmentation
- **ICA Sverige Cohorts**: `Barnfamiljer Storhandlare`, `Ekologiskt Medvetna`, `Lojala Veckohandlare`, `Prisjägare & Studenter`, `Inaktiva Stammisar`.

### 3. Exactly 4-Channel Distribution & Cadence
- Balance digital and store channels: ICA App Push, Email & Nyhetsbrev, Instagram/Facebook Social, In-Store Banners/Direct Mail (summing to 100%).

### 4. Exactly 3 Core Strategic Pillars
1. **Matglädje & Vardagsmiddagar**: Quick, inspiring 25-minute recipes paired with hero deals.
2. **Lokala Klipp & Stammispriser**: Personalized store discounts loaded directly to Stammis cards.
3. **Hållbarhet & Svenskt Ursprung**: KRAV-certified organic produce and Swedish agricultural pride.

### 5. Exactly 3 A/B Testing Hypotheses
- Specific testable statements evaluating recipe subject lines, Stammis discounts, and weekend meal inspiration.
""",
            "brand-voice-craft": """# Brand Voice & Creative Copywriting Skill — ICA Sverige

## Brand Tone & Persona (Swedish Grocery)
- **Varm & Folklig**: Tala med värme, omtanke och glimten i ögat. ICA är hela Sveriges matbutik.
- **Matglädje & Inspiration**: Väck aptiten! Lyft fram goda smaker, säsongens råvaror och enkla middagstips.
- **Vardagsenkel & Tillgänglig**: Gör vardagen enklare och godare för alla, från barnfamiljer till pensionärer.
- **Hållbarhet & Svenskt Ursprung**: Lyft stolt fram *Från Sverige 🇸🇪*, *KRAV 🌿*, svenskt lantbruk och klimatsmarta val.
- **Stammis & Lokalt Värde**: Betona ICA Stammis-förmåner, personliga priser och "Ladda till kortet".

## Copywriting Formats & Rules (Swedish)
- **Email & Nyhetsbrev**: Korta, inspirerande ämnesrader (t.ex. *"Veckans Stammispriser & Middagstips under 25 minuter 🍽️"*).
- **Sociala Medier**: Matfokus, snabba receptfilmer, tips mot matsvinn, taggar som `#ICAMaxi #Stammispris #Matglädje`.
- **SMS & App-Push**: Max 160 tecken: *"Hej [Namn]! Nu finns dina personliga Stammispriser laddade i ICA-appen. Se veckans klipp → ica.se/stammis"*.
- **Valuta & Prisformat**: Alltid SEK (t.ex. `24:90 kr/st`, `89:00 kr/kg`, `Spara 15:-`).
""",
            "product-recommender": """# Product Recommendation & Merchandising Skill — ICA Sverige

## Merchandising Matrix (Swedish Grocery Catalog)
Curates tailored 5-product assortments from `agent-demo-09.marketing_analytics_ica.product_catalog` (SEK currency):

1. **Ekologiskt Medvetna** (KRAV & Eco affinity):
   - `PROD-ICA-001` (ICA I love eco Krossade Tomater, 15:90 kr)
   - `PROD-ICA-002` (Ekologiska Lantägg 12p, 38:90 kr)
   - `PROD-ICA-004` (Svensk Rapsolja Kallpressad, 42:50 kr)
2. **Barnfamiljer Storhandlare** (Family packs, bulk staples):
   - `PROD-ICA-005` (Svensk Nötfärs 12% 1000g Storpack, 99:00 kr)
   - `PROD-ICA-006` (Spaghetti 1kg, 21:90 kr)
   - `PROD-ICA-008` (Mellanmjölk 1.5L, 19:50 kr)
3. **Prisjägare & Studenter** (Budget & staple value):
   - `PROD-ICA-009` (Potatis Fast 2kg, 26:90 kr)
   - `PROD-ICA-003` (Havregryn 1.5kg, 18:90 kr)

## Output Requirements
- Curate exactly 5 complementary products with IDs, Categories, SEK prices, and data-driven segment affinity rationales.
""",
            "a2ui-personalization": """# A2UI Personalization & Stammis Offer Skill — ICA Sverige

## Overview
Guides the A2UI Pipeline in generating Swedish Stammis grocery offer banners with meal inspiration for ICA Sverige.

## Component Specifications (ICA Sverige)
- `brand`: 'ICA'
- `store_format`: 'ICA Maxi Stormarknad' | 'ICA Kvantum' | 'ICA Supermarket' | 'ICA Nära'
- `store_name`: Specific local store (e.g. 'ICA Maxi Lindhagen, Stockholm')
- `badge_type`: 'Stammispris' | 'Personligt Stammispris' | 'HelgKlipp!'
- `icon`: Accurate Unicode emoji (e.g. `🥒`, `🥚`, `🥛`, `🍎`, `🥩`, `🍞`, `🧀`, `☕`, `🍗`, `🥕`, `🥑`) or `'shopping-bag'` (`🛍️`).
- `pricing`: Major numerals (`24`), minor numerals (`90`), unit (`kr/st`), savings (`Spara 10:00`), comparison price (`Jfr-pris 16:60/l`).
- `recipe_suggestion`: Rich meal inspiration with prep time, servings, cost/serving, ingredient checklist, and instructions.
- `cta_button`: "Ladda till kortet" Stammis card button.

## Cardinality Rules
- Single Item Mode: Generate strictly 1 hero deal (leave `additional_deals` null).
- Bundle Mode: Include additional bundle deals only when explicitly requested.
"""
        }

        tailored_skills = ica_skills if is_ica else crazy_fashion_skills
        if skill_id in tailored_skills:
            content = tailored_skills[skill_id]
            return {
                "skill_id": skill_id,
                "content": content,
                "bytes": len(content.encode("utf-8"))
            }

        skill_path = os.path.join(self.skills_dir, skill_id, "SKILL.md")
        if not os.path.exists(skill_path):
            return {"error": f"Skill '{skill_id}' not found in registry."}

        with open(skill_path, encoding="utf-8") as f:
            content = f.read()

        return {
            "skill_id": skill_id,
            "content": content,
            "bytes": len(content.encode("utf-8"))
        }
