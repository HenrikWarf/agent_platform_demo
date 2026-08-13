#!/usr/bin/env python3
"""
Register Marketing Skills in Agent Registry.

Packages each skill directory (skills/*/) into a ZIP archive and registers
it as an Agent Registry Skill resource via gcloud alpha agent-registry skills.

Skills are separate from agents in Agent Registry:
- Agents: auto-registered by `agents-cli deploy`
- Skills: manually registered via this script

Usage:
    python deploy/register_skills.py
    python deploy/register_skills.py --location global
"""
import os
import subprocess
import sys
import tempfile
import zipfile
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("register_skills")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agent-demo-09")
LOCATION = os.getenv("AGENT_REGISTRY_LOCATION", "global")

# Skills to register: maps skill directory name -> registry metadata
SKILLS = [
    {
        "dir": "marketing_analytics",
        "skill_id": "bigquery-customer-analytics",
        "display_name": "BigQuery Customer Analytics",
        "description": (
            "Executes BigQuery SQL queries on customer datasets "
            "(RFM summary, Demographics 360, Transactions) to extract "
            "cohort metrics, customer counts, and revenue-at-risk."
        ),
    },
    {
        "dir": "omnichannel_strategy",
        "skill_id": "omnichannel-strategy",
        "display_name": "Omnichannel Strategy Framework",
        "description": (
            "Generates multi-channel marketing strategies, campaign "
            "frameworks, channel allocation, and ROI projections."
        ),
    },
    {
        "dir": "brand_voice",
        "skill_id": "brand-voice-content",
        "display_name": "Brand Voice & Creative Copy",
        "description": (
            "Drafts brand-aligned subject lines, email templates, "
            "social media posts, and targeted ad copy."
        ),
    },
]


def package_skill(skill_dir: str, output_path: str) -> bool:
    """Package a skill directory into a ZIP archive with SKILL.md at the root."""
    skills_root = os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills")
    skill_path = os.path.join(skills_root, skill_dir)

    if not os.path.isdir(skill_path):
        logger.error(f"Skill directory not found: {skill_path}")
        return False

    skill_md = os.path.join(skill_path, "SKILL.md")
    if not os.path.isfile(skill_md):
        logger.error(f"SKILL.md not found in: {skill_path}")
        return False

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(skill_path):
            for fname in files:
                abs_path = os.path.join(root, fname)
                arc_name = os.path.relpath(abs_path, skill_path)
                zf.write(abs_path, arc_name)

    size_kb = os.path.getsize(output_path) / 1024
    logger.info(f"  Packaged {skill_dir} -> {output_path} ({size_kb:.1f} KB)")

    if size_kb > 500:
        logger.error(f"  ZIP exceeds 500 KB limit ({size_kb:.1f} KB)")
        return False

    return True

def _run(cmd: list[str], label: str) -> subprocess.CompletedProcess:
    """Run a gcloud command and log the result."""
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.debug(f"  {label} stderr: {result.stderr.strip()}")
    return result


def register_skill(skill_id: str, display_name: str, description: str, payload_path: str) -> bool:
    """Register or update a skill in Agent Registry.

    Full lifecycle: create (draft) → create revision (payload) → set default → activate.
    The API auto-prefixes names with 'private-' for non-publisher projects.
    """
    # The API adds a 'private-' prefix to skill IDs for non-publisher projects
    prefixed_id = f"private-{skill_id}"

    # Step 1: Create skill as draft (without payload — payload goes on revision)
    logger.info(f"  Step 1: Creating skill '{skill_id}' as draft...")
    create_cmd = [
        "gcloud", "alpha", "agent-registry", "skills", "create", skill_id,
        "--location", LOCATION,
        "--display-name", display_name,
        "--description", description,
        "--target-state", "draft",
        "--project", PROJECT_ID,
        "--quiet",
    ]
    result = _run(create_cmd, "create")
    if result.returncode != 0:
        if "ALREADY_EXISTS" in result.stderr or "already exists" in result.stderr.lower():
            logger.info(f"  Skill already exists, updating metadata...")
            update_cmd = [
                "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
                "--location", LOCATION,
                "--display-name", display_name,
                "--description", description,
                "--project", PROJECT_ID,
                "--quiet",
            ]
            update_result = _run(update_cmd, "update")
            if update_result.returncode != 0:
                logger.error(f"  ❌ Update failed: {update_result.stderr.strip()}")
                return False
        else:
            logger.error(f"  ❌ Create failed: {result.stderr.strip()}")
            return False

    # Step 2: Create a revision with the ZIP payload
    revision_name = "rev-1"
    logger.info(f"  Step 2: Creating revision '{revision_name}' with payload...")
    revision_cmd = [
        "gcloud", "alpha", "agent-registry", "skills", "revisions", "create", revision_name,
        "--skill", prefixed_id,
        "--location", LOCATION,
        "--payload", payload_path,
        "--project", PROJECT_ID,
        "--quiet",
    ]
    rev_result = _run(revision_cmd, "revision")
    if rev_result.returncode != 0:
        if "ALREADY_EXISTS" in rev_result.stderr:
            logger.info(f"  Revision already exists, skipping...")
        else:
            logger.error(f"  ❌ Revision create failed: {rev_result.stderr.strip()}")
            return False

    # Step 3: Set default revision
    full_revision = f"projects/{PROJECT_ID}/locations/{LOCATION}/skills/{prefixed_id}/revisions/{revision_name}"
    logger.info(f"  Step 3: Setting default revision...")
    default_cmd = [
        "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
        "--location", LOCATION,
        "--default-revision", full_revision,
        "--project", PROJECT_ID,
        "--quiet",
    ]
    default_result = _run(default_cmd, "default-revision")
    if default_result.returncode != 0:
        logger.warning(f"  ⚠️  Set default revision failed: {default_result.stderr.strip()}")

    # Step 4: Activate
    logger.info(f"  Step 4: Activating skill...")
    activate_cmd = [
        "gcloud", "alpha", "agent-registry", "skills", "update", prefixed_id,
        "--location", LOCATION,
        "--target-state", "active",
        "--project", PROJECT_ID,
        "--quiet",
    ]
    activate_result = _run(activate_cmd, "activate")
    if activate_result.returncode == 0:
        logger.info(f"  ✅ Skill '{skill_id}' registered and activated!")
        return True
    else:
        logger.warning(f"  ⚠️  Skill created but activation failed: {activate_result.stderr.strip()}")
        return True  # Skill exists, just not active yet


def main():
    """Package and register all marketing skills."""
    logger.info(f"Registering skills in Agent Registry (project={PROJECT_ID}, location={LOCATION})")

    results = {}
    with tempfile.TemporaryDirectory() as tmpdir:
        for skill in SKILLS:
            skill_id = skill["skill_id"]
            logger.info(f"\nProcessing skill: {skill_id}")

            # 1. Package
            zip_path = os.path.join(tmpdir, f"{skill_id}.zip")
            if not package_skill(skill["dir"], zip_path):
                results[skill_id] = "PACKAGE_FAILED"
                continue

            # 2. Register
            success = register_skill(
                skill_id=skill_id,
                display_name=skill["display_name"],
                description=skill["description"],
                payload_path=zip_path,
            )
            results[skill_id] = "REGISTERED" if success else "FAILED"

    # Summary
    print("\n" + "=" * 60)
    print("Agent Registry Skill Registration Summary")
    print("=" * 60)
    for skill_id, status in results.items():
        icon = "✅" if status == "REGISTERED" else "❌"
        print(f"  {icon} {skill_id}: {status}")

    all_ok = all(s == "REGISTERED" for s in results.values())
    return 0 if all_ok else 1


if __name__ == "__main__":
    # Allow override of location via CLI arg
    if len(sys.argv) > 1 and sys.argv[1] == "--location":
        LOCATION = sys.argv[2]
    sys.exit(main())
