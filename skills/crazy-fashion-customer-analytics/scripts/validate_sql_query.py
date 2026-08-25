#!/usr/bin/env python3
"""
Read-Only SQL Safety Validator for Crazy Fashion Analytics Agent.
Ensures queries target the correct dataset and contain no destructive DDL/DML statements.
"""
import json
import re
import sys

ALLOWED_DATASET = "agent-demo-09.marketing_analytics"
PROHIBITED_KEYWORDS = ["DROP", "DELETE", "TRUNCATE", "ALTER", "INSERT", "UPDATE", "CREATE", "GRANT", "REVOKE"]


def validate_sql(query: str) -> str:
    """Validates SQL query against safety constraints."""
    upper_query = query.upper()

    for kw in PROHIBITED_KEYWORDS:
        if re.search(r"\b" + kw + r"\b", upper_query):
            return json.dumps({"valid": False, "error": f"Destructive keyword '{kw}' detected. Only read-only SELECT queries are allowed."}, indent=2)

    if "marketing_analytics" not in query:
        return json.dumps({"valid": False, "warning": f"Query does not explicitly reference dataset '{ALLOWED_DATASET}'."}, indent=2)

    return json.dumps({"valid": True, "message": "SQL query passed read-only safety validation."}, indent=2)


if __name__ == "__main__":
    sql = sys.argv[1] if len(sys.argv) > 1 else "SELECT COUNT(*) FROM `agent-demo-09.marketing_analytics.customer_demographics_360`"
    print(validate_sql(sql))
