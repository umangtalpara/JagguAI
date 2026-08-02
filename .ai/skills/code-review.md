# Code Review Skill

## Identity
- **Name**: Code Review
- **Domain**: Automated code quality assessment and improvement

## Capabilities

### Code Quality Assessment
- Evaluate code against established coding standards and conventions.
- Detect code smells: long methods, deep nesting, god classes, feature envy.
- Verify TypeScript strict mode compliance (no `any`, proper interfaces).
- Check for consistent error handling patterns.
- Validate import organization and module boundaries.

### Architecture Compliance
- Verify layered architecture (Controller → Service → Repository).
- Check for circular dependencies between modules.
- Ensure business logic is in services, not controllers.
- Validate dependency injection patterns.
- Confirm repository pattern usage for database access.

### Best Practice Enforcement
- DRY: Identify duplicated code for extraction.
- SOLID: Validate single responsibility, open/closed, and dependency inversion.
- Clean Code: Descriptive naming, small functions, clear intent.
- Documentation: JSDoc on public functions, inline comments for complex logic.

## Review Severity Levels

| Level | Label | Action Required |
|-------|-------|----------------|
| 🔴 | CRITICAL | Must fix — blocks approval |
| 🟠 | HIGH | Must fix — blocks approval |
| 🟡 | MEDIUM | Should fix — can approve with plan |
| 🟢 | LOW | Optional — noted for improvement |

## Review Checklist

### TypeScript
- [ ] No `any` types used
- [ ] All interfaces/types defined
- [ ] Strict mode enabled
- [ ] Proper error types used

### Architecture
- [ ] Single responsibility per class/function
- [ ] Dependency injection used correctly
- [ ] No circular dependencies
- [ ] Proper module boundaries

### Naming
- [ ] Files: kebab-case
- [ ] Classes: PascalCase
- [ ] Variables/functions: camelCase
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Descriptive, meaningful names

### Error Handling
- [ ] All errors caught and handled
- [ ] Consistent error response format
- [ ] No swallowed exceptions
- [ ] Meaningful error messages

### Testing
- [ ] Unit tests for all service methods
- [ ] Integration tests for all endpoints
- [ ] Edge cases covered
- [ ] ≥80% code coverage

## Review Output Format

```yaml
finding:
  id: "CR-XXX"
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  category: "security" | "performance" | "quality" | "architecture" | "documentation"
  file: "path/to/file.ts"
  line: 42
  title: "Short description"
  description: "Detailed explanation of the issue"
  current_code: "The problematic code"
  suggested_fix: "The corrected code"
```
