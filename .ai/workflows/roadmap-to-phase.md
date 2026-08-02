# Roadmap to Phase Workflow

## Identity
- **Name**: Roadmap to Phase
- **Trigger**: Planning complete, roadmap approved
- **Owner**: Super Agent

## Flow

```
┌─────────────────────────┐
│  1. LOAD ROADMAP         │
│  Read roadmap.md         │
│  Identify all phases     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. DETERMINE PHASE      │
│  Check current-phase.md  │
│  If new: start Phase 1   │
│  If resuming: continue   │
│  from last incomplete    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  3. EXTRACT TASKS        │
│  Get all tasks for the   │
│  current phase           │
│  Sort by dependency      │
│  order and priority      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  4. CHECK DEPENDENCIES   │
│  Verify all upstream     │
│  dependencies from       │
│  previous phases are     │
│  completed               │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
 [Ready]         [Blocked]
     │               │
     │               ▼
     │     ┌──────────────────┐
     │     │ Log blockers     │
     │     │ Identify missing │
     │     │ dependencies     │
     │     │ HALT             │
     │     └──────────────────┘
     │
     ▼
┌─────────────────────────┐
│  5. GROUP BY AGENT       │
│  Backend tasks → Queue   │
│  Frontend tasks → Queue  │
│  Testing tasks → Queue   │
│  Review tasks → Queue    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  6. SET PHASE ACTIVE     │
│  Update current-phase.md │
│  Update project-status   │
│  Update agent-status     │
│  Log phase start         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  7. TRIGGER EXECUTION    │
│  Hand off to             │
│  phase-execution.md      │
└─────────────────────────┘
```

## Phase Transition Rules

1. A phase is complete when ALL tasks are validated by the Super Agent.
2. The next phase can only start after the current phase is fully complete.
3. If a task fails 3 times, the phase is halted.
4. Completed tasks are NEVER rerun — even if the phase is restarted.
5. Progress within a phase is tracked in `progress.md`.

## State Recovery

If the system is restarted mid-phase:

1. Read `current-phase.md` to determine the active phase.
2. Read `progress.md` to determine completed tasks.
3. Read `agent-status.md` to determine agent states.
4. Read `completed-tasks.md` to confirm finished work.
5. Resume from the first incomplete task.

## Output

- `.ai/project-management/current-phase.md` — Updated with current phase details and task list.
- `.ai/project-management/agent-status.md` — All agents assigned their tasks.
- `.ai/memory/execution-log.md` — Phase start logged.
