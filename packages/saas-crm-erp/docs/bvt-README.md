# Build Verification Test (BVT) / Smoke Testing System

## Overview

The Build Verification Test (BVT) system is a comprehensive smoke testing framework for the SaaS CRM/ERP platform. It ensures that critical functionality works after each build and before deployment to production.

## Key Features

- **Infrastructure Health Checks**: Verifies PostgreSQL, Redis, and other service dependencies
- **Backend Smoke Tests**: Tests critical API endpoints and business logic
- **Frontend Smoke Tests**: Validates basic UI functionality and rendering
- **CI/CD Integration**: Automated testing in GitHub Actions
- **Comprehensive Reporting**: Detailed test results and health check reports
- **Local Development Support**: Easy to run locally for pre-commit validation

## Directory Structure

```
.
├── .github/workflows/bvt.yml          # GitHub Actions BVT workflow
├── backend/test/smoke/                # Backend smoke tests
│   ├── setup.ts                       # Test setup and utilities
│   ├── infrastructure.spec.ts         # Infrastructure tests
│   ├── auth.spec.ts                   # Authentication tests
│   ├── organizations.spec.ts          # Organization CRUD tests
│   └── customers.spec.ts              # Customer management tests
├── backend/test/acceptance/           # Business acceptance tests
│   └── organization-management.spec.ts # Organization management acceptance tests
├── frontend/test/smoke/               # Frontend smoke tests
│   ├── app.spec.tsx                   # Basic app loading tests
│   └── (more to be added)
├── scripts/health-check/              # Infrastructure health checks
│   ├── check-database.js              # PostgreSQL health check
│   ├── check-redis.js                 # Redis health check
│   ├── check-all.js                   # Combined health checks
│   └── package.json                   # Health check dependencies
├── scripts/run-bvt.ps1                # Windows BVT runner
├── scripts/run-bvt.sh                 # Unix/Linux BVT runner
└── docs/                              # Documentation
    ├── bvt-smoke-testing-design.md    # System design
    ├── bvt-runbook.md                 # Operational runbook
    ├── bvt-quickstart.md              # Quick start guide
    └── bvt-README.md                  # This file
```

## Getting Started

### Prerequisites
- Node.js 22 or later
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7

### Quick Start

1. **Start required services**:
   ```powershell
   docker-compose up -d postgres redis
   ```

2. **Install dependencies**:
   ```powershell
   cd backend && npm ci
   cd ../frontend && npm ci
   ```

3. **Run complete BVT suite**:
   ```powershell
   .\scripts\run-bvt.ps1
   ```

   Or for Unix/Linux:
   ```bash
   ./scripts/run-bvt.sh
   ```

## Running Tests

### Infrastructure Health Checks
```powershell
cd scripts/health-check
node check-database.js
node check-redis.js
node check-all.js
```

### Backend Smoke Tests
```powershell
cd backend
npm test -- test/smoke
npm test -- test/smoke/auth.spec.ts      # Specific test file
```

### Backend Acceptance Tests
```powershell
cd backend
npm run test:acceptance                  # Run all acceptance tests
npm run test:acceptance -- --testNamePattern="Scenario 1"  # Run specific scenario
```

### Frontend Smoke Tests
```powershell
cd frontend
npm test -- test/smoke
npm test -- test/smoke/app.spec.tsx      # Specific test file
```

## CI/CD Integration

The BVT system is integrated with GitHub Actions and runs automatically:

- **On every push** to `main` or `develop` branches
- **On every pull request** to `main` branch
- **Daily at 2 AM UTC** (scheduled run)
- **Manually** via GitHub Actions UI

### Viewing CI Results
1. Go to GitHub → Actions → "Build Verification Test (BVT)"
2. Click on the latest run
3. Review job outputs and download artifacts

### Generated Artifacts
- Infrastructure health check results (JSON)
- Backend test coverage reports
- Frontend test results
- BVT summary report (Markdown)

## Adding New Tests

### When to Add a Smoke Test
Add a smoke test when implementing:
- New critical user flows
- Core business functions
- Security-sensitive functionality
- Integration with external services

### Backend Smoke Test Example
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

### Acceptance Test Example
```typescript
/**
 * Acceptance Test: Business Scenario
 *
 * Business Scenario: As a [role],
 * I want to [perform action]
 * so that [business outcome].
 */
describe('Business Scenario Acceptance Test', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
    await setupTestData(context);
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  describe('Scenario 1: User Authentication and Authorization', () => {
    it('should authenticate user with valid credentials', async () => {
      // Test authentication flow
    });

    it('should enforce role-based access control', async () => {
      // Test RBAC enforcement
    });
  });

  describe('Scenario 2: Business Workflow Completion', () => {
    it('should complete end-to-end workflow', async () => {
      // Test complete business workflow
    });

    it('should validate business rules', async () => {
      // Test business rule validation
    });
  });
});
```

### Frontend Test Example
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

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d crm_erp_test -c "SELECT 1"
```

#### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli -h localhost ping
```

#### Test Timeout Issues
Increase timeout in test configuration or check for:
- Slow database queries
- Network latency
- Resource constraints

### Debugging Tests
```powershell
# Run tests with verbose output
npm test -- test/smoke --verbose

# Run specific test with debug
npm test -- test/smoke/auth.spec.ts --debug
```

## Best Practices

### Writing Effective Smoke Tests
1. **Focus on critical paths**: Test what users actually do
2. **Keep tests fast**: Each test should complete in <1 second
3. **Make tests independent**: Tests shouldn't depend on each other
4. **Clean up after tests**: Don't leave test data in the database
5. **Use descriptive names**: Test names should explain what's being tested

### Test Data Management
- Use the `setup.ts` file for shared test data
- Create unique test data for each test when possible
- Clean up test data in `afterEach` or `afterAll` hooks
- Use factories or builders for complex test data

## Monitoring and Maintenance

### Success Metrics
- **Test Pass Rate**: >95% of smoke tests passing
- **Execution Time**: <10 minutes for full BVT suite
- **Infrastructure Uptime**: >99.9% for required services

### Regular Maintenance
- **Weekly**: Review test data, clean up artifacts
- **Monthly**: Update test coverage, performance benchmarks
- **Quarterly**: Comprehensive test suite review and security audit

## Documentation

### Complete Documentation
- **[Design Document](./bvt-smoke-testing-design.md)**: System architecture and design decisions
- **[Runbook](./bvt-runbook.md)**: Operational procedures and troubleshooting
- **[Quick Start Guide](./bvt-quickstart.md)**: Getting started and basic usage

### Related Documentation
- [CI/CD Pipeline](../.github/workflows/ci.yml)
- [Testing Strategy](../tech.md#testing-strategy)
- [Project Execution Plan](../pep.md)

## Support

### Getting Help
- **Backend issues**: Contact backend team
- **Frontend issues**: Contact frontend team
- **Infrastructure issues**: Contact DevOps team
- **Test methodology**: Contact QA team

### External Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)

## Contributing

### Adding New Test Categories
1. Create new test files in appropriate directories
2. Update test setup if needed
3. Add to CI/CD workflow
4. Update documentation
5. Run complete BVT suite to verify

### Reporting Issues
1. Check existing issues in GitHub
2. Create new issue with detailed description
3. Include test output and environment details
4. Label with `bvt` or `testing`

## License

This BVT system is part of the SaaS CRM/ERP platform. See the main project LICENSE file for details.

---

**Last Updated**: 2026-01-06  
**Version**: 1.0.0  
**Maintainer**: DevOps Team