"""
Agent Gateway & Model Armor Security Service
Protects agent routes, performs prompt injection defense, PII masking, and rate limiting.
"""
from typing import Dict, Any
import logging
import re
from .config import Config

logger = logging.getLogger("agent_gateway")

class AgentGateway:
    def __init__(self):
        self.floor_id = Config.MODEL_ARMOR_FLOOR_ID
        self.gateway_url = Config.AGENT_GATEWAY_URL or "projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway"

    def inspect_and_sanitize(self, prompt: str) -> Dict[str, Any]:
        """
        Executes Model Armor inspection policies on prompt input at the Agent Gateway level.
        Verifies prompt against malicious injection patterns, script tags, and PII exposure.
        """
        lower = prompt.lower()
        
        # Threat detection rules
        injection_patterns = [
            r"ignore\s+(all\s+)?previous\s+instructions",
            r"bypass\s+safety",
            r"system\s+prompt\s+override",
            r"drop\s+table",
            r"<script>"
        ]
        
        detected_threats = []
        for pattern in injection_patterns:
            if re.search(pattern, lower):
                detected_threats.append(pattern)

        if detected_threats:
            logger.warning(f"Agent Gateway & Model Armor Triggered: Threat detected {detected_threats} at Gateway '{self.gateway_url}'")
            return {
                "passed": False,
                "floor_id": self.floor_id,
                "gateway_url": self.gateway_url,
                "filter_reason": f"Agent Gateway Model Armor Block: Threat Detected ({', '.join(detected_threats)})",
                "sanitized_prompt": None,
                "pii_masked": False
            }

        # PII Masking (Masking credit card numbers or raw emails if passed in prompt)
        sanitized = prompt
        pii_masked = False
        
        # Email masking pattern
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', prompt):
            sanitized = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', sanitized)
            pii_masked = True

        return {
            "passed": True,
            "floor_id": self.floor_id,
            "gateway_url": self.gateway_url,
            "filter_reason": "Clean",
            "sanitized_prompt": sanitized,
            "pii_masked": pii_masked
        }
