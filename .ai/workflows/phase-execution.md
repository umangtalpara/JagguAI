# Phase Execution Workflow

## Identity
- **Name**: Phase Execution
- **Trigger**: Phase initialized by roadmap-to-phase workflow
- **Owner**: Super Agent (orchestrates all sub-agents)

## Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    PHASE EXECUTION LOOP                       │
│                                                               │
│  ┌─────────────────────────────┐                             │
│  │  STEP 1: BACKEND AGENT      │                             │
│  │  Execute all backend tasks   │                             │
│  │  for current phase           │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
│        ┌────────┴────────┐                                   │
│        │                 │                                    │
│        ▼                 ▼                                    │
│    [SUCCESS]         [FAILURE]                                │
│        │                 │                                    │
│        │                 ▼                                    │
│        │      ┌───────────────────┐                          │
│        │      │ RETRY PROTOCOL     │                          │
│        │      │ Retry ≤ 3 times    │                          │
│        │      │ Failed task only   │                          │
│        │      │ Preserve completed │                          │
│        │      └────────┬──────────┘                          │
│        │               │                                     │
│        │      ┌────────┴────────┐                            │
│        │      │                 │                             │
│        │      ▼                 ▼                             │
│        │  [RETRY OK]    [MAX RETRIES]                        │
│        │      │                 │                             │
│        │      │                 ▼                             │
│        │      │      ┌──────────────┐                        │
│        │      │      │ LOG BLOCKER   │                        │
│        │      │      │ HALT PHASE    │                        │
│        │      │      │ REQUEST INPUT │                        │
│        │      │      └──────────────┘                        │
│        │      │                                              │
│        ▼      ▼                                              │
│  ┌─────────────────────────────┐                             │
│  │  STEP 2: FRONTEND AGENT     │                             │
│  │  Execute all frontend tasks  │                             │
│  │  for current phase           │                             │
│  │  (same retry protocol)       │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────┐                             │
│  │  STEP 3: QA AGENT           │                             │
│  │  Run all test suites         │                             │
│  │  Unit + Integration + E2E   │                             │
│  │  (same retry protocol)       │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────┐                             │
│  │  STEP 4: CODE REVIEW AGENT  │                             │
│  │  Review all phase changes    │                             │
│  │  Security + Performance +   │                             │
│  │  Quality + Scalability      │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
│        ┌────────┴────────┐                                   │
│        │                 │                                    │
│        ▼                 ▼                                    │
│   [APPROVED]    [CHANGES REQUESTED]                          │
│        │                 │                                    │
│        │                 ▼                                    │
│        │      ┌───────────────────┐                          │
│        │      │ Send findings to   │                          │
│        │      │ responsible agent   │                          │
│        │      │ (backend/frontend) │                          │
│        │      │ Re-execute ONLY    │                          │
│        │      │ affected tasks     │                          │
│        │      │ Then re-review     │                          │
│        │      └───────────────────┘                          │
│        │                                                     │
│        ▼                                                     │
│  ┌─────────────────────────────┐                             │
│  │  STEP 5: VALIDATION         │                             │
│  │  All tests pass             │                             │
│  │  Code review approved       │                             │
│  │  Doc updated               │                             │
│  │  No blockers                │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────┐                             │
│  │  STEP 6: PHASE COMPLETE     │                             │
│  │  Update progress.md         │                             │
│  │  Update completed-tasks.md  │                             │
│  │  Update project-status.md   │                             │
│  │  Advance to next phase      │                             │
│  └─────────────────────────────┘                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Execution Order (Strict)

```
1. Backend Agent    → All backend tasks for phase
2. Frontend Agent   → All frontend tasks for phase (depends on backend APIs)
3. QA Agent         → All test suites (depends on backend + frontend)
4. Code Review Agent → Full code review (depends on all code + tests)
```

Agents execute sequentially — the next agent only starts after the previous one completes successfully.

## Retry Protocol

```yaml
retry_policy:
  max_retries: 3
  scope: "FAILED_TASK_ONLY"
  preserve: "ALL_SUCCESSFUL_TASKS"
  backoff:
    type: "exponential"
    delays: [5, 15, 45]  # seconds
  
  on_failure:
    1. Log failure details to retry-log.md
    2. Analyze failure reason
    3. Provide failure context to the agent
    4. Re-execute ONLY the failed task
    5. Validate result
  
  on_max_retries_exceeded:
    1. Log to blockers.md
    2. Halt phase execution
    3. Request human input
    4. Do NOT advance to next step
```

## Task State Machine

```
PENDING → IN_PROGRESS → COMPLETED
                      → FAILED → RETRYING → COMPLETED
                                           → FAILED (max retries) → BLOCKED
```

## Documentation Updates (Automatic)

After each task completion:
- Update `.ai/project-management/progress.md`
- Update `.ai/project-management/agent-status.md`
- Update `.ai/memory/completed-tasks.md`
- Update `.ai/memory/execution-log.md`

After each task failure:
- Update `.ai/memory/retry-log.md`
- Update `.ai/project-management/agent-status.md`
- Update `.ai/memory/execution-log.md`

After phase completion:
- Update `.ai/project-management/project-status.md`
- Update `.ai/project-management/current-phase.md`
- Update `.ai/project-management/progress.md`

## Validation Checklist (Before Phase Advancement)

- [ ] All backend tasks completed
- [ ] All frontend tasks completed
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code review approved (zero CRITICAL/HIGH findings)
- [ ] Swagger documentation complete
- [ ] No unresolved blockers
- [ ] All documentation updated
