# Testing Skill

## Identity
- **Name**: Testing & Quality Assurance
- **Domain**: Automated testing strategies
- **Tools**: Jest, Supertest, Playwright, Newman

## Capabilities

### Unit Testing (Jest)
- Test individual functions, services, and utilities in isolation.
- Mock dependencies using Jest mock functions and factories.
- Test edge cases, error conditions, and boundary values.
- Achieve ≥80% code coverage per module.

### Integration Testing (Supertest)
- Test API endpoints with real database connections.
- Validate request/response schemas against OpenAPI specs.
- Test authentication and authorization flows.
- Verify database state changes after API calls.

### E2E Testing (Playwright)
- Test complete user journeys through the browser.
- Validate responsive layouts across viewports.
- Test form submissions with validation.
- Verify navigation flows and route guards.

### API Testing (Newman/Postman)
- Validate all API endpoints against their contracts.
- Test error handling for invalid inputs.
- Verify rate limiting behavior.
- Test pagination with various parameters.

## Test File Naming

```
Unit:        *.spec.ts        (co-located with source)
Integration: *.e2e-spec.ts    (in tests/integration/)
E2E:         *.spec.ts        (in tests/e2e/)
API:         *.api-spec.ts    (in tests/api/)
```

## Test Structure (AAA Pattern)

```typescript
describe('FeatureService', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange: Set up test data and mocks
      const input = createTestInput();
      mockRepository.findOne.mockResolvedValue(expectedResult);

      // Act: Execute the method under test
      const result = await service.methodName(input);

      // Assert: Verify the expected outcome
      expect(result).toEqual(expectedResult);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: input.id } });
    });
  });
});
```

## Coverage Targets

| Type | Minimum | Target |
|------|---------|--------|
| Lines | 80% | 90% |
| Branches | 75% | 85% |
| Functions | 80% | 90% |
| Statements | 80% | 90% |

## Testing Rules

1. Every service method has at least one unit test.
2. Every API endpoint has at least one integration test.
3. Every critical user journey has an E2E test.
4. Tests are independent — no shared state between tests.
5. Tests clean up after themselves (database, files, cache).
6. Test descriptions read like specifications.
7. Mock external dependencies — never call real external services in tests.
8. Use factories for test data creation — no hardcoded test data.
