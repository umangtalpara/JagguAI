# Debugging Skill

## Identity
- **Name**: Debugging & Troubleshooting
- **Domain**: Error analysis, root cause identification, and issue resolution

## Capabilities

### Error Analysis
- Parse and interpret error messages, stack traces, and log output.
- Identify the root cause vs. symptoms of a failure.
- Classify errors: syntax, runtime, logic, configuration, dependency.
- Trace errors through the full stack (frontend → API → service → database).

### Debugging Strategies

#### 1. Systematic Elimination
```
1. Reproduce the error reliably.
2. Identify the failing component (frontend, backend, database, config).
3. Isolate the smallest failing unit.
4. Check recent changes that could have introduced the bug.
5. Verify assumptions with console.log, debugger, or unit tests.
6. Fix the root cause, not just the symptom.
7. Add a regression test.
```

#### 2. Common Error Patterns

##### Backend Errors
| Error | Common Cause | Fix |
|-------|-------------|-----|
| `MODULE_NOT_FOUND` | Missing import or dependency | Check import path, run `npm install` |
| `ECONNREFUSED` | Database/Redis not running | Start Docker services |
| `QueryFailedError` | Invalid SQL, missing column, type mismatch | Check migration, entity definition |
| `UnauthorizedException` | Expired/invalid JWT | Check token expiry, secret key |
| `ValidationError` | Invalid DTO input | Check class-validator decorators |
| `CircularDependencyException` | Module A imports B imports A | Use `forwardRef()` or restructure |

##### Frontend Errors
| Error | Common Cause | Fix |
|-------|-------------|-----|
| `Hydration mismatch` | Server/client render difference | Check for browser-only code in SSR |
| `TypeError: undefined` | Missing data before load completes | Add null checks, loading states |
| `CORS error` | Backend CORS not configured | Add frontend origin to CORS whitelist |
| `Module not found` | Wrong import path or missing dep | Check path aliases, run `npm install` |
| `Too many re-renders` | State update in render cycle | Move state updates to useEffect/callbacks |

##### Database Errors
| Error | Common Cause | Fix |
|-------|-------------|-----|
| `relation does not exist` | Migration not run | Run `npm run migration:run` |
| `duplicate key value` | Unique constraint violation | Check for duplicates before insert |
| `connection refused` | Database not running | Start Docker, check connection string |
| `timeout exceeded` | Missing index, long query | Add index, optimize query |

#### 3. Logging Strategy
```typescript
// Structured logging with Winston
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

// Datadog Integration (Optional)
if (process.env.DD_LOGS_ENABLED === 'true') {
  transports.push(
    new winston.transports.Http({
      host: `http-intake.logs.${process.env.DD_SITE || 'datadoghq.com'}`,
      path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=${process.env.DD_SERVICE || 'smart-llm-backend'}&env=${process.env.DD_ENV || 'development'}&version=${process.env.DD_VERSION || '1.0.0'}`,
      ssl: true,
      format: winston.format.json(),
    })
  );
}

const logger = WinstonModule.createLogger({
  transports,
});

// Log levels
logger.error('Payment failed', { userId, orderId, error: err.message });
logger.warn('Rate limit approaching', { ip, requestCount });
logger.info('User registered', { userId, email });
logger.debug('Query executed', { query, duration, rowCount });
```

#### 4. Performance Debugging
```
1. Identify slow endpoints with request timing middleware.
2. Use EXPLAIN ANALYZE for slow database queries.
3. Check for N+1 query problems with query logging.
4. Profile memory usage for leak detection.
5. Monitor event loop lag for CPU-bound issues.
6. Check bundle size for frontend performance.
```

## Debugging Output Format

```yaml
debug_report:
  error: "QueryFailedError: relation 'users' does not exist"
  stack_trace: "..."
  root_cause: "Database migration for users table has not been run"
  affected_file: "codebase/backend/src/modules/users/users.repository.ts"
  fix_applied: "Ran migration: npm run migration:run"
  regression_test: "Added integration test verifying users table exists"
  prevention: "Added migration check to Docker Compose healthcheck"
```

## Debugging Rules

1. Always reproduce before fixing — understand the exact failure case.
2. Fix root causes, not symptoms — prevent recurrence.
3. Add regression tests for every bug fixed.
4. Document fixes in `.ai/memory/execution-log.md`.
5. Never use `try { } catch { }` to silently swallow errors.
6. Log with context — include relevant IDs, inputs, and state.
7. Check the simplest explanation first — typos, missing imports, wrong env vars.
