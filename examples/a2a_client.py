"""
A2A Client Example — Call the Marketing Orchestrator Agent via the A2A Protocol.

This script demonstrates how to call the deployed ADK agent using the
Agent-to-Agent (A2A) protocol. The agent serves an A2A agent card at:
  /.well-known/agent-card.json

And accepts JSON-RPC calls at the /a2a/app endpoint.

Usage:
    PYTHONPATH=. python examples/a2a_client.py
    PYTHONPATH=. python examples/a2a_client.py "What are the top 5 customer segments by revenue?"
"""
import json
import sys
import uuid

import google.auth
import google.auth.transport.requests
import requests


# Agent Runtime A2A endpoints
RUNTIME_ID = "projects/1047232371360/locations/us-central1/reasoningEngines/3829020106671783936"
BASE_URL = "https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1"
AGENT_CARD_URL = f"{BASE_URL}/{RUNTIME_ID}/api/a2a/app/.well-known/agent-card.json"
RPC_URL = f"{BASE_URL}/{RUNTIME_ID}/api/a2a/app"


def get_auth_headers() -> dict:
    """Get Google Cloud authentication headers."""
    credentials, _ = google.auth.default()
    credentials.refresh(google.auth.transport.requests.Request())
    return {
        "Authorization": f"Bearer {credentials.token}",
        "Content-Type": "application/json",
    }


def fetch_agent_card():
    """Fetch and display the A2A agent card."""
    print("=" * 60)
    print("📇 Fetching A2A Agent Card")
    print("=" * 60)

    resp = requests.get(AGENT_CARD_URL, headers=get_auth_headers(), timeout=30)
    resp.raise_for_status()
    card = resp.json()

    print(f"  Name:         {card['name']}")
    print(f"  Description:  {card['description']}")
    print(f"  Version:      {card.get('version', 'N/A')}")
    print(f"  Streaming:    {card.get('capabilities', {}).get('streaming', False)}")
    print(f"  Input Modes:  {card.get('defaultInputModes', [])}")
    print(f"  Output Modes: {card.get('defaultOutputModes', [])}")

    if card.get("skills"):
        print(f"  Skills:       {len(card['skills'])}")
        for skill in card["skills"]:
            print(f"    - {skill['name']}: {skill.get('description', '')[:80]}")

    if card.get("supportedInterfaces"):
        print(f"  Interfaces:   {len(card['supportedInterfaces'])}")
        for iface in card["supportedInterfaces"]:
            print(f"    - {iface['protocolBinding']} v{iface['protocolVersion']}")

    print()
    return card


def send_a2a_message(prompt: str, streaming: bool = False):
    """Send a message to the agent via A2A JSON-RPC.

    Uses the A2A v1.0 SendMessage method (PascalCase).
    """
    print("=" * 60)
    print(f"💬 Sending A2A Message: \"{prompt[:60]}...\"")
    print("=" * 60)

    task_id = str(uuid.uuid4())

    # A2A v1.0 JSON-RPC request
    payload = {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": "SendMessage" if not streaming else "SendMessageStream",
        "params": {
            "message": {
                "messageId": str(uuid.uuid4()),
                "role": "ROLE_USER",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            },
            "configuration": {
                "acceptedOutputModes": ["text/plain"],
            },
        },
    }

    headers = get_auth_headers()
    headers["A2A-Version"] = "1.0"

    if streaming:
        # Streaming: read SSE events
        print("\n📡 Streaming response:\n")
        resp = requests.post(RPC_URL, headers=headers, json=payload, stream=True, timeout=120)
        resp.raise_for_status()

        for line in resp.iter_lines():
            if line:
                decoded = line.decode("utf-8")
                if decoded.startswith("data:"):
                    data = json.loads(decoded[5:].strip())
                    _print_a2a_response(data)
    else:
        # Non-streaming: single response
        resp = requests.post(RPC_URL, headers=headers, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        _print_a2a_response(data)

    print()


def _print_a2a_response(data: dict):
    """Pretty-print an A2A JSON-RPC response."""
    if "error" in data:
        print(f"  ❌ Error: {data['error']}")
        return

    result = data.get("result", data)

    # A2A v1.0 uses task-based responses
    status = result.get("status", {})
    state = status.get("state", "")

    # Also check for direct task structure
    if not state and "task" in result:
        task = result["task"]
        status = task.get("status", {})
        state = status.get("state", "")
        result = task

    print(f"  State: {state or 'COMPLETED'}")

    # Extract text from artifacts
    artifacts = result.get("artifacts", [])
    for artifact in artifacts:
        parts = artifact.get("parts", [])
        for part in parts:
            text = part.get("text", "")
            if text:
                if len(text) > 500:
                    print(f"  Response ({len(text)} chars):")
                    print(f"    {text[:500]}...")
                else:
                    print(f"  Response: {text}")

    # If no artifacts, check for direct message in status
    if not artifacts:
        message = status.get("message", {})
        if message:
            parts = message.get("parts", [])
            for part in parts:
                text = part.get("text", "")
                if text:
                    if len(text) > 500:
                        print(f"  Response ({len(text)} chars):")
                        print(f"    {text[:500]}...")
                    else:
                        print(f"  Response: {text}")

    # If still nothing, dump the raw result for debugging
    if not artifacts and not status.get("message"):
        print(f"  Raw result: {json.dumps(result, indent=2)[:800]}")


def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else "What are the top 5 customer segments by total revenue?"

    # Step 1: Fetch the agent card
    card = fetch_agent_card()

    # Step 2: Send an A2A message
    send_a2a_message(prompt, streaming=False)


if __name__ == "__main__":
    main()
