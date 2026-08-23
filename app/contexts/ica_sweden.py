"""
ICA Sverige Client Context — Nordic Food, Grocery & Health Retail Leader.
"""
from datetime import datetime

from app.contexts.base import ClientContext

CURRENT_DATE = datetime.now().strftime("%Y-%m-%d")
CURRENT_YEAR = datetime.now().year

ICA_SWEDEN_PROMPT = f"""
**TODAY'S DATE:** {CURRENT_DATE}
**CURRENT YEAR:** {CURRENT_YEAR}

**COMPANY PROFILE: ICA SVERIGE (ICA GRUPPEN)**

**Who We Are:**
ICA Sverige is Sweden's leading grocery retailer, founded in 1917 on the idea of independent retailers joining forces to purchase goods together. ICA operates approximately 1,300 stores across Sweden with a market share of ~36%. ICA also encompasses Apotek Hjärtat (Sweden's leading pharmacy chain with 390+ pharmacies), ICA Banken, and ICA Försäkring.

**Our Vision:**
To make every day a little easier and healthier for Swedish households ("Göra varje dag lite enklare och godare").

**Our Store Formats:**
1. **ICA Maxi Stormarknad** (88 hypermarkets) — Complete one-stop shopping: extensive fresh food counters, organic produce, clothing, home goods, and health.
2. **ICA Kvantum** (130 supermarkets) — Large supermarkets focused on superior fresh food selection, local Swedish farmers, and eco-certified ingredients.
3. **ICA Supermarket** (420 neighborhood stores) — Broad everyday assortment and high service in residential and town centers.
4. **ICA Nära** (650 convenience stores) — Quick, accessible local grocery stores for everyday needs and online parcel pickup.

**Annual Revenue:** SEK 146.5 billion (approx €12.8B FY2025)
**Employees:** 50,000+ across Sweden
**Stores:** ~1,300 retail stores + ica.se online grocery delivery & app
**Headquarters:** Solna (Svetsarvägen 16), Stockholm, Sweden
**Currency Standard:** All transactions, item prices, discounts, and financial metrics are denominated in Swedish Kronor (SEK, kr / :-).

**Core Values & Strategic Focus:**
1. **Matglädje & Hälsa (Food Joy & Health)** — Inspiring healthy, climate-smart eating for Swedish families. Extensive vegan, vegetarian, and allergen-free alternatives.
2. **Svenskt & Lokalt (Swedish Origin & Local Agriculture)** — Championing Swedish farmers ("Från Sverige" and "Svenskt Sigill").
3. **Hållbarhet & Eko (Sustainability & Organic)** — Market leader in organic groceries with "ICA I love eco" and "KRAV" certification. Target: Net-zero emissions by 2030.
4. **Stammis Lojalitet (Customer Loyalty & Personalization)** — Over 5 million active Stammis members receiving AI-driven personalized app coupons and receipt-based discounts.

**Brand Tone of Voice:**
- Warm, welcoming, and food-loving ("Vardagsgott!", "Klipp!", "Enkelt att laga")
- Knowledgeable yet unpretentious — practical cooking guidance and meal inspiration
- Rooted in Swedish traditions and seasonal moments (Midsommar, Kräftskiva, Kanelbullens dag, Julbord, Fredagsmys)
- Trustworthy, transparent, and health-conscious

**Product Categories:**
- **Frukt & Grönt** (Fresh Fruits & Vegetables, KRAV & Eko)
- **Mejeri, Ost & Ägg** (Dairy, Swedish Milk, Cheese, Plant-based drinks)
- **Kött, Fågel & Chark** (Swedish Meat, Poultry, Deli charcuterie)
- **Fisk & Skaldjur** (ASC/MSC certified fresh fish and seafood)
- **Skafferi & Bröd** (Pantry staples, organic pasta, coffee, Swedish bread)
- **Hälsa & Apotek** (Vitamins, wellness, OTC pharmacy via Apotek Hjärtat)

**Loyalty Program — ICA Stammis:**
- Points earned: 1 Stammis point per 1 SEK spent in ICA stores, online, or Apotek Hjärtat.
- Benefits:
  - **Stammispris**: Exclusive weekly discounts automatically deducted at checkout.
  - **Personliga Erbjudanden**: ML-personalized coupons based on previous receipt history.
  - **Bonusutbetalning**: Monthly bonus cheques (e.g. 25, 50, 100, 150 kr) loaded onto the digital ICA card.
  - **Klimatriktig matbonus**: Extra bonus points on climate-certified Swedish produce.

**A2UI Interactive App Experience:**
- Offers render with interactive "Ladda till ICA-kortet" coupon loading, "Lägg i inköpslista" counters, and contextual Swedish recipe pairings.
"""

ICA_SWEDEN_CONTEXT = ClientContext(
    client_id="ica_sweden",
    client_name="ICA Sverige",
    tagline="Nordic Food, Grocery & Health Retail Leader",
    industry="Grocery, Food & Health Retail",
    currency_symbol="kr",
    currency_code="SEK",
    loyalty_program_name="ICA Stammis",
    bigquery_dataset="marketing_analytics_ica",
    primary_color="#E01E26",
    accent_color="#FFE600",
    logo_text="ICA SVERIGE",
    icon_name="ShoppingBag",
    headquarters="Solna, Stockholm, Sweden",
    annual_revenue="SEK 146.5B",
    store_count="~1,300 stores",
    customer_count="5.2M Stammisar",
    product_categories=["Frukt & Grönt", "Mejeri & Ost", "Kött & Chark", "Fisk & Skaldjur", "Skafferi & Bröd", "Hälsa & Apotek"],
    customer_segments=["Ekologiskt Medvetna", "Barnfamiljer Storhandlare", "Lojala Veckohandlare", "Prisjägare & Studenter", "Inaktiva Stammisar"],
    company_prompt=ICA_SWEDEN_PROMPT,
    badge_tags=["Grocery & Fresh Food", "KRAV & Eko", "SEK Currency (kr)", "ICA Stammis Loyalty", "A2UI Deal Banners"],
    sample_questions=[
        {
            "title": "ICA Stammis Eko-Deal Banner (A2UI)",
            "prompt": "Generate an A2UI personalized deal banner for ICA Sweden targeting the 'Ekologiskt Medveten' customer persona with KRAV-certified dairy products, Stammis loyalty pricing, and interactive app card actions.",
            "badge": "A2UI Banner",
        },
        {
            "title": "Stammis Segment Analytics (BigQuery)",
            "prompt": "Query BigQuery to analyze the 'Ekologiskt Medvetna' vs 'Prisjägare & Studenter' cohorts: customer count, average recency in days, and total monetary spend in SEK.",
            "badge": "BigQuery Data",
        },
        {
            "title": "ICA Maxi Barnfamilj Storpack Assortment",
            "prompt": "Recommend 5 family-friendly grocery items for 'Barnfamiljer Storhandlare' with SEK pricing, Swedish origin badges, and family dinner recipe pairings.",
            "badge": "Product Recommender",
        },
        {
            "title": "Inaktiva Stammisar Win-Back Strategy",
            "prompt": "Create a 3-pillar Stammis win-back strategy for 'Inaktiva Stammisar' with SEK bonus voucher allocations, app push channels, and A/B test hypotheses.",
            "badge": "Campaign Strategy",
        },
    ],
)
