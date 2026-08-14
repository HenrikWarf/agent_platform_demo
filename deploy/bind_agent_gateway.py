#!/usr/bin/env python3
"""
Bind Agent Gateway to Agent Runtime (Reasoning Engine).

Attaches the Agent Gateway's CLIENT_TO_AGENT config to the deployed
Reasoning Engine so all incoming query/streamQuery traffic is governed
by Model Armor security policies and access control.

Prerequisites:
  - Reasoning Engine deployed with `--agent-identity` enabled
  - Agent Gateway already created (deploy/agent_gateway.yaml)

Usage:
  PYTHONPATH=. ./venv/bin/python deploy/bind_agent_gateway.py
"""
import json
import subprocess
import sys


GATEWAY_RESOURCE = "projects/agent-demo-09/locations/us-central1/agentGateways/marketing-agent-gateway"
ENGINE_RESOURCE = None  # Auto-detected from deployment_metadata.json


def get_engine_resource():
    """Read the Reasoning Engine resource name from deployment_metadata.json."""
    try:
        with open("deployment_metadata.json", "r") as f:
            data = json.load(f)
        return data.get("remote_agent_runtime_id", "")
    except FileNotFoundError:
        print("❌ deployment_metadata.json not found. Run 'agents-cli deploy' first.")
        sys.exit(1)


def get_access_token():
    result = subprocess.run(
        ["gcloud", "auth", "application-default", "print-access-token"],
        capture_output=True, text=True,
    )
    return result.stdout.strip()


def bind_gateway(engine_resource: str, gateway_resource: str):
    """Attach Agent Gateway CLIENT_TO_AGENT config to the Reasoning Engine."""
    token = get_access_token()

    # PATCH via v1beta1 API
    url = f"https://us-central1-aiplatform.googleapis.com/v1beta1/{engine_resource}?updateMask=spec.deploymentSpec.agentGatewayConfig"

    payload = {
        "spec": {
            "deploymentSpec": {
                "agentGatewayConfig": {
                    "clientToAgentConfig": {
                        "agentGateway": gateway_resource,
                    }
                }
            }
        }
    }

    result = subprocess.run(
        [
            "curl", "-s", "-X", "PATCH",
            "-H", f"Authorization: Bearer {token}",
            "-H", "Content-Type: application/json",
            url,
            "-d", json.dumps(payload),
        ],
        capture_output=True, text=True,
    )

    response = json.loads(result.stdout)
    if "error" in response:
        print(f"❌ Failed to bind Agent Gateway: {response['error']['message']}")
        print()
        if "AGENT_IDENTITY" in response["error"]["message"]:
            print("💡 The Reasoning Engine must be deployed with --agent-identity.")
            print("   Run: agents-cli deploy --agent-identity --no-confirm-project")
        sys.exit(1)
    else:
        print("✅ Agent Gateway bound to Reasoning Engine!")
        print(f"   Gateway:  {gateway_resource}")
        print(f"   Engine:   {engine_resource}")
        print(f"   Mode:     CLIENT_TO_AGENT (ingress governance)")
        print()
        print("   All query/streamQuery traffic now routes through Agent Gateway")
        print("   with Model Armor security policies enforced.")


if __name__ == "__main__":
    engine = ENGINE_RESOURCE or get_engine_resource()
    print(f"🔗 Binding Agent Gateway to Reasoning Engine...")
    print(f"   Engine:  {engine}")
    print(f"   Gateway: {GATEWAY_RESOURCE}")
    print()
    bind_gateway(engine, GATEWAY_RESOURCE)
