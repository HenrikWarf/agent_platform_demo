#!/usr/bin/env python3
"""
Capsule Wardrobe Completeness & Crazy Club Point Calculator for Crazy Fashion.
Scores a 5-item fashion assortment for styling synergy and member point yields.
"""
import json


def score_capsule(items: list) -> str:
    """Evaluates capsule wardrobe completeness and Crazy Club loyalty benefits."""
    total_eur = sum(item.get("price_eur", 0.0) for item in items)
    sustainable_count = sum(1 for item in items if item.get("sustainability_certified", False))
    club_points = int(total_eur * 2.0)  # 2 points per EUR

    categories_present = set(item.get("category", "") for item in items)
    has_outerwear = any("outerwear" in c.lower() or "tailoring" in c.lower() or "blazer" in c.lower() for c in categories_present)
    has_knit = any("knitwear" in c.lower() or "tops" in c.lower() for c in categories_present)
    has_bottom = any("bottoms" in c.lower() or "trousers" in c.lower() or "skirts" in c.lower() for c in categories_present)

    completeness = "Complete 5-Piece Capsule (100%)" if (len(items) == 5 and has_outerwear and has_knit and has_bottom) else "Incomplete (80%)"

    return json.dumps(
        {
            "item_count": len(items),
            "capsule_completeness": completeness,
            "total_capsule_value_eur": round(total_eur, 2),
            "sustainable_certified_items": f"{sustainable_count} / {len(items)}",
            "crazy_club_points_generated": club_points,
            "average_item_price_eur": round(total_eur / len(items), 2) if items else 0.0,
            "vip_savings_estimate_eur": round(total_eur * 0.20, 2),
        },
        indent=2,
    )


if __name__ == "__main__":
    sample = [
        {"name": "NOVA Oversized Wool Blazer", "category": "Womenswear / Tailoring", "price_eur": 129.99, "sustainability_certified": True},
        {"name": "Cashmere Crewneck Sweater", "category": "Womenswear / Knitwear", "price_eur": 89.99, "sustainability_certified": True},
        {"name": "Tailored Wide Trousers", "category": "Womenswear / Bottoms", "price_eur": 69.99, "sustainability_certified": True},
        {"name": "Ribbed Cotton Longsleeve", "category": "Womenswear / Tops", "price_eur": 39.99, "sustainability_certified": True},
        {"name": "Classic Wool Coat", "category": "Womenswear / Outerwear", "price_eur": 199.99, "sustainability_certified": True},
    ]
    print(score_capsule(sample))
