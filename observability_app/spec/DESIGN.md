# UI/UX & Design System Specification (DESIGN) — GCP Multi-Agent Observability Platform

## 1. Aesthetic Vision & Glassmorphism Design Language

The Observability Platform is built with an **Enterprise Dark Mode Glassmorphism** design system inspired by mission-control telemetry dashboards (e.g. Datadog, Grafana, Cloud Trace, and Linear).

### Core Visual Pillars:
1. **Depth & Layering**: Translucent card backgrounds (`rgba(30, 41, 59, 0.7)`) layered over a deep slate gradient canvas (`#0b0f19` to `#0f172a`) with subtle `backdrop-filter: blur(12px)`.
2. **Distinct Agent Color Identities**: Every subagent has an invariant, high-contrast signature color applied across badges, tree connectors, status borders, and Gantt waterfall bars.
3. **Typography Distinction**: Clean geometric sans-serif (`Inter`, system UI) for labels and narrative copy, paired with monospace (`JetBrains Mono`, `monospace`) for session IDs, timestamps, OpenTelemetry attributes, and SQL blocks.
4. **Zero Layout Shift & Instant Feedback**: Smooth hover transitions (`0.15s ease`), active glow borders, and loading skeletons.

---

## 2. Color Palette & Token System

### 2.1 Surface & Background Tokens
| Token Name | CSS Value | Visual Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0b0f19` | Main application backdrop |
| `--bg-card` | `rgba(30, 41, 59, 0.65)` | Glassmorphism card surface |
| `--bg-card-hover`| `rgba(51, 65, 85, 0.75)` | Interactive row/card hover state |
| `--bg-secondary` | `rgba(15, 23, 42, 0.6)` | Inset containers, detail wells, code blocks |
| `--border-color` | `rgba(148, 163, 184, 0.15)`| Translucent card & divider borders |
| `--text-primary` | `#f8fafc` | Primary headlines, metric values, bold labels |
| `--text-secondary`| `#94a3b8` | Subheadings, descriptions, metadata |
| `--text-muted` | `#64748b` | Timestamps, micro-labels, axis ticks |

### 2.2 Agent Signature Color System
| Agent Entity | Signature Hex | RGBA Fill (15% opacity) | Role & Visual Identifier |
| :--- | :--- | :--- | :--- |
| **`marketing_orchestrator`** | `#4f46e5` (Indigo) | `rgba(79, 70, 229, 0.15)` | Root Workflow Coordinator & Routing |
| **`analytics_agent`** | `#0284c7` (Sky Cyan) | `rgba(2, 132, 199, 0.15)` | BigQuery NL2SQL & RFM Data |
| **`recommendation_pipeline`**| `#059669` (Emerald) | `rgba(5, 150, 105, 0.15)` | 5-Item Assortment & Cross-Sell Engine |
| **`a2ui_pipeline`** | `#ec4899` (Pink Rose) | `rgba(236, 72, 153, 0.15)` | Stammis Deal Banners & Drop Cards |
| **`strategy_pipeline`** | `#7c3aed` (Violet) | `rgba(124, 58, 237, 0.15)` | 3-Pillar Marketing Strategy |
| **`content_pipeline`** | `#d97706` (Amber) | `rgba(217, 119, 6, 0.15)` | Channel-Scoped Copy & SMS Limits |
| **`model_armor`** | `#e11d48` (Rose Crimson)| `rgba(225, 29, 72, 0.15)` | Ingress Guardrail & Safety Shield |

---

## 3. Core Component Layouts & Visual Specs

### 3.1 App Header & Tab Navigation Bar (`App.jsx`)
- **Top Brand Bar**:
  - Logo: Multi-colored connected node icon (`Activity`) with gradient text: **GCP Multi-Agent Observability Platform**.
  - Subtitle: *Enterprise Telemetry, Triage & Evaluation Control Plane*.
  - Action Controls:
    - `🔄 Sync GCP Telemetry` button (emerald pulse badge on click).
    - Status Indicator: `● Cloud Trace Active` (emerald badge).
- **Navigation Tabs Rail**:
  - 5 primary tab pills:
    1. `📊 Fleet Quality Index`
    2. `⚠️ 7-Dimension Error Triage`
    3. `🌲 Conversation Trace`
    4. `🤖 Agent Fleet Deep-Dive`
    5. `🧪 Quality Evals Suite`
  - Active Tab Style: Accent background (`#4f46e5`), white text, bottom indicator glow.

---

### 3.2 Fleet Quality Index (`FleetOverview.jsx`)
- **Executive Banner**:
  - Left: Gradient icon box (`48x48px`), Title **Fleet Quality Index**, Status pill `● HEALTHY (SLA MET)`.
  - Right: High-impact KPI numbers (Global Score `96.4%`, Task Completion `97.8%`).
- **6 KPI Scorecards (3x2 Grid)**:
  - Metric name, large monospace value (`font-size: 1.75rem`), delta indicator, and descriptive context micro-copy.
- **Visual Analytics Split Grid (2 Columns)**:
  - **Left (5-Axis SVG Radar Chart)**: Polygonal SVG radar displaying *Tool Use Accuracy*, *Grounding Faithfulness*, *Brand Voice Adherence*, *Task Completion Rate*, and *Latency SLA Adherence*.
  - **Right (Failure Taxonomy Distribution)**: Horizontal distribution bars for each of the 7 enterprise failure categories with incident counts and percentages.
- **Tenant Comparison Cards**:
  - Crazy Fashion (EUR) vs ICA Sverige (SEK) side-by-side performance cards.

---

### 3.3 7-Dimension Error Triage Board (`ErrorTriageBoard.jsx`)
- **Agent Fleet Health & Overview Matrix (Top Section)**:
  - 6 interactive agent health diagnostic cards in a responsive grid.
  - **Header**: Agent Name, Role, Domain Skill, Status Badge (`● HEALTHY` vs `⚠️ ATTENTION NEEDED`), Success Rate %, Open Issue Count.
  - **⚠️ What Could Improve Box**: Outlines concrete failure patterns (e.g. *Minimizing delegation ping-pong hops on compound inquiries*).
  - **✨ Suggestions on What to Look Into Box**: Actionable checklist of investigation items.
  - **Interactive Filtering**: Clicking any agent card filters the problem matrix below.
- **Problem Matrix Toolbar**:
  - Severity Filter Pills: `ALL (9)`, `CRITICAL (1)`, `HIGH (3)`, `MEDIUM (4)`, `LOW (1)`.
  - Category Filter Dropdown (7 dimensions).
  - Status Filter Pills: `ALL`, `OPEN (6)`, `INVESTIGATING (2)`, `RESOLVED (1)`.
- **Error Cluster Cards**:
  - Header: Category Badge, Severity Badge (`CRITICAL` in rose, `HIGH` in amber, `MEDIUM` in cyan, `LOW` in slate), Total Occurrences.
  - Cluster Title & Error Signature (in monospace font).
  - Diagnostic & ADK Remediation Sections (with code styling).
  - Sample Session ID tags (clickable).
  - Status Update & Audit Logging Button.

---

### 3.4 OpenTelemetry Conversation Trace Waterfall (`ConversationTraceWaterfall.jsx`)
- **Split Master-Detail Layout**:
  - **Left Rail (320px width)**: Search bar, Tenant filter, Routed Agent filter, and scrollable session cards.
  - **Right Trace Area**:
    - **Header**: Session ID, Client Badge, Turn Latency (`ms`), Total Tokens, Quality Score (`%`), Root Prompt.
    - **Delegation Flow Sequence**: Interactive visual chain: `User Intent` ➔ `Orchestrator` ➔ `Subagent 1` ➔ `Subagent 2` ➔ `BigQuery Tool`.
    - **Timeline Header & Ticks**: `0 ms`, `+25%`, `+50%`, `+75%`, `+Total ms` with vertical dashed reference lines.
    - **Waterfall Flow Table**:
      - Left (38% width): Tree depth indentation (`├── `, `└── `), Agent icon & color badge, Operation name (`invoke_workflow`, `check_prompt_guardrail`, `call_llm`, `execute_tool`), Duration pill, Status icon.
      - Right (62% width): Full-width Gantt timeline track. Span bar placed at `left: ${offsetPercent}%` and `width: ${durationPercent}%`.
    - **Interactive Span Inspector**: Displays OpenTelemetry semantic attributes, exact start/end offsets, and BigQuery SQL statement box.

---

### 3.5 Agent Fleet Deep-Dive Profiler (`AgentDeepDive.jsx`)
- **6 Agent Performance Cards (3x2 Grid)**:
  - Agent Name & Role with 4px left accent border.
  - Latency Percentile Cluster: `p50 (Median)`, `p90`, `p99` in large monospace numerals.
  - Volume & Overhead Row: `Invocations`, `Avg Tokens`, `Error Rate %`.
  - Operational SLA Badge.

---

### 3.6 Automated Quality Evals Suite (`QualityEvalsSuite.jsx`)
- **4-Step Evaluation Workflow**:
  - **Step 1**: Scenario Selector (6 baseline scenarios + dynamic AI generator) & Question Count Selector (`1`, `3`, `4`, `6`, `8`, `10 Questions`).
  - **Step 2**: Test Suite Viewer with expandable prompt test cases.
  - **Step 3**: Batch Run Execution Bar with live progress animation.
  - **Step 4**: Batch Quality Verdict Card: Overall pass rate, average quality score, 4-axis rubric score breakdown, and individual test case diagnostic drawer.

---

### 3.7 In-App AI Observability Assistant (`ObservabilityAssistantChat.jsx`)
- Floating interactive button in bottom-right corner (`✨ AI Observability Assistant`).
- Expandable / collapsible chat modal with full-screen expand toggle (`Maximize2` / `Minimize2`).
- Multi-step reasoning indicator during query processing.
- Rich Markdown output with syntax-highlighted SQL blocks and tool call telemetry inspection badges.
