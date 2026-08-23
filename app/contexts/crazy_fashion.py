"""
Crazy Fashion Client Context — Nordic Fashion & Apparel Retailer.
"""
from datetime import datetime

from app.contexts.base import ClientContext

CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")
CURRENT_YEAR = datetime.now().year

CRAZY_FASHION_PROMPT = f"""
**TODAY'S DATE:** {CURRENT_DATE}
**CURRENT YEAR:** {CURRENT_YEAR}

**COMPANY PROFILE: CRAZY FASHION**

**Who We Are:**
Crazy Fashion is a Nordic fashion company headquartered in Stockholm, Sweden. Founded in 1987, we design and sell affordable, trend-forward clothing and accessories for women, men, and children across 45 markets worldwide. With over 3,200 stores and a rapidly growing e-commerce platform serving 78 million active customers, we make fashion accessible to everyone.

**Our Vision:**
Fashion and quality at the best price in a sustainable way.

**Our Business:**
We offer a wide range of fashion for all ages — from everyday basics and workwear essentials to seasonal trend collections and exclusive designer collaborations. Our strength lies in our fast supply chain (trend-to-store in 2-3 weeks), data-driven merchandising, and deep understanding of local market preferences across the Nordics, Europe, and North America.

**Annual Revenue:** €22.3 billion (FY2025)
**Employees:** 148,000 across 45 markets
**Stores:** 3,247 retail locations + crazyfa.com e-commerce
**Headquarters:** Drottninggatan 56, Stockholm, Sweden
**Currency Standard:** All transactions, prices, and financial metrics are denominated in EUR (€).

**Core Values:**
1. **Sustainability First** — Circular fashion, recycled materials, garment collecting program. Target: 100% sustainably sourced materials by 2030.
2. **Inclusivity** — Fashion for every body, every age, every budget. Extended size ranges, adaptive collections, and gender-fluid lines.
3. **Speed & Agility** — From trend identification to store shelf in 2-3 weeks. 12 seasonal drops per year plus flash collections.
4. **Customer Obsession** — Crazy Club loyalty program with 54 million members. Personalized recommendations, early access, and member-only pricing.

**Brand Tone of Voice:**
- Confident & contemporary — never pretentious or elitist
- Inclusive & warm — every customer belongs at Crazy Fashion
- Sustainability-aware — honest about our progress and challenges
- Trend-forward yet attainable — aspirational without being exclusive
- Nordic simplicity — clean, direct communication

**Product Categories:**
- **Womenswear** (42% of revenue): Dresses, tops, outerwear, denim, knitwear
- **Menswear** (28% of revenue): Casual, smart-casual, outerwear, basics
- **Kids & Baby** (15% of revenue): Newborn to 14 years
- **Accessories** (10% of revenue): Bags, jewelry, scarves, sunglasses
- **Home & Living** (5% of revenue): Textiles, candles, small décor

**Key Markets:** Sweden, Norway, Denmark, Finland, Germany, United Kingdom, France, Netherlands

**Loyalty Program — Crazy Club:**
- Points earned per EUR spent (10 points per €1)
- Tier system: Bronze (0-999 pts), Silver (1,000-4,999 pts), Gold (5,000-14,999 pts), Platinum (15,000+ pts)
- Benefits: Member pricing, early collection access, birthday rewards, sustainable fashion bonus points, free shipping on orders €50+
"""

CRAZY_FASHION_CONTEXT = ClientContext(
    client_id="crazy_fashion",
    client_name="Crazy Fashion",
    tagline="Nordic Trend & Sustainable Apparel Retailer",
    industry="Fashion & Apparel Retail",
    currency_symbol="€",
    currency_code="EUR",
    loyalty_program_name="Crazy Club",
    bigquery_dataset="marketing_analytics",
    primary_color="#4f46e5",
    accent_color="#7c3aed",
    logo_text="CRAZY FASHION",
    icon_name="Shirt",
    headquarters="Stockholm, Sweden",
    annual_revenue="€22.3B",
    store_count="3,247 stores",
    customer_count="78M customers",
    product_categories=["Womenswear", "Menswear", "Kids & Baby", "Accessories", "Home & Living"],
    customer_segments=["VIP Fashionistas", "Loyal Regulars", "Seasonal Shoppers", "New Explorers", "Dormant At-Risk"],
    company_prompt=CRAZY_FASHION_PROMPT,
    badge_tags=["Apparel & Footwear", "Circular Fashion", "EUR Currency (€)", "Crazy Club Loyalty"],
    sample_questions=[
        {
            "title": "VIP Luxury & Outerwear Curation",
            "prompt": "Recommend 5 premium, sustainability-certified products for our 'VIP Fashionistas' cohort with EUR pricing and detailed data-driven reasoning.",
            "badge": "Product Recommender",
        },
        {
            "title": "Dormant Win-Back Framework",
            "prompt": "Create an omnichannel retention strategy for our 'Dormant At-Risk' customer cohort with 3 campaign pillars, 4 channel mix allocations summing to 100%, and A/B test hypotheses.",
            "badge": "Campaign Strategy",
        },
        {
            "title": "Sustainable Catalog Filter",
            "prompt": "Query the product catalog in BigQuery for all sustainability-certified items in Womenswear and Menswear with EUR pricing and collection names.",
            "badge": "BigQuery Data",
        },
    ],
)
