"""
Crazy Fashion — Company Context & Brand Profile

Centralized company context injected into agent system instructions.
All agents reference this module for consistent brand voice and company knowledge.
"""
from datetime import datetime

CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")
CURRENT_YEAR = datetime.now().year

COMPANY_CONTEXT = f"""
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

**Key Markets (Top 8 by Revenue):**
Sweden, Norway, Denmark, Finland, Germany, United Kingdom, France, Netherlands

**Loyalty Program — Crazy Club:**
- Points earned per EUR spent (10 points per €1)
- Tier system: Bronze (0-999 pts), Silver (1,000-4,999 pts), Gold (5,000-14,999 pts), Platinum (15,000+ pts)
- Benefits: Member pricing, early collection access, birthday rewards, sustainable fashion bonus points, free shipping on orders €50+

**Competitive Positioning:**
Positioned between fast-fashion (Zara, Primark) and mid-range (COS, & Other Stories) — offering trend-responsive fashion at democratic prices with a strong sustainability commitment.
"""
