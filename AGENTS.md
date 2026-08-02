# AI Agent Workspace Rules

This repository runs a cooperative AI agent software factory configured in `.ai/`. All agents and AI coding assistants must adhere to the rules and conventions defined herein.

## Core Directives

1. **Tech Stack Single Source of Truth**: Refer to [.ai/settings.json](.ai/settings.json) for the active stack and directory layout.
2. **Coding Standards**:
   - Backend follows NestJS 11.x, TypeScript 5.x, MongoDB (Mongoose 8.x), and Redis 7.x. Follow [.ai/context/coding-rules.md](.ai/context/coding-rules.md).
   - Frontend follows Next.js 14.x, React 18.x, TypeScript 5.x, Tailwind CSS 3.x, and Shadcn UI. Follow [.ai/context/ui-guidelines.md](.ai/context/ui-guidelines.md).
3. **No RabbitMQ**: Standard background processing must use **BullMQ + Redis**.
4. **Architecture**: Clean modular monolith where each domain features its own controller, service, repository, and entity layers. Follow [.ai/context/architecture-rules.md](.ai/context/architecture-rules.md).
5. **Naming Conventions**: Use `kebab-case` for files and folders, and `PascalCase` for classes. Follow [.ai/context/naming-rules.md](.ai/context/naming-rules.md).

## Task Execution & Logging

- Report status changes in [.ai/project-management/agent-status.md](.ai/project-management/agent-status.md).
- Track phase progress in [.ai/project-management/current-phase.md](.ai/project-management/current-phase.md) and [.ai/project-management/progress.md](.ai/project-management/progress.md).
- Document architectural changes and decisions in [.ai/memory/decisions.md](.ai/memory/decisions.md).
- Log blockers in [.ai/memory/blockers.md](.ai/memory/blockers.md).
