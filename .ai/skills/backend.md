# Backend Development Skill

## Identity
- **Name**: Backend Development
- **Domain**: Server-side application development
- **Stack**: Node.js, NestJS, TypeScript, MongoDB, Redis

## Capabilities

### NestJS Application Development
- Scaffold NestJS modules, controllers, services, and schemas/repositories.
- Implement dependency injection with the NestJS IoC container.
- Configure middleware, guards, pipes, interceptors, and exception filters.
- Build modular monolith architecture with clear domain boundaries.

### API Development
- Design and implement RESTful APIs following OpenAPI 3.0 specification.
- Implement versioned endpoints (`/api/v1/*`).
- Add Swagger decorators for automatic documentation generation.
- Implement request validation with `class-validator` and `class-transformer`.
- Build response serialization with DTOs.

### Authentication & Authorization
- Implement JWT-based authentication with access/refresh token rotation.
- Build RBAC (Role-Based Access Control) with custom guards.
- Implement OAuth2 social login integrations.
- Build password hashing with bcrypt (12+ salt rounds).
- Implement rate limiting with `@nestjs/throttler`.

### Database Operations (MongoDB/Mongoose)
- Configure Mongoose for MongoDB with strict schema validation.
- Implement repository pattern for data access abstraction using Mongoose models.
- Build cursor-based pagination for large datasets using MongoDB queries.
- Write complex queries using aggregation pipelines.
- Use transactions and sessions for multi-document operations.

### Background Processing
- Configure BullMQ queues, workers, and processors.
- Implement job scheduling with `@nestjs/schedule`.
- Build event-driven communication between modules.
- Handle job retries, backoff, and failed job queueing.

### Caching & Session Storage (Redis)
- Configure Redis for session management and data caching.
- Implement cache invalidation strategies (write-through/cache-aside).
- Build rate limiting with Redis sliding window.
- Use Redis Streams for real-time features.
- Connect to Redis/BullMQ using the unified `REDIS_URL` environment variable.

## Patterns

### Module Pattern
```
Every feature is a self-contained NestJS module with:
  - Controller (HTTP layer)
  - Service (business logic)
  - Schema (Mongoose definitions)
  - DTOs (input validation + response serialization)
  - Constants (module-specific constants)
  - Module definition (wiring)
```

### Error Handling Pattern
```
- Use NestJS built-in HTTP exceptions (NotFoundException, ConflictException, etc.)
- Implement global exception filter for unhandled errors
- Return consistent error response format:
  { statusCode, message, error, timestamp, path }
- Log errors with context (module, method, user, request ID)
```

### Logging Pattern
```
- Configure structured logging with Winston.
- Implement optional Datadog integration: if `DD_LOGS_ENABLED=true` (or string `"true"`), add a Winston transport (e.g., HTTP transport) forwarding logs to Datadog.
- Ensure Datadog integration uses: `DD_API_KEY`, `DD_SITE` (e.g., `us5.datadoghq.com`), `DD_SERVICE` (e.g., `smart-llm-backend`), `DD_ENV`, and `DD_VERSION`.
```

### Security Pattern
```
- Validate all inputs at the controller level with class-validator
- Sanitize outputs through DTOs — never expose internal fields
- Use parameterized/escaped queries in MongoDB to prevent NoSQL injection
- Implement request size limits
- Use CORS with explicit origin whitelist
- Enable helmet for HTTP security headers
```

## Anti-Patterns (Never Do)

- Never put business logic in controllers — controllers delegate to services.
- Never use `any` type — always define proper TypeScript interfaces.
- Never enable Mongoose `autoIndex` in production configurations.
- Never hardcode secrets — use environment variables with `@nestjs/config`.
- Never log sensitive data (passwords, tokens, PII).
- Never use `*` for CORS origins in production.
- Never skip input validation on any endpoint.
- Never use separate `REDIS_HOST`, `REDIS_PORT`, or `REDIS_PASSWORD` variables — always connect via the unified `REDIS_URL` connection string.
