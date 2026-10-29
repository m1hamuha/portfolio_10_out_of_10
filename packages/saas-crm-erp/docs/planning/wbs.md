## Work breakdown structure

**1.0 Program & governance**  
1.1 Project kickoff & stakeholder alignment  
1.2 Scope, milestones, and success metrics (incl. “reduce manual work by 60%” target)  
1.3 Delivery plan (phases, release strategy, environments)  
1.4 Risk, compliance, and security planning (incl. multi-tenant + payments)  
1.5 Architecture decision records (ADR): NestJS vs FastAPI, RabbitMQ vs SQS, etc.

**2.0 Product requirements & UX**  
2.1 Personas and role map (Super Admin, Org Admin, Manager, Sales Rep, Finance, Support)  
2.2 End-to-end workflows  
- Lead/opportunity → customer → invoice → payment → receipt  
- Report request → async generation → download (PDF/XLSX/CSV)  
2.3 Information architecture (modules, navigation, role-based UI)  
2.4 UX/UI design system (components, forms, tables, accessibility)  
2.5 Analytics & audit requirements (events, audit trails, retention)

**3.0 System architecture & foundations**  
3.1 High-level architecture (frontend, API, DB, cache, queue, workers, webhooks)  
3.2 Multi-tenancy strategy (org isolation, tenant identifiers, routing)  
3.3 API standards (OpenAPI, error model, pagination, idempotency patterns)  
3.4 Data model design (CRM + ERP entities)  
3.5 Non-functional requirements (p95 latency, concurrency, uptime, scaling targets)

**4.0 Data layer (PostgreSQL + Redis)**  
4.1 PostgreSQL schema implementation (core CRM/ERP tables)  
4.2 Row-Level Security (RLS) policies for tenant isolation and privilege boundaries  
4.3 Migrations tooling + seeding strategy (dev/stage/prod)  
4.4 Redis caching patterns  
- Role-permission mapping cache  
- Hot-path entity caches (e.g., customer summary)  
4.5 Performance structures  
- Materialized views / pre-aggregated tables  
- Partitioning by date (rolling 12 months)  
- Indexing strategy and query plans

**5.0 Backend API (NestJS/FastAPI)**  
5.1 Project scaffolding (DI setup, config, validation, logging, error handling)  
5.2 Core modules  
- Organizations/tenancy  
- Users & profiles  
- Customers/accounts/contacts  
- Deals/pipeline (CRM)  
- Invoices (ERP)  
- Payments & reconciliation  
- Reports  
5.3 Authorization middleware/guards (RBAC + ABAC conditions)  
5.4 Audit logging (who did what, when; immutable event records as needed)  
5.5 Rate limiting & abuse protection (user/org thresholds)  
5.6 API documentation (OpenAPI + examples)

**6.0 Authentication & security**  
6.1 OAuth 2.0 + PKCE implementation (login, callback, session handling)  
6.2 JWT issuance/validation (claims: roles, org_id, permissions, exp)  
6.3 Refresh token rotation and revocation strategy  
6.4 DPoP / sender-constrained token support (if in scope for first release)  
6.5 Web security controls  
- CSP headers, XSS sanitization, cookie strategy (HttpOnly/SameSite)  
- CSRF protections for state-changing operations  
6.6 Optional enterprise controls  
- IP allowlisting  
- Org security settings & compliance exports  
6.7 MFA  
- TOTP enrollment/verification  
- Backup codes (encrypted)  
- Recovery flows and admin resets

**7.0 Payments (Stripe)**  
7.1 Stripe Connect onboarding (Express accounts per tenant)  
7.2 Payment intent lifecycle  
- Create intent w/ metadata (customer_id, invoice_id)  
- Idempotency key handling  
7.3 Frontend payment collection (Stripe Elements integration)  
7.4 Webhook processing (/webhooks/stripe)  
- Signature verification + secret rotation handling  
- Retry logic and dead-letter handling (if using SQS)  
7.5 Atomic invoice state updates (DB transaction boundaries)  
7.6 Receipt generation + email notification job  
7.7 Reconciliation views and finance workflows (matching, exceptions)

**8.0 Reporting & analytics subsystem**  
8.1 Report catalog  
- Sales pipeline (conversion, velocity)  
- Financial (revenue, MRR, churn)  
- Customer analytics (engagement, tickets)  
8.2 Async job execution (Bull/BullMQ or queue workers)  
8.3 Data preparation  
- Hourly pre-aggregations  
- Materialized view refresh strategy  
8.4 Export generation  
- PDF generation with Puppeteer in isolated containers  
- CSV/XLSX exports with streaming for large datasets  
8.5 Caching rules (5 min dashboard vs 24h historical)  
8.6 Custom report builder (visual query builder)  
- Query model + validation  
- Permission-aware data access  
- Saved report definitions per tenant

**9.0 Frontend (Next.js 14 + React 18)**  
9.1 App shell (routing, layouts, SSR/RSC strategy)  
9.2 Auth integration (login, callback, token storage strategy)  
9.3 Role-based navigation and page guards  
9.4 CRM UI  
- Customer list/detail, assignment rules, search/filter  
- Pipeline/deals UI  
9.5 ERP UI  
- Invoice creation, lifecycle states, approvals (if required)  
- Finance reconciliation screens  
9.6 Payments UI  
- Stripe Elements checkout inside invoice flow  
- Payment status and receipt access  
9.7 Reports UI  
- Report request/configure → status → download  
- Dashboards and cached views  
9.8 Error handling & empty states (permission-denied, rate-limited, offline)  
9.9 Accessibility & performance (Lighthouse targets, bundle budgets)

**10.0 Messaging/async infrastructure (RabbitMQ or SQS)**  
10.1 Queue provisioning and configuration (topics/queues, retries, DLQ)  
10.2 Worker services (report generation, email, webhook processing helpers)  
10.3 Idempotent job design (dedupe keys, safe retries)  
10.4 Operational tooling (poison message handling, replay controls)

**11.0 DevOps & cloud infrastructure (AWS + Vercel)**  
11.1 Docker hardening  
- Multi-stage builds, distroless images, non-root execution, health checks  
11.2 CI pipeline (GitHub Actions)  
- Lint/SAST/dependency scanning  
- Unit tests + coverage gates  
- Build + image scan (Trivy)  
- Integration/E2E tests (Playwright)  
11.3 AWS infrastructure  
- ECS Fargate services + autoscaling  
- RDS PostgreSQL Multi-AZ + backups  
- Redis (ElastiCache)  
- Secrets Manager + rotation  
- Networking (VPC, private subnets, security groups)  
11.4 Deployment strategy  
- Blue/Green + rollback rules  
- Canary releases for risky changes  
11.5 Environment management  
- Dev/stage/prod parity  
- Config, feature flags, tenant test data

**12.0 Testing & quality assurance**  
12.1 Backend unit tests (>80% coverage)  
12.2 Backend integration tests (API + auth + Stripe test mode webhooks)  
12.3 Frontend component tests (forms, role-based rendering, errors)  
12.4 E2E tests (login → customer → invoice → payment; multi-role flows)  
12.5 Performance tests  
- Load testing (1000 concurrent users; p95 <200ms target)  
- Lighthouse CI (Performance >90; Accessibility >95)  
12.6 Security testing  
- Threat modeling review  
- Pen-test readiness checklist (OWASP top risks)  
- Secrets scanning + dependency audits

**13.0 Observability & operations**  
13.1 Structured logging (JSON) → CloudWatch  
13.2 Metrics (Prometheus) + dashboards (Grafana)  
13.3 Distributed tracing (OpenTelemetry)  
13.4 Alerting (PagerDuty rules: error rate, DB availability, webhook failures)  
13.5 Runbooks and on-call playbooks (payments, auth outages, report worker backlog)

**14.0 Documentation & enablement**  
14.1 Admin/user guides by role (sales, finance, support, admins)  
14.2 API docs for integrations (webhooks, reports export endpoints)  
14.3 Security documentation (RBAC model, RLS overview, incident response)  
14.4 Operational documentation (deployments, rollback, scaling, backups)

**15.0 Release & rollout**  
15.1 Beta onboarding (selected tenants), feedback loop  
15.2 Data migration/import utilities (customers, invoices)  
15.3 Production readiness review (SLOs, monitoring, backups, access controls)  
15.4 Launch and post-launch stabilization window  
15.5 Post-launch backlog: enhancements (custom report builder depth, enterprise IP allowlisting, mobile biometrics, etc.)
