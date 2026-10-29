# Project: Portfolio 10/10 Overhaul

## Architecture
A production-grade, employer-facing monorepo housing 3 flagship live demos, 4 elevated open-source enterprise software systems, a unified verification pipeline, and an opaque-box E2E test harness.

```
portfolio_10_out_of_10/
├── apps/
│   ├── invoice-autopilot/          # Zero-touch document validation, multi-step review, DATEV/CSV export
│   ├── marginpulse/               # In-browser financial engine, 1k-row <300ms, zero-exfiltration waterfall
│   └── slotsaver/                 # Priority waitlist rebooking, n8n webhook with mock fallback, event stream
├── packages/
│   ├── kostin-erp-audit/          # Diagnostic ERP architecture engine, scoring 0-100, jsPDF executive export
│   ├── eudr-assistant/            # Geospatial boundary validator, supplier coordinate conflict, TRACES NT pack
│   ├── saas-crm-erp/              # Modular monorepo, unified customer/ops models, interactive RBAC gating
│   ├── fintech-dashboard/         # Financial analytics, integer-cent runway math, embedded resilient AI Copilot
│   └── shared-e2e-harness/        # Centralized Playwright benchmarks, integration test runner & suites
├── .github/
│   └── workflows/
│       └── ci.yml                 # Unified multi-project GitHub Actions matrix pipeline
├── package.json                   # Monorepo workspaces manifest & verification scripts
├── tsconfig.json                  # Root TypeScript strict base configuration
└── README.md                      # Central Portfolio Showcase & Employer Navigation Hub
```

### Data Flow & Architecture Invariants
1. **Deterministic Integer-Cent Math**: All financial representations (InvoiceAutopilot, MarginPulse, Fintech-Dashboard, SaaS-CRM-ERP) store currency values as integer cents (`Cents` / `Money` value object). Floating-point arithmetic on currency is strictly prohibited.
2. **Zero-Setup Resilient Mocks**: All external network dependencies (n8n webhooks, OpenRouter/LLM APIs, remote databases) feature seamless local mock fallbacks activating automatically whenever credentials or endpoints are unavailable.
3. **Zero Data Exfiltration Security**: MarginPulse operates 100% client-side; zero bytes leave the browser during file parsing or report generation.
4. **Standardized Executive Documentation**: Every project contains a 4-section executive `README.md` (Business Problem, Measurable ROI, Architecture & Engineering Decisions, Quickstart/Demo) and supports 2-command local setup (`npm install && npm test`).
5. **Quality & Coverage Invariant**: Strict TypeScript (`strict: true`), zero ESLint warnings, and >=80% test coverage on core business logic across all 7 projects.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Monorepo Workspace Setup | Root `package.json` workspaces, scripts (`lint:all`, `build:all`, `test:all`, `verify:full`), and base `tsconfig.json` | M1 | Survey |
| 2 | Unified CI/CD Matrix | GitHub Actions workflow (`.github/workflows/ci.yml`) validating lint, typecheck, build, test, and E2E | M1 | Survey / AC 56 |
| 3 | E2E Harness Architecture | Setup of `packages/shared-e2e-harness` with Playwright browser runner and test scaffolding | M1 | Survey / Dual Track |
| 4 | InvoiceAutopilot Presets | 4 bundled 1-click presets (Clean, Duplicate, Missing VAT/IBAN, Rounding Mismatch) | M2 | ORIGINAL_REQUEST R1 |
| 5 | InvoiceAutopilot Duplicate Diff | Duplicate detection engine with visual side-by-side diff modal highlighting identical fields | M2 | ORIGINAL_REQUEST R1, AC 44 |
| 6 | InvoiceAutopilot Structured Export | RFC 4180 CSV, JSON ledger, and DATEV EXTF 700 format export generators | M2 | ORIGINAL_REQUEST R1 |
| 7 | InvoiceAutopilot Multi-Step Review | Multi-step review safeguards workflow (Ingestion -> Validation -> Audit -> Commit) | M2 | ORIGINAL_REQUEST R1 |
| 8 | InvoiceAutopilot ROI Calculator | Interactive component calculating cycle time reduction (7m to 9s), labor savings, and duplicate loss avoidance | M2 | ORIGINAL_REQUEST R1 |
| 9 | MarginPulse WooCommerce Support | Ingestion parser for WooCommerce order dumps matching Shopify and Amazon | M2 | ORIGINAL_REQUEST R1 |
| 10 | MarginPulse Presets & 1k Dataset | 1-click presets (Shopify, Amazon, WooCommerce) and 1,000-row stress test dataset | M2 | ORIGINAL_REQUEST R1, AC 45 |
| 11 | MarginPulse Performance Benchmark | Client-side processing of 1,000 rows in <300ms with real-time UI timer and zero network payload assertion | M2 | ORIGINAL_REQUEST R1, AC 45 |
| 12 | MarginPulse Interactive Waterfall | Full-width profit leak waterfall with click-to-filter drilldown into offending negative margin SKUs | M2 | ORIGINAL_REQUEST R1 |
| 13 | MarginPulse Executive Audit Report | Exportable audit report (PDF/HTML) with portfolio health score, recoverable bleed, and remediation directives | M2 | ORIGINAL_REQUEST R1, AC 45 |
| 14 | SlotSaver Priority Scoring | Deterministic formula scoring (Service Match, Availability, Loyalty LTV, Response Speed) with UI transparency cards | M2 | ORIGINAL_REQUEST R1 |
| 15 | SlotSaver n8n Webhook & Fallback | n8n webhook dispatcher with automatic fallback to local simulated mock execution on timeout/failure | M2 | ORIGINAL_REQUEST R1, AC 52 |
| 16 | SlotSaver Live Event Log | Terminal/timeline event stream rendering millisecond timestamps and payload previews | M2 | ORIGINAL_REQUEST R1, AC 46 |
| 17 | SlotSaver Downloadable Workflow | Downloadable, valid n8n workflow definition JSON file (`slotsaver-cancellation-autofill.json`) | M2 | ORIGINAL_REQUEST R1 |
| 18 | SlotSaver Revenue Recovery Metrics | Real-time calculation of recovered revenue and payback multiplier | M2 | ORIGINAL_REQUEST R1 |
| 19 | kostin-erp-audit Diagnostic Engine | 7-question assessment calculating overall health score (0-100) and 4 architectural sub-scores | M3 | ORIGINAL_REQUEST R2 |
| 20 | kostin-erp-audit Sample Presets | 1-click presets (Legacy 1C, Spreadsheets Chaos, QuickBooks Outgrown, Optimized Odoo) | M3 | ORIGINAL_REQUEST R2, R3 |
| 21 | kostin-erp-audit Executive PDF Export | Programmatic client-side vector PDF generation via jsPDF with branded scores, financial impact, and roadmap | M3 | ORIGINAL_REQUEST R2 |
| 22 | kostin-erp-audit Automated Test Suite | Vitest test suite with >=80% coverage on scoring rules and financial impact calculations | M3 | ORIGINAL_REQUEST R2, AC 55 |
| 23 | EUDR-Assistant Turf Boundary Validator | GeoJSON validation: bounds [-90,90; -180,180], 6 decimal places, ring closure, kinks check, 4 ha threshold | M3 | ORIGINAL_REQUEST R2, AC 55 |
| 24 | EUDR-Assistant Deforestation Intersection | Spatial intersection of plot polygons against post-2020 deforestation cutoff zones | M3 | ORIGINAL_REQUEST R2 |
| 25 | EUDR-Assistant Supplier Conflict Engine | Conflict detection: exact coordinate duplicate and cross-supplier polygon overlap (>1% threshold) | M3 | ORIGINAL_REQUEST R2 |
| 26 | EUDR-Assistant Compliance Pack | Downloadable ZIP pack (TRACES NT GeoJSON, Due Diligence Statement JSON, SHA-256 certificate) | M3 | ORIGINAL_REQUEST R2 |
| 27 | EUDR-Assistant Offline Demonstration Mode | 1-click presets (Compliant Cocoa Ghana, Supplier Conflict Indonesia, Deforestation Brazil) with zero cloud setup | M3 | ORIGINAL_REQUEST R2, AC 48 |
| 28 | SaaS-CRM-ERP Monorepo & Types | Monorepo consolidation with `packages/shared-types` unifying Customer, Deal, Invoice, User, and RBAC schemas | M4 | ORIGINAL_REQUEST R2 |
| 29 | SaaS-CRM-ERP Unified Data Models | Data linkage: Won Deals -> Draft Invoices -> Paid Receipts -> Customer LTV in integer cents | M4 | ORIGINAL_REQUEST R2 |
| 30 | SaaS-CRM-ERP Interactive RBAC Switcher | Role selector (SuperAdmin, OrgAdmin, Manager, FinanceViewer, SalesRep) with dynamic UI permission gating | M4 | ORIGINAL_REQUEST R2 |
| 31 | SaaS-CRM-ERP Responsive Dashboards | Customers data grid, Deals Kanban pipeline, and Invoices & Operations ledger | M4 | ORIGINAL_REQUEST R2 |
| 32 | SaaS-CRM-ERP Zero-Setup Mock Backend | In-memory mock client providing instant full functionality without running PostgreSQL/Redis | M4 | ORIGINAL_REQUEST R2, AC 52 |
| 33 | Fintech Platform Consolidation | Integration of Financial Analytics Dashboard and AI Copilot Coach into unified package | M4 | ORIGINAL_REQUEST R2 |
| 34 | Fintech Runway & Burn Engine | Real-time calculation of cash balance, net monthly burn, runway months, zero date, and scenario modeling in integer cents | M4 | ORIGINAL_REQUEST R2, AC 51 |
| 35 | Fintech Business KPIs | Core KPI cards with trend indicators: MRR, ARR, Gross Margin %, OpEx breakdown | M4 | ORIGINAL_REQUEST R2 |
| 36 | AI Copilot Coach & Mock Fallback | Embedded slide-over Copilot drawer with dual execution (live LLM streaming or local deterministic heuristics) | M4 | ORIGINAL_REQUEST R2, AC 52 |
| 37 | Fintech 1-Click Startup Presets | 1-click financial presets (Seed Stage Runway Emergency, Series A Scaleup, Bootstrapped Default Alive) | M4 | ORIGINAL_REQUEST R2, R3 |
| 38 | Standardized Executive READMEs | 4-section executive README across all 7 projects (Problem, Impact/ROI, Architecture, Quickstart/Demo) | M5 | ORIGINAL_REQUEST R3, AC 57 |
| 39 | 2-Command Quickstart Protocol | Every project runnable locally via `npm install && npm test` with zero configuration | M5 | ORIGINAL_REQUEST R3 |
| 40 | Bidirectional Portfolio Cross-Links | Header/footer navigation links between all live demos, open-source repos, and central portfolio hub | M5 | ORIGINAL_REQUEST R3, AC 47 |
| 41 | Central Portfolio Showcase Hub | Root showcase hub (`README.md` and central portal) presenting all 7 projects to employers | M5 | ORIGINAL_REQUEST R3 |
| 42 | Full E2E Test Suite Execution (Tiers 1-4) | 100% pass on all opaque-box E2E test cases across all 7 projects | M6 | ORIGINAL_REQUEST Final Milestone |
| 43 | Adversarial Coverage Hardening (Tier 5) | White-box stress-testing and boundary verification with zero remaining gaps | M6 | Final Milestone Phase 2 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Monorepo Foundation & E2E Infra | Workspace configuration, package manifests, shared configs, CI workflow, E2E harness base | none | DONE |
| 2 | Flagship Live Demos Overhaul | InvoiceAutopilot, MarginPulse, SlotSaver enterprise features & benchmarks (F4–F18) | M1 | DONE |
| 3 | Enterprise ERP & Compliance Repos | kostin-erp-audit and EUDR-Assistant elevation, tests, PDF/ZIP exports, presets (F19–F27) | M1 | IN_PROGRESS |
| 4 | SaaS Platform & Financial Intelligence | SaaS-CRM-ERP and Fintech-Dashboard/CopilotCoach integration, runway math, RBAC, mocks (F28–F37) | M1 | PLANNED |
| 5 | Central Showcase, READMEs & Cross-Nav | Standardized READMEs, 2-command quickstart, cross-navigation, portfolio showcase hub (F38–F41) | M2, M3, M4 | DONE |
| 6 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Phase 1: Pass 100% E2E tests (Tiers 1-4); Phase 2: Tier 5 adversarial hardening & forensic audit (F42–F43) | M5 | PLANNED |

---

## Interface Contracts

### 1. Integer-Cent Currency Contract (`Money` / `Cents`)
```typescript
export type Cents = number; // Integer invariant: Number.isInteger(cents) === true

export interface MoneyValue {
  readonly cents: Cents;
  add(other: MoneyValue): MoneyValue;
  subtract(other: MoneyValue): MoneyValue;
  multiplyByQuantity(qty: number): MoneyValue;
  applyBasisPoints(bps: number): MoneyValue; // e.g. 1900 for 19.00% VAT
  format(currency?: string, locale?: string): string;
}
```

### 2. Resilient Webhook & Mock Dispatcher Contract
```typescript
export interface WebhookResult<T = unknown> {
  success: boolean;
  simulated: boolean;
  status: number;
  data: T;
  timestamp: string;
}

export interface IWebhookDispatcher {
  dispatch<T>(event: string, payload: unknown): Promise<WebhookResult<T>>;
}
```

### 3. Spatial Compliance & Conflict Detection Contract
```typescript
export interface SpatialConflictResult {
  hasConflict: boolean;
  conflictType?: 'EXACT_DUPLICATE' | 'POLYGON_OVERLAP' | 'DEFORESTATION_ENCROACHMENT';
  overlapAreaHectares?: number;
  overlapPercentage?: number;
  conflictingSupplierIds?: string[];
  affectedPlotIds: string[];
  remediationAdvice: string;
}
```

### 4. Executive PDF / Pack Export Contract
```typescript
export interface ExecutiveExportService<TInput, TOutput> {
  generate(input: TInput): Promise<TOutput>;
  download(output: TOutput, filename: string): void;
}
```

---

## Code Layout
```
portfolio_10_out_of_10/
├── apps/
│   ├── invoice-autopilot/
│   │   ├── src/engine/{types.ts, validate.ts, documents.ts, export.ts, math.ts}
│   │   ├── src/components/{DuplicateDiffModal.tsx, RoiCalculator.tsx, ...}
│   │   ├── tests/{validation.test.ts, export.test.ts, duplicate.test.ts}
│   │   └── README.md
│   ├── marginpulse/
│   │   ├── src/engine/{types.ts, raw-import.ts, margin.ts, waterfall.ts, report.ts}
│   │   ├── src/engine/presets/{shopify.csv, amazon.csv, woocommerce.csv, stress-1k.csv}
│   │   ├── src/components/{InteractiveWaterfall.tsx, ExecutiveReportModal.tsx, ...}
│   │   ├── tests/{margin.test.ts, benchmark.test.ts, exfiltration.test.ts}
│   │   └── README.md
│   └── slotsaver/
│       ├── src/engine/{types.ts, priorityQueue.ts, webhook.ts, fill.ts}
│       ├── src/components/{LiveEventLog.tsx, ScoreBreakdownModal.tsx, ...}
│       ├── public/n8n/slotsaver-cancellation-autofill.json
│       ├── tests/{priorityQueue.test.ts, webhook.test.ts, simulation.test.ts}
│       └── README.md
├── packages/
│   ├── kostin-erp-audit/
│   │   ├── src/{questions.ts, generateReport.ts, pdfExport.ts, types.ts}
│   │   ├── src/components/{Report.tsx, HealthScore.tsx, PresetsBar.tsx}
│   │   ├── tests/{diagnosticScorer.test.ts, auditRules.test.ts}
│   │   └── README.md
│   ├── eudr-assistant/
│   │   ├── src/lib/{eudr-validator.ts, risk.ts, conflicts.ts, deforestation.ts, dds.ts}
│   │   ├── tests/{validator.test.ts, conflicts.test.ts, deforestation.test.ts}
│   │   └── README.md
│   ├── saas-crm-erp/
│   │   ├── packages/shared-types/src/index.ts
│   │   ├── packages/frontend/components/{Dashboard.tsx, RbacSwitcher.tsx, ...}
│   │   ├── packages/backend/src/...
│   │   ├── tests/{rbac.test.ts, ledger.test.ts}
│   │   └── README.md
│   ├── fintech-dashboard/
│   │   ├── src/engine/{runway.ts, kpis.ts, mockAiCoach.ts, types.ts}
│   │   ├── src/components/{RunwayCard.tsx, AiCoachDrawer.tsx, ScenarioSimulator.tsx}
│   │   ├── tests/{runway.test.ts, mockAiCoach.test.ts}
│   │   └── README.md
│   └── shared-e2e-harness/
│       ├── tests/{benchmarks.spec.ts, demos.spec.ts, zero-exfiltration.spec.ts}
│       ├── playwright.config.ts
│       └── package.json
├── .github/workflows/ci.yml
├── package.json
├── tsconfig.json
└── README.md
```
