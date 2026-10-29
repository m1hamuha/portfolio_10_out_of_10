# Simulation Runbook: Launch and Operation for SaaS CRM/ERP

This runbook provides a practical, repeatable guide to launch and operate the SaaS CRM/ERP application in a local development environment. It covers infrastructure, application startup, health checks, basic functionality testing, and performance/stability checks.

Note: This document is intended for local development and testing. Adapt values for your production environment as needed.

## 1) Prerequisites
- Operating system: Windows (with Docker Desktop) or macOS/Linux
- Docker Desktop running (including Docker Compose)
- Node.js 18+ (npm 9+ recommended)
- Git
- Sufficient resources: 8 GB RAM+ and 4+ CPU cores

## 2) Project layout (brief)
- backend/       NestJS API server
- frontend/      Next.js UI
- docker/        Docker-related configs (optional)
- docker-compose.yml Local dev environment (PostgreSQL, Redis, RabbitMQ, and apps)
- scripts/        Helper scripts (health checks, BVТ, etc.)

## 3) Environment configuration
- Ensure env templates exist:
  - backend/.env.example
  - frontend/.env.example
- Copy to actual env files (do not commit secrets):
  - cp backend/.env.example backend/.env
  - cp frontend/.env.example frontend/.env
- Fill in required values (DB credentials, Redis, RabbitMQ, Stripe keys, JWT secrets).

## 4) Start infrastructure (local dev)
1) From repo root, bring up services:
   docker-compose up -d
2) Wait for health:
   - PostgreSQL: pg_isready -U postgres
   - Redis: redis-cli ping
   - RabbitMQ: docker exec <container> rabbitmqctl status

## 5) Install dependencies and run apps
Backend
- cd backend
- npm ci --legacy-peer-deps
- npm run start:dev

Frontend
- cd frontend
- npm ci
- npm run dev

Notes:
- If you see peer-dependency warnings during npm install, using --legacy-peer-deps often resolves them for development scenarios.
- The backend defaults to http://localhost:3001 and frontend to http://localhost:3000.

## 6) Health checks and readiness
- Backend health: GET http://localhost:3001/api/v1/health
- Frontend: http://localhost:3000 (check root and /api/docs on backend if swagger is enabled)
- Swagger: http://localhost:3001/api/docs
- If health endpoints fail, check logs and verify DB connectivity and Redis availability.

## 7) Basic functional simulation
- Authentication: register/login and obtain JWT
- CRM core flows: create customer, list customers
- ERP flows: create invoice, create payment (Stripe), update invoice status
- Deal pipeline: create deal and progress stages
- Multitenancy: test with organization_id context in requests or JWT claims

## 8) Performance and load testing (optional)
- Frontend: Lighthouse CI or local Lighthouse run for Performance/Accessibility targets
- API: Artillery/k6 for 100-1000 concurrent requests (auth, customers, invoices, payments)
- Monitor p95 latency and memory usage

## 9) Logging, monitoring and observability
- Structured logs via Winston (backend)
- Prometheus metrics exposure and Grafana dashboards (if configured)
- Health checks and runbooks for incident handling

## 10) Cleanup and rollback
- Stop services: docker-compose down
- Remove test data if needed (seed scripts or database cleanup)
- Remove any temporary env files used for testing

## 11) Quick start script (optional)
- You can create a small script to automate the above steps in your environment. For example:
  - A bash script that runs docker-compose up, npm ci, npm run start:dev, and basic health checks

## 12) Appendix: example env variables
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- REDIS_HOST, REDIS_PORT
- RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD
- JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- ALLOWED_ORIGINS
- LOG_LEVEL

---
Документация может быть дополнена по мере реализации дополнительных компонентов (Reporting, MFA, RLS и пр.).
