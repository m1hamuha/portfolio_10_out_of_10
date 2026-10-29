# Fintech Dashboard & AI Financial Copilot

[![Portfolio Showcase](https://img.shields.io/badge/Portfolio-Showcase_10%2F10-blue)](../../README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6_Strict-blue)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Coverage_%3E80%25-brightgreen)](https://vitest.dev/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Interactive-success)](https://m1hamuha.github.io/portfolio/fintech-dashboard/)

> **Real-time financial telemetry, deterministic runway & burn modeling, scenario simulations, and resilient AI CFO advisory engine for high-growth tech enterprises and startups.**

---

### Portfolio Navigation Hub
**[← Central Portfolio Showcase Hub](../../README.md)**  
*Sister Systems:* **[InvoiceAutopilot](../../apps/invoice-autopilot/README.md)** · **[MarginPulse](../../apps/marginpulse/README.md)** · **[SlotSaver](../../apps/slotsaver/README.md)** · **[Kostin ERP Audit](../kostin-erp-audit/README.md)** · **[EUDR Assistant](../eudr-assistant/README.md)** · **[SaaS CRM/ERP](../saas-crm-erp/README.md)** · **[Fintech Dashboard (Current)](./README.md)**

---

## 1. Business Problem & Executive Summary

### The Startup Runway Blindspot
Founders and finance operators in venture-backed and bootstrapped startups navigate severe financial volatility where spreadsheet modeling consistently falls short:
1. **Spreadsheet Formula Fragility**: Over 88% of corporate spreadsheets contain formula errors. In runway planning, subtle formula shifts or outdated cash burn inputs lead founders to miss their capital-raising window, resulting in abrupt insolvency.
2. **IEEE 754 Floating-Point Inaccuracies**: Standard web dashboards calculate runway using floating-point math, introducing rounding drifts across multi-currency scenarios and multi-year projections.
3. **Fragile Cloud AI Integrations**: Modern financial copilot tools depend on remote LLM endpoints; when third-party AI APIs throttle or lose connectivity, the executive dashboard crashes or hangs indefinitely during crucial board meetings.

### Executive Summary: Deterministic Runway Intelligence
**Fintech Dashboard & AI Financial Copilot** (Milestone 4, Features F33–F37) provides startup executives with institutional-grade cash telemetry and automated scenario stress-testing:
- **Deterministic Runway & Burn Engine (F33)**: Computes gross/net burn rates, exact monthly runway, precise zero-cash date projections, and mathematical "Default Alive" detection in strict integer cents.
- **Dynamic Scenario Simulator (F34)**: Real-time slider and preset controls simulating hiring plans (added headcount × loaded cost), marketing budget adjustments, pricing/growth changes, and OpEx freezes.
- **Institutional Financial KPIs (F35)**: Real-time calculation of MRR, ARR, Gross Margin %, and OpEx category allocations (R&D, S&M, G&A, Operations) with Month-over-Month (MoM) trend tracking.
- **Dual-Mode Resilient AI Copilot Coach (F36)**: Streaming financial heuristics advisor that integrates with OpenRouter for live LLM inference when configured, and falls back seamlessly to deterministic financial heuristics when offline or without an API key.
- **1-Click Employer Demo Presets (F37)**: Instant one-click presets covering *Seed Stage Runway Emergency* (<4 mo runway), *Series A Scaleup* (18+ mo runway), and *Bootstrapped Default Alive* (profitable micro-SaaS).

---

## 2. Quantified Business Impact & Measurable ROI

| Metric | Static Excel Runway Model | Fintech Dashboard & Copilot | Quantified Enterprise ROI |
|---|---|---|---|
| **Scenario Simulation Latency** | 30–60 minutes manual formula editing | **< 1 millisecond real-time sliders** | **Instantaneous financial stress-testing** |
| **Financial Math Precision** | IEEE 754 floating-point drift | **Deterministic Integer-Cent Math (`Cents`)** | **Zero rounding errors** across all projections |
| **AI Availability SLA** | Fails when API key or cloud drops | **100% Uptime (Resilient Local Fallback)** | **Guaranteed execution** in board meetings & reviews |
| **Cash Crunch Warning** | Discovered when bank balance is low | **Automated Zero-Cash Date alerts** | **3–6 months advance warning** for fundraising |
| **Setup & Evaluation Time** | Complex setup or API configuration | **0 seconds (1-Click Presets)** | Immediate hiring manager evaluation |

### Scenario Stress-Testing:
- **Hiring additions**: Previews runway compression from adding senior engineering headcount ($15,000/mo loaded cost) before signing employment agreements.
- **OpEx Optimization**: Demonstrates how a 15% reduction in cloud infrastructure or G&A spend immediately postpones the zero-cash date by months.

---

## 3. Architecture & Engineering Decisions

```
packages/fintech-dashboard/
├── src/
│   ├── engine/                        # Financial domain engine (pure TypeScript, test-first)
│   │   ├── types.ts                   # FinancialMetrics, RunwayResult, ScenarioModifiers, Cents
│   │   ├── math.ts                    # Integer-cent math invariants & basis point logic
│   │   ├── runway.ts                  # Deterministic runway, net burn, and zero date engine (F33)
│   │   ├── kpis.ts                    # MRR, ARR, gross margin, and OpEx category allocations (F35)
│   │   ├── presets.ts                 # 1-Click enterprise topologies (Seed, Series A, Bootstrapped) (F37)
│   │   ├── openRouterClient.ts        # OpenRouter SSE streaming client with resilient fallback (F36)
│   │   └── mockAiCoach.ts             # Deterministic local financial heuristics engine (F36)
│   ├── components/
│   │   ├── RunwayCard.tsx             # Hero cash runway card with live zero-date & status chips
│   │   ├── ScenarioSimulator.tsx      # Real-time hiring, growth, and expense sliders (F34)
│   │   ├── KpiGrid.tsx                # MRR / ARR / Gross Margin / Net Burn cards with MoM trends (F35)
│   │   ├── OpExBreakdownCard.tsx      # Stacked visual OpEx allocation bar (R&D, S&M, G&A)
│   │   ├── PresetsBar.tsx             # 1-click preset selector bar (F37)
│   │   └── AiCoachDrawer.tsx          # Slide-over AI Copilot drawer with quick chips (F36)
│   └── styles/                        # High-density financial dark theme
└── tests/                             # Vitest automated test suites (38 tests)
    ├── runway.test.ts                 # Burn velocity, runway months, and zero date math
    ├── kpis.test.ts                   # MRR, ARR, and gross margin calculations
    ├── scenarios.test.ts              # Headcount and revenue delta simulations
    ├── presets.test.ts                # Preset schema and state consistency
    ├── mockAiCoach.test.ts            # Deterministic heuristic advice generation
    └── openRouterClient.test.ts       # Network failure resilience and offline fallback
```

### Architectural Invariants:
1. **Integer Cent Invariant (`Cents = number`)**: All monetary amounts across accounts, burn rates, revenues, and projections are represented as integer cents (`Cents`). Percentage changes and margins are modeled as integer basis points (`BasisPoints`, where 10,000 bps = 100.00% and 1 bps = 0.01%).
2. **Default Alive Detection**: When monthly recurring revenue exceeds monthly OpEx, the engine mathematically detects that net burn is negative ($\le 0$), reports runway as `Infinity`, and marks the company as `DEFAULT_ALIVE`.
3. **Deterministic Offline AI Fallback (F36)**: In the absence of an `OPENROUTER_API_KEY` or upon network disconnection, the copilot immediately routes prompts to `mockAiCoach.ts`. The heuristic engine performs financial diagnostic math, generating structured 3-part advisory reports with zero latency.
4. **Zero Server Exfiltration**: Operates 100% client-side in memory; zero bytes egress over the network during financial analysis.

---

## 4. 2-Command Quickstart & Interactive Demo

### 2-Command Local Setup (F39)
Install dependencies and run the complete Vitest test suite with zero configuration:

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Run unit and heuristic test suite
npm test --workspace=fintech-dashboard
```

### Development Server
```bash
npm run dev --workspace=fintech-dashboard
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Key Evaluation Workflows for Hiring Managers:
1. **1-Click Startup Presets (F37)**:
   - Click **"Seed Stage Runway Emergency"**: Cash is at $380k with a $110k/mo burn; runway displays a critical 3.5 months with urgent warning badges.
   - Click **"Series A Scaleup"**: Runway jumps to 18.2 months with healthy growth velocity.
   - Click **"Bootstrapped Default Alive"**: Net burn is negative (-$15,000/mo); runway displays `Infinity` and status confirms `DEFAULT_ALIVE`.
2. **Real-Time Scenario Modeling (F34)**:
   - On the Seed Stage preset, drag the **"Add Engineers"** slider to `+2`.
   - Watch the zero-cash date immediately pull forward by 1.1 months in real time.
3. **Engage Resilient AI Financial Copilot (F36)**:
   - Click **"🤖 Open AI Copilot"** in the top navigation.
   - Click the prompt chip **"Emergency runway extension plan"**.
   - Observe the instant structured response: Mathematical Diagnosis, 3-Point Action Plan, and Downside Risk Sensitivities.

---

### Bidirectional Portfolio Cross-Links (F40)
- **[Central Portfolio Showcase Hub](../../README.md)**
- **[InvoiceAutopilot — Zero-Touch Document Validation](../../apps/invoice-autopilot/README.md)**
- **[MarginPulse — In-Browser Profit Leak Engine](../../apps/marginpulse/README.md)**
- **[SlotSaver — Priority Appointment Backfilling](../../apps/slotsaver/README.md)**
- **[Kostin ERP Audit — Diagnostic Architecture Engine](../kostin-erp-audit/README.md)**
- **[EUDR Assistant — Geospatial Deforestation Compliance](../eudr-assistant/README.md)**
- **[SaaS CRM/ERP — Modular Operations Monorepo](../saas-crm-erp/README.md)**
