# AGENTS.md - Coding Agent Guidelines

This file provides comprehensive guidelines for coding agents working on the Unified CRM/ERP SaaS Platform. It includes build/lint/test commands, code style guidelines, and development conventions.

## Build/Lint/Test Commands

### Backend (NestJS/TypeScript)

**Build Commands:**
- `cd backend && npm run build` - Build TypeScript to JavaScript
- `cd backend && npm run start:dev` - Start development server with hot reload
- `cd backend && npm run start:prod` - Start production server

**Linting & Formatting:**
- `cd backend && npm run lint` - Run ESLint with auto-fix
- `cd backend && npm run format` - Format code with Prettier

**Testing Commands:**
- `cd backend && npm test` - Run all unit tests with Jest
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:cov` - Run tests with coverage report
- `cd backend && npm run test:debug` - Run tests in debug mode
- `cd backend && npm run test:e2e` - Run end-to-end tests
- `cd backend && npm run test:acceptance` - Run acceptance tests
- `cd backend && npm run test:smoke` - Run smoke tests

**Running Single Tests:**
- `cd backend && npx jest src/path/to/file.spec.ts` - Run specific test file
- `cd backend && npx jest --testNamePattern="should authenticate with valid credentials"` - Run test by name pattern
- `cd backend && npx jest --testPathPattern=auth.spec.ts` - Run tests matching pattern

### Frontend (Next.js/React/TypeScript)

**Build Commands:**
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run start` - Start production server
- `cd frontend && npm run dev` - Start development server

**Linting & Formatting:**
- `cd frontend && npm run lint` - Run Next.js ESLint
- `cd frontend && npm run format` - Format code with Prettier

**Testing Commands:**
- `cd frontend && npm test` - Run all unit tests with Jest
- `cd frontend && npm run test:watch` - Run tests in watch mode
- `cd frontend && npm run test:cov` - Run tests with coverage report
- `cd frontend && npm run test:e2e` - Run Playwright end-to-end tests
- `cd frontend && npm run test:smoke` - Run smoke tests

**Running Single Tests:**
- `cd frontend && npx jest src/path/to/file.spec.tsx` - Run specific test file
- `cd frontend && npx jest --testNamePattern="should render without crashing"` - Run test by name pattern
- `cd frontend && npx jest --testPathPattern=app.spec.tsx` - Run tests matching pattern

### Infrastructure & Health Checks

**Docker Services:**
- `docker-compose up -d` - Start all services (PostgreSQL, Redis, RabbitMQ)
- `docker-compose down` - Stop all services
- `docker-compose logs -f` - Follow service logs

**Health Checks:**
- `cd scripts/health-check && node check-all.js` - Check all infrastructure services
- `./scripts/run-bvt.sh` - Run Build Verification Tests (Linux/Mac)
- `./scripts/run-bvt.ps1` - Run Build Verification Tests (Windows)

## Code Style Guidelines

### TypeScript Configuration

**Backend (NestJS):**
- Strict TypeScript with `strictNullChecks: true`
- Target ES2022, module resolution: nodenext
- Decorators enabled for NestJS patterns
- Declaration files generated on build

**Frontend (Next.js):**
- Strict TypeScript with `strict: true`
- Target ES2017, JSX transform: react-jsx
- Path mapping: `@/*` to `./*`

### ESLint Rules

**Backend:**
- TypeScript strict type checking enabled
- Prettier integration for code formatting
- Relaxed rules for test files (allow `any`, disable some strict checks)
- Auto-fix enabled for most rules

**Frontend:**
- Next.js ESLint configuration
- React Testing Library best practices

### Prettier Configuration

**Backend:**
```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

**Frontend:**
- Inherits from Next.js defaults
- Custom formatting rules via `npm run format`

### Import Conventions

**Backend:**
- Group imports by type: Node.js modules, third-party, local modules
- Use absolute imports with TypeORM entities
- Consistent import ordering in service files

**Frontend:**
- Path aliases with `@/` prefix
- React imports first, then third-party libraries, then local components

### Naming Conventions

**Backend:**
- Classes: PascalCase (e.g., `UserService`, `OrganizationEntity`)
- Methods: camelCase (e.g., `findOne`, `createOrganization`)
- Variables: camelCase (e.g., `userRepository`, `organizationId`)
- Constants: UPPER_SNAKE_CASE
- Database columns: snake_case (e.g., `organization_id`, `created_at`)
- Entity properties: camelCase with definite assignment assertions (`!`)

**Frontend:**
- Components: PascalCase (e.g., `UserProfile`, `OrganizationTable`)
- Hooks: camelCase with `use` prefix (e.g., `useUsers`, `useOrganizations`)
- Files: kebab-case for components, camelCase for utilities
- CSS classes: kebab-case with Tailwind CSS conventions

### Error Handling

**Backend:**
- Use NestJS exceptions (`NotFoundException`, `BadRequestException`)
- Service methods throw appropriate HTTP exceptions
- Async operations properly handled with try/catch blocks
- Consistent error messages across endpoints

**Frontend:**
- React Error Boundaries for component-level error handling
- React Query for API error handling with retry logic
- User-friendly error messages and loading states

### Database & Entity Patterns

**TypeORM Entities:**
- UUID primary keys for all entities
- Soft delete with `deleted_at` timestamp
- Automatic timestamps (`created_at`, `updated_at`)
- Explicit column definitions with types and constraints
- Relations defined with proper join columns

**Multi-tenant Architecture:**
- Organization-based tenant isolation
- Row-Level Security (RLS) policies in PostgreSQL
- Tenant context in middleware

### Testing Conventions

**Backend Tests:**
- Jest with supertest for API testing
- Test files named `*.spec.ts`
- Describe blocks for logical grouping
- Arrange-Act-Assert pattern
- Mock external dependencies appropriately
- Comprehensive smoke tests for critical functionality

**Frontend Tests:**
- React Testing Library for component testing
- Playwright for end-to-end testing
- Accessibility testing with proper ARIA attributes
- Responsive design testing across viewport sizes

### Security Best Practices

- JWT tokens with expiration and refresh rotation
- Password hashing with bcryptjs
- Input validation with class-validator
- Security headers (Helmet.js)
- CSRF protection
- Rate limiting with NestJS throttler
- Never commit secrets or environment variables

### Code Organization

**Backend Structure:**
```
src/
├── auth/           # Authentication logic
├── users/          # User management
├── organizations/  # Multi-tenant organization handling
├── customers/      # Customer data management
├── middleware/     # HTTP middleware
├── config/         # Configuration management
└── database/       # Database connection and migrations
```

**Frontend Structure:**
```
app/                # Next.js App Router
├── layout.tsx      # Root layout
├── page.tsx        # Home page
└── components/     # Reusable components
```

### Commit Message Conventions

- Use imperative mood (e.g., "Add user authentication", not "Added user authentication")
- Include scope when relevant (e.g., "feat(auth): add JWT refresh tokens")
- Keep messages concise but descriptive
- Reference issue numbers when applicable

### Git Workflow

- Feature branches from `main`
- Pull requests required for all changes
- CI/CD pipeline runs on all PRs
- Build Verification Tests (BVT) for comprehensive validation
- No direct pushes to main branch

## Recent Improvements and Fixes

### Critical Fixes Applied
- **Fixed Broken Backend**: Added missing AuthModule, OrganizationsModule, UsersModule, and CustomersModule to app.module.ts - the application was completely non-functional before
- **Created Missing Modules**: Implemented complete UsersModule and CustomersModule with services, controllers, and DTOs
- **Fixed Port Inconsistency**: Corrected main.ts to use port 3001 consistently with configuration
- **Enhanced Security**: Improved tenant middleware with proper JWT validation and removed hardcoded organization IDs
- **Fixed Database Security**: Removed hardcoded organization ID from database config and improved SSL configuration

### Frontend Implementation
- **Replaced Placeholder**: Created a functional CRM dashboard to replace the default Next.js template
- **Added UI Components**: Implemented Card and Button components with proper accessibility
- **Updated Tests**: Fixed smoke tests to work with the new dashboard interface

### Security Enhancements
- **Rate Limiting**: Added global rate limiting with ThrottlerGuard
- **Database Security**: Improved SSL configuration and connection security
- **Input Validation**: Enhanced validation pipes with proper error handling
- **Tenant Isolation**: Strengthened multi-tenant middleware with UUID validation

### Code Quality Improvements
- **TypeScript**: Strict type checking across both backend and frontend
- **ESLint/Prettier**: Consistent code formatting and linting rules
- **Error Handling**: Comprehensive exception filters and proper HTTP status codes
- **Testing**: Updated test suites to match new implementation

## Cursor Rules

No Cursor rules (.cursorrules or .cursor/rules/) were found in this repository.

## Copilot Instructions

No GitHub Copilot instructions (.github/copilot-instructions.md) were found in this repository.

## Additional Resources

- [README.md](README.md) - Project overview and setup instructions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [tech.md](tech.md) - Technical specification
- [docs/bvt-runbook.md](docs/bvt-runbook.md) - Build verification testing guide</content>
<parameter name="filePath">C:\DEVELOPMENT\workspace\my projects\SaaS platform (CRMERP)\1st\AGENTS.md