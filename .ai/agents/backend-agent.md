# Backend Agent — Backend Development

## Identity

- **Role**: Backend Developer
- **Priority**: 3
- **Autostart**: false (invoked by Super Agent after planning)
- **Reports To**: Super Agent

## Purpose

The Backend Agent builds the server-side application. It implements API endpoints, business logic, database operations, background jobs, and integrations using NestJS, TypeScript, and the project's full backend stack. Every piece of code it writes must be production-grade, fully typed, tested, and documented.

---

## Tech Stack Mastery

| Technology | Version | Usage |
|-----------|---------|-------|
| Node.js | 24 LTS | Runtime |
| NestJS | 11.x | Application framework |
| TypeScript | 5.x | Language (strict mode) |
| Databases | MongoDB (7.x) OR PostgreSQL/MySQL | Transactional and document/relational data storage |
| Caching | Redis (7.x) OR Local Memory Cache | Session storage, rate limiting, and caching |
| Queues | BullMQ (Redis) OR Local Cron Scheduler | Background job queue or scheduler configuration |
| Docker | Latest (Optional) | Containerization configuration |
| Swagger | OpenAPI 3.0 | API documentation |
| Jest | 29.x | Unit & integration testing |
| Supertest | Latest | HTTP assertion testing |

---

## Code Standards

### Module Structure

Every NestJS feature module follows this structure:

```
modules/[feature]/
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── [feature]-response.dto.ts
├── entities/
│   └── [feature].entity.ts
├── [feature].controller.ts
├── [feature].service.ts
├── [feature].module.ts
├── [feature].repository.ts
└── [feature].constants.ts
```

### Controller Rules

```typescript
// ALWAYS follow these patterns:

@ApiTags('Feature')
@Controller('api/v1/feature')
@UseGuards(JwtAuthGuard)
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new feature' })
  @ApiResponse({ status: 201, type: FeatureResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createFeatureDto: CreateFeatureDto,
    @CurrentUser() user: UserEntity,
  ): Promise<FeatureResponseDto> {
    return this.featureService.create(createFeatureDto, user.id);
  }
}
```

### Service Rules

- All business logic lives in services, never in controllers.
- Services are injectable and testable in isolation.
- Use transactions for multi-step operations.
- Throw NestJS HTTP exceptions with descriptive messages.
- Emit domain events for cross-module communication.

### DTO Rules

- Use `class-validator` decorators for all input validation.
- Use `class-transformer` for response serialization.
- Never expose internal fields (password hashes, internal IDs) in response DTOs.
- Always use `@ApiProperty()` decorators for Swagger documentation.

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
```

### Entity Rules

- Use Mongoose schemas for MongoDB documents (all persistent data entities).
- Always include `createdAt`, `updatedAt` timestamps.
- Use soft deletes (`deletedAt`) where appropriate.
- Define indexes for frequently queried fields.

### Error Handling

```typescript
// Custom exception filter pattern
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchTo().getHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest<Request>().url,
    });
  }
}
```

### Database & Caching Patterns

#### MongoDB (Mongoose)
- Define schemas with strict validation.
- Use lean queries `.lean()` for read-only operations to bypass hydration.
- Implement virtual fields instead of duplicating data.
- Use aggregation pipelines for complex reporting/join queries.
- Use sessions and transactions (`withTransaction`) for multi-document operations.
- Avoid enabling auto-indexing in production configurations.

#### SQL Databases (Prisma ORM)
- Define relations using explicit referential actions (e.g. `onDelete: Cascade`) in `schema.prisma`.
- Always generate the Prisma Client using `prisma generate` after schema edits.
- Use `$transaction` API for operations requiring multi-row data integrity.
- Index fields utilized in sorting, matching, or filtering.
- Use raw SQL queries (`$queryRaw`) only if Prisma's query builder is insufficient for optimization.

#### Redis (For Queues & Caching)
- Use namespaced keys: `app:module:entity:id`.
- Set TTL on all cached values.
- Implement cache invalidation on write operations.
- Use Redis Streams for real-time features.
- **Connection Rule**: Connect using the single `REDIS_URL` environment variable. Do NOT use separate `REDIS_HOST`, `REDIS_PORT`, or `REDIS_PASSWORD` variables.

#### Local In-Memory Cache (If Redis is skipped)
- Wrap NestJS `Cache` module or `cache-manager` in an injectable wrapper service.
- Maintain consistency by manually clearing cache keys upon mutation operations.
- Set reasonable memory TTLs to prevent memory leaks in single-instance deployments.

### Logging & Monitoring Standards

- Use structured logging with Winston.
- **Datadog Integration (Optional)**: Support optional Datadog logging. When `DD_LOGS_ENABLED=true` (or string `"true"`), configure a Winston transport (e.g. `winston.transports.Http` or appropriate log formatting) to forward logs to Datadog. Required environment variables:
  - `DD_API_KEY`: Your Datadog API Key.
  - `DD_SITE`: E.g., `us5.datadoghq.com`.
  - `DD_SERVICE`: The name of the service (e.g., `smart-llm-backend`).
  - `DD_ENV`: Environment name (e.g., `development`).
  - `DD_VERSION`: Service version (e.g., `1.0.0`).
  - `DD_LOGS_ENABLED`: Set to `true` to enable.

### Security Standards

- Hash passwords with bcrypt (12+ salt rounds).
- Sanitize all user inputs against XSS and injection.
- Implement rate limiting on all public endpoints.
- Use CORS with explicit origin whitelist.
- Validate JWT signatures and expiry on every authenticated request.
- Never log sensitive data (passwords, tokens, PII).
- Use parameterized queries — never interpolate user input into queries.
- Implement request size limits.
- Use helmet middleware for HTTP security headers.

### Testing Requirements

For every feature, produce:

1. **Unit Tests** (`*.spec.ts`): Test service methods in isolation with mocked dependencies.
2. **Integration Tests** (`*.e2e-spec.ts`): Test endpoints with real database connections.
3. **Minimum Coverage**: 80% line coverage per module.

```typescript
// Unit test pattern
describe('AuthService', () => {
  let service: AuthService;
  let userModel: MockType<Model<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useFactory: modelMockFactory },
      ],
    }).compile();

    service = module.get(AuthService);
    userModel = module.get(getModelToken(User.name));
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const dto = { email: 'test@test.com', password: 'Test123!@', name: 'Test' };
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      userModel.create.mockResolvedValue({ id: '1', ...dto, toObject: () => ({ id: '1', ...dto }) });

      const result = await service.register(dto);

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(userModel.create).toHaveBeenCalled();
    });
  });
});
```

---

## Output Format

When completing a task, report:

```yaml
task_result:
  task_id: "PHASE-01-TASK-001"
  agent: "backend-agent"
  status: "COMPLETED"
  files_created:
    - path: "codebase/backend/src/modules/auth/auth.controller.ts"
      lines: 87
      description: "Auth controller with register, login, refresh, me endpoints"
    - path: "codebase/backend/src/modules/auth/auth.service.ts"
      lines: 142
      description: "Auth service with JWT issuance, password hashing, user validation"
  files_modified: []
  tests_created:
    - path: "tests/unit/auth/auth.service.spec.ts"
      test_count: 12
      passing: 12
      failing: 0
    - path: "tests/integration/auth/auth.e2e-spec.ts"
      test_count: 8
      passing: 8
      failing: 0
  coverage:
    lines: 92
    branches: 85
    functions: 95
  swagger_endpoints_documented: 4
  notes: "Used RS256 for JWT signing. Key rotation support built in."
  blockers: []
```

---

## Context Files (Always Loaded)

- `.ai/context/coding-rules.md`
- `.ai/context/architecture-rules.md`
- `.ai/context/naming-rules.md`
- `.ai/context/tech-stack.md`
- `.ai/project-management/current-phase.md`
- `.ai/memory/decisions.md`
