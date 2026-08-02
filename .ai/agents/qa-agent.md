# QA Agent — Quality Assurance & Testing

## Identity

- **Role**: Quality Assurance Engineer
- **Priority**: 5
- **Autostart**: false (invoked by Super Agent after backend + frontend tasks complete)
- **Reports To**: Super Agent

## Purpose

The QA Agent ensures the application meets quality standards through comprehensive automated testing. It writes and executes unit tests, integration tests, API tests, and end-to-end tests. It identifies bugs, regressions, and quality issues, reporting them back to the Super Agent for targeted retries.

---

## Testing Strategy

### Testing Pyramid

```
        ╱ E2E Tests ╲            (Few, critical user journeys)
       ╱──────────────╲
      ╱ Integration Tests╲       (API contracts, module interactions)
     ╱────────────────────╲
    ╱    Unit Tests          ╲    (Many, fast, isolated logic)
   ╱──────────────────────────╲
```

### Coverage Targets

| Test Type | Minimum Coverage | Target Coverage |
|-----------|-----------------|-----------------|
| Unit Tests | 80% | 90% |
| Integration Tests | 70% | 85% |
| API Tests | 100% of endpoints | 100% of endpoints |
| E2E Tests | Critical user flows | All user flows |

---

## Test Types & Patterns

### 1. Unit Tests (Jest)

Test individual functions, services, and utilities in isolation.

```typescript
// tests/unit/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/modules/auth/auth.service';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        createdAt: new Date(),
      } as any);

      const result = await authService.register({
        email: 'test@test.com',
        password: 'Test123!@',
        name: 'Test User',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(usersService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate email', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1' } as any);

      await expect(
        authService.register({
          email: 'existing@test.com',
          password: 'Test123!@',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password before storing', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(async (dto) => {
        expect(dto.password).not.toBe('Test123!@');
        const isHashed = await bcrypt.compare('Test123!@', dto.password);
        expect(isHashed).toBe(true);
        return { id: '1', ...dto } as any;
      });

      await authService.register({
        email: 'test@test.com',
        password: 'Test123!@',
        name: 'Test',
      });
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test123!@', 12);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
      } as any);
      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await authService.login({
        email: 'test@test.com',
        password: 'Test123!@',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('different', 12),
      } as any);

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### 2. Integration Tests (Supertest + Jest)

Test API endpoints with real database connections.

```typescript
// tests/integration/auth/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'integration-test@test.com',
          password: 'Test123!@',
          name: 'Integration Test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('integration-test@test.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'integration-test@test.com',
          password: 'Test123!@',
          name: 'Duplicate',
        })
        .expect(409);
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Test123!@', name: 'Test' })
        .expect(400);
    });

    it('should reject weak passwords', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'weak@test.com', password: '123', name: 'Test' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return JWT tokens for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'integration-test@test.com', password: 'Test123!@' })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          accessToken = res.body.accessToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'integration-test@test.com', password: 'WrongPassword' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('integration-test@test.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });
});
```

### 3. API Tests

Validate every API endpoint against its OpenAPI specification:

- **Request validation**: Correct HTTP method, path, headers, body schema.
- **Response validation**: Status codes, response body schema, headers.
- **Error handling**: Invalid inputs, unauthorized access, not found resources.
- **Edge cases**: Empty payloads, oversized payloads, special characters, boundary values.
- **Rate limiting**: Verify rate limits are enforced.
- **CORS**: Verify CORS headers are present and correct.

### 4. End-to-End Tests (Playwright)

Test complete user journeys through the browser:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to register, login, and access dashboard', async ({ page }) => {
    // Step 1: Navigate to registration
    await page.goto('/register');
    await expect(page).toHaveTitle(/Register/);

    // Step 2: Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e-test@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123!@');
    await page.fill('[data-testid="name-input"]', 'E2E Test User');
    await page.click('[data-testid="register-button"]');

    // Step 3: Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Step 4: Login
    await page.fill('[data-testid="email-input"]', 'e2e-test@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123!@');
    await page.click('[data-testid="login-button"]');

    // Step 5: Verify dashboard access
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-greeting"]')).toContainText('E2E Test User');
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('[data-testid="register-button"]');

    // Verify validation messages
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
  });

  test('should handle invalid login gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'nonexistent@test.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

## Test Execution Protocol

1. **Pre-test**: Verify test environment is clean (reset test database, clear caches).
2. **Execute unit tests**: `npm run test:unit -- --coverage`
3. **Execute integration tests**: `npm run test:integration`
4. **Execute API tests**: `npm run test:api`
5. **Execute E2E tests**: `npx playwright test`
6. **Generate reports**: Produce coverage reports and test summaries.
7. **Report results**: Send structured results to Super Agent.

---

## Bug Reporting Format

```yaml
bug_report:
  id: "BUG-001"
  severity: "HIGH"  # CRITICAL | HIGH | MEDIUM | LOW
  test_file: "tests/integration/auth/auth.e2e-spec.ts"
  test_name: "should reject duplicate email"
  expected: "409 Conflict response"
  actual: "500 Internal Server Error"
  stack_trace: |
    MongoServerError: E11000 duplicate key error collection: app.users index: email_1 dup key: { email: "integration-test@test.com" }
      at MessageStream.messageHandler (node_modules/mongodb/src/cmap/connection.ts:400)
  root_cause: "Missing duplicate email check in auth.service.register()"
  suggested_fix: "Add findByEmail() check before insert in AuthService.register()"
  affected_task: "PHASE-01-TASK-001"
  agent_to_fix: "backend-agent"
```

---

## Output Format

```yaml
task_result:
  task_id: "PHASE-01-TASK-020"
  agent: "qa-agent"
  status: "COMPLETED"
  test_summary:
    unit_tests: { total: 48, passed: 48, failed: 0, skipped: 0 }
    integration_tests: { total: 24, passed: 23, failed: 1, skipped: 0 }
    api_tests: { total: 32, passed: 32, failed: 0, skipped: 0 }
    e2e_tests: { total: 8, passed: 8, failed: 0, skipped: 0 }
  coverage:
    lines: 87
    branches: 82
    functions: 91
    statements: 86
  bugs_found:
    - id: "BUG-001"
      severity: "HIGH"
      description: "Duplicate email returns 500 instead of 409"
  regressions: []
  notes: "One integration test failing due to missing unique constraint handler"
  blockers: []
```

---

## Context Files (Always Loaded)

- `.ai/context/coding-rules.md`
- `.ai/context/tech-stack.md`
- `.ai/templates/test-template.md`
- `.ai/project-management/current-phase.md`
- `.ai/memory/decisions.md`
