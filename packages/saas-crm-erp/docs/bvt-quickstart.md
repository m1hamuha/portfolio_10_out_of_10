# BVT Quick Start Guide

## What is BVT?
Build Verification Tests (BVT) are automated tests that verify the most critical functionality of the SaaS CRM/ERP platform after each build. They're also known as "smoke tests" - if the build is on fire (broken), these tests will detect it.

## Getting Started

### Prerequisites
- Node.js 22 or later
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7

### Initial Setup
1. **Clone the repository** (if you haven't already)
2. **Start required services**:
   ```bash
   docker-compose up -d postgres redis
   ```
3. **Install dependencies**:
   ```bash
   cd backend && npm ci
   cd ../frontend && npm ci
   ```

## Running BVT Locally

### Option 1: Run Complete BVT Suite
```bash
# From project root
./scripts/run-bvt.sh
```

### Option 2: Run Individual Components

#### Infrastructure Health Checks
```bash
cd scripts/health-check

# Install health check dependencies (first time only)
npm init -y
npm install pg ioredis

# Run all health checks
node check-all.js

# Run specific checks
node check-database.js
node check-redis.js
```

#### Backend Smoke Tests
```bash
cd backend

# Set up test environment
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=crm_erp_test
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=test-secret-for-bvt
export NODE_ENV=test

# Run all smoke tests
npm test -- test/smoke

# Run specific test file
npm test -- test/smoke/auth.spec.ts

# Run with coverage
npm run test:cov -- test/smoke
```

#### Frontend Smoke Tests
```bash
cd frontend

# Run all smoke tests
npm test -- test/smoke

# Run specific test file
npm test -- test/smoke/app.spec.tsx

# Run with watch mode (development)
npm test -- test/smoke --watch
```

## Understanding Test Results

### Test Output Interpretation
- **✅ PASS**: Test succeeded
- **❌ FAIL**: Test failed - investigate immediately
- **⚠️ WARN**: Test passed but with warnings - review
- **⏸️ SKIP**: Test was skipped (usually intentional)

### Common Failure Patterns

#### Database Issues
```
❌ Database connection failed: Connection refused
```
**Fix**: Ensure PostgreSQL is running: `docker-compose up -d postgres`

#### Redis Issues
```
❌ Redis ping failed: Connection lost
```
**Fix**: Ensure Redis is running: `docker-compose up -d redis`

#### Authentication Issues
```
❌ Login failed: Invalid credentials
```
**Fix**: Check test user setup in `backend/test/smoke/setup.ts`

## Adding New Smoke Tests

### When to Add a Smoke Test
Add a smoke test when:
1. A new critical user flow is implemented
2. A core business function is added
3. Security-sensitive functionality is introduced
4. Integration with external services is added

### Backend Test Template
```typescript
import { createTestApp, cleanupTestApp } from './setup';

describe('New Feature Smoke Tests', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  it('should perform basic operation', async () => {
    const { app } = context;
    
    const response = await request(app.getHttpServer())
      .get('/new-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

### Frontend Test Template
```typescript
import { render, screen } from '@testing-library/react';
import NewComponent from '@/components/NewComponent';

describe('NewComponent Smoke Tests', () => {
  it('should render without crashing', () => {
    expect(() => render(<NewComponent />)).not.toThrow();
  });

  it('should display required elements', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow
The BVT runs automatically:
- On every push to `main` or `develop` branches
- On every pull request to `main`
- Daily at 2 AM UTC (scheduled)
- Manually via GitHub Actions UI

### Viewing CI Results
1. Go to GitHub → Actions → "Build Verification Test (BVT)"
2. Click on the latest run
3. Review job outputs and download artifacts

### Artifacts Generated
- Infrastructure health check results (JSON)
- Backend test coverage reports
- Frontend test results
- BVT summary report (Markdown)

## Troubleshooting Common Issues

### "Cannot find module" Errors
```bash
# Install missing dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../scripts/health-check && npm install
```

### Database Migration Issues
```bash
# Reset test database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS crm_erp_test; CREATE DATABASE crm_erp_test;"

# Run migrations
cd backend && npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
```

### Test Timeout Issues
Increase timeout in test configuration:
```javascript
// In jest.config.js or package.json
jest.setTimeout(30000); // 30 seconds
```

## Best Practices

### Writing Effective Smoke Tests
1. **Focus on critical paths**: Test what users actually do
2. **Keep tests fast**: Each test should complete in <1 second
3. **Make tests independent**: Tests shouldn't depend on each other
4. **Clean up after tests**: Don't leave test data in the database
5. **Use descriptive names**: Test names should explain what's being tested

### Maintaining Test Data
- Use the `setup.ts` file for shared test data
- Create unique test data for each test when possible
- Clean up test data in `afterEach` or `afterAll` hooks
- Use factories or builders for complex test data

### Performance Considerations
- Mock external API calls
- Use in-memory databases for unit tests
- Run tests in parallel when possible
- Monitor test execution time and optimize slow tests

## Next Steps

### After Setting Up BVT
1. **Integrate with your IDE**: Configure test runners in VS Code/WebStorm
2. **Set up pre-commit hooks**: Run smoke tests before committing
3. **Monitor test flakiness**: Track and fix flaky tests
4. **Expand test coverage**: Add tests for new critical features

### Learning Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)

## Getting Help

### Internal Resources
- Check the [BVT Runbook](./bvt-runbook.md) for detailed procedures
- Review existing tests in `backend/test/smoke/` and `frontend/test/smoke/`
- Check GitHub Actions workflow logs for CI issues

### Team Support
- **Backend issues**: Contact backend team
- **Frontend issues**: Contact frontend team
- **Infrastructure issues**: Contact DevOps team
- **Test methodology**: Contact QA team

### External Resources
- Stack Overflow tags: `jestjs`, `testing-library`, `nestjs`
- Official documentation links above
- Community Discord/Slack channels