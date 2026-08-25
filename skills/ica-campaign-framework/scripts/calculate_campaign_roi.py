#!/usr/bin/env python3
"""
Deterministic ROI & Revenue Projection Calculator for ICA Sverige Marketing Campaigns.
Used by the campaign strategy agent to produce accurate financial models.
"""
import json
import sys


def calculate_roi(
    cohort_size: int,
    avg_spend_sek: float,
    conversion_rate: float = 0.08,
    margin_pct: float = 0.28,
    campaign_cost_sek: float = 5000.0,
    stammis_bonus_rate: float = 1.0,
) -> str:
    """Calculates campaign financials based on cohort volume and historical spend."""
    participating_customers = int(cohort_size * conversion_rate)
    incremental_revenue_sek = round(participating_customers * avg_spend_sek * 1.25, 2)
    gross_profit_sek = round(incremental_revenue_sek * margin_pct, 2)
    net_profit_sek = round(gross_profit_sek - campaign_cost_sek, 2)
    roi_pct = round((net_profit_sek / campaign_cost_sek) * 100, 1) if campaign_cost_sek > 0 else 0.0
    stammis_points = int(incremental_revenue_sek * stammis_bonus_rate)

    return json.dumps(
        {
            "currency": "SEK",
            "cohort_size": cohort_size,
            "assumed_conversion_rate_pct": round(conversion_rate * 100, 1),
            "projected_participating_customers": participating_customers,
            "projected_incremental_revenue_sek": incremental_revenue_sek,
            "projected_gross_profit_sek": gross_profit_sek,
            "estimated_campaign_cost_sek": campaign_cost_sek,
            "projected_net_profit_sek": net_profit_sek,
            "projected_roi_pct": f"{roi_pct}%",
            "stammis_points_awarded": stammis_points,
            "break_even_customers": int(campaign_cost_sek / (avg_spend_sek * margin_pct)) if (avg_spend_sek * margin_pct) > 0 else 0,
        },
        indent=2,
    )


if __name__ == "__main__":
    cohort = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    spend = float(sys.argv[2]) if len(sys.argv) > 2 else 450.0
    print(calculate_roi(cohort, spend))
