# Coding Rules

## Language: TypeScript (Strict Mode)

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Type Safety Rules

1. **Never use `any`** — always define proper types or interfaces.
2. **Prefer `interface` over `type`** for object shapes (extendable).
3. **Use `type` for unions, intersections, and computed types**.
4. **Use `enum` for fixed sets of related constants**.
5. **Use generics** for reusable type patterns.
6. **Use `readonly` for immutable data**.
7. **Use `unknown` instead of `any`** when the type is genuinely unknown.
8. **Use `as const` for literal type assertions**.

### Function Rules

1. **Single Responsibility**: Each function does one thing.
2. **Maximum 30 lines**: Extract sub-functions if longer.
3. **Maximum 4 parameters**: Use an options object for more.
4. **Explicit return types**: Always declare return types on public methods.
5. **No side effects in pure functions**: Separate pure logic from I/O.
6. **Use async/await**: Never use raw Promises with `.then()/.catch()`.
7. **Error first**: Handle error cases at the top of functions (early return).

### Class Rules

1. **Single Responsibility**: Each class has one reason to change.
2. **Dependency Injection**: Receive dependencies through constructor, not direct imports.
3. **Private by default**: Only expose what's needed.
4. **No static methods** for business logic — use injectable services.
5. **Maximum 200 lines** per class file.

### Import Organization

```typescript
// 1. Node.js built-in modules
import { join } from 'path';

// 2. External libraries (npm packages)
import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose'; // If using MongoDB
import { PrismaService } from '@/database/prisma.service'; // If using SQL

// 3. Internal modules (absolute imports or local aliases)
import { User } from '@/modules/users/entities/user.entity';
import { AuthService } from '@/modules/auth/auth.service';

// 4. Relative imports (same module)
import { CreateUserDto } from './dto/create-user.dto';
import { USER_CONSTANTS } from './user.constants';
```

### Error Handling

```typescript
// DO: Use specific exception types
throw new NotFoundException(`User with ID ${id} not found`);
throw new ConflictException('Email already registered');
throw new UnauthorizedException('Invalid credentials');

// DO: Use try-catch with specific error handling for MongoDB
try {
  await this.userModel.create(dto);
} catch (error: any) {
  if (error.code === 11000) { // MongoDB duplicate key error
    throw new ConflictException('Resource already exists');
  }
  throw new InternalServerErrorException('Failed to save resource');
}

// DO: Use try-catch with specific error handling for SQL (Prisma)
try {
  await this.prisma.user.create({ data: dto });
} catch (error: any) {
  if (error.code === 'P2002') { // Prisma unique constraint violation
    throw new ConflictException('Resource already exists');
  }
  throw new InternalServerErrorException('Failed to save resource');
}

// DON'T: Swallow errors silently
try { ... } catch (e) { /* empty */ }

// DON'T: Use generic catch-all
try { ... } catch (e) { return null; }
```

### Constants

```typescript
// DO: Use enums for related constants
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

// DO: Use const objects for configuration
export const AUTH_CONSTANTS = {
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;

// DON'T: Use magic numbers or strings
if (user.role === 'admin') { ... }  // Bad
if (user.role === UserRole.ADMIN) { ... }  // Good
```

### Comments

```typescript
// DO: Explain "why", not "what"
// Using cursor-based pagination instead of offset because
// offset pagination degrades with large datasets (O(n) skip)
const users = await this.paginateWithCursor(cursor, limit);

// DON'T: State the obvious
// Get the user by ID
const user = await this.findById(id);
```

### Testing

1. Every service method has at least one unit test.
2. Every controller endpoint has at least one integration test.
3. Use descriptive test names: `should [expected behavior] when [condition]`.
4. Follow AAA pattern: Arrange, Act, Assert.
5. Mock external dependencies — never call real external services.
6. Use factories for test data — no hardcoded test objects.
7. Clean up test state in `afterEach`/`afterAll`.
