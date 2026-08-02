# Code Review Template

## Review Information

| Field | Value |
|-------|-------|
| **Reviewer** | Code Review Agent |
| **Phase** | PHASE-XX |
| **Date** | YYYY-MM-DD |
| **Files Reviewed** | X files |
| **Lines Reviewed** | X lines |

---

## Overall Assessment

| Category | Status | Issues |
|----------|--------|--------|
| Security | ✅ PASS / ❌ FAIL | X findings |
| Performance | ✅ PASS / ❌ FAIL | X findings |
| Code Quality | ✅ PASS / ❌ FAIL | X findings |
| Scalability | ✅ PASS / ❌ FAIL | X findings |
| Documentation | ✅ PASS / ❌ FAIL | X findings |
| **Overall** | **APPROVED / CHANGES_REQUESTED** | **X total** |

---

## Findings

### 🔴 CRITICAL

#### CR-XXX: [Title]
- **File**: `path/to/file.ts`
- **Line**: XX
- **Category**: security | performance | quality | architecture
- **Description**: [Detailed description of the issue]
- **Current Code**:
  ```typescript
  // The problematic code
  ```
- **Suggested Fix**:
  ```typescript
  // The corrected code
  ```
- **References**: [Link to best practice or documentation]

### 🟠 HIGH

#### CR-XXX: [Title]
[Same format as CRITICAL]

### 🟡 MEDIUM

#### CR-XXX: [Title]
[Same format as CRITICAL]

### 🟢 LOW

#### CR-XXX: [Title]
[Same format as CRITICAL]

---

## Checklist Results

### Security
- [ ] No hardcoded secrets
- [ ] Input validation on all endpoints
- [ ] Parameterized queries only
- [ ] Authentication on protected endpoints
- [ ] Authorization checks on resource access
- [ ] Sensitive data excluded from responses and logs
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers enabled

### Performance
- [ ] Database queries optimized with indexes
- [ ] No N+1 queries
- [ ] Pagination implemented for list endpoints
- [ ] Caching used for frequently accessed data
- [ ] No blocking operations in request handlers
- [ ] Bundle size optimized (frontend)

### Code Quality
- [ ] TypeScript strict mode compliance (no `any`)
- [ ] Single responsibility per class/function
- [ ] Dependency injection used correctly
- [ ] No circular dependencies
- [ ] Consistent error handling
- [ ] Dead code removed
- [ ] Constants used (no magic numbers/strings)

### Documentation
- [ ] Swagger decorators on all endpoints
- [ ] JSDoc on public functions
- [ ] Complex logic has inline comments
- [ ] README is current

### Testing
- [ ] Unit tests for all service methods
- [ ] Integration tests for all endpoints
- [ ] Edge cases covered
- [ ] ≥80% code coverage

---

## Approval Decision

**Status**: APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUESTED

### Conditions for Approval
1. [Condition 1 — e.g., Fix CR-001]
2. [Condition 2 — e.g., Fix CR-002]

### Notes
[Additional context, suggestions for future improvements, or acknowledged technical debt]

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| Total Files Reviewed | X |
| Total Lines Reviewed | X |
| Critical Issues | X |
| High Issues | X |
| Medium Issues | X |
| Low Issues | X |
| Test Coverage | X% |
| Swagger Coverage | X% |
