# Deployment Skill

## Identity
- **Name**: Deployment & DevOps
- **Domain**: Application deployment, CI/CD, and infrastructure

## Capabilities

### Docker Containerization
- Build multi-stage Docker images for backend and frontend.
- Configure Docker Compose for local development.
- Optimize image sizes with alpine base images.
- Implement health checks in Dockerfiles.

### CI/CD Pipeline (GitHub Actions)
- Automated testing on pull requests.
- Build and push Docker images on merge to main.
- Staged deployments (staging → production).
- Automated database migrations and schema checks.
- Rollback capabilities.

### Environment Management
- Separate configurations for development, staging, and production.
- Environment variable management with `.env` files for both backend and frontend.
- Backend environments configure using unified variables like `REDIS_URL` (avoid separate host/port/password variables).
- Frontend environment files use `NEXT_PUBLIC_` prefixed variables (specifically `NEXT_PUBLIC_API_URL` for the backend API URL prefix).
- Secrets management (never commit secrets to git).

### Monitoring & Logging
- Application metrics with Prometheus.
- Log aggregation with Winston + ELK stack / Datadog.
- Health check endpoints (`/health`, `/ready`).
- Error tracking and alerting.

## Docker Compose Template

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./codebase/backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/app
      - REDIS_URL=redis://redis:6379
      - DD_API_KEY=your_datadog_api_key_here
      - DD_SITE=us5.datadoghq.com
      - DD_SERVICE=smart-llm-backend
      - DD_ENV=development
      - DD_VERSION=1.0.0
      - DD_LOGS_ENABLED=true
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./codebase/backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./codebase/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
    depends_on:
      - backend
    volumes:
      - ./codebase/frontend:/app
      - /app/node_modules

  mongo:
    image: mongo:7-jammy
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data



volumes:
  mongo_data:
  redis_data:
```

## Dockerfile Template (Backend)

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
CMD ["node", "dist/main"]
```

## Deployment Checklist

- [ ] All tests pass in CI
- [ ] Docker images build successfully
- [ ] Environment variables configured for target environment
- [ ] Mongoose schema checks and migrations applied (if any)
- [ ] Health check endpoints responding
- [ ] Monitoring and logging configured
- [ ] SSL/TLS certificates valid
- [ ] CORS configured for production domains
- [ ] Rate limiting configured for production load
- [ ] Rollback procedure documented and tested
