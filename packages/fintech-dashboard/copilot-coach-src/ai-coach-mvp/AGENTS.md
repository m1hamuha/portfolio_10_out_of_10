# AGENTS.md

This document provides conventions and working rules for agentic coding agents (including AI copilots) that operate in this repository. It covers build/test commands, code style guidelines, and operational norms to keep work predictable and reproducible.

Note: If the repository already contains a root AGENTS.md, merge changes rather than replacing it. If there are Cursor rules enabled (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), include or reference them below.

----------------------------------------------------------------------
## 0) Contributing and governance
- This repository uses a pragmatic, incremental approach. Prefer small, reviewable patches.
- All changes should be documented with a concise commit message describing why the change was made.
- For any architectural changes, include a short rationale and potential trade-offs.
- Follow the guidance in this AGENTS.md and the Cursor/Copilot references if present.

## 6) Contributing and governance
- This repository uses a pragmatic, incremental approach. Prefer small, reviewable patches.
- All changes should be documented with a concise commit message describing why the change was made.
- For any architectural changes, include a short rationale and potential trade-offs.
- If there is a root AGENTS.md, merge changes rather than replacing it.

## 7) Patch/merge etiquette for agents
- Use the repository's patch format (as defined by apply_patch) for code edits.
- When multiple independent changes are needed, batch related changes in a single patch.
- Do not rewrite history in shared branches without explicit authorization.

1) Build, lint, test commands
How to work locally and in CI
- Install dependencies
  - npm i
  - Or pnpm i (if you see pnpm in scripts)

- Run the development server
  - npm run dev
  - Or pnpm dev
  - In Docker contexts, prefer docker-compose workflows described below.

- Build for production
  - npm run build
  - Or pnpm build

- Start production server
  - npm run start
  - Or pnpm start

- Lint
  - npm run lint
  - Or pnpm lint
  - For targeted lint: npm run lint -- path/to/file.tsx

- Type check
  - npm run typecheck
  - Or pnpm typecheck

- Unit tests (Vitest)
  - npm run test:unit
  - Or pnpm test:unit
  - Run a single test:
    - pnpm run test:unit -- -t "buildSystemPrompt"
    - Or: pnpm run test:unit -- tests/unit/prompt.test.ts

- End-to-end tests (Playwright)
  - npm run test:e2e
  - Or pnpm test:e2e
  - To run a single e2e file: npx playwright test tests/e2e/coach.spec.ts
  - To filter tests: pnpm run test:e2e -- -g "Coach flows" 

- Docker, DB, and migrations
  - docker compose up -d db
  - docker compose up --build
  - docker compose down
  - pnpm prisma:generate
  - pnpm prisma:migrate

- Health checks and quick sanity
  - ls -la
  - cat .env.local (verify required keys exist; do not commit secrets)
  - curl -sS http://localhost:3000/health (if implemented)

- Quick debugging workflow
  - Spin up DB: docker compose up -d db
  - Run migrations: pnpm prisma:migrate
  - Start dev: pnpm dev
  - Exercise endpoints, e.g. /api/auth/github/redirect, /api/chat

----------------------------------------------------------------------
2) Code style guidelines
General stance
- Prioritize clarity, readability, and maintainability. Use explicit types over any.
- Follow TypeScript + Next.js idioms; prefer small, well-scoped helpers.
- Break large functions into smaller units; add tests where possible.

Imports
- Order: external libs, internal aliases (like '@/lib/*'), then local relative imports.
- Alphabetize within groups; remove unused imports.
- Use absolute imports for project root modules; relative imports for same-folder siblings.
- Enable lint rules to catch circulars and duplicates.

Formatting
- 2-space indentation; wrap lines at ~100-120 chars.
- Use Prettier; ensure a consistent .prettierrc exists.
- End-of-line: LF.
- Minimize inline comments; only add them to clarify non-obvious blocks.

Types, interfaces, and APIs
- Run with strict mode; ensure explicit return types on public functions.
- Avoid 'any'; prefer unknown with guards when necessary.
- Define API payload types; reuse types across client/server boundaries.
- Validate external inputs (e.g., request bodies) with schemas (Zod preferred).

Naming conventions
- Files: kebab-case or project-aligned pattern (as used in repo).
- Types/interfaces: PascalCase (UserProfile, ApiResponse).
- Functions/variables: camelCase; constants: UPPER_SNAKE_CASE.
- Components: PascalCase.

Error handling and logging
- Propagate actionable errors; include context where helpful.
- Use custom error classes (e.g., AppError) with optional codes.
- Centralize logging; avoid console logs in production unless behind a debug flag.
- Do not leak sensitive data in error messages.

Security and data validation
- Validate all inputs; sanitize outputs.
- Cookies: HttpOnly; Secure in prod; SameSite as appropriate.
- CSRF: implement protection for state-changing requests (double-submit cookie or framework-provided support).
- Never log secrets; redact in tests and logs.

Testing philosophy
- Tests should be fast and deterministic; mock external services in unit tests.
- End-to-end tests should exercise core flows; avoid brittle auth-flows in unit tests.
- Use fixtures for deterministic inputs.

Documentation
- Comment non-trivial logic; otherwise rely on clear naming.
- Document public APIs, expected inputs/outputs, and data models.
- Keep docs in repo (README) up to date with how to run tests and debugging steps.

CI/CD expectations
- CI runs lint, typecheck, unit tests; fail builds on critical issues.
- Tests should run headless in CI without prompts.
- Secrets must come from CI secrets.

Code review expectations
- Review for security, performance, and alignment to guidelines.
- Ensure tests cover new functionality and edge cases.
- Confirm no secrets or credentials are committed.

Debugging and diagnostics
- Provide reproducible steps and logs for bugs.
- Use feature flags for debugging paths (e.g., DEBUG_FAKE_OAUTH).

----------------------------------------------------------------------
3) Cursor rules
If Cursor rules exist, they go under .cursor/rules/ or .cursorrules. Include or reference them here.

----------------------------------------------------------------------
4) Copilot rules
If there is a .github/copilot-instructions.md, reference it here and ensure agents follow guidance.

----------------------------------------------------------------------
5) Quick PR guidelines (optional)
- Branches: feat/..., fix/..., chore/..., test/...
- Commits: one logical change per commit; include why, not just what.
- PRs: provide summary, testing notes, and review checklist.

This document is a living artifact. Update it as tooling and conventions evolve.
