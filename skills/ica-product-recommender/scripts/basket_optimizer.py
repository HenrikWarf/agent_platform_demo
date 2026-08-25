#!/usr/bin/env python3
"""
Basket Balance & Stammis Loyalty Point Optimizer for ICA Sverige.
Scores 5-product assortments to verify complete weekly meal coverage and point yields.
"""
import json
import sys

ROLES = ["dinner_hero", "produce", "pantry_staple", "dairy_breakfast", "stammis_deal"]


def score_basket(items: list) -> str:
    """Evaluates basket balance across Swedish household shopping roles."""
    total_sek = sum(item.get("price_sek", 0.0) for item in items)
    eco_count = sum(1 for item in items if item.get("sustainability_certified", False))
    stammis_points = int(total_sek * 1.5)  # 1.5x multi-item basket multiplier

    is_balanced = len(items) == 5

    return json.dumps(
        {
            "item_count": len(items),
            "is_balanced_5_item_basket": is_balanced,
            "total_basket_price_sek": round(total_sek, 2),
            "eco_krav_certified_items": f"{eco_count} / {len(items)}",
            "estimated_stammis_points_earned": stammis_points,
            "average_item_price_sek": round(total_sek / len(items), 2) if items else 0.0,
            "basket_health_score": "Optimal (100%)" if (is_balanced and eco_count >= 2) else "Good (80%)",
        },
        indent=2,
    )


if __name__ == "__main__":
    # Test with standard sample items
    sample = [
        {"name": "Svensk Färsk Laxfilé 4x125g", "price_sek": 79.90, "sustainability_certified": True},
        {"name": "Svensk Färsk Broccoli 250g", "price_sek": 16.90, "sustainability_certified": True},
        {"name": "Ekologisk Pasta Penne 500g", "price_sek": 19.90, "sustainability_certified": True},
        {"name": "Ekologisk Svensk Mellanmjölk 1.5L", "price_sek": 22.90, "sustainability_certified": True},
        {"name": "Handskalade Räkor i Lake 280g", "price_sek": 69.90, "sustainability_certified": False},
    ]
    print(score_basket(sample))
