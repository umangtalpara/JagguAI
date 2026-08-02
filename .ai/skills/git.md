# Git Skill

## Identity
- **Name**: Git & Version Control
- **Domain**: Source control, branching strategy, and collaboration

## Capabilities

### Branching Strategy (Git Flow Simplified)
```
main          ← Production-ready code (protected)
├── develop   ← Integration branch for next release
│   ├── feature/TASK-XXX-description  ← Feature branches
│   ├── fix/BUG-XXX-description       ← Bug fix branches
│   └── refactor/description          ← Refactoring branches
├── release/vX.Y.Z                    ← Release preparation
└── hotfix/BUG-XXX-description        ← Production hotfixes
```

### Branch Naming Convention
```
Pattern: {type}/{task-id}-{short-description}

Types:
  feature/  → New feature development
  fix/      → Bug fixes
  refactor/ → Code refactoring (no behavior change)
  docs/     → Documentation changes
  test/     → Test additions or fixes
  chore/    → Build, CI, dependency updates

Examples:
  feature/PHASE-01-TASK-001-user-registration
  fix/BUG-042-duplicate-email-error
  refactor/auth-module-cleanup
```

### Commit Message Convention (Conventional Commits)
```
Format: {type}({scope}): {description}

Types:
  feat:     New feature
  fix:      Bug fix
  refactor: Code refactoring
  docs:     Documentation
  test:     Test additions/fixes
  chore:    Build, CI, tooling
  perf:     Performance improvement
  style:    Formatting (no code change)

Scope: Module or feature name (optional)

Examples:
  feat(auth): implement JWT-based login with refresh tokens
  fix(users): resolve duplicate email 500 error
  refactor(common): extract pagination utility to shared module
  test(auth): add integration tests for registration endpoint
  docs(api): update Swagger documentation for user endpoints
  chore(docker): optimize backend Dockerfile with multi-stage build

Rules:
  1. Use imperative mood ("add" not "added")
  2. First line ≤ 72 characters
  3. Body explains "why" not "what"
  4. Reference task IDs: "Refs: PHASE-01-TASK-001"
```

### Pull Request Template
```markdown
## Description
Brief description of changes.

## Task Reference
- Task ID: PHASE-XX-TASK-XXX
- Phase: X

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Test

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Git Rules

1. Never commit directly to `main` or `develop`.
2. Always create feature branches from `develop`.
3. Squash merge feature branches into `develop`.
4. Write descriptive commit messages following Conventional Commits.
5. Keep commits atomic — one logical change per commit.
6. Never commit secrets, credentials, or `.env` files.
7. Always pull latest `develop` before creating a branch.
8. Resolve merge conflicts locally before pushing.
