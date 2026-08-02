# PRD to Plan Workflow

## Identity
- **Name**: PRD to Plan
- **Trigger**: New PRD submitted or updated at `doc/prd.md`
- **Owner**: Super Agent → Deep Planning Agent

## Flow

```
┌─────────────────────────┐
│    1. PRD INGESTION      │
│    Super Agent reads     │
│    doc/prd.md            │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    2. PRD VALIDATION     │
│    Check completeness    │
│    against template      │
│    Flag missing sections │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [Complete]     [Incomplete]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Log blockers     │
     │     │ Request user     │
     │     │ input            │
     │     │ HALT until fixed │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  2.1 DISCOVERY Q&A      │
│  Super Agent generates  │
│  customized questions   │
│  based on PRD features  │
│  & waits for user       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    3. DEEP PLANNING      │
│    Invoke Deep Planning  │
│    Agent with PRD and    │
│    user Q&A responses    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    4. ARCHITECTURE       │
│    System architecture   │
│    Database design       │
│    API design            │
│    Folder structure      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    5. TASK BREAKDOWN     │
│    Decompose features    │
│    into atomic tasks     │
│    Assign to agents      │
│    Define dependencies   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    6. PHASED ROADMAP     │
│    Organize tasks into   │
│    sequential phases     │
│    Estimate timelines    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    7. PLAN VALIDATION    │
│    Super Agent reviews   │
│    All features covered  │
│    Dependencies valid    │
│    No circular deps      │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [Valid]         [Invalid]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Return to Deep   │
     │     │ Planning Agent   │
     │     │ with feedback    │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│    8. SAVE ARTIFACTS     │
│    Save roadmap.md       │
│    Save decisions.md     │
│    Set current-phase.md  │
│    Update project-status │
└─────────────────────────┘
```

## Input

- `doc/prd.md` — The Product Requirements Document.
- `.ai/templates/prd-template.md` — Template for validation.
- **User Discovery Responses** — Answers to database, caching, structure, git repository strategy, multi-tenancy, file storage, email, and logging questions.

## Output

- `.ai/project-management/roadmap.md` — Complete phased roadmap with all tasks.
- `.ai/project-management/current-phase.md` — Set to Phase 1.
- `.ai/project-management/project-status.md` — Updated to "Planning Complete".
- `.ai/memory/decisions.md` — Architecture and design decisions recorded (incorporating Q&A choices).

## Validation Rules

1. Every PRD feature maps to at least one task.
2. Every task has a unique ID, agent assignment, and acceptance criteria.
3. Task dependencies form a valid DAG (directed acyclic graph).
4. Database design matches user choice (SQL/NoSQL) and supports all identified query patterns.
5. Project layout matches user choice (Shared Monorepo vs Decoupled Independent folders) and Git repository configuration is mapped.
6. Cache strategy matches user choice (Redis cache vs Local Node cache).
7. All 11 Discovery Q&A questions (Repo Structure, Deploy Configs, Git Strategy, Database, Caching, Multi-Tenancy, Mailing, File Storage, Logging, Payments, and Real-Time) are compulsory and must be asked and answered by the user under all circumstances (with "Skip" options chosen explicitly by the user rather than auto-skipped). The agent MUST directly update the configurations in `.ai/settings.json` and `.ai/memory/state.json` based on the user's responses, rather than requesting manual file edits from the user.
8. Security and role settings match multi-tenant SaaS vs single client choices.
9. API design follows project conventions.
10. Phase ordering respects dependency chains.
11. Git repository SSH links are validated as active and authorized if Single/3-Repo strategy is selected, and root remote origin is correctly configured in the project.

## Error Handling

- **Incomplete PRD**: Log missing sections to `blockers.md`, halt, request user input.
- **Missing Q&A Responses**: Halt planning phase until user answers all required questions.
- **SSH Connection Failure**: If testing repository links fails via `verify-ssh.js` (and Git setup was not skipped), log connection issue, halt planning, and request working SSH repository links.
- **Invalid dependencies**: Return to Deep Planning Agent with specific feedback.
- **Missing security considerations**: Flag as blocker, require security plan before proceeding.

## Duration

- Expected: 5–15 minutes for a standard SaaS PRD planning.
- Maximum: 30 minutes before timeout and escalation.
