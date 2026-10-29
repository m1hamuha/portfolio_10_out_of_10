# E2E Test Infra: Portfolio 10/10 Overhaul

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests are designed directly from `ORIGINAL_REQUEST.md` and user-facing specifications, exercising the application as an end-user or hiring manager would.
- **Methodology**: Systematic 4-tier design:
  - **Tier 1 — Feature Coverage**: Happy-path verification of every feature in isolation (>=5 tests per feature).
  - **Tier 2 — Boundary & Corner Cases**: Edge cases, invalid data, zero/negative bounds, rounding edges, and corrupted inputs (>=5 tests per feature).
  - **Tier 3 — Cross-Feature Interactions**: Pairwise combinatorial testing across interdependent features (e.g., duplicate detection combined with multi-step review and DATEV export; polygon validation combined with coordinate conflict and TRACES NT zip export).
  - **Tier 4 — Real-World Application Scenarios**: End-to-end realistic user flows (e.g., complete month-end invoice processing batch, multi-million dollar e-commerce Amazon settlement audit with fee leak identification, clinic appointment cancellation rush backfill).
- **Zero Server Exfiltration Assertion**: Network inspection verifies that MarginPulse transmits zero client payloads to external servers.
- **Performance Budget Assertions**: Automated Playwright timing checks verify cold load < 1.5s and 1,000-row processing < 300ms.

---

## Feature Inventory & Test Matrix
| # | Feature | Requirement Source | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|-------------------|:--------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | InvoiceAutopilot Document Validation & Multi-Step Review | ORIGINAL_REQUEST R1, AC 44 | 5 | 5 | ✓ | ✓ |
| 2 | InvoiceAutopilot Presets & Duplicate Diff | ORIGINAL_REQUEST R1, AC 44 | 5 | 5 | ✓ | ✓ |
| 3 | InvoiceAutopilot Structured Export (CSV/JSON/DATEV) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| 4 | InvoiceAutopilot Quantifiable ROI Calculator | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| 5 | MarginPulse Integer-Cent Engine & Ingestion (Shopify/Amazon/WooCommerce) | ORIGINAL_REQUEST R1, AC 51 | 5 | 5 | ✓ | ✓ |
| 6 | MarginPulse 1k Dataset & Sub-300ms Client-Side Benchmark | ORIGINAL_REQUEST R1, AC 45 | 5 | 5 | ✓ | ✓ |
| 7 | MarginPulse Interactive Profit Leak Waterfall & Drilldown | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| 8 | MarginPulse Executive Audit Report & Zero-Exfiltration | ORIGINAL_REQUEST R1, AC 45 | 5 | 5 | ✓ | ✓ |
| 9 | SlotSaver Priority Scoring & Transparent Cards | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| 10 | SlotSaver n8n Webhook & Resilient Mock Fallback | ORIGINAL_REQUEST R1, AC 52 | 5 | 5 | ✓ | ✓ |
| 11 | SlotSaver Live Event Stream & Timestamps | ORIGINAL_REQUEST R1, AC 46 | 5 | 5 | ✓ | ✓ |
| 12 | SlotSaver Downloadable n8n Workflow JSON & Recovery ROI | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| 13 | kostin-erp-audit Diagnostic Engine (0-100) & Sub-scores | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 14 | kostin-erp-audit Presets & jsPDF Executive Export | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 15 | EUDR-Assistant Turf Boundary Validator & Precision | ORIGINAL_REQUEST R2, AC 55 | 5 | 5 | ✓ | ✓ |
| 16 | EUDR-Assistant Spatial Deforestation Zone Intersection | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 17 | EUDR-Assistant Supplier Coordinate Conflict Engine | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 18 | EUDR-Assistant TRACES NT Compliance Pack & SHA-256 | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 19 | SaaS-CRM-ERP Monorepo & Shared Types | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 20 | SaaS-CRM-ERP Interactive RBAC Switcher & UI Gating | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| 21 | SaaS-CRM-ERP Responsive Operational Dashboards & In-Memory Mock | ORIGINAL_REQUEST R2, AC 52 | 5 | 5 | ✓ | ✓ |
| 22 | Fintech-Dashboard Deterministic Runway Math & Scenarios | ORIGINAL_REQUEST R2, AC 51 | 5 | 5 | ✓ | ✓ |
| 23 | MVP-AI-CopilotCoach Dual-Mode Execution (Live/Mock Heuristic) | ORIGINAL_REQUEST R2, AC 52 | 5 | 5 | ✓ | ✓ |
| 24 | 1-Click "Try Demo Data" Flow Across All Live Demos | ORIGINAL_REQUEST R3, AC 47 | 5 | 5 | ✓ | ✓ |
| 25 | Standardized 4-Section READMEs & 2-Command Quickstart | ORIGINAL_REQUEST R3, AC 57 | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Central Harness Location**: `packages/shared-e2e-harness`
- **Runner**: Playwright (`@playwright/test`) + Vitest (`vitest`) for Node integration tests.
- **Pass/Fail Semantics**: Process exits with code 0 if and only if all assertions across all tiers pass. Any unhandled console warning, benchmark breach, or assertion error exits with code 1.
- **Directory Layout**:
  ```
  packages/shared-e2e-harness/
  ├── src/
  │   ├── runner.ts                    # Unified multi-project test runner
  │   └── fixtures/                    # Shared mock fixtures, GeoJSONs, CSV dumps, and sample invoices
  ├── tests/
  │   ├── tier1-feature/               # Tier 1 happy-path tests
  │   ├── tier2-boundary/              # Tier 2 edge cases, invalid data, overflows
  │   ├── tier3-pairwise/              # Tier 3 cross-feature interactions
  │   ├── tier4-workload/              # Tier 4 real-world user workflows
  │   └── benchmarks/                  # Playwright performance (<1.5s load, <300ms parse) & exfiltration
  ├── playwright.config.ts
  └── package.json
  ```

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | **Enterprise Accounts Payable Month-End Run**: Batch of 10 mixed invoices (5 clean, 2 duplicate claims, 2 missing VAT/IBAN, 1 rounding mismatch). Invoices processed through multi-step review, diffs inspected, duplicates rejected, clean committed, and DATEV EXTF 700 file exported. | F1, F2, F3, F4 | High |
| 2 | **E-Commerce Black Friday Settlement Audit**: 1,000-row blended Amazon/Shopify order dump processed in browser. Performance timer proves <300ms execution. Waterfall filters top 3 negative margin SKUs caused by FBA fee hikes and returns. Executive audit PDF report generated and downloaded. | F5, F6, F7, F8 | High |
| 3 | **Urgent High-Volume Clinic Cancellation Backfill**: Peak morning cancellation event triggered. n8n webhook dispatches, priority queue ranks 5 waitlisted patients, SMS cascade triggers, Rank #1 unavailable, Rank #2 confirms, calendar synchronizes, live event log records all timestamps, and +€168 revenue is recovered. | F9, F10, F11, F12 | High |
| 4 | **Cross-Border EUDR Cocoa Cooperative Audit**: 30 agricultural plots evaluated. Validator confirms 6-decimal precision and polygon closure. Conflict engine detects overlapping concession claimed by rival supplier. Deforestation analyzer flags 1 plot encroaching on protected reserve. Compliant plots bundled into TRACES NT ZIP with SHA-256 certificate. | F15, F16, F17, F18 | High |
| 5 | **SaaS Startup Cash Crunch & Board Deck Prep**: CFO logs into Fintech Dashboard as FinanceViewer, verifies cash balance and net burn. Runway calculator computes 4.2 months. Interactive hiring slider previews impact of 2 senior engineers. AI Copilot (running offline in resilient mock mode) generates 3-point cash extension plan. | F20, F21, F22, F23 | High |

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: >= 125 test cases (5 × 25 features).
- **Tier 2 (Boundary & Corner)**: >= 125 test cases (5 × 25 features).
- **Tier 3 (Cross-Feature Combinations)**: >= 25 pairwise integration test cases.
- **Tier 4 (Real-World Application Scenarios)**: >= 5 comprehensive end-to-end scenarios.
- **Core Business Logic Unit Coverage**: Enforced >= 80% statement, branch, and function coverage across all projects.
