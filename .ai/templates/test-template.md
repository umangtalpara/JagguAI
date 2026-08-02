# Test Template

## Unit Test Template

```typescript
// tests/unit/[module]/[service].spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { [ServiceName] } from '@/modules/[module]/[module].service';
import { getModelToken } from '@nestjs/mongoose';
import { [ModelName], [ModelName]Document } from '@/modules/[module]/schemas/[module].schema';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

// ──────────────────────────────────────────
// Mock Factory
// ──────────────────────────────────────────

const mockModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
});

// ──────────────────────────────────────────
// Test Data Factory
// ──────────────────────────────────────────

function createTest[ModelName](overrides: Partial<[ModelName]> = {}): [ModelName] {
  return {
    id: 'test-object-id-1',
    name: 'Test Entity',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as [ModelName];
}

// ──────────────────────────────────────────
// Test Suite
// ──────────────────────────────────────────

describe('[ServiceName]', () => {
  let service: [ServiceName];
  let model: any; // Mocked Mongoose Model

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [ServiceName],
        {
          provide: getModelToken([ModelName].name),
          useFactory: mockModel,
        },
      ],
    }).compile();

    service = module.get<[ServiceName]>([ServiceName]);
    model = module.get(getModelToken([ModelName].name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────

  describe('findAll', () => {
    it('should return an array of documents', async () => {
      // Arrange
      const expected = [createTest[ModelName]()];
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expected);
      expect(model.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no documents exist', async () => {
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────

  describe('findOne', () => {
    it('should return document when found', async () => {
      const expected = createTest[ModelName]();
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(expected),
      });

      const result = await service.findOne('test-object-id-1');

      expect(result).toEqual(expected);
      expect(model.findOne).toHaveBeenCalledWith({ _id: 'test-object-id-1' });
    });

    it('should throw NotFoundException when document not found', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ──────────────────────────────────────────
  // create
  // ──────────────────────────────────────────

  describe('create', () => {
    it('should create and return new document', async () => {
      const dto = { name: 'New Document' };
      const expected = createTest[ModelName](dto);
      model.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(model.create).toHaveBeenCalledWith(dto);
    });
  });

  // ──────────────────────────────────────────
  // update
  // ──────────────────────────────────────────

  describe('update', () => {
    it('should update and return updated document', async () => {
      const existing = createTest[ModelName]();
      const dto = { name: 'Updated Name' };
      const updated = { ...existing, ...dto };

      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      });
      model.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ nModified: 1 }),
      });

      const result = await service.update('test-object-id-1', dto);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when document not found', async () => {
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────

  describe('remove', () => {
    it('should delete document', async () => {
      const existing = createTest[ModelName]();
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      });
      model.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.remove('test-object-id-1');

      expect(model.deleteOne).toHaveBeenCalledWith({ _id: 'test-object-id-1' });
    });
  });
});
```
## SQL (Prisma ORM) Unit Test Template

```typescript
// tests/unit/[module]/[service].spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { [ServiceName] } from '@/modules/[module]/[module].service';
import { PrismaService } from '@/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = () => ({
  [modelName]: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
});

describe('[ServiceName] (Prisma)', () => {
  let service: [ServiceName];
  let prisma: any; // Mocked Prisma client

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [ServiceName],
        {
          provide: PrismaService,
          useFactory: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<[ServiceName]>([ServiceName]);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const expected = [{ id: '1', name: 'Test Record' }];
      prisma.[modelName].findMany.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(result).toEqual(expected);
      expect(prisma.[modelName].findMany).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Integration Test Template

```typescript
// tests/integration/[module]/[module].e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('[Module] Endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Get auth token for authenticated tests
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'Test123!@' });
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/[resource]', () => {
    it('should return paginated list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/[resource]')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.total).toBeDefined();
        });
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/[resource]')
        .expect(401);
    });
  });

  describe('POST /api/v1/[resource]', () => {
    it('should create new resource', () => {
      return request(app.getHttpServer())
        .post('/api/v1/[resource]')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Resource' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe('Test Resource');
        });
    });

    it('should reject invalid input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/[resource]')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ })
        .expect(400);
    });
  });
});
```

## E2E Test Template (Playwright)

```typescript
// tests/e2e/[feature].spec.ts

import { test, expect } from '@playwright/test';

test.describe('[Feature] Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@test.com');
    await page.fill('[data-testid="password-input"]', 'Test123!@');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display [feature] list', async ({ page }) => {
    await page.goto('/[feature]');
    await expect(page.locator('[data-testid="[feature]-list"]')).toBeVisible();
  });

  test('should create new [feature]', async ({ page }) => {
    await page.goto('/[feature]');
    await page.click('[data-testid="create-button"]');
    await page.fill('[data-testid="name-input"]', 'New Feature');
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

## Test Naming Convention

```
should [expected behavior] when [condition]

Examples:
  should return user profile when valid JWT is provided
  should throw NotFoundException when user does not exist
  should hash password before saving to database
  should reject registration when email is already taken
  should return paginated results when page and limit are specified
```
