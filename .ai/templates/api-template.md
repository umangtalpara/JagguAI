# API Endpoint Template

## Endpoint Definition

```yaml
endpoint:
  method: "GET | POST | PATCH | PUT | DELETE"
  path: "/api/v1/{resource}"
  summary: "Brief description of what this endpoint does"
  description: |
    Detailed description of the endpoint's purpose,
    business logic, and any special behavior.
  tags: ["Tag Name"]
  version: "v1"
```

## Authentication

```yaml
authentication:
  required: true | false
  type: "Bearer JWT"
  roles: ["admin", "user"]  # Required roles (empty = any authenticated user)
```

## Rate Limiting

```yaml
rate_limit:
  requests: 100
  window: "1 minute"
  scope: "per_user | per_ip"
```

## Request

### Headers
```yaml
headers:
  Authorization: "Bearer {access_token}"  # If authenticated
  Content-Type: "application/json"        # For POST/PATCH/PUT
```

### Path Parameters
```yaml
path_params:
  id:
    type: "string"
    format: "uuid"
    description: "Resource unique identifier"
    required: true
```

### Query Parameters
```yaml
query_params:
  page:
    type: "integer"
    default: 1
    description: "Page number for pagination"
  limit:
    type: "integer"
    default: 20
    max: 100
    description: "Number of items per page"
  sort:
    type: "string"
    default: "createdAt:desc"
    description: "Sort field and direction"
  search:
    type: "string"
    description: "Full-text search query"
  filter[status]:
    type: "string"
    enum: ["active", "inactive", "archived"]
    description: "Filter by status"
```

### Request Body
```yaml
request_body:
  content_type: "application/json"
  schema:
    field_name:
      type: "string"
      required: true
      minLength: 2
      maxLength: 100
      description: "Field description"
      example: "Example value"
    email:
      type: "string"
      format: "email"
      required: true
      description: "User email address"
      example: "user@example.com"
    optional_field:
      type: "string"
      required: false
      default: "default_value"
      description: "Optional field with default"
```

## Responses

### Success (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "field": "value",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-01T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Success - Created (201)
```json
{
  "data": {
    "id": "uuid",
    "field": "value",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Success - Paginated (200)
```json
{
  "data": [
    { "id": "uuid", "field": "value" }
  ],
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

### Error - Validation (400)
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email", "name must be at least 2 characters"],
  "error": "Bad Request",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/resource"
}
```

### Error - Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Error - Forbidden (403)
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Error - Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Resource with ID {id} not found",
  "error": "Not Found",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Error - Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Error - Rate Limited (429)
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "error": "Too Many Requests",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## NestJS Implementation Reference

```typescript
@ApiTags('Resource')
@Controller('api/v1/resource')
@UseGuards(JwtAuthGuard)
export class ResourceController {
  @Get()
  @ApiOperation({ summary: 'List resources' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  async findAll(
    @Query() query: ListResourcesDto,
    @CurrentUser() user: UserEntity,
  ): Promise<PaginatedResponse<ResourceResponseDto>> {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create resource' })
  @ApiResponse({ status: 201, type: ResourceResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: UserEntity,
  ): Promise<ResourceResponseDto> {}

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ResourceResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ResourceResponseDto> {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource' })
  @ApiResponse({ status: 200, type: ResourceResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() user: UserEntity,
  ): Promise<ResourceResponseDto> {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete resource' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<void> {}
}
```
