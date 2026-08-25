"""
Agent Registry Skills Manager
Handles registration, metadata extraction, dynamic binding, and inspection of Agent Platform Skills.
"""
import glob
import logging
import os
from typing import Any

logger = logging.getLogger("skill_registry")


class SkillRegistry:
    def __init__(self):
        self.skills_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "skills"))

    def list_registered_skills(self, client_id: str | None = None) -> list[dict[str, Any]]:
        """Scans skills repository and returns registered skills and their metadata tailored to active client."""
        registered = []
        is_ica = (client_id == "ica_sweden")
        target_prefix = "ica-" if is_ica else "crazy-fashion-"

        skill_files = glob.glob(os.path.join(self.skills_dir, "*", "SKILL.md"))

        for sf in skill_files:
            skill_folder = os.path.basename(os.path.dirname(sf))

            # Exclude CLI development skills (e.g. google-agents-cli-*)
            if skill_folder.startswith("google-agents-cli-") or "cli-" in skill_folder:
                continue

            # Filter skills for the active client
            if not skill_folder.startswith(target_prefix):
                continue

            try:
                with open(sf, encoding="utf-8") as f:
                    file_content = f.read()

                description = "Domain Skill"
                category = "General"

                # Parse YAML frontmatter if present
                if file_content.startswith("---"):
                    parts = file_content.split("---", 2)
                    if len(parts) >= 3:
                        frontmatter = parts[1]
                        for line in frontmatter.strip().splitlines():
                            if line.startswith("description:"):
                                description = line.split(":", 1)[1].strip().strip('"').strip("'")
                            elif line.startswith("category:"):
                                category = line.split(":", 1)[1].strip().strip('"').strip("'")

                # Formulate clean display name
                clean_name = skill_folder.replace(target_prefix, "").replace("-", " ").title()
                if "Bigquery" in clean_name:
                    clean_name = clean_name.replace("Bigquery", "BigQuery")
                if "A2Ui" in clean_name:
                    clean_name = clean_name.replace("A2Ui", "A2UI")

                registered.append({
                    "skill_id": skill_folder,
                    "name": clean_name,
                    "description": description,
                    "category": category,
                    "file_path": sf,
                    "status": "REGISTERED_IN_AGENT_REGISTRY",
                })
            except Exception as e:
                logger.error(f"Error reading skill at {sf}: {e}")

        # Sort predictably
        skill_order = [
            f"{target_prefix}customer-analytics",
            f"{target_prefix}campaign-framework",
            f"{target_prefix}brand-voice",
            f"{target_prefix}product-recommender",
            f"{target_prefix}a2ui-personalization",
        ]
        registered.sort(key=lambda s: skill_order.index(s["skill_id"]) if s["skill_id"] in skill_order else 99)

        return registered

    def get_skill_content(self, skill_id: str, client_id: str | None = None) -> dict[str, Any]:
        """Returns the full text and metadata of a specific skill directly from its SKILL.md file."""
        is_ica = (client_id == "ica_sweden")
        target_prefix = "ica-" if is_ica else "crazy-fashion-"

        # Resolve skill_id if short or prefixed
        resolved_id = skill_id
        if not (resolved_id.startswith("crazy-fashion-") or resolved_id.startswith("ica-")):
            # Convert legacy short ids
            if "analytics" in resolved_id:
                resolved_id = f"{target_prefix}customer-analytics"
            elif "campaign" in resolved_id or "strategy" in resolved_id:
                resolved_id = f"{target_prefix}campaign-framework"
            elif "brand" in resolved_id or "content" in resolved_id:
                resolved_id = f"{target_prefix}brand-voice"
            elif "recommender" in resolved_id or "product" in resolved_id:
                resolved_id = f"{target_prefix}product-recommender"
            elif "a2ui" in resolved_id:
                resolved_id = f"{target_prefix}a2ui-personalization"
            else:
                resolved_id = f"{target_prefix}{resolved_id}"

        skill_file = os.path.join(self.skills_dir, resolved_id, "SKILL.md")

        if os.path.isfile(skill_file):
            try:
                with open(skill_file, encoding="utf-8") as f:
                    file_content = f.read()

                return {
                    "skill_id": resolved_id,
                    "file_path": skill_file,
                    "content": file_content,
                    "status": "REGISTERED_IN_AGENT_REGISTRY",
                }
            except Exception as e:
                logger.error(f"Error reading skill file {skill_file}: {e}")

        return {
            "skill_id": skill_id,
            "file_path": skill_file,
            "content": f"# Skill {skill_id}\n\nSkill specification file not found at `{skill_file}`.",
            "status": "NOT_FOUND",
        }
