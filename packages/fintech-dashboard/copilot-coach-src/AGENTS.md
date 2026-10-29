# AGENTS.md

This document provides conventions and working rules for agentic coding agents operating in this repo. It covers build/test commands, code style guidelines, and operational norms.

Cursor rules and Copilot instructions (if present) live under .cursor/rules/ and .github/copilot-instructions.md. Reference them as needed.

1) Build, lint, test commands
- Install: npm i
- Dev: npm run dev
- Build: npm run build
- Start: npm run start
- Lint: npm run lint
- Type check: npm run typecheck
- Unit tests: npm run test:unit
- E2E tests: npm run test:e2e
- Run a single unit test: npm run test:unit -- -t "buildSystemPrompt" or npm run test:unit -- tests/unit/prompt.test.ts
- Docker/db: docker compose up -d db
- Prisma: npm run prisma:generate, npm run prisma:migrate

2) Code style guidelines
- Imports: group externals, internal aliases, then relative; alphabetize; remove unused.
- Formatting: 2-space indent, 100-120 char line length, Prettier, LF endings.
- Types: strict mode; explicit returns; avoid any; prefer schemas (Zod) for external inputs.
- Naming: files kebab-case; types/interfaces PascalCase; functions/vars camelCase; constants UPPER_SNAKE_CASE.
- Error handling: actionable messages; central logger; avoid leaking secrets.
- Security: HttpOnly cookies; Secure in prod; CSRF; input validation.
- Testing: deterministic; mocks for external services; integration tests for critical flows.

3) Monorepo or single app guidance
- If root AGENTS.md exists, merge, not duplicate.
- For monorepo, structure as root/ and apps/. If single app, flatten under root.

4) CI/CD and quality gates
- Root CI should run lint/typecheck/unit tests; optionally Playwright tests.
- Ensure PRs have small, reviewable patches; tests pass before merge.

5) Debugging patterns
- Feature flags (e.g., DEBUG_FAKE_OAUTH) to safely test flows without external deps.
- Capture repro steps and logs for issues.
