# Feature Addition Workflow (Incremental Features)

## Identity
- **Name**: Feature Addition Loop
- **Trigger**: New feature spec created under `doc/features/` or PRD updated
- **Owner**: Super Agent → Deep Planning Agent → Developer Agents

## Flow Diagram

```
┌─────────────────────────────────┐
│     1. INGEST FEATURE SPEC      │
│  Super Agent reads requirements,│
│  use cases, and DTO structures. │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│      2. IMPACT ANALYSIS         │
│  Deep Plan Agent reviews existing│
│  schema, DB relations, and APIs│
│  for breaking changes.          │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     3. ADD PHASE & TASKS        │
│  Register a new Phase in state  │
│  (e.g., PHASE-07) and generate  │
│  phased tasks with dependencies.│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     4. DATABASE MIGRATIONS      │
│  If SQL/Prisma: generate migrations│
│  If Mongo: prepare schema update.│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    5. STANDARD EXECUTION        │
│  Run Backend -> Frontend -> QA  │
│  -> Code Review pipeline.       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     6. VALIDATION & MERGE       │
│  Run validate-project.js, run   │
│  tests, and update status logs. │
└─────────────────────────────────┘
```

## How to Add a New Feature

### Step 1: Create a Feature Specification
Create a new file under `doc/features/[feature-name].md` or append to `doc/prd.md`:
```markdown
# Feature Specification: [Feature Name]

## 1. Description
[Describe the feature and user stories]

## 2. Requirements & Acceptance Criteria
- [ ] AC 1
- [ ] AC 2

## 3. Data Model & API changes
* Describe any new fields or endpoints needed.
```

### Step 2: Message the AI Agent
Prompt the agent in the chat:
> *"I have added a new feature request at doc/features/[feature-name].md. Please analyze the impact on our current architecture, add it as a new phase, and implement it."*

### Step 3: Automated Planning & Scaffolding
The AI agent will:
1. Load current schemas and workspace state.
2. Formulate an **Incremental Feature Plan** assessing:
   * **Database migrations** (e.g. `npx prisma migrate dev` if SQL is chosen).
   * **API versions** (maintaining `/api/v1/` compatibility or creating `/api/v2/`).
3. Add a new Phase (e.g., `PHASE-07: Advanced Analytics`) to `.ai/memory/state.json` via the CLI.
4. Auto-regenerate [roadmap.md](file:///d:/Umang/provenpeak/npm%20repo/saasAiAgentWorkFLow/.ai/project-management/roadmap.md) and [progress.md](file:///d:/Umang/provenpeak/npm%20repo/saasAiAgentWorkFLow/.ai/project-management/progress.md).
5. Hand off tasks to the Developer Agents to implement codebase changes.
6. Verify integration and E2E tests, audit via the Code Review Agent, and complete the phase.
