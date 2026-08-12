#!/usr/bin/env python3
"""
agents-cli: Local CLI Tool for GCP Agent Platform
Manage, test, evaluate agents, and inspect Agent Registry Skills locally.
"""
import sys
import os
import argparse
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.orchestrator_agent import OrchestratorAgent
from backend.bq_client import BigQueryClient
from backend.skill_registry import SkillRegistry
from eval.local_eval import run_local_evaluation

def main():
    parser = argparse.ArgumentParser(description="agents-cli: Google Cloud Agent Platform CLI")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Command: list
    list_parser = subparsers.add_parser("list", help="List registered agents and bound skills")

    # Command: test
    test_parser = subparsers.add_parser("test", help="Test a prompt against the Agent Engine")
    test_parser.add_argument("--prompt", type=str, required=True, help="Marketing prompt to send")
    test_parser.add_argument("--segment", type=str, default="At-Risk Premium", help="Customer segment")

    # Command: eval
    eval_parser = subparsers.add_parser("eval", help="Run local evaluation benchmark suite")

    # Command: skills
    skills_parser = subparsers.add_parser("skills", help="Manage Agent Registry Skills")
    skills_parser.add_argument("action", choices=["list", "inspect"], help="Skills action")
    skills_parser.add_argument("--id", type=str, help="Skill ID to inspect")

    args = parser.parse_args()

    bq_client = BigQueryClient()
    orchestrator = OrchestratorAgent(bq_client=bq_client)
    skill_registry = SkillRegistry()

    if args.command == "list":
        print("\n🤖 Registered Agents in Agent Engine:")
        print("--------------------------------------------------")
        for metadata in [orchestrator.get_metadata(), orchestrator.analytics_agent.get_metadata(), orchestrator.strategy_agent.get_metadata(), orchestrator.content_agent.get_metadata()]:
            print(f"• ID: {metadata['agent_id']}")
            print(f"  Name: {metadata['name']}")
            print(f"  Skills: {', '.join(metadata['skills']) if metadata['skills'] else 'None'}")
            print()

    elif args.command == "test":
        print(f"\n🚀 Testing Prompt: '{args.prompt}' (Segment: {args.segment})")
        res = orchestrator.process_user_request(args.prompt, target_segment=args.segment)
        print(json.dumps(res, indent=2))

    elif args.command == "eval":
        summary = run_local_evaluation()
        print("\n📊 Local Evaluation Result:")
        print(json.dumps(summary, indent=2))

    elif args.command == "skills":
        if args.action == "list":
            skills = skill_registry.list_registered_skills()
            print("\n📚 Agent Registry Skills:")
            print("--------------------------------------------------")
            for s in skills:
                print(f"• ID: {s['skill_id']}")
                print(f"  Name: {s['name']}")
                print(f"  Category: {s['category']}")
                print(f"  Description: {s['description']}")
                print()
        elif args.action == "inspect":
            if not args.id:
                print("Error: --id is required for skills inspect")
                return
            detail = skill_registry.get_skill_content(args.id)
            print(f"\n📄 Skill Detail [{args.id}]:")
            print(detail.get("content", detail.get("error")))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
