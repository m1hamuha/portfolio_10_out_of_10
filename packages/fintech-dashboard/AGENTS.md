Overview
- This AGENTS.md provides commands and guidelines for building, linting, testing, and coding practices for agents operating in this repository.
- It is intended for automated agents and human maintainers alike.

Build, lint, test commands
- Build (root): npm run build or yarn build or pnpm build; if monorepo, build each workspace as needed (see workspace tooling).
- Lint: npm run lint or yarn lint or pnpm lint; optionally with --fix for automatic fixes.
- Tests: npm test or yarn test or pnpm test; base pattern for running a single test is provided below.
- Run a single test (examples by framework):
  - Jest: npm test -- --testPathPattern <path>  OR npm test -- -t "<name>" 
  - Vitest: npx vitest run <path> -t "<name>" 
  - Mocha: npm test -- --grep "<name>" 
- Multi-package workspaces: use workspace-scoped commands, e.g. npm run -w <ws> test, yarn workspace <ws> test, or pnpm -w -F <workspace> test.
- CI: CI=true npm test; tests must be hermetic and deterministic.

Code style guidelines (TypeScript/JavaScript)
- Imports: external libs first, then aliases and internal modules, then relative imports. No circular deps.
- Formatting: Prettier with standard config; 2-space indentation, single quotes, trailing commas where allowed, semicolons. 100-char width.
- Types: Prefer explicit types; avoid any; use unknown with guards; public APIs should declare types.
- Naming: camelCase for variables/functions; PascalCase for classes; UPPER_SNAKE_CASE for constants; suffix types with Props/Params/Response/Request.
- Exports: Prefer named exports; default exports only where a clear default is intended.
- Error handling: Create a shared AppError with code, message, status, and optional data; throw typed errors; avoid swallowing errors.
- Async: Always await promises; catch and rethrow with context; implement retry/backoff for IO calls.
- Testing: unit tests for modules, contract tests for APIs, and e2e tests for critical flows; mocks and fixtures; deterministic.
- Security: validate input, avoid eval, store secrets in env/vault; run SCA scans; CSP/XSS considerations.
- Accessibility: keyboard navigation and ARIA where relevant; semantic HTML.
- Documentation: inline comments, JSDoc where necessary; avoid over-commenting.
- Versioning: document breaking changes in PR notes; follow semantic versioning.
- Review: small patches; one reviewer; rationale in PR body.
- Performance: prefer lazy loading; virtualization; memoization; avoid heavy work on main thread.
- Data: preserve raw input, normalise at ingest, maintain lineage when possible.
- UI: consistent patterns; avoid boilerplate; ensure cross-device responsiveness.
- Observability: integrate traces, metrics, and logs; observe data freshness.

Cursor and Copilot rules
- Cursor rules: If .cursor/rules/ or .cursorrules exist, ensure edits conform to them and mention any deviations.
- Copilot rules: If .github/copilot-instructions.md exists, follow its constraints for generated patches.
- Currently, no Cursor or Copilot rules detected in this repository; section reserved for future updates.

Operational notes
- This AGENTS.md is a contract for agent tasks in this repo. Use it to standardize work and reduce ambiguity.
- When in doubt, apply safe defaults and provide patch notes; ask for clarifications only if strictly necessary.
- For multi-step changes, include a concise changelog entry and patch summary for traceability.
