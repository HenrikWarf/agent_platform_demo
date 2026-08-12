"""
Agent Registry Skills Manager
Handles registration, metadata extraction, dynamic binding, and inspection of Agent Platform Skills.
"""
from typing import Dict, Any, List
import os
import glob
import logging

logger = logging.getLogger("skill_registry")

class SkillRegistry:
    def __init__(self):
        self.skills_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "skills"))

    def list_registered_skills(self) -> List[Dict[str, Any]]:
        """Scans skills repository and returns registered skills and their metadata."""
        registered = []
        skill_files = glob.glob(os.path.join(self.skills_dir, "*", "SKILL.md"))
        
        for sf in skill_files:
            skill_folder = os.path.basename(os.path.dirname(sf))
            
            # Exclude CLI development skills (e.g. google-agents-cli-*)
            if skill_folder.startswith("google-agents-cli-") or "cli-" in skill_folder:
                continue

            try:
                with open(sf, "r", encoding="utf-8") as f:
                    content = f.read()
                
                name = skill_folder
                description = "Domain Skill"
                category = "General"
                
                # Parse frontmatter if present
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        frontmatter = parts[1]
                        for line in frontmatter.strip().split("\n"):
                            if line.startswith("name:"):
                                name = line.split(":", 1)[1].strip().strip('"')
                            elif line.startswith("description:"):
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

        return registered

    def get_skill_content(self, skill_id: str) -> Dict[str, Any]:
        """Returns the full text and metadata of a specific skill."""
        skill_path = os.path.join(self.skills_dir, skill_id, "SKILL.md")
        if not os.path.exists(skill_path):
            return {"error": f"Skill '{skill_id}' not found in registry."}

        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()

        return {
            "skill_id": skill_id,
            "content": content,
            "bytes": len(content.encode("utf-8"))
        }
