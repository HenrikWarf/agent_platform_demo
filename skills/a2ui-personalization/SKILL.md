---
name: a2ui-personalization
description: "Designs personalized retail UI components, Stammis grocery app offer banners with recipe pairings, and fashion drop cards for Crazy Fashion and ICA Sverige."
version: 1.0.0
category: user_interface_personalization
---

# A2UI Personalization & Offer Banner Skill

## Overview
This skill guides the **A2UI Pipeline** (`a2ui_reasoner` ➔ `a2ui_formatter`) in designing personalized, high-converting interactive retail UI components tailored to active enterprise retailer contexts:
- **ICA Sverige**: Swedish Grocery App Stammis Deal Banner with meal inspiration and recipe pairing.
- **Crazy Fashion**: H&M-style editorial fashion drop card with member exclusive pricing and size/color swatches.

---

## 1. Cardinality & Product Quantity Rules (Strict)

1. **Single Product / Default Mode**:
   - If the user asks for **one product**, a single app banner, 1 offer, or does not explicitly ask for a multi-item bundle:
     - Generate **EXACTLY 1 hero product**.
     - Set `additional_deals` (ICA) to `null` / empty.
     - Set `additional_look_items` (Crazy Fashion) to `null` / empty.
2. **Multi-Item Bundle Mode (Explicit Requests Only)**:
   - When the user explicitly asks for "multiple deals", "dinner bundle", "weekly basket", or "complete the look with matching pieces":
     - Include 1-3 complementary products in `additional_deals` or `additional_look_items`.
3. **Strict Compliance**: Never generate 3 items when the user asked for 1 item.

---

## 2. ICA Sverige Stammis Offer Banner Specification
- `brand`: 'ICA'
- `store_format`: 'ICA Maxi Stormarknad' | 'ICA Kvantum' | 'ICA Supermarket' | 'ICA Nära'
- `store_name`: Specific local store, e.g. 'ICA Maxi Lindhagen, Stockholm'
- `badge_type`: 'Stammispris' | 'Personligt Stammispris' | 'HelgKlipp!'
- `icon`: Provide an accurate matching Unicode emoji (e.g. `🥒` for cucumber/gurka, `🥚` for eggs/ägg, `🥛` for dairy/milk, `🍎` for apples, `🥩` for beef/meat, `🍞` for bread, `🧀` for cheese, `☕` for coffee, `🍗` for chicken, `🥕` for carrots, `🥑` for avocado) or a standard semantic keyword. If no specific grocery icon fits, default to `'shopping-bag'` (`🛍️`). NEVER default to `'tomato'` unless the item is specifically tomatoes.
- `personalization_reason`: Swedish rationale based on customer purchase history.
- `pricing`: Major digits (`24`), minor digits (`90`), unit (`kr/st`), savings (`Spara 10:00 (29% rabatt)`), comparison price (`Jfr-pris 16:60/l`).
- `recipe_suggestion`: Swedish culinary meal inspiration featuring the hero ingredient (prep time, servings, cost/serving, ingredient list with measurements, brief instructions).

---

## 3. Crazy Fashion Editorial Drop Card Specification
- `brand`: 'Crazy Fashion'
- `collection_title`: Editorial headline (e.g. 'AUTUMN DROP // SUSTAINABLE EDIT')
- `drop_badge`: 'MEMBER EXCLUSIVE' | 'TRENDING NOW' | 'CONSCIOUS CHOICE 🌿'
- `product_name`: High-fashion catalog item (e.g. 'NOVA Oversized Wool Blazer')
- `sustainability_tag`: Certified material tag (e.g. '100% Recycled Italian Wool 🌿')
- `color_options`: 3 tasteful color names
- `size_options`: ['XS', 'S', 'M', 'L', 'XL']
- `pricing`: Regular price (`€79.99`), member price (`€59.99`), discount (`-25% MEMBER OFFER`), Crazy Club points (`+150 Club Points`), recycling bonus (`Extra -15% with garment recycling voucher`).
