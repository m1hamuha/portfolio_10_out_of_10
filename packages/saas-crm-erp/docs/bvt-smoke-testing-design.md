# Build Verification Test (BVT) / Smoke Testing Design

## Overview
Build Verification Tests (BVTs) are a set of automated tests that verify the most critical functionality of the SaaS CRM/ERP platform after each build. Smoke tests ensure the system is stable enough for further testing.

## Test Categories

### 1. Infrastructure Health Checks
- Database connectivity (PostgreSQL)
- Redis cache connectivity
- RabbitMQ message queue health
- External service dependencies (Stripe test mode)

### 2. Backend API Smoke Tests
- Authentication endpoints (login, token refresh)
- Core CRUD operations (organizations, users, customers)
- Role-based access control validation
- Error handling and validation

### 3. Acceptance Tests
- End-to-end business scenarios (organization management, user workflows)
- Business rule validation
- Multi-tenant data isolation verification
- Performance and scalability acceptance criteria

### 4. Frontend Smoke Tests
- Application loads without errors
- Login functionality
- Basic navigation between pages
- Critical user flows (create customer, generate invoice)

### 5. Integration Smoke Tests
- Database migrations apply successfully
- Environment configuration validation
- Service dependencies communication

## Test Architecture

### Backend Test Structure
```
backend/test/
├── smoke/
│   ├── infrastructure.spec.ts      # Infrastructure health checks
│   ├── auth.spec.ts               # Authentication smoke tests
│   ├── organizations.spec.ts      # Organization CRUD tests
│   ├── customers.spec.ts          # Customer management tests
│   └── setup.ts                   # Test setup and teardown
└── acceptance/
    └── organization-management.spec.ts  # Business acceptance tests
```

### Frontend Test Structure
```
frontend/test/smoke/
├── app.spec.ts               # Basic app loading
├── auth.spec.ts              # Login/logout flows
├── navigation.spec.ts        # Role-based navigation
└── critical-flows.spec.ts    # Key user journeys
```

### Infrastructure Health Check Scripts
```
scripts/health-check/
├── check-database.js         # PostgreSQL connectivity
├── check-redis.js            # Redis connectivity
├── check-rabbitmq.js         # RabbitMQ health
└── check-services.js         # All services combined
```

## Test Execution Strategy

### Local Development
```bash
# Run all smoke tests
npm run test:smoke

# Run specific test category
npm run test:smoke:infrastructure
npm run test:smoke:backend
npm run test:smoke:frontend
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
- name: Run Build Verification Tests
  run: |
    npm run test:smoke
    npm run health-check:all
```

### Pre-deployment Validation
```bash
# Validate deployment readiness
npm run validate:deployment
```

## Success Criteria

### Infrastructure Health Checks
- ✅ All required services are reachable
- ✅ Database migrations applied successfully
- ✅ Environment variables properly configured
- ✅ External API keys valid (Stripe test mode)

### Backend Smoke Tests
- ✅ Authentication endpoints return expected status codes
- ✅ CRUD operations succeed with valid data
- ✅ Role-based access control enforced
- ✅ Error handling returns appropriate HTTP codes

### Acceptance Tests
- ✅ End-to-end business scenarios complete successfully
- ✅ Business rules are properly enforced
- ✅ Multi-tenant data isolation verified
- ✅ Performance meets acceptance criteria

### Frontend Smoke Tests
- ✅ Application loads without JavaScript errors
- ✅ Login page accessible and functional
- ✅ Basic navigation works
- ✅ Critical user flows complete successfully

## Failure Handling

### Test Failure Scenarios
1. **Infrastructure failures**: Alert DevOps team, block deployment
2. **Backend API failures**: Alert backend team, investigate recent changes
3. **Frontend failures**: Alert frontend team, check recent UI changes
4. **Integration failures**: Alert integration team, verify service dependencies

### Automated Responses
- Failed tests generate detailed reports
- Slack/Teams notifications for critical failures
- Automatic rollback if post-deployment BVT fails
- Test results stored for trend analysis

## Monitoring and Reporting

### Test Results Dashboard
- Real-time test execution status
- Historical pass/fail trends
- Performance metrics (response times)
- Coverage reports

### Alerting
- Immediate notification for critical test failures
- Daily summary of test execution
- Weekly trend analysis reports

## Implementation Priority

### Phase 1 (Immediate)
1. Infrastructure health checks
2. Backend authentication smoke tests
3. Basic database connectivity tests

### Phase 2 (Short-term)
1. Core CRUD operation smoke tests
2. Frontend basic loading tests
3. CI/CD integration

### Phase 3 (Long-term)
1. Complete end-to-end smoke tests
2. Performance smoke tests
3. Security smoke tests
4. Automated rollback based on BVT results

## Dependencies
- Test database with seed data
- Mock external services (Stripe, email)
- Test environment isolation
- Monitoring and alerting infrastructure

## Maintenance
- Regular review and update of smoke tests
- Test data management strategy
- Performance optimization of test suite
- Documentation updates as features evolve