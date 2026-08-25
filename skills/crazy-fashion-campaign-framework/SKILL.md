---
name: crazy-fashion-campaign-framework
description: "Formulates omnichannel marketing strategies, seasonal drop plans, garment recycling drives, and EUR ROI projections for Crazy Fashion."
version: 2.0.0
category: campaign_framework
tenant: crazy_fashion
---

# Campaign Strategy Framework — Crazy Fashion

## Execution Workflow
1. **Analyze Target Cohort**: Identify cohort volume, average basket spend in EUR, and frequency from BigQuery `customer_rfm_summary`.
2. **Select Collection Theme**: Formulate seasonal drop themes (e.g. *Autumn Studio Drop*, *Conscious Cashmere Edit*, *Nordic Winter Transition*).
3. **Project Financials & ROI**: Use `scripts/calculate_campaign_roi.py` to calculate projected EUR revenue, gross profit, and Crazy Club points.
4. **Enforce Compliance**: Ensure claims align with `references/nordic_fashion_compliance.md` (*EU Green Claims Directive*, *Crazy Club VIP terms*, *Recycling vouchers*).
5. **Omnichannel Orchestration**: Define budget allocation, channel cadence (Lookbook Email, Instagram, VIP SMS, In-Store), and KPI milestones modeled after `examples/golden_campaign_brief.json`.

## Strategic Framework Structure
Every campaign strategy must adhere to structured components:
1. **Executive Campaign Title & Business Goal**: Quantified commercial targets in EUR (€) and customer retention/LTV goals.
2. **Target Cohort Definition**: RFM segment traits, loyalty tier breakdown (Crazy Club Platinum/Gold/Silver), and purchasing behavior.
3. **Three Strategic Pillars**: Actionable themes (e.g., Circular Fashion, VIP Exclusivity, Seasonal Drop Urgency).
4. **Omnichannel Channel Mix (100% Total)**:
   - Email: 40% (editorial lookbooks, private sale invitations)
   - Social (Instagram/TikTok): 30% (curated reels, styling inspiration)
   - SMS: 20% (time-sensitive VIP drop access, double points alerts)
   - Mobile App Push: 10% (personalized drops, in-app vouchers)
5. **Three A/B Test Hypotheses**: Variable, control vs. variant, measurable KPI.
6. **Projected Revenue & ROI**: Explicit expected financial returns in EUR (€).
