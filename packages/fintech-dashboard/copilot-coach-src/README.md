# MVP AI CopilotCoach

Monorepo skeleton: the app lives under apps/ai-coach-mvp. This root contains build/dev tooling and CI configuration to operate across workspaces.

How to run locally:
- Install: npm i (or pnpm install if you prefer)
- Build: npm run build (or pnpm build)
- Start: npm run start (or pnpm start)
- Lint: npm run lint
- Type check: npm run typecheck
- Unit tests: npm run test:unit
- E2E tests: npm run test:e2e

CI: See .github/workflows/ci.yml for the minimal CI config that runs lint/typecheck/unit tests in the ai-coach-mvp workspace.

Environment: See ai-coach-mvp/.env.example for required keys.

Contributing: Follow the AGENTS.md guidance under the repo structure, and keep a clean, small set of changes per PR.
