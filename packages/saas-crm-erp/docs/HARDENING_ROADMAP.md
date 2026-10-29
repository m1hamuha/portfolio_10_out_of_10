# Production Hardening Roadmap

This document tracks the work to take the platform from "impressive-looking demo" to
a genuinely production-grade, internally-consistent codebase. It is delivered as a
sequence of focused PRs (one phase per PR).

The plan is derived from a full multi-dimension audit of the repository
(architecture, security, domain correctness, payments, tests, frontend, infra,
hygiene, dependencies). Each item links back to a verified finding.

## Status legend

- ✅ done
- 🚧 in progress
- ⏳ planned

---

## Phase 0 — Foundation & hygiene (this PR)

Goal: a clean, honest, **green** baseline. No domain behaviour changes yet — this
phase only fixes what is broken or misleading and unblocks every later phase.

- ✅ Untrack the broken 858 MB nested `1st/` gitlink (recursive self-copy committed
  as a submodule with no `.gitmodules`). The one divergent commit it contained is
  preserved as the git tag `archive/1st-divergent` so nothing is lost.
- ✅ Add `.gitattributes` to normalize line endings (kills the constant CRLF/LF churn
  that made ~60 files always show as "modified").
- ✅ Fix `.github/workflows/ci.yml` — it was **unparseable YAML** (indentation error),
  so CI never actually ran. Rebuilt as a real gate: workflow-lint (actionlint),
  backend (format · lint · typecheck · unit test · build), frontend (lint · test ·
  build), Trivy security scan.
- ✅ Fix `.github/workflows/bvt.yml` — same YAML breakage on three steps; scoped to
  manual + nightly (it is a pre-deploy gate, not a per-PR check) and pointed the
  schema step at the real init SQL.
- ✅ Fix `backend/Dockerfile` — the builder ran `npm ci --only=production`, so the
  production image could never build (nest/tsc are devDependencies). Now a proper
  multi-stage build with a slim runtime-deps layer + non-root user + liveness probe.
- ✅ Fix the broken backend install: `package-lock.json` was out of sync with
  `package.json` (so `npm ci` failed) and `@nestjs/cache-manager@2.x` conflicts with
  NestJS 11. Regenerated the lockfile and added `backend/.npmrc` (`legacy-peer-deps`)
  as a temporary bridge — the proper `@nestjs/cache-manager` v3 bump is in the deps
  phase below.
- ✅ Add backend CI scripts (`format:check`, `lint:check`, `typecheck`) and run
  Prettier across the tree so `format:check` passes.
- ✅ Add the missing `frontend/.env.example` (referenced by the README).
- ✅ Fix the `.gitignore` `public` rule (Gatsby leftover that would hide Next.js
  `frontend/public/`) and the `*.dockerignore` rule (hid `.dockerignore` files);
  add `1st/` to `.gitignore` and allow `frontend/.env.example`.

> Already landed on `main` via PRs #1–#4 (and therefore not repeated here):
> re-enabling `DatabaseModule`, de-duplicating `CacheModule`, migrating the frontend
> lint to a flat ESLint config, README accuracy, and initial tenant-security / boot
> fixes. Phases 1–2 below are scoped to what those PRs did **not** yet fully address.

## Phase 1 — Persistence & multi-tenancy foundation ⏳

- Wire `DatabaseModule` explicitly into `AppModule` (make the `DataSource` global) so
  persistence and `TenantMiddleware` no longer rely on a transitive import.
- Introduce TypeORM migrations + a real `data-source.ts` (replace the
  docker-init-only schema); add a seed path.
- Fix tenant isolation: the RLS `SET app.current_organization_id` runs on a pooled
  connection that is **not** the one the request's repositories use, and uses
  session-level `SET` (not `SET LOCAL`), so it leaks across tenants and does not
  reliably apply. Move to a request-scoped transaction/`QueryRunner`.
- Add a config validation schema (Joi/zod) and remove insecure production defaults.
- Add graceful-shutdown hooks; move the throttler to Redis-backed storage.
- Re-enable the integration/e2e tier in CI against a real Postgres + Redis.

## Phase 2 — Security & access control ⏳

- Enforce RBAC: register `RolesGuard` globally and annotate privileged routes
  (`@Roles`). Today the guard and `@Roles` decorator exist but are wired to nothing —
  any authenticated user has full admin access.
- Close cross-tenant IDOR holes: derive `organization_id` from the JWT, never from the
  request body/query, and scope every query (users, organizations, invoices, deals).
- Stop trusting `role`/`organization_id` from the create-user body (privilege
  escalation).
- Hash passwords on user creation (today `password` is dropped and `password_hash` is
  never set — created users can never log in).
- Implement refresh-token rotation correctly (the lookup currently filters on
  `user_id: undefined`); wire the dormant CSRF middleware or document why JWT +
  SameSite suffices.

## Phase 3 — Payments correctness ⏳

- Exclude the Stripe webhook from `TenantMiddleware` (it currently 401s every webhook,
  so payments never reconcile) and derive tenant from the PaymentIntent metadata.
- Create the app with `rawBody: true` and read `req.rawBody` strictly.
- Add idempotency keys, integer-cents money handling, atomic status reconciliation,
  and refund/dispute handling. Add webhook tests (signature, replay, routing).

## Phase 4 — Domain completeness ⏳

- Pagination on every list endpoint (`PaginationDto`, hard max page size).
- Compute invoice line totals server-side (never trust client `total`); decimal money.
- DB indexes/constraints; nested DTO validation.

## Phase 5 — Frontend (real application) ⏳

- `QueryClientProvider` + an axios API client reading `NEXT_PUBLIC_API_URL`.
- Auth: login page, token storage/refresh, request interceptor, `middleware.ts`
  route protection.
- Real pages (customers, organizations, invoices, deals, reports, login) wired to the
  backend; replace the hard-coded dashboard literals.
- Accessibility pass, `public/` assets, frontend e2e (Playwright).

## Phase 6 — Async & reporting ⏳

- Wire the Bull/RabbitMQ queues that are registered but have no processors.
- Report generation (PDF/Excel/CSV) via the queue.
- MFA/TOTP (the dormant `mfa_*` columns).

## Phase 7 — Observability & CD ⏳

- Wire the written-but-unused `MetricsService` to a Prometheus endpoint; add Grafana
  + OpenTelemetry tracing + structured logging.
- A real CD pipeline (build → scan → push image → deploy) with a migrations step.
- Move docker-compose secrets out of plaintext.

## Phase 8 — Test suite to a meaningful ≥80% ⏳

- Replace tests that assert unimplemented behaviour; real unit tests for services and
  guards; e2e against a real DB with per-test isolation; enforce coverage thresholds.
