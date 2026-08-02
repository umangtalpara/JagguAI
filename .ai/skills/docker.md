# Docker Skill

## Identity
- **Name**: Docker & Containerization
- **Domain**: Container orchestration, image optimization, and local development

## Capabilities

### Image Building
- Multi-stage builds for minimal production images.
- Alpine-based images for smallest footprint.
- Layer caching optimization for faster builds.
- Non-root user execution for security.
- `.dockerignore` for build context optimization.

### Docker Compose
- Multi-service local development environments.
- Service health checks and dependency ordering.
- Named volumes for data persistence.
- Network isolation between services.
- Environment variable management.

### Best Practices

#### Image Optimization
```
1. Use multi-stage builds to separate build and runtime.
2. Use alpine variants for smallest base image.
3. Copy package.json first, install deps, then copy source (layer caching).
4. Use npm ci instead of npm install for reproducible builds.
5. Clean npm cache after install.
6. Use .dockerignore to exclude node_modules, .git, tests, docs.
```

#### Security
```
1. Run as non-root user (adduser in Dockerfile).
2. Don't store secrets in images — use environment variables.
3. Scan images for vulnerabilities (docker scout, trivy).
4. Pin base image versions — never use :latest in production.
5. Use read-only filesystem where possible.
```

#### Health Checks
```
1. Every service has a health check endpoint.
2. Docker HEALTHCHECK instruction in every Dockerfile.
3. Docker Compose healthcheck with interval, timeout, retries.
4. Dependent services wait for health checks before starting.
```

## .dockerignore Template
```
node_modules
npm-debug.log
.git
.gitignore
.env*
!.env.example
dist
coverage
.nyc_output
*.md
!README.md
tests
__tests__
.vscode
.idea
```

## Common Commands
```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f [service]

# Restart a service
docker compose restart [service]

# Run migrations / seeders
docker compose exec backend npm run db:migrate

# Access database
docker compose exec mongo mongosh -u user -p pass --authenticationDatabase admin

# Clean up
docker compose down -v --remove-orphans
```
