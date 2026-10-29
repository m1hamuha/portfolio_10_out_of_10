# Build Verification Test (BVT) Runbook

## Overview
This runbook provides operational guidance for the Build Verification Test (BVT) system of the SaaS CRM/ERP platform. BVT ensures that critical functionality works after each build and before deployment.

## Quick Reference

### Key Commands
```bash
# Run all BVT checks locally
cd scripts/health-check && node check-all.js

# Run backend smoke tests
cd backend && npm test -- test/smoke

# Run frontend smoke tests
cd frontend && npm test -- test/smoke

# Run specific health check
cd scripts/health-check && node check-database.js
```

### CI/CD Integration
- **Workflow**: `.github/workflows/bvt.yml`
- **Trigger**: On push to main/develop, PRs to main, daily schedule, manual
- **Duration**: ~5-10 minutes
- **Artifacts**: Test results, coverage reports, health check results

## Test Categories

### 1. Infrastructure Health Checks
**Purpose**: Verify all required services are operational and accessible.

**Components**:
- PostgreSQL database connectivity and schema
- Redis cache connectivity and basic operations
- Environment configuration validation
- Service dependency checks

**Scripts**: `scripts/health-check/check-*.js`

### 2. Backend Smoke Tests
**Purpose**: Verify critical API endpoints and business logic.

**Test Suites**:
- `backend/test/smoke/infrastructure.spec.ts` - Service connectivity
- `backend/test/smoke/auth.spec.ts` - Authentication flows
- `backend/test/smoke/organizations.spec.ts` - Organization CRUD
- `backend/test/smoke/customers.spec.ts` - Customer management

**Coverage**: Authentication, CRUD operations, validation, error handling

### 3. Frontend Smoke Tests
**Purpose**: Verify basic UI functionality and rendering.

**Test Suites**:
- `frontend/test/smoke/app.spec.tsx` - Basic app loading and rendering
- Additional suites for specific components (to be added)

**Coverage**: Component rendering, accessibility, performance basics

## Failure Scenarios and Troubleshooting

### Scenario 1: Database Connection Failure
**Symptoms**:
- Infrastructure health check fails
- Backend smoke tests fail with connection errors
- Error: "Connection refused" or "Authentication failed"

**Diagnosis**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql -h localhost -U postgres -d crm_erp_test -c "SELECT 1"
```

**Resolution**:
1. Start PostgreSQL service: `docker-compose up -d postgres`
2. Verify credentials in environment variables
3. Check database exists: `CREATE DATABASE crm_erp_test;`
4. Apply migrations: `cd backend && npm run migration:run`

### Scenario 2: Redis Connection Failure
**Symptoms**:
- Redis health check fails
- Cache-related operations timeout
- Error: "Redis connection lost"

**Diagnosis**:
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli -h localhost ping
```

**Resolution**:
1. Start Redis service: `docker-compose up -d redis`
2. Check Redis configuration
3. Verify Redis memory usage isn't exhausted
4. Restart Redis if needed: `docker restart crm_erp_redis`

### Scenario 3: Backend API Tests Failing
**Symptoms**:
- Specific backend smoke tests failing
- API endpoints returning unexpected status codes
- Authentication/authorization issues

**Diagnosis**:
```bash
# Run specific failing test with more detail
cd backend && npm test -- test/smoke/auth.spec.ts --verbose

# Check application logs
cd backend && npm start:dev
```

**Resolution**:
1. Check test data setup in `backend/test/smoke/setup.ts`
2. Verify JWT secret configuration
3. Check database state (migrations applied, test data exists)
4. Review recent code changes affecting the failing endpoint

### Scenario 4: Frontend Tests Failing
**Symptoms**:
- Frontend smoke tests failing
- Components not rendering correctly
- Accessibility or performance issues

**Diagnosis**:
```bash
# Run frontend tests with debug output
cd frontend && npm test -- test/smoke --verbose

# Check browser console for errors
cd frontend && npm run dev
```

**Resolution**:
1. Check component props and state management
2. Verify API mocking in test setup
3. Check for missing dependencies or imports
4. Review recent UI/component changes

## Monitoring and Alerting

### Success Metrics
- **Test Pass Rate**: >95% of smoke tests passing
- **Execution Time**: <10 minutes for full BVT suite
- **Infrastructure Uptime**: >99.9% for required services

### Alert Thresholds
- **Critical**: Any infrastructure health check fails
- **High**: >30% of smoke tests failing
- **Medium**: Single critical user flow failing
- **Low**: Non-critical test failures or warnings

### Notification Channels
1. **Slack/Teams**: Immediate notification for critical failures
2. **Email**: Daily summary report
3. **Dashboard**: Real-time BVT status dashboard (to be implemented)

## Maintenance Procedures

### Regular Maintenance Tasks
**Weekly**:
- Review and update test data
- Clean up old test artifacts
- Update dependencies in test scripts

**Monthly**:
- Review and update smoke test coverage
- Performance benchmark comparison
- Test environment cleanup and refresh

**Quarterly**:
- Comprehensive test suite review
- Update for new features and requirements
- Security audit of test infrastructure

### Test Data Management
**Test Database**:
- Separate database for testing (`crm_erp_test`)
- Automated schema creation via migrations
- Test data seeded by `backend/test/smoke/setup.ts`

**Cleanup**:
- Tests should clean up after themselves
- Database reset between test runs in CI
- Local test data persistence configurable

### Performance Optimization
**Test Execution**:
- Parallel test execution where possible
- Mock external services to reduce dependencies
- Cache test dependencies in CI

**Resource Usage**:
- Monitor test execution time
- Optimize slow-running tests
- Remove redundant or overlapping tests

## Rollback Procedures

### When to Rollback
1. BVT fails in production deployment pipeline
2. Critical functionality broken in production
3. Security vulnerabilities detected

### Rollback Steps
1. **Immediate Action**: Stop traffic to new deployment
2. **Assessment**: Review BVT failure details
3. **Decision**: Determine if rollback is needed
4. **Execution**: Revert to previous stable version
5. **Verification**: Run BVT on rolled-back version
6. **Documentation**: Record incident and resolution

### Automated Rollback Triggers
- BVT failure rate >50%
- Infrastructure health check failure
- Critical user flow test failure
- Performance degradation beyond thresholds

## Continuous Improvement

### Feedback Loop
1. **Collect Data**: Test results, failure patterns, execution times
2. **Analyze Trends**: Identify flaky tests, performance bottlenecks
3. **Prioritize Improvements**: Based on impact and frequency
4. **Implement Changes**: Update tests, infrastructure, processes
5. **Measure Impact**: Track improvement in success metrics

### Test Coverage Expansion
**Priority 1** (Critical Business Functions):
- User authentication and authorization
- Customer creation and management
- Payment processing integration
- Report generation

**Priority 2** (Important Features):
- Organization management
- User role management
- Data export functionality
- Notification system

**Priority 3** (Enhancements):
- Performance benchmarks
- Security vulnerability scans
- Accessibility compliance
- Internationalization support

## Emergency Procedures

### BVT System Failure
If the BVT system itself fails (not the application under test):

1. **Assess Impact**: Determine if deployment can proceed
2. **Manual Verification**: Perform critical checks manually
3. **Temporary Bypass**: If justified, bypass with approval
4. **Fix BVT System**: Priority fix for BVT infrastructure
5. **Retrospective**: Analyze root cause and prevent recurrence

### False Positives/Negatives
**Procedure**:
1. Document the false result with evidence
2. Temporarily skip or fix the test
3. Investigate root cause (test logic, environment, data)
4. Update test to be more robust
5. Re-enable test after verification

## Contact Information

### Primary Contacts
- **DevOps Team**: Infrastructure and deployment issues
- **Backend Team**: API and service issues
- **Frontend Team**: UI and component issues
- **QA Team**: Test methodology and coverage

### Escalation Path
1. Team lead of affected area
2. Engineering manager
3. Head of engineering
4. CTO (for critical production issues)

## Appendix

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_erp_test
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
JWT_SECRET=test-secret-for-bvt
NODE_ENV=test
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Useful Commands
```bash
# Reset test database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS crm_erp_test; CREATE DATABASE crm_erp_test;"

# Run specific test category
cd backend && npm test -- test/smoke/auth.spec.ts

# Generate test coverage report
cd backend && npm run test:cov
cd frontend && npm test -- --coverage

# Debug failing test
cd backend && npm run test:debug -- test/smoke/auth.spec.ts
```

### Related Documentation
- [BVT Design Document](./bvt-smoke-testing-design.md)
- [CI/CD Pipeline Documentation](../.github/workflows/ci.yml)
- [Testing Strategy](../tech.md#testing-strategy)
- [Project Execution Plan](../pep.md)