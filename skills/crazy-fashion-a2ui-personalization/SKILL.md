---
name: crazy-fashion-a2ui-personalization
description: "Designs interactive H&M-style editorial fashion drop card UI components for Crazy Fashion (Studio Collection, member pricing, size/color selectors)."
version: 1.0.0
category: a2ui
tenant: crazy_fashion
---

# A2UI Personalization & Drop Card Skill — Crazy Fashion

## Drop Card Component Requirements
1. **Collection Tagline**: Editorial headline (e.g., `STUDIO COLLECTION // AUTUMN 2026`).
2. **Single Hero vs. Multi-Product Assortment**:
   - **Single Item Request**: When the user requests a single banner or hero item, output strictly 1 hero product. Set `products` and `additional_look_items` to `null`.
   - **Multi-Product Assortment (2-5 Products)**: When the user asks for a banner of recommendations or an assortment, populate the `products` array with all 2-5 items, each containing complete product names, categories, size options, color variants, member pricing, and personalization rationale.
3. **Interactive Selectors**:
   - `available_sizes`: e.g. `["XS", "S", "M", "L", "XL"]`
   - `available_colors`: e.g. `[{"name": "Charcoal Grey", "hex": "#2b2b2b"}, {"name": "Camel Beige", "hex": "#c19a6b"}]`
4. **Member Pricing**: Regular price (e.g. `€79.99`) vs. Crazy Club Member price (e.g. `€59.99`).
5. **Loyalty Perk**: Member points (e.g. `+150 Club Points`) and garment recycling voucher perk.
