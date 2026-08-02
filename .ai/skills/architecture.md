# Architecture Skill

## Identity
- **Name**: Software Architecture
- **Domain**: System design and architectural decision-making

## Capabilities

### System Architecture Design
- Design modular monolith architecture with NestJS modules.
- Define clear domain boundaries for future microservice extraction.
- Implement layered architecture (Controller → Service → Repository → Database).
- Design event-driven communication patterns between modules.
- Plan horizontal scaling strategies.

### Design Patterns
- **Repository Pattern**: Abstract database access behind interfaces.
- **Strategy Pattern**: Pluggable algorithms for business logic variations.
- **Observer Pattern**: Event-driven module communication.
- **Factory Pattern**: Dynamic object creation based on configuration.
- **Decorator Pattern**: Cross-cutting concerns (logging, caching, auth).
- **CQRS**: Command Query Responsibility Segregation for complex domains.

### Architecture Decision Records (ADR)
```
Format:
  Title: ADR-XXX: [Decision Title]
  Status: Proposed | Accepted | Deprecated | Superseded
  Context: What is the technical problem?
  Decision: What is the chosen solution?
  Alternatives: What alternatives were considered?
  Consequences: What are the trade-offs?
  Date: YYYY-MM-DD
```

## Principles

1. **Separation of Concerns**: Each layer has a single responsibility.
2. **Dependency Inversion**: High-level modules depend on abstractions, not implementations.
3. **Open/Closed Principle**: Open for extension, closed for modification.
4. **Interface Segregation**: Clients should not depend on interfaces they don't use.
5. **Single Responsibility**: Every module, class, and function has one reason to change.
6. **Don't Repeat Yourself**: Extract shared logic into reusable modules.
7. **YAGNI**: Don't build features until they're needed.
8. **Convention over Configuration**: Follow established patterns consistently.

## Architecture Layers

```
┌─────────────────────────────────────┐
│          Presentation Layer          │  Controllers, Guards, Pipes
├─────────────────────────────────────┤
│          Application Layer           │  Services, Use Cases
├─────────────────────────────────────┤
│           Domain Layer               │  Entities, Value Objects, Events
├─────────────────────────────────────┤
│        Infrastructure Layer          │  Repositories, External Services
├─────────────────────────────────────┤
│           Data Layer                 │  Database, Cache, Queue
└─────────────────────────────────────┘
```

## Module Communication

### Synchronous (Within Same Process)
- Direct service injection via NestJS DI container.
- Use interfaces for loose coupling between modules.

### Asynchronous (Decoupled Communication)
- BullMQ (Redis-backed) for reliable background job processing and event queues.
- Event patterns: `module.entity.action` (e.g., `auth.user.registered`).
- Failed job queues and retries for error handling.
- Idempotent message processing.

## Scalability Checklist

- [ ] No in-memory application state — all state externalized to Redis or database.
- [ ] Stateless application instances — any instance can handle any request.
- [ ] Database connection pooling configured.
- [ ] Background jobs offloaded to message queues.
- [ ] File storage uses external object storage (S3-compatible).
- [ ] Caching strategy defined for hot data paths.
- [ ] Database indexes defined for all query patterns.
- [ ] Rate limiting protects against abuse.
