# Deployment Workflow

## Identity
- **Name**: Deployment Workflow
- **Trigger**: All phases completed, final validation passed
- **Owner**: Super Agent

## Flow

```
┌─────────────────────────┐
│  1. PRE-DEPLOYMENT       │
│  CHECKS                  │
│  All phases complete     │
│  All tests pass          │
│  Code review approved    │
│  No open blockers        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. BUILD VALIDATION     │
│  Backend builds          │
│  Frontend builds         │
│  No TypeScript errors    │
│  No lint warnings        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  3. DOCKER BUILD         │
│  Build backend image     │
│  Build frontend image    │
│  Run security scan       │
│  Verify health checks    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  4. ENVIRONMENT CONFIG   │
│  Verify .env.example     │
│  Document all env vars   │
│  Validate secrets setup  │
│  Check TLS certificates  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  5. DATABASE MIGRATION   │
│  Generate migration      │
│  files                   │
│  Test migrations on      │
│  staging database        │
│  Verify rollback works   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  6. STAGING DEPLOYMENT   │
│  Deploy to staging       │
│  Run smoke tests         │
│  Verify API endpoints    │
│  Verify frontend renders │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
  [PASS]         [FAIL]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Log failures     │
     │     │ Rollback staging │
     │     │ Fix and retry    │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  7. PRODUCTION DEPLOY    │
│  (Requires human         │
│  approval)               │
│  Deploy to production    │
│  Run health checks       │
│  Monitor error rates     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  8. POST-DEPLOYMENT      │
│  Verify production       │
│  health checks           │
│  Monitor logs for        │
│  errors (15 min)         │
│  Update project-status   │
│  to DEPLOYED             │
└─────────────────────────┘
```

## Deployment Checklist

### Pre-Deployment
- [ ] All phases completed
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code review approved
- [ ] No open blockers
- [ ] Documentation is current

### Build
- [ ] `npm run build` succeeds for backend
- [ ] `npm run build` succeeds for frontend
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors/warnings
- [ ] Docker images build successfully

### Configuration
- [ ] `.env.example` documents all required variables
- [ ] All secrets use environment variables (no hardcoded values)
- [ ] CORS configured for production domains
- [ ] Rate limiting configured for production load
- [ ] SSL/TLS certificates valid

### Database
- [ ] All migrations generated and tested
- [ ] Migrations tested against staging database
- [ ] Rollback procedure verified
- [ ] Seed data prepared (if needed)

### Infrastructure
- [ ] Docker images scanned for vulnerabilities
- [ ] Health check endpoints responding
- [ ] Monitoring configured (Prometheus)
- [ ] Logging configured (Winston + ELK)
- [ ] Error tracking configured

### Post-Deployment
- [ ] Health checks pass in production
- [ ] No error spikes in logs
- [ ] API response times within SLA
- [ ] Frontend loads correctly
- [ ] Authentication flow works
- [ ] Rollback procedure documented

## Rollback Procedure

```
1. Identify the issue (check error logs, monitoring)
2. Revert to previous Docker images
3. Rollback database migrations (if applicable)
4. Verify rollback success with health checks
5. Log the rollback in execution-log.md
6. Create a bug report for the issue
7. Fix the issue in development
8. Re-deploy through the standard pipeline
```

## CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: ['27017:27017']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit -- --coverage
      - run: npm run test:e2e

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
      - name: Push images
        run: docker compose push

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"
      - name: Run smoke tests
        run: echo "Run smoke tests against staging"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
      - name: Health check
        run: echo "Verify production health"
```
