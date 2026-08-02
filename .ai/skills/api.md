# API Design Skill

## Identity
- **Name**: API Design & Development
- **Domain**: RESTful API design, documentation, and implementation
- **Standard**: OpenAPI 3.0

## Capabilities

### RESTful API Design
- Design resource-oriented endpoints following REST conventions.
- Implement consistent URL patterns with API versioning (`/api/v1/*`).
- Define request/response schemas with DTOs.
- Handle pagination, filtering, sorting, and search.
- Implement HATEOAS links where beneficial.

### OpenAPI Documentation
- Generate Swagger documentation from NestJS decorators.
- Document all endpoints with examples, descriptions, and error responses.
- Define reusable schemas for common response patterns.
- Provide Swagger UI for interactive API exploration.

## URL Convention

```
Pattern: /api/v{version}/{resource}

GET    /api/v1/users          → List users (paginated)
POST   /api/v1/users          → Create user
GET    /api/v1/users/:id      → Get user by ID
PATCH  /api/v1/users/:id      → Update user
DELETE /api/v1/users/:id      → Delete user (soft)

Nested resources:
GET    /api/v1/users/:id/orders     → List user's orders
POST   /api/v1/users/:id/orders     → Create order for user

Actions (non-CRUD):
POST   /api/v1/auth/login           → Login
POST   /api/v1/auth/refresh         → Refresh token
POST   /api/v1/orders/:id/cancel    → Cancel order
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH, or action |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Unauthorized (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable entity (business logic error) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Query Parameters

### Pagination
```
?page=1&limit=20
?cursor=eyJpZCI6IjEyMyJ9&limit=20  (cursor-based)
```

### Filtering
```
?status=active
?role=admin,user
?createdAt[gte]=2026-01-01&createdAt[lte]=2026-12-31
?price[gte]=10&price[lte]=100
```

### Sorting
```
?sort=createdAt:desc
?sort=name:asc,createdAt:desc
```

### Search
```
?search=keyword
?q=full+text+search
```

## Security Rules

- Authenticate with Bearer JWT tokens in Authorization header.
- Rate limit all public endpoints (configurable per-endpoint).
- Validate all inputs at the controller level — reject malformed requests early.
- Never expose internal errors in production — return generic 500 messages.
- Log all 4xx and 5xx responses with request context for debugging.
- Use CORS with explicit origin whitelist.
- Implement request ID tracking for distributed tracing.
