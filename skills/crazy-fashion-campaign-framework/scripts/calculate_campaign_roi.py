#!/usr/bin/env python3
"""
Deterministic ROI & Revenue Projection Calculator for Crazy Fashion Marketing Campaigns.
Used by the campaign strategy agent to produce accurate financial models in EUR (€).
"""
import json
import sys


def calculate_roi(
    cohort_size: int,
    avg_spend_eur: float,
    conversion_rate: float = 0.065,
    gross_margin_pct: float = 0.54,
    campaign_cost_eur: float = 800.0,
    club_points_rate: float = 2.0,
) -> str:
    """Calculates campaign financials based on cohort volume and historical fashion spend."""
    participating_customers = int(cohort_size * conversion_rate)
    incremental_revenue_eur = round(participating_customers * avg_spend_eur * 1.35, 2)
    gross_profit_eur = round(incremental_revenue_eur * gross_margin_pct, 2)
    net_profit_eur = round(gross_profit_eur - campaign_cost_eur, 2)
    roi_pct = round((net_profit_eur / campaign_cost_eur) * 100, 1) if campaign_cost_eur > 0 else 0.0
    crazy_club_points = int(incremental_revenue_eur * club_points_rate)

    return json.dumps(
        {
            "currency": "EUR",
            "cohort_size": cohort_size,
            "assumed_conversion_rate_pct": round(conversion_rate * 100, 1),
            "projected_participating_customers": participating_customers,
            "projected_incremental_revenue_eur": incremental_revenue_eur,
            "projected_gross_profit_eur": gross_profit_eur,
            "estimated_campaign_cost_eur": campaign_cost_eur,
            "projected_net_profit_eur": net_profit_eur,
            "projected_roi_pct": f"{roi_pct}%",
            "crazy_club_points_awarded": crazy_club_points,
            "break_even_orders": int(campaign_cost_eur / (avg_spend_eur * gross_margin_pct)) if (avg_spend_eur * gross_margin_pct) > 0 else 0,
        },
        indent=2,
    )


if __name__ == "__main__":
    cohort = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    spend = float(sys.argv[2]) if len(sys.argv) > 2 else 125.0
    print(calculate_roi(cohort, spend))
