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
        skill_files = glob.glob(os.path.join(self.skills_dir, "*", "SKILL.md"))
        is_ica = (client_id == "ica_sweden")

        client_skill_descriptions = {
            "bigquery-customer-analytics": (
                "Executes BigQuery SQL queries on Swedish grocery customer datasets (`marketing_analytics_ica`) to extract Stammis metrics and basket spend in SEK."
                if is_ica else
                "Executes BigQuery SQL queries on Nordic fashion customer datasets (`marketing_analytics`) to extract RFM cohort metrics and revenue-at-risk in EUR."
            ),
            "campaign-framework": (
                "Designs omnichannel marketing strategies, campaign timelines, and channel mix in SEK for ICA Sverige store formats and Stammis campaigns."
                if is_ica else
                "Designs omnichannel marketing strategies, seasonal collection drop frameworks, and ROI projections in EUR for Crazy Fashion."
            ),
            "brand-voice-craft": (
                "Drafts warm, food-inspiring Swedish marketing copy (Email, Instagram, SMS) with ICA Stammis loyalty integration."
                if is_ica else
                "Drafts contemporary Nordic fashion copy (Email, Instagram, TikTok, SMS) with Crazy Club loyalty integration."
            ),
            "product-recommender": (
                "Curates tailored 5-product grocery assortments and merchandising strategies for ICA customer cohorts."
                if is_ica else
                "Curates tailored 5-product fashion assortments and merchandising strategies for Crazy Fashion customer cohorts."
            ),
            "a2ui-personalization": (
                "Designs personalized Swedish Grocery App Stammis offer banners with meal inspiration and recipe pairings."
                if is_ica else
                "Designs H&M-style high-fashion editorial drop cards with member exclusive pricing and size/color swatches."
            ),
        }

        for sf in skill_files:
            skill_folder = os.path.basename(os.path.dirname(sf))

            # Exclude CLI development skills (e.g. google-agents-cli-*)
            if skill_folder.startswith("google-agents-cli-") or "cli-" in skill_folder:
                continue

            try:
                with open(sf, encoding="utf-8") as f:
                    content = f.read()

                name = skill_folder
                description = client_skill_descriptions.get(skill_folder, "Domain Skill")
                category = "General"

                # Parse frontmatter if present
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        frontmatter = parts[1]
                        for line in frontmatter.strip().split("\n"):
                            if line.startswith("name:"):
                                name = line.split(":", 1)[1].strip().strip('"')
                            elif line.startswith("description:") and skill_folder not in client_skill_descriptions:
                                description = line.split(":", 1)[1].strip().strip('"')
                            elif line.startswith("category:"):
                                category = line.split(":", 1)[1].strip().strip('"')

                registered.append({
                    "skill_id": skill_folder,
                    "name": name,
                    "description": description,
                    "category": category,
                    "file_path": sf,
                    "status": "REGISTERED_IN_AGENT_REGISTRY"
                })
            except Exception as e:
                logger.error(f"Error reading skill at {sf}: {e}")

        # Sort predictably
        skill_order = ["bigquery-customer-analytics", "campaign-framework", "brand-voice-craft", "product-recommender", "a2ui-personalization"]
        registered.sort(key=lambda s: skill_order.index(s["skill_id"]) if s["skill_id"] in skill_order else 99)

        return registered

    def get_skill_content(self, skill_id: str) -> dict[str, Any]:
        """Returns the full text and metadata of a specific skill."""
        skill_path = os.path.join(self.skills_dir, skill_id, "SKILL.md")
        if not os.path.exists(skill_path):
            return {"error": f"Skill '{skill_id}' not found in registry."}

        with open(skill_path, encoding="utf-8") as f:
            content = f.read()

        return {
            "skill_id": skill_id,
            "content": content,
            "bytes": len(content.encode("utf-8"))
        }
