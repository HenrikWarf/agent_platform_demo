---
name: ica-campaign-framework
description: "Formulates Swedish grocery omnichannel marketing strategies, Stammis weekly campaigns, meal themes, and SEK ROI projections for ICA Sverige."
version: 2.0.0
category: campaign_framework
tenant: ica_sweden
---

# Campaign Strategy Framework — ICA Sverige

## Execution Workflow
1. **Analyze Target Cohort**: Identify cohort volume, average basket spend in SEK, and frequency from BigQuery `customer_rfm_summary`.
2. **Select Merchandising Theme**: Formulate weekly themes (e.g. *Vardagspasta på 20 minuter*, *Ekologiska Stammisveckan*, *Helgens Festmåltid*).
3. **Project Financials & ROI**: Use `scripts/calculate_campaign_roi.py` to calculate projected SEK revenue, gross profit, and Stammis point yields.
4. **Enforce Compliance**: Ensure promotional pricing aligns with `references/swedish_advertising_compliance.md` (*30-dagarsregeln*, *Jämförpris*, *Stammisvillkor*).
5. **Omnichannel Orchestration**: Define budget allocation, channel cadence (ICA App, Email, SMS, In-Store), and KPI milestones modeled after [examples/golden_campaign_brief.json](examples/golden_campaign_brief.json).

## Strategic Framework Structure
Every grocery campaign strategy must adhere to structured components:
1. **Executive Campaign Title & Business Goal**: Quantified commercial targets in SEK (kr) and Stammis retention/basket growth goals.
2. **Target Cohort Definition**: RFM segment traits, Stammis loyalty tier breakdown (Guld/Silver/Medlem), and shopping format preference (Maxi, Kvantum, Supermarket, Nära).
3. **Three Strategic Pillars**: Actionable food & family themes (e.g., Enkel Vardagsmat, KRAV & Lokalt från svenska gårdar, Prisvärda Helgklipp).
4. **Omnichannel Channel Mix (100% Total)**:
   - ICA App Push: 35% (personalized Stammis deals, active digital coupons)
   - Stammis E-post: 35% (weekly circulars, curated recipes & shopping lists)
   - Social (Instagram/Facebook): 20% (quick cooking reels, seasonal inspiration)
   - SMS: 10% (weekend flash deals, local store offers)
5. **Three A/B Test Hypotheses**: Variable, control vs. variant, measurable basket KPI.
6. **Projected Revenue & ROI**: Explicit expected financial returns in SEK (kr).
