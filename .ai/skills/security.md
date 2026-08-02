# Security Skill

## Identity
- **Name**: Application Security
- **Domain**: Security auditing, threat modeling, and secure coding practices

## Capabilities

### Authentication Security
- JWT implementation with RS256 algorithm and key rotation.
- Access token short expiry (15 minutes), refresh token long expiry (7 days).
- Refresh token rotation — invalidate old refresh token on use.
- Account lockout after 5 failed login attempts (30-minute cooldown).
- Password policy enforcement (8+ chars, upper, lower, number, special).
- Secure password reset with time-limited, single-use tokens.

### Authorization Security
- RBAC (Role-Based Access Control) with NestJS guards.
- Resource-level authorization — verify user owns the resource.
- Principle of least privilege — minimum permissions by default.
- Admin actions require re-authentication.

### Input Security
- Validate all inputs with class-validator (backend) and Zod (frontend).
- Sanitize HTML inputs to prevent XSS (DOMPurify or sanitize-html).
- Parameterized queries only — never interpolate user input into queries.
- Request body size limits (1MB default, 10MB for file uploads).
- Content-Type validation on all endpoints.

### Data Security
- Encrypt sensitive data at rest (AES-256).
- Use TLS for all data in transit.
- Hash passwords with bcrypt (12+ salt rounds).
- Never log PII, passwords, tokens, or credit card numbers.
- Implement data retention policies with automated cleanup.
- GDPR compliance: data export and deletion capabilities.

### Infrastructure Security
- Helmet middleware for HTTP security headers.
- CORS with explicit origin whitelist.
- Rate limiting on all public endpoints.
- CSRF protection for state-changing operations.
- Docker containers run as non-root users.
- Environment variables for all secrets.
- `.env` files in `.gitignore`.

## OWASP Top 10 Checklist

- [ ] **A01: Broken Access Control** — RBAC + resource ownership validation
- [ ] **A02: Cryptographic Failures** — Strong encryption, no sensitive data exposure
- [ ] **A03: Injection** — Parameterized queries, input validation
- [ ] **A04: Insecure Design** — Threat modeling, security by design
- [ ] **A05: Security Misconfiguration** — Secure defaults, remove debug endpoints
- [ ] **A06: Vulnerable Components** — Regular dependency audits (`npm audit`)
- [ ] **A07: Auth Failures** — Strong passwords, MFA support, account lockout
- [ ] **A08: Data Integrity Failures** — Input validation, signed JWTs
- [ ] **A09: Logging Failures** — Comprehensive security event logging
- [ ] **A10: SSRF** — URL validation, allowlist for external requests

## Security Headers (Helmet Configuration)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.googleapis.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));
```

## Security Review Checklist

1. No hardcoded secrets in source code.
2. All user inputs validated and sanitized.
3. Parameterized queries used exclusively.
4. Authentication required on all non-public endpoints.
5. Authorization checks on every resource access.
6. Sensitive data excluded from API responses and logs.
7. Rate limiting active on authentication endpoints.
8. CORS configured with specific origins.
9. Security headers enabled via Helmet.
10. Dependencies audited for known vulnerabilities.
