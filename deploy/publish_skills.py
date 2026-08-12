#!/usr/bin/env python3
"""
Agent Registry & Skill Publishing Script for GCP Agent Platform
Registers active marketing skills with Agent Registry and Gemini Enterprise.
"""
import os
import sys
import subprocess
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("publish_skills")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
REGION = os.getenv("GCP_REGION", "us-central1")
GEMINI_ENTERPRISE_APP_ID = os.getenv(
    "GEMINI_ENTERPRISE_APP_ID",
    f"projects/{PROJECT_ID}/locations/global/collections/default_collection/engines/marketing-app"
)

SKILLS_TO_PUBLISH = [
    {
        "name": "bigquery_customer_analytics",
        "agent": "AnalyticsAgent",
        "display_name": "BigQuery Customer Analytics Skill",
        "description": "Queries customer RFM segmentation metrics and demographic data in BigQuery.",
        "path": "skills/marketing_analytics/SKILL.md"
    },
    {
        "name": "omnichannel_strategy",
        "agent": "StrategyAgent",
        "display_name": "Omnichannel Strategy Framework Skill",
        "description": "Generates multi-channel marketing strategies, channel allocation, and ROI projections.",
        "path": "skills/omnichannel_strategy/SKILL.md"
    },
    {
        "name": "brand_voice",
        "agent": "ContentAgent",
        "display_name": "Brand Voice & Creative Copy Skill",
        "description": "Drafts brand-aligned subject lines, email templates, and targeted ad copy.",
        "path": "skills/brand_voice/SKILL.md"
    }
]

def run_command(cmd_list: list) -> bool:
    cmd_str = " ".join(cmd_list)
    logger.info(f"Executing: {cmd_str}")
    try:
        res = subprocess.run(cmd_list, capture_output=True, text=True, check=True)
        logger.info(f"Success Output: {res.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.warning(f"Command failed (Code {e.returncode}): {e.stderr.strip()}")
        return False
    except FileNotFoundError:
        logger.warning(f"Binary not found: {cmd_list[0]}")
        return False

def publish_all():
    logger.info(f"Starting Skill Publishing for GCP Project: '{PROJECT_ID}'...")
    results = {}

    for skill in SKILLS_TO_PUBLISH:
        skill_name = skill["name"]
        logger.info(f"Publishing skill '{skill_name}' bound to '{skill['agent']}'...")
        
        # 1. Register via agents-cli publish gemini-enterprise (if CLI is installed)
        cli_cmd = [
            "agents-cli", "publish", "gemini-enterprise",
            "--display-name", skill["display_name"],
            "--description", skill["description"],
            "--project-id", PROJECT_ID,
            "--gemini-enterprise-app-id", GEMINI_ENTERPRISE_APP_ID
        ]
        
        cli_success = run_command(cli_cmd)
        
        # 2. Fallback to gcloud alpha agent-registry if needed
        registry_cmd = [
            "gcloud", "alpha", "agent-registry", "services", "update", skill_name,
            "--display-name", skill["display_name"],
            "--description", skill["description"],
            "--project", PROJECT_ID,
            "--location", REGION,
            "--quiet"
        ]
        registry_success = run_command(registry_cmd)
        
        results[skill_name] = {
            "agent": skill["agent"],
            "published": cli_success or registry_success,
            "status": "REGISTERED" if (cli_success or registry_success) else "LOCAL_FALLBACK_ONLY"
        }

    # Save output to deployment metadata manifest
    manifest_path = "deployment_metadata.json"
    manifest_data = {
        "project_id": PROJECT_ID,
        "region": REGION,
        "gemini_enterprise_app_id": GEMINI_ENTERPRISE_APP_ID,
        "published_skills": results
    }
    
    with open(manifest_path, "w") as f:
        json.dump(manifest_data, f, indent=2)
        
    logger.info(f"Successfully updated '{manifest_path}' with registered skill metadata.")

if __name__ == "__main__":
    publish_all()
