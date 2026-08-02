# Architecture Rules

## System Architecture

### Pattern: Modular Monolith

The application follows a modular monolith architecture using NestJS modules. Each feature is a self-contained module with clear boundaries, enabling future microservice extraction without refactoring.

```
┌────────────────────────────────────────────────────┐
│                    API Gateway                      │
│              (Controllers + Guards)                 │
│ ├────────────────────────────────────────────────────┤
│ │                                                     │
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │  │  Auth     │  │  Users   │  │ Feature  │  ...    │
│ │  │  Module   │  │  Module  │  │  Module  │         │
│ │  └──────────┘  └──────────┘  └──────────┘         │
│ │                                                     │
│ ├────────────────────────────────────────────────────┤
│ │              Shared / Common Module                 │
│ │     (Guards, Pipes, Filters, Interceptors)          │
│ ├────────────────────────────────────────────────────┤
│ │                                                     │
│ │  ┌────────────────────────────────────┐            │
│ │  │        Database (Choose One)       │            │
│ │  │  MongoDB (Mongoose) / SQL (Prisma) │            │
│ │  └────────────────────────────────────┘            │
│ │                                                     │
│ │  ┌────────────────────────────────────┐            │
│ │  │          Cache (Choose One)        │            │
│ │  │        Redis Engine / Local RAM    │            │
│ │  └────────────────────────────────────┘            │
│ │                                                     │
│ └────────────────────────────────────────────────────┘
```

### Layered Architecture (Per Module)

```
Controller Layer   → HTTP request handling, input validation, response formatting
    ↓
Service Layer      → Business logic, orchestration, domain rules
    ↓
Repository Layer   → Data access (Mongoose queries or Prisma database client queries)
    ↓
Entity Layer       → Data models, database schema definitions (Mongoose schema or Prisma schema)
```

### Rules

1. **Controllers** handle HTTP concerns only — no business logic.
2. **Services** contain all business logic — injectable and testable.
3. **Repositories** abstract database access — services never query the database model or DB client directly.
4. **Entities** define data shapes — no methods, no logic.
5. **DTOs** validate inputs and serialize outputs — separate request/response DTOs.
6. **Guards** handle authentication and authorization — applied at controller level.
7. **Pipes** handle request transformation — applied at parameter level.
8. **Filters** handle exception formatting — applied globally.
9. **Interceptors** handle cross-cutting concerns — logging, caching, timing.

### Module Communication

#### Within the Same Process
- Services inject other services via NestJS DI container.
- Use interfaces for loose coupling.
- Avoid circular dependencies — use `forwardRef()` only as a last resort.

#### Across Modules (Decoupled)
- Background events use the configured queue system.
  - If **Redis** is used: BullMQ job queue.
  - If **Local Cache** is used: NestJS built-in `@nestjs/schedule` and event emitters.
- Event/Job naming: `module.entity.action` (e.g., `auth.user.registered`).
- Events are fire-and-forget — don't wait for processing.
- Consumers are idempotent — safe to process the same event twice.

### API Versioning

- All endpoints use `/api/v1/` prefix.
- Breaking changes require a new version (`/api/v2/`).
- Old versions are maintained until all clients migrate.
- Version is in the URL, not in headers.

### Configuration Management

```typescript
// Use @nestjs/config with validation
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
        PORT: Joi.number().default(3001),
        
        // MongoDB (if selected)
        MONGODB_URI: Joi.string().when('DB_ENGINE', { is: 'mongodb', then: Joi.required(), otherwise: Joi.optional() }),
        
        // SQL (if selected)
        DATABASE_URL: Joi.string().when('DB_ENGINE', { is: 'sql', then: Joi.required(), otherwise: Joi.optional() }),
        
        // Caching
        REDIS_URL: Joi.string().optional(), // Required only if Redis is selected. Never use REDIS_HOST/PORT/PASSWORD.
        
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

        // Datadog Integration (Optional/Conditional)
        DD_API_KEY: Joi.string().optional(),
        DD_SITE: Joi.string().optional(),
        DD_SERVICE: Joi.string().optional(),
        DD_ENV: Joi.string().optional(),
        DD_VERSION: Joi.string().optional(),
        DD_LOGS_ENABLED: Joi.boolean().default(false),
      }),
    }),
  ],
})
```

### Dependency Rules

1. **No circular dependencies** between modules.
2. **Common module** is imported by feature modules, never the reverse.
3. **Feature modules** do not directly import other feature modules' internals.
4. **Shared Types Layout**:
   * **Monorepo setup**: Shared types live in `codebase/shared/` and are imported by both backend and frontend.
   * **Decoupled setup**: Frontend and backend are completely independent. Duplicate types or auto-generated OpenAPI models are maintained separately in each codebase folder.
5. **Third-party libraries** are wrapped in internal services for abstraction.

### Forbidden Patterns

- ❌ Business logic in controllers
- ❌ Direct database queries or DB client actions in services (use repositories)
- ❌ `any` types anywhere in the codebase
- ❌ Mongoose auto-indexing or Prisma dynamic schema sync enabled in production (causes performance overhead)
- ❌ Hardcoded configuration values (use `.env`)
- ❌ Circular module dependencies
- ❌ God classes (>200 lines) or god functions (>30 lines)
- ❌ In-memory state that prevents horizontal scaling (if multi-instance scaling is selected)
