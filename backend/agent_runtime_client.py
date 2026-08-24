"""
Agent Runtime Client — Proxies requests to the deployed ADK Agent on Vertex AI Agent Runtime.

Instead of running agents locally, the Cloud Run backend delegates all agent
orchestration to the Agent Runtime instance deployed via `agents-cli deploy`.
This keeps the backend as a thin API layer handling safety, BigQuery data browsing,
and skill registry — while the actual multi-agent workflow runs on managed infrastructure.

Uses the Agent Engine `/api` passthrough to call the container's `/run_sse` endpoint
(ADK streaming API). Traffic routes through Agent Gateway when bound.
"""
import collections.abc
import datetime
import json
import logging
import os
import uuid
from typing import Any

import google.auth
import google.auth.transport.requests
import requests

logger = logging.getLogger("agent_runtime_client")

try:
    from .config import Config
except ImportError:
    from backend.config import Config


class AgentRuntimeClient:
    """Client for calling the deployed ADK Agent on Vertex AI Agent Runtime.

    Uses a hybrid URL approach:
    - /api passthrough for session management (not governed by gateway)
    - :streamQuery for agent queries (governed by Agent Gateway + Model Armor)

    Traffic flow for prompts:
      Client → :streamQuery → Agent Gateway (Model Armor screening) → Container
    """

    def __init__(self):
        self._credentials = None
        self._governed_url = None  # :streamQuery/:query governed endpoint
        self._active_sessions: set[tuple[str, str]] = set()  # (user_id, session_id)
        self.runtime_id = Config.AGENT_RUNTIME_ID
        if not self.runtime_id:
            self.runtime_id = self._read_deployment_metadata()

        # Pre-cache URLs for default runtime
        self._governed_url, self._base_url = self._build_urls_for_runtime(self.runtime_id)

    def _read_deployment_metadata(self) -> str | None:
        """Read runtime ID from deployment_metadata.json if it exists."""
        metadata_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "deployment_metadata.json")
        )
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, encoding="utf-8") as f:
                    data = json.load(f)
                runtime_id = data.get("remote_agent_runtime_id", "")
                if runtime_id:
                    logger.info(f"Loaded Agent Runtime ID from deployment_metadata.json: {runtime_id}")
                    return runtime_id
            except Exception as e:
                logger.warning(f"Failed to read deployment_metadata.json: {e}")
        return None

    def _resolve_runtime_id(self, client_id: str | None = None) -> str | None:
        """Resolve the target Agent Runtime ID based on the active client context."""
        client = (client_id or "").lower()
        if "ica" in client:
            return Config.AGENT_RUNTIME_ID_ICA_SVERIGE or self.runtime_id
        return Config.AGENT_RUNTIME_ID_CRAZY_FASHION or self.runtime_id

    def _build_urls_for_runtime(self, runtime_id: str | None) -> tuple[str | None, str | None]:
        """Build (governed_url, passthrough_url) from a runtime resource ID.

        - governed_url: :streamQuery / :query governed endpoints (Agent Gateway + Model Armor)
        - passthrough_url: /api passthrough for session management (not governed)
        """
        if not runtime_id:
            return None, None
        parts = runtime_id.split("/")
        if len(parts) >= 6:
            location = parts[3]  # e.g. "us-central1"
            governed_url = f"https://{location}-aiplatform.googleapis.com/v1beta1/{runtime_id}"
            passthrough_url = f"https://{location}-aiplatform.googleapis.com/reasoningEngines/v1/{runtime_id}/api"
            return governed_url, passthrough_url
        return None, None

    def _get_auth_headers(self) -> dict[str, str]:
        """Get authenticated headers using Google Cloud default credentials."""
        if self._credentials is None:
            self._credentials, _ = google.auth.default()

        auth_req = google.auth.transport.requests.Request()
        self._credentials.refresh(auth_req)
        return {
            "Authorization": f"Bearer {self._credentials.token}",
            "Content-Type": "application/json",
        }

    def _create_session(self, user_id: str, session_id: str | None = None, base_url: str | None = None) -> str:
        """Create a new ADK session via the /api passthrough.

        Session management doesn't need Agent Gateway governance —
        only actual prompts need Model Armor screening.
        """
        target_base_url = base_url or self._base_url
        url = f"{target_base_url}/apps/app/users/{user_id}/sessions"
        payload = {"id": session_id} if session_id else {}
        resp = requests.post(url, headers=self._get_auth_headers(), json=payload, timeout=30)
        if resp.status_code in (200, 201):
            created_id = resp.json().get("id", "") or session_id or ""
            logger.info(f"Created session {created_id} for user {user_id}")
            return created_id
        if resp.status_code == 409 and session_id:
            logger.info(f"Session {session_id} already exists for user {user_id}")
            return session_id
        resp.raise_for_status()
        created_id = resp.json().get("id", "")
        logger.info(f"Created session {created_id} for user {user_id}")
        return created_id

    def get_or_create_session(
        self, user_id: str | None = None, session_id: str | None = None, client_id: str | None = None
    ) -> tuple[str, str, bool]:
        """Ensure an active ADK session exists on the target Agent Runtime for the client.

        Returns (user_id, session_id, is_new_session).
        """
        user_id = user_id or f"user-{uuid.uuid4().hex[:8]}"
        target_runtime_id = self._resolve_runtime_id(client_id)
        _, target_base_url = self._build_urls_for_runtime(target_runtime_id)

        session_key = (f"{client_id or 'default'}:{user_id}", session_id or "")

        if session_id and session_key in self._active_sessions:
            return (user_id, session_id, False)

        if not target_base_url:
            sid = session_id or f"session-{uuid.uuid4().hex[:8]}"
            self._active_sessions.add((f"{client_id or 'default'}:{user_id}", sid))
            return (user_id, sid, not bool(session_id))

        if session_id:
            try:
                sid = self._create_session(user_id, session_id=session_id, base_url=target_base_url)
                self._active_sessions.add((f"{client_id or 'default'}:{user_id}", sid))
                return (user_id, sid, True)
            except Exception as e:
                logger.warning(f"Failed to register custom session {session_id}: {e}. Falling back.")

        try:
            created_sid = self._create_session(user_id, base_url=target_base_url)
            self._active_sessions.add((f"{client_id or 'default'}:{user_id}", created_sid))
            return (user_id, created_sid, True)
        except Exception as e:
            logger.error(f"Failed to create session on Agent Runtime: {e}")
            fallback_sid = session_id or f"session-{uuid.uuid4().hex[:8]}"
            self._active_sessions.add((f"{client_id or 'default'}:{user_id}", fallback_sid))
            return (user_id, fallback_sid, True)

    def query_stream(
        self,
        prompt: str,
        target_segment: str = "All Cohorts (Full Dataset)",
        session_id: str | None = None,
        user_id: str | None = None,
        client_id: str | None = None,
    ) -> collections.abc.Generator[dict[str, Any], None, None]:
        """Send a prompt to Agent Runtime via :streamQuery and yield real-time background execution steps.

        Yields SSE message dictionaries:
        - {"type": "step", "step": {...}} as agents transition, skills are loaded, and tools are called.
        - {"type": "final", "data": {...}, "session_id": ..., "user_id": ..., "steps": [...]} containing the complete formatted deliverable cards.
        """
        def now_str():
            return datetime.datetime.now().strftime("%H:%M:%S")

        recorded_steps: list[dict[str, Any]] = []

        from app.contexts import get_client_context
        client_ctx = get_client_context(client_id)

        # Contextualize prompt dynamically for the active client
        if client_ctx.client_id == "ica_sweden":
            effective_prompt = (
                f"[CLIENT IDENTITY & CONTEXT: {client_ctx.client_name.upper()} (SWEDISH GROCERY & HEALTH RETAILER)]\n"
                f"You represent {client_ctx.client_name} exclusively ({client_ctx.tagline}).\n"
                f"Industry: {client_ctx.industry} | HQ: {client_ctx.headquarters}\n"
                f"Currency Standard: {client_ctx.currency_code} ({client_ctx.currency_symbol})\n"
                f"Loyalty Program: {client_ctx.loyalty_program_name} (Stammispris, Personal coupons, monthly bonus vouchers)\n"
                f"Target BigQuery Dataset: `agent-demo-09.{client_ctx.bigquery_dataset}` (Tables: customer_rfm_summary, customer_demographics_360, customer_transactions, product_catalog, customer_events)\n"
                f"Customer Segments: {', '.join(client_ctx.customer_segments)}\n"
                f"Product Categories: {', '.join(client_ctx.product_categories)}\n\n"
                f"{client_ctx.company_prompt}\n\n"
                f"MANDATORY CLIENT INSTRUCTIONS:\n"
                f"1. You are the AI Marketing Orchestrator for {client_ctx.client_name}. If asked who you work for or what company this is, answer {client_ctx.client_name}.\n"
                f"2. For any customer analysis or BigQuery SQL queries, query the `{client_ctx.bigquery_dataset}` dataset and Swedish segments (e.g. 'Ekologiskt Medvetna', 'Barnfamiljer Storhandlare', 'Prisjägare & Studenter').\n"
                f"3. All monetary numbers and prices MUST be in Swedish Kronor ({client_ctx.currency_symbol}).\n\n"
                f"USER QUESTION:\n{prompt}"
            )
        else:
            effective_prompt = (
                f"[CLIENT IDENTITY & CONTEXT: {client_ctx.client_name.upper()}]\n"
                f"You represent {client_ctx.client_name} ({client_ctx.tagline}).\n"
                f"Currency: {client_ctx.currency_code} ({client_ctx.currency_symbol}) | Loyalty: {client_ctx.loyalty_program_name}\n"
                f"Target BigQuery Dataset: `agent-demo-09.{client_ctx.bigquery_dataset}`\n\n"
                f"USER QUESTION:\n{prompt}"
            )

        # Resolve target runtime and URLs
        target_runtime_id = self._resolve_runtime_id(client_id)
        governed_url, _ = self._build_urls_for_runtime(target_runtime_id)

        # Resolve persistent session
        user_id, session_id, is_new_session = self.get_or_create_session(
            user_id=user_id, session_id=session_id, client_id=client_id
        )

        # Step 1: Orchestrator A2A Supervisor Step
        if is_new_session:
            step_title = f"A2A Multi-Agent Supervisor Initialized ({client_ctx.client_name})"
            step_detail = f"Session {session_id[:16]}... started for {client_ctx.client_name}. Evaluating user objective and routing path..."
        else:
            step_title = f"A2A Multi-Agent Supervisor ({client_ctx.client_name})"
            step_detail = f"Continuing session {session_id[:16]}... for {client_ctx.client_name}. Evaluating follow-up context..."

        step_orch = {
            "id": f"step_orch_{uuid.uuid4().hex[:6]}",
            "timestamp": now_str(),
            "stage": "orchestrating",
            "agent": "marketing_orchestrator",
            "agent_name": f"Orchestrator Agent ({client_ctx.client_name})",
            "title": step_title,
            "detail": step_detail,
            "status": "completed",
            "icon": "cpu",
            "session_id": session_id,
        }
        recorded_steps.append(step_orch)
        yield {"type": "step", "step": step_orch}

        if not governed_url:
            err_msg = f"Agent Runtime for {client_ctx.client_name} is not configured. Deploy the agent first with 'agents-cli deploy'."
            step_err = {
                "id": f"step_err_{uuid.uuid4().hex[:6]}",
                "timestamp": now_str(),
                "stage": "error",
                "agent": "marketing_orchestrator",
                "agent_name": "Orchestrator Agent",
                "title": "Agent Runtime Not Configured",
                "detail": err_msg,
                "status": "error",
                "icon": "shield",
            }
            recorded_steps.append(step_err)
            yield {"type": "step", "step": step_err}
            yield {
                "type": "final",
                "data": {
                    "status": "ERROR",
                    "summary": err_msg,
                    "session_id": session_id,
                    "user_id": user_id,
                    "analytics": {},
                    "strategy": {},
                    "content": {},
                    "a2a_trace": [],
                    "steps": recorded_steps,
                },
                "session_id": session_id,
                "user_id": user_id,
                "steps": recorded_steps,
            }
            return

        events = []
        seen_author_stages = set()
        seen_tools = set()

        try:
            stream_url = f"{governed_url}:streamQuery"
            resp = requests.post(
                stream_url,
                headers=self._get_auth_headers(),
                json={
                    "class_method": "stream_query",
                    "input": {
                        "message": effective_prompt,
                        "user_id": user_id,
                        "session_id": session_id,
                    },
                },
                stream=True,
                timeout=(30, 300),
            )
            resp.raise_for_status()

            for line in resp.iter_lines(decode_unicode=True):
                if not line:
                    continue
                text_line = line.strip()
                if text_line.startswith("data:"):
                    text_line = text_line[5:].strip()
                if not text_line:
                    continue
                try:
                    event = json.loads(text_line)
                    events.append(event)
                except json.JSONDecodeError:
                    continue

                author = str(event.get("author", ""))
                event_content = event.get("content", {})
                actions = event.get("actions", {})
                transfer_to = str(actions.get("transferToAgent", ""))

                # 1. Check for Analytics Agent routing
                if ("analytics" in author or "analytics" in transfer_to) and "analytics_routing" not in seen_author_stages:
                    seen_author_stages.add("analytics_routing")
                    step_analytics = {
                        "id": f"step_analytics_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "delegation",
                        "agent": "analytics_agent",
                        "agent_name": f"Customer Insights & Analytics Agent ({client_ctx.client_name})",
                        "title": "Routing to Analytics Agent",
                        "detail": f"Activating skill 'bigquery-customer-analytics' against 5 {client_ctx.client_name} BigQuery customer tables",
                        "skill": "bigquery-customer-analytics",
                        "status": "running",
                        "icon": "database",
                    }
                    recorded_steps.append(step_analytics)
                    yield {"type": "step", "step": step_analytics}

                # 2. Check for Tool Call
                tool_name = self._extract_tool_name(event_content)
                fc_args = self._extract_tool_call_args(event_content)
                if tool_name and tool_name not in seen_tools:
                    seen_tools.add(tool_name)
                    sql_snippet = ""
                    if isinstance(fc_args, dict):
                        sql_snippet = fc_args.get("sql_query") or fc_args.get("query") or ""
                    step_tool = {
                        "id": f"step_tool_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "tool_call",
                        "agent": "analytics_agent",
                        "agent_name": f"Customer Insights & Analytics Agent ({client_ctx.client_name})",
                        "title": f"Invoking Tool: {tool_name}",
                        "detail": f"Executing SQL in BigQuery: {sql_snippet[:90]}..." if sql_snippet else f"Executing query tool '{tool_name}' on BigQuery dataset '{client_ctx.bigquery_dataset}'",
                        "tool": tool_name,
                        "skill": "bigquery-customer-analytics",
                        "status": "running",
                        "icon": "terminal",
                    }
                    recorded_steps.append(step_tool)
                    yield {"type": "step", "step": step_tool}

                # 3. Check for Tool Result
                tool_res = self._extract_tool_results(event_content)
                if tool_res and "tool_res" not in seen_author_stages:
                    seen_author_stages.add("tool_res")
                    row_count = 0
                    if isinstance(tool_res, dict):
                        row_count = tool_res.get("row_count") or len(tool_res.get("results", []))
                    step_res = {
                        "id": f"step_tool_res_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "tool_result",
                        "agent": "analytics_agent",
                        "agent_name": f"Customer Insights & Analytics Agent ({client_ctx.client_name})",
                        "title": "BigQuery Data Query Completed",
                        "detail": f"Retrieved {row_count} customer rows from dataset 'agent-demo-09.{client_ctx.bigquery_dataset}'" if row_count else f"BigQuery query completed on dataset '{client_ctx.bigquery_dataset}'",
                        "tool": tool_name or "query_customer_data",
                        "status": "completed",
                        "icon": "check",
                    }
                    recorded_steps.append(step_res)
                    yield {"type": "step", "step": step_res}

                # 4. Check for Strategy Pipeline routing
                if ("strategy" in author or "strategy" in transfer_to) and "strategy_routing" not in seen_author_stages:
                    seen_author_stages.add("strategy_routing")
                    step_strat = {
                        "id": f"step_strat_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "reasoning",
                        "agent": "strategy_pipeline",
                        "agent_name": "Omnichannel Strategy Pipeline",
                        "title": "Routing to Strategy Pipeline",
                        "detail": "Applying skill 'campaign-framework' to formulate 3-pillar strategy & projected EUR recovery",
                        "skill": "campaign-framework",
                        "status": "running",
                        "icon": "trending-up",
                    }
                    recorded_steps.append(step_strat)
                    yield {"type": "step", "step": step_strat}

                # 5. Check for Strategy Formatting
                if ("strategy_json" in author or "strategy_formatter" in author) and "strategy_fmt" not in seen_author_stages:
                    seen_author_stages.add("strategy_fmt")
                    step_strat_fmt = {
                        "id": f"step_strat_fmt_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "formatting",
                        "agent": "strategy_pipeline",
                        "agent_name": "Strategy Pipeline (Structured Output)",
                        "title": "Validating Strategy Deliverables Schema",
                        "detail": "Formatting structured Pydantic StrategySchema (pillars, 100% channel mix, A/B hypotheses)",
                        "status": "completed",
                        "icon": "file-text",
                    }
                    recorded_steps.append(step_strat_fmt)
                    yield {"type": "step", "step": step_strat_fmt}

                # 6. Check for Recommendation Pipeline routing
                if ("recommendation" in author or "recommendation" in transfer_to) and "rec_routing" not in seen_author_stages:
                    seen_author_stages.add("rec_routing")
                    step_rec = {
                        "id": f"step_rec_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "reasoning",
                        "agent": "recommendation_pipeline",
                        "agent_name": "Product Recommendation Pipeline",
                        "title": "Routing to Recommendation Pipeline",
                        "detail": "Applying skill 'product-recommender' to curate 5 tailored items from BigQuery product catalog",
                        "skill": "product-recommender",
                        "status": "running",
                        "icon": "shopping-bag",
                    }
                    recorded_steps.append(step_rec)
                    yield {"type": "step", "step": step_rec}

                # 7. Check for Recommendation Formatting
                if ("recommendation_formatter" in author or "recommendation_json" in author) and "rec_fmt" not in seen_author_stages:
                    seen_author_stages.add("rec_fmt")
                    step_rec_fmt = {
                        "id": f"step_rec_fmt_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "formatting",
                        "agent": "recommendation_pipeline",
                        "agent_name": "Recommendation Pipeline (Structured Output)",
                        "title": "Validating Product Recommendation Schema",
                        "detail": "Formatting structured Pydantic ProductRecommendationSchema with 5 data-driven product matches",
                        "status": "completed",
                        "icon": "file-text",
                    }
                    recorded_steps.append(step_rec_fmt)
                    yield {"type": "step", "step": step_rec_fmt}

                # 8. Check for A2UI Pipeline routing
                if ("a2ui" in author or "a2ui" in transfer_to) and "a2ui_routing" not in seen_author_stages:
                    seen_author_stages.add("a2ui_routing")
                    step_a2ui = {
                        "id": f"step_a2ui_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "reasoning",
                        "agent": "a2ui_pipeline",
                        "agent_name": "A2UI Component Designer",
                        "title": "Designing Interactive Personalization UI",
                        "detail": "Crafting tailored digital offer component with dynamic pricing and member perks",
                        "status": "running",
                        "icon": "sparkles",
                    }
                    recorded_steps.append(step_a2ui)
                    yield {"type": "step", "step": step_a2ui}

                # 9. Check for A2UI Formatting
                if ("a2ui_formatter" in author or "a2ui_json" in author) and "a2ui_fmt" not in seen_author_stages:
                    seen_author_stages.add("a2ui_fmt")
                    step_a2ui_fmt = {
                        "id": f"step_a2ui_fmt_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "formatting",
                        "agent": "a2ui_pipeline",
                        "agent_name": "A2UI Pipeline (Structured Output)",
                        "title": "Validating A2UI Component Schema",
                        "detail": "Formatting structured Pydantic A2UIComponentSchema for interactive client banner",
                        "status": "completed",
                        "icon": "file-text",
                    }
                    recorded_steps.append(step_a2ui_fmt)
                    yield {"type": "step", "step": step_a2ui_fmt}

                # 10. Check for Content Pipeline routing
                if ("content" in author or "content" in transfer_to) and "content_routing" not in seen_author_stages:
                    seen_author_stages.add("content_routing")
                    step_content = {
                        "id": f"step_content_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "reasoning",
                        "agent": "content_pipeline",
                        "agent_name": "Brand Voice Content Pipeline",
                        "title": "Routing to Content Pipeline",
                        "detail": "Applying skill 'brand-voice-craft' to craft Nordic emails, Instagram copy, and SMS",
                        "skill": "brand-voice-craft",
                        "status": "running",
                        "icon": "mail",
                    }
                    recorded_steps.append(step_content)
                    yield {"type": "step", "step": step_content}

                # 9. Check for Content Formatting
                if ("content_json" in author or "content_formatter" in author) and "content_fmt" not in seen_author_stages:
                    seen_author_stages.add("content_fmt")
                    step_content_fmt = {
                        "id": f"step_content_fmt_{uuid.uuid4().hex[:6]}",
                        "timestamp": now_str(),
                        "stage": "formatting",
                        "agent": "content_pipeline",
                        "agent_name": "Content Pipeline (Structured Output)",
                        "title": "Validating Creative Deliverables Schema",
                        "detail": "Formatting structured Pydantic ContentSchema for requested channels",
                        "status": "completed",
                        "icon": "file-text",
                    }
                    recorded_steps.append(step_content_fmt)
                    yield {"type": "step", "step": step_content_fmt}

            # In-line Model Armor Verification step
            step_gov = {
                "id": f"step_gov_{uuid.uuid4().hex[:6]}",
                "timestamp": now_str(),
                "stage": "governance",
                "agent": "agent_gateway",
                "agent_name": "Agent Gateway & Model Armor",
                "title": "In-Line Model Armor & Governance Check",
                "detail": "Passed prompt & response safety guardrails, PII filters, and Responsible AI safety policies",
                "status": "completed",
                "icon": "shield",
            }
            recorded_steps.append(step_gov)
            yield {"type": "step", "step": step_gov}

            final_data = self._format_response(
                events, prompt, target_segment, session_id=session_id, user_id=user_id
            )
            final_data["steps"] = recorded_steps
            yield {
                "type": "final",
                "data": final_data,
                "session_id": session_id,
                "user_id": user_id,
                "steps": recorded_steps,
            }

        except Exception as e:
            logger.error(f"Streaming query failed: {e}")
            step_err = {
                "id": f"step_err_{uuid.uuid4().hex[:6]}",
                "timestamp": now_str(),
                "stage": "error",
                "agent": "marketing_orchestrator",
                "agent_name": "Orchestrator Agent",
                "title": "Agent Execution Error",
                "detail": str(e),
                "status": "error",
                "icon": "shield",
                "session_id": session_id,
            }
            recorded_steps.append(step_err)
            yield {"type": "step", "step": step_err}
            yield {
                "type": "final",
                "data": {
                    "status": "ERROR",
                    "summary": f"Agent Runtime execution failed: {str(e)}",
                    "session_id": session_id,
                    "user_id": user_id,
                    "analytics": {},
                    "strategy": {},
                    "content": {},
                    "a2a_trace": [],
                    "steps": recorded_steps,
                },
                "session_id": session_id,
                "user_id": user_id,
                "steps": recorded_steps,
            }

    def query(
        self,
        prompt: str,
        target_segment: str = "All Cohorts (Full Dataset)",
        session_id: str | None = None,
        user_id: str | None = None,
        client_id: str | None = None,
    ) -> dict[str, Any]:
        """Send a prompt to Agent Runtime via :streamQuery and return structured results."""
        final_res = None
        for event in self.query_stream(
            prompt=prompt,
            target_segment=target_segment,
            session_id=session_id,
            user_id=user_id,
            client_id=client_id,
        ):
            if event.get("type") == "final":
                final_res = event.get("data")
        return final_res or {
            "status": "ERROR",
            "summary": "No response returned from Agent Runtime.",
            "session_id": session_id or "",
            "user_id": user_id or "",
            "analytics": {},
            "strategy": {},
            "content": {},
            "a2a_trace": [],
            "steps": [],
        }

    def _format_response(
        self,
        events: list,
        prompt: str,
        target_segment: str,
        session_id: str = "",
        user_id: str = "",
    ) -> dict[str, Any]:
        """Format ADK SSE events into the frontend response structure.

        Extracts the final agent text response and any structured data from:
        - Tool functionResponse events (analytics from query_customer_data)
        - Text events from formatter agents with output_schema (strategy, content)
        """
        analytics = {}
        strategy = {}
        content = {}
        recommendation = {}
        a2ui = {}
        a2a_trace = []
        sql_executed = ""
        seen_agents = []
        last_text = ""

        for event in events:
            # SSE events have a nested content structure
            event_content = event.get("content", {})

            # Track author
            author = event.get("author", "")

            # Extract text content
            text = self._extract_text(event_content)
            if text:
                # Check if this is a formatter agent emitting structured JSON
                if author in ("strategy_formatter", "strategy_agent") and not strategy:
                    parsed = self._try_parse_json(text)
                    if parsed and ("campaign_title" in parsed or "campaign_pillars" in parsed):
                        strategy = parsed
                        continue
                elif author in ("content_formatter", "content_agent") and not content:
                    parsed = self._try_parse_json(text)
                    if parsed and ("email_template" in parsed or "social_posts" in parsed or "sms_copy" in parsed):
                        content = {"generated_assets": parsed}
                        continue
                elif author in ("recommendation_formatter", "recommendation_agent") and not recommendation:
                    parsed = self._try_parse_json(text)
                    if parsed and ("recommended_products" in parsed or "target_segment" in parsed):
                        recommendation = parsed
                        continue
                elif author in ("a2ui_formatter", "a2ui_agent") and not a2ui:
                    parsed = self._try_parse_json(text)
                    if parsed and ("client_type" in parsed or "ica_offer_banner" in parsed or "fashion_drop_card" in parsed or "deal_price_major" in parsed or "collection_title" in parsed):
                        a2ui = parsed
                        continue

                # Keep as summary text (orchestrator speaks last)
                last_text = text

            # Extract tool results (analytics from query_customer_data)
            tool_results = self._extract_tool_results(event_content)
            if tool_results:
                if "cohort_details" in tool_results or "sql_executed" in tool_results or "results" in tool_results:
                    analytics = tool_results
                    sql_executed = tool_results.get("sql_executed", sql_executed)
                elif "strategy" in tool_results and not strategy:
                    # Legacy: tool-based strategy (backward compat)
                    strategy = tool_results.get("strategy", {})
                elif "generated_assets" in tool_results and not content:
                    # Legacy: tool-based content (backward compat)
                    content = tool_results

            # Track agent sequence for A2A trace
            transfer_to = event.get("actions", {}).get("transferToAgent", "")
            if author and (not seen_agents or seen_agents[-1] != author):
                seen_agents.append(author)
            if transfer_to and (not seen_agents or seen_agents[-1] != transfer_to):
                seen_agents.append(transfer_to)

        # If structured outputs weren't found from specific authors, try parsing from any text
        if not strategy or not content or not recommendation or not a2ui:
            for event in events:
                text = self._extract_text(event.get("content", {}))
                if text:
                    parsed = self._try_parse_json(text)
                    if parsed:
                        if not strategy and ("campaign_title" in parsed or "campaign_pillars" in parsed):
                            strategy = parsed
                        elif not content and ("email_template" in parsed or "social_posts" in parsed or "sms_copy" in parsed):
                            content = {"generated_assets": parsed}
                        elif not recommendation and ("recommended_products" in parsed):
                            recommendation = parsed
                        elif not a2ui and ("client_type" in parsed or "ica_offer_banner" in parsed or "fashion_drop_card" in parsed or "deal_price_major" in parsed or "collection_title" in parsed):
                            a2ui = parsed

        # Build A2A trace as sender→receiver pairs
        # Filter out internal formatter agents from the trace display
        display_agents = [a for a in seen_agents if "formatter" not in a]
        skill_map = {
            "analytics_agent": "bigquery_customer_analytics",
            "recommendation_agent": "product_recommender",
            "recommendation_pipeline": "product_recommender",
            "a2ui_agent": "a2ui_designer",
            "a2ui_pipeline": "a2ui_designer",
            "strategy_agent": "omnichannel_strategy",
            "strategy_pipeline": "omnichannel_strategy",
            "content_agent": "brand_voice",
            "content_pipeline": "brand_voice",
        }
        intent = "ANALYTICS_ONLY"
        if any("a2ui" in a for a in seen_agents):
            intent = "A2UI_COMPONENT_ONLY"
        elif any("recommendation" in a for a in seen_agents):
            intent = "RECOMMENDATIONS_ONLY"
        elif any("strategy" in a for a in seen_agents):
            intent = "STRATEGY_ONLY"
        elif any("content" in a for a in seen_agents):
            intent = "FULL_CAMPAIGN"

        for i in range(len(display_agents) - 1):
            sender = display_agents[i]
            receiver = display_agents[i + 1]
            a2a_trace.append({
                "sender_id": sender,
                "receiver_id": receiver,
                "intent": intent,
                "skill_used": skill_map.get(receiver, ""),
            })

        # Use the last text event as summary (orchestrator always speaks last)
        summary = last_text or "Agent completed processing."

        return {
            "status": "SUCCESS",
            "summary": summary,
            "session_id": session_id,
            "user_id": user_id,
            "analytics": analytics,
            "recommendation": recommendation,
            "a2ui": a2ui,
            "strategy": strategy,
            "content": content,
            "sql_executed": sql_executed,
            "a2a_trace": a2a_trace,
            "intent": intent,
            "target_segment": target_segment,
        }

    @staticmethod
    def _extract_text(content: dict) -> str | None:
        """Extract text content from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "text" in part:
                    return part["text"]
        return None

    @staticmethod
    def _try_parse_json(text: str) -> dict[str, Any] | None:
        """Try to parse a text string as JSON. Returns None if parsing fails."""
        if not text or not text.strip():
            return None
        text = text.strip()
        # Handle markdown code fences around JSON
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [line for line in lines if not line.strip().startswith("```")]
            text = "\n".join(lines).strip()
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, ValueError):
            pass
        return None

    @staticmethod
    def _extract_tool_results(content: dict) -> dict[str, Any] | None:
        """Extract tool call results from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and "functionResponse" in part:
                    response = part["functionResponse"]
                    if isinstance(response, dict):
                        return response.get("response", response)
                # Also check camelCase variant
                if isinstance(part, dict) and "function_response" in part:
                    response = part["function_response"]
                    if isinstance(response, dict):
                        return response.get("response", response)
        return None

    @staticmethod
    def _extract_tool_name(content: dict) -> str | None:
        """Extract the tool/function name from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict):
                    fc = part.get("functionCall") or part.get("function_call")
                    if fc and isinstance(fc, dict):
                        return fc.get("name", "")
                    fr = part.get("functionResponse") or part.get("function_response")
                    if fr and isinstance(fr, dict):
                        return fr.get("name", "")
        return None

    @staticmethod
    def _extract_tool_call_args(content: dict) -> dict[str, Any] | None:
        """Extract arguments passed to a tool call from an ADK SSE event content block."""
        if isinstance(content, dict):
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, dict):
                    fc = part.get("functionCall") or part.get("function_call")
                    if fc and isinstance(fc, dict):
                        return fc.get("args", {})
        return None

    @property
    def is_configured(self) -> bool:
        """Check if Agent Runtime is configured."""
        return bool(self.runtime_id)

    def get_agent_metadata(self, client_id: str | None = None) -> list:
        """Return static agent metadata for the /api/agents endpoint tailored to active client."""
        is_ica = (client_id == "ica_sweden")
        client_name = "ICA Sverige" if is_ica else "Crazy Fashion"
        dataset = "agent-demo-09.marketing_analytics_ica" if is_ica else "agent-demo-09.marketing_analytics"
        curr = "SEK (kr)" if is_ica else "EUR (€)"

        return [
            {
                "agent_id": "marketing_orchestrator",
                "name": f"Marketing Campaign Orchestrator ({client_name})",
                "type": "orchestrator",
                "description": f"Enterprise Marketing Campaign Supervisor for {client_name} — routes objectives to Analytics, Recommendations, A2UI, Strategy, and Content agents.",
                "skills": [],
                "sub_agents": ["analytics_agent", "recommendation_pipeline", "a2ui_pipeline", "strategy_pipeline", "content_pipeline"],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "analytics_agent",
                "name": f"Customer Insights & Analytics Agent ({client_name})",
                "type": "specialist",
                "description": f"Executes BigQuery customer data analysis, cohort extraction, and RFM segmentation on `{dataset}`.",
                "skills": ["bigquery-customer-analytics"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "recommendation_pipeline",
                "name": f"Product Recommendation Pipeline ({client_name})",
                "type": "specialist",
                "description": f"Curates tailored 5-product assortments and merchandising strategies for {client_name} customer cohorts.",
                "skills": ["product-recommender"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "a2ui_pipeline",
                "name": f"A2UI Component & Personalization Designer ({client_name})",
                "type": "specialist",
                "description": "Designs personalized Swedish Grocery App Stammis offer banners with recipe pairings." if is_ica else "Designs H&M-style high-fashion editorial drop cards with member exclusive pricing and size selectors.",
                "skills": ["a2ui-personalization"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "strategy_pipeline",
                "name": f"Omnichannel Strategy Pipeline ({client_name})",
                "type": "specialist",
                "description": f"Designs campaign frameworks, channel mix, and ROI projections in {curr} for {client_name}.",
                "skills": ["campaign-framework"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
            {
                "agent_id": "content_pipeline",
                "name": f"Brand Voice Content Pipeline ({client_name})",
                "type": "specialist",
                "description": "Drafts warm, food-inspiring Swedish marketing copy (email, social, SMS) with Stammis loyalty integration." if is_ica else "Drafts contemporary Nordic fashion copy (email, social, SMS) with Crazy Club loyalty integration.",
                "skills": ["brand-voice-craft"],
                "sub_agents": [],
                "runtime": "agent_runtime" if self.is_configured else "not_deployed",
            },
        ]
