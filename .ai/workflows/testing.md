# Testing Workflow

## Identity
- **Name**: Testing Workflow
- **Trigger**: Backend and frontend tasks completed for current phase
- **Owner**: QA Agent (orchestrated by Super Agent)

## Flow

```
┌─────────────────────────┐
│  1. ENVIRONMENT SETUP    │
│  Verify test databases   │
│  Clear test data         │
│  Seed required fixtures  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. UNIT TESTS           │
│  npm run test:unit       │
│  -- --coverage           │
│  Target: ≥80% coverage  │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [PASS]          [FAIL]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Generate bug     │
     │     │ reports for each │
     │     │ failing test     │
     │     │ Send to Super    │
     │     │ Agent for retry  │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  3. INTEGRATION TESTS    │
│  npm run test:e2e        │
│  Test API endpoints      │
│  with real database      │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [PASS]          [FAIL]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Generate bug     │
     │     │ reports           │
     │     │ Identify failing │
     │     │ endpoints         │
     │     │ Send to Super    │
     │     │ Agent            │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  4. API CONTRACT TESTS   │
│  Validate all endpoints  │
│  against OpenAPI spec    │
│  Test error responses    │
│  Test rate limiting      │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [PASS]          [FAIL]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Log contract     │
     │     │ violations        │
     │     │ Flag mismatches  │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  5. E2E TESTS            │
│  npx playwright test     │
│  Test critical user      │
│  journeys through UI     │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [PASS]          [FAIL]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Capture failing  │
     │     │ screenshots      │
     │     │ Record traces    │
     │     │ Generate reports │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  6. COVERAGE REPORT      │
│  Generate coverage       │
│  summary                 │
│  Check against targets   │
│  Flag under-covered      │
│  modules                 │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  7. TEST SUMMARY         │
│  Compile results         │
│  List all bugs found     │
│  Report to Super Agent   │
└─────────────────────────┘
```

## Test Configuration

### Jest Configuration
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "codebase",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s", "!**/*.module.ts", "!**/main.ts"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Playwright Configuration
```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 2,
  workers: '50%',
  reporter: [['html', { open: 'never' }], ['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
}
```

## Success Criteria

| Metric | Minimum | Target |
|--------|---------|--------|
| Unit test pass rate | 100% | 100% |
| Integration test pass rate | 100% | 100% |
| E2E test pass rate | 95% | 100% |
| Line coverage | 80% | 90% |
| Branch coverage | 75% | 85% |
| Zero CRITICAL bugs | Required | Required |
| Zero HIGH bugs | Required | Required |
