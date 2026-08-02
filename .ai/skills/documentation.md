# Documentation Skill

## Identity
- **Name**: Documentation
- **Domain**: Technical writing, API documentation, and project documentation

## Capabilities

### Code Documentation
- JSDoc comments on all public functions and classes.
- Inline comments explaining complex business logic ("why", not "what").
- Type documentation for all interfaces and type aliases.
- Module-level documentation describing purpose and dependencies.

### API Documentation
- Swagger/OpenAPI decorators on all controller methods.
- Request/response examples for every endpoint.
- Error response documentation with descriptions.
- Authentication requirements documented per endpoint.

### Project Documentation
- README with setup instructions, architecture overview, and contribution guide.
- Environment variable documentation with descriptions and examples.
- Database schema documentation with ER diagrams.
- Deployment documentation with step-by-step instructions.

## JSDoc Pattern

```typescript
/**
 * Registers a new user account.
 *
 * Creates the user with a hashed password and publishes a
 * USER_REGISTERED event for downstream processing (welcome email, etc.).
 *
 * @param dto - The registration data containing email, password, and name.
 * @returns The created user profile without the password hash.
 * @throws ConflictException - If a user with the same email already exists.
 * @throws InternalServerErrorException - If password hashing fails.
 *
 * @example
 * const user = await authService.register({
 *   email: 'user@example.com',
 *   password: 'StrongP@ss123',
 *   name: 'John Doe',
 * });
 */
async register(dto: RegisterDto): Promise<UserResponseDto> { ... }
```

## README Template

```markdown
# Project Name

Brief description of the project.

## Tech Stack

- **Backend**: Node.js, NestJS, TypeScript
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Databases**: MongoDB, Redis
- **Queue**: BullMQ (Redis-backed)
- **Containerization**: Docker

## Getting Started

### Prerequisites
- Node.js 24+
- Docker & Docker Compose
- Git

### Installation
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Run `docker compose up -d`
4. Access the application

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection | - |
| REDIS_URL | Redis connection | - |
| JWT_SECRET | JWT signing secret | - |

## Architecture

Brief architecture overview with diagram reference.

## API Documentation

Available at `http://localhost:3001/api/docs` (Swagger UI).

## Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # Integration tests
npm run test:cov      # Coverage report
```

## Deployment

See `doc/deployment.md` for deployment instructions.
```

## Documentation Rules

1. Every public function has a JSDoc comment.
2. Every API endpoint has Swagger decorators.
3. README is updated when setup steps change.
4. Environment variables are documented with descriptions.
5. Architecture decisions are recorded in ADR format.
6. Complex business logic has inline explanations.
7. Database schema changes are documented.
8. Breaking changes are highlighted in changelogs.
