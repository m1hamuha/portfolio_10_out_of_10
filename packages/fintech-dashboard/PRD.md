PRD: Fintech Dashboard

Context, problem, goals
- User problem: financial data analytics is fragmented (multiple sources), updates with delays, it's hard to spot anomalies/trends, and it's difficult to make fast decisions.
- Product goal: provide a unified dashboard with near-real-time metrics, alerts, and interactive analytics (filters, drill-down), designed for large volumes of time series/transactions.

Success metrics (example)
- p95 API response time: <300-500 ms on cache hits
- p95 TTI (time-to-interactive): <2.5-3.5 s on a typical laptop
- Data accuracy/consistency: deviation from the source <0.1%

Personas and key scenarios
- Financial analyst
- Risk manager/Compliance
- Head of product/CEO

- Daily summary: balances, turnover, fees, MAU/ARPU
- Anomalies: spike in declines/chargebacks, conversion drop
- Deep slice: filter by time/geo/provider/currency; drill down to individual transactions
- Export/sharing: CSV/PDF, link sharing with permissions

Non-functional expectations
- Fast UI on large tables, predictable data refresh, explainability of metrics (tooltip: formula and source)

Functional requirements (MVP → v1)
MVP (must-have)
- Integration with 2-3 external APIs (e.g., FX rates, payments statistics, bank statements/provider)
- ETL-lite layer: normalization, currency/timezone mapping, deduplication, storage of raw and normalized data
- Dashboard: 6-10 key charts (Chart.js for standard charts, D3 for custom/complex), transaction table with server-side pagination/sorting/filtering

v1 (enhancements)
- Alerting: rules (thresholds, simplified anomaly detection), channels (email/Telegram/webhook)
- Role-based access (RBAC) + action audit (who exported/viewed sensitive breakdowns)
- Self-serve source configuration (UI for API keys, integration health checks, limits)

Technical requirements and quality (what makes the project “strong”)
API and data (external integrations)
- Resilience strategy: rate limiting, retries with backoff, circuit breaker, idempotency on ingestion
- Observability: tracing requests to external APIs, error/latency metrics per provider, data freshness report

Caching and load (Redis)
- Redis used for: caching responses/aggregates, caching reference data (currencies/merchants), ingestion dedup keys, distributed rate limiting
- Caching reduces repeat API requests and helps speed up responses for users

Visualization and large volumes
- Backend aggregations (time-bucketing), downsampling for charts, progressive disclosure (show aggregates first, then details)
- Frontend: table virtualization, Web Workers for heavy transformations, selector memoization, lazy-loading chunks and charts

Security and auth (2026-level)
- OAuth 2.0 / OIDC, JWT access token + refresh token rotation (single-use refresh: when refreshed, a new one is issued and the old one is invalidated; reuse signals compromise)
- Protections: CSP + XSS hardening, CSRF protection (if cookie-based), secrets only via vault/env, dependency scanning (SCA)

DevOps, testing, readiness criteria
CI/CD and infrastructure: Docker (dev/prod), CI (lint/test/build), CD (preview deployments on Vercel + prod on AWS), DB migrations, infrastructure as code (Terraform/CDK—optional)
Tests and reliability: backend unit + contract tests for external APIs (mocks/fixtures), frontend integration tests (Playwright/Cypress) for key scenarios, SLO/SLI (p95 latency, error budget), load tests for “heavy” endpoints

If stack you want to showcase to an employer is specified (e.g., NestJS vs Spring Boot, Next.js vs Vite/React), I’ll adapt the PRD to it and add concrete user stories + acceptance criteria for 1–2 sprints.
