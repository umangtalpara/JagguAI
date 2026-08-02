# Naming Rules

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| TypeScript files | kebab-case | `user-profile.service.ts` |
| React components | kebab-case file, PascalCase export | `feature-card.tsx` → `FeatureCard` |
| Test files | `*.spec.ts` or `*.e2e-spec.ts` | `auth.service.spec.ts` |
| DTOs | `create-[entity].dto.ts` | `create-user.dto.ts` |
| Entities | `[entity].entity.ts` | `user.entity.ts` |
| Modules | `[feature].module.ts` | `auth.module.ts` |
| Controllers | `[feature].controller.ts` | `users.controller.ts` |
| Services | `[feature].service.ts` | `auth.service.ts` |
| Repositories | `[feature].repository.ts` | `users.repository.ts` |
| Guards | `[name].guard.ts` | `jwt-auth.guard.ts` |
| Pipes | `[name].pipe.ts` | `parse-uuid.pipe.ts` |
| Filters | `[name].filter.ts` | `all-exceptions.filter.ts` |
| Interceptors | `[name].interceptor.ts` | `logging.interceptor.ts` |
| Hooks | `use-[name].ts` | `use-auth.ts` |
| Stores | `[name].store.ts` | `auth.store.ts` |
| Services (FE) | `[name].service.ts` | `auth.service.ts` |
| Types | `[name].types.ts` | `api.types.ts` |
| Constants | `[name].constants.ts` | `auth.constants.ts` |
| Utils | `[name].util.ts` or `utils.ts` | `string.util.ts` |

## Code Naming

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `UserService`, `AuthController` |
| Interfaces | PascalCase (no `I` prefix) | `UserProfile`, `AuthTokens` |
| Type aliases | PascalCase | `PaginatedResponse<T>` |
| Enums | PascalCase | `UserRole`, `OrderStatus` |
| Enum values | UPPER_SNAKE_CASE | `UserRole.ADMIN` |
| Functions | camelCase | `createUser()`, `validateToken()` |
| Variables | camelCase | `accessToken`, `currentUser` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `JWT_SECRET` |
| Boolean variables | `is/has/can/should` prefix | `isActive`, `hasPermission` |
| Private members | No underscore prefix | `private readonly logger` |
| Event names | dot-separated lowercase | `auth.user.registered` |
| Environment vars | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

## Database Naming

| Type | Convention | Example |
|------|-----------|---------|
| Tables | snake_case, plural | `users`, `order_items` |
| Columns | snake_case | `first_name`, `created_at` |
| Primary keys | `id` | `id` (UUID) |
| Foreign keys | `[entity]_id` | `user_id`, `order_id` |
| Indexes | `idx_[table]_[columns]` | `idx_users_email` |
| Unique constraints | `uq_[table]_[columns]` | `uq_users_email` |
| Enum types | PascalCase | `user_role`, `order_status` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` | Standard |
| Boolean columns | `is_[adjective]` | `is_active`, `is_verified` |

## API Naming

| Type | Convention | Example |
|------|-----------|---------|
| URL paths | kebab-case, plural nouns | `/api/v1/user-profiles` |
| Query params | camelCase | `?sortBy=createdAt&pageSize=20` |
| Request body | camelCase | `{ "firstName": "John" }` |
| Response body | camelCase | `{ "createdAt": "2026-01-01" }` |
| Headers | PascalCase-Kebab | `Authorization`, `Content-Type` |

## Git Naming

| Type | Convention | Example |
|------|-----------|---------|
| Branches | `{type}/{task-id}-{description}` | `feature/PHASE-01-TASK-001-user-auth` |
| Commits | Conventional Commits | `feat(auth): implement JWT login` |
| Tags | Semantic Versioning | `v1.0.0`, `v1.2.3` |

## React Component Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfileCard` |
| Props interface | `{Component}Props` | `UserProfileCardProps` |
| Event handlers | `on{Event}` or `handle{Event}` | `onClick`, `handleSubmit` |
| Render functions | `render{Thing}` | `renderUserList` |
| Custom hooks | `use{Name}` | `useAuth`, `useDebounce` |
| Context | `{Name}Context` | `AuthContext`, `ThemeContext` |
| Provider | `{Name}Provider` | `AuthProvider`, `ThemeProvider` |

## Anti-Patterns

- ❌ Single-letter variables (except `i`, `j` in loops, `e` in events)
- ❌ Abbreviations that aren't universally understood
- ❌ Hungarian notation (`strName`, `boolIsActive`)
- ❌ `I` prefix on interfaces (`IUserService`)
- ❌ Underscore prefix for private members (`_userService`)
- ❌ Generic names (`data`, `info`, `temp`, `foo`, `bar`)
- ❌ Negative boolean names (`isNotActive` → use `isActive`)
