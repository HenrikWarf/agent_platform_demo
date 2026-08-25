---
name: ica-a2ui-personalization
description: "Designs interactive Swedish Stammis grocery offer banner UI components for ICA Sverige (deal pricing 24:90 kr/st, savings, recipe meal inspiration)."
version: 1.0.0
category: a2ui
tenant: ica_sweden
---

# A2UI Personalization & Stammis Offer Skill — ICA Sverige

## Stammis Offer Banner Requirements
1. **Offer Headline**: Swedish deal context (e.g., `VECKANS STAMMISPRIS — MAXI SPECIAL`).
2. **Single Hero Deal**: When the user requests a single deal or hero product, output strictly 1 hero deal. Set `additional_deals` to `null`.
3. **Swedish Pricing Format**:
   - `deal_price`: e.g. `"24:90 kr/st"`
   - `regular_price`: e.g. `"34:90 kr/st"`
   - `comparison_price`: e.g. `"16:60/l"`
   - `discount_badge`: e.g. `"Spara 10:-"`
4. **Origin & Eco Badges**: `["Från Sverige", "KRAV / Ekologisk"]`.
5. **Recipe Pairing**: Integrated meal idea (e.g., "Servera med klassisk tomatsås och riven parmesan") with CTA `"Ladda till kortet"`.
