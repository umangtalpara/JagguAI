const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

const statePath = path.join(__dirname, '../memory/state.json');

// Ensure parent folder exists
if (!fs.existsSync(path.dirname(statePath))) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
}

// Load current state or return fresh layout
function loadState() {
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (e) {
      log('Error parsing state.json. Starting fresh.', colors.red);
    }
  }
  return {
    project: {
      name: "SaaS AI Factory",
      status: "🟡 AWAITING_PRD",
      startedAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      totalPhases: 0,
      completedPhases: 0,
      activeBlockers: 0
    },
    phases: [], // { id, name, status, startedAt, completionEstimate, tasks: [] }
    timeline: [
      { event: "Project Initialized", date: new Date().toISOString().split('T')[0], notes: "AI Factory workspace created" }
    ]
  };
}

function saveState(state) {
  state.project.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  log('Successfully saved state.json', colors.green);
  syncMarkdowns(state);
}

// Main Markdown Sync Logic
function syncMarkdowns(state) {
  log('Syncing markdown files...', colors.bold + colors.blue);
  
  // Calculate stats
  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let failedTasks = 0;
  let blockedTasks = 0;
  let pendingTasks = 0;
  
  const agentStats = {
    'backend-agent': { assigned: 0, completed: 0, inProgress: 0, failed: 0, blocked: 0 },
    'frontend-agent': { assigned: 0, completed: 0, inProgress: 0, failed: 0, blocked: 0 },
    'qa-agent': { assigned: 0, completed: 0, inProgress: 0, failed: 0, blocked: 0 },
    'code-review-agent': { assigned: 0, completed: 0, inProgress: 0, failed: 0, blocked: 0 }
  };

  const completedList = [];

  state.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      totalTasks++;
      
      const agent = task.agent || 'backend-agent';
      if (!agentStats[agent]) {
        agentStats[agent] = { assigned: 0, completed: 0, inProgress: 0, failed: 0, blocked: 0 };
      }
      agentStats[agent].assigned++;

      if (task.status === 'COMPLETED') {
        completedTasks++;
        agentStats[agent].completed++;
        completedList.push(task);
      } else if (task.status === 'IN_PROGRESS' || task.status === 'RETRYING') {
        inProgressTasks++;
        agentStats[agent].inProgress++;
      } else if (task.status === 'FAILED') {
        failedTasks++;
        agentStats[agent].failed++;
      } else if (task.status === 'BLOCKED') {
        blockedTasks++;
        agentStats[agent].blocked++;
      } else {
        pendingTasks++;
      }
    });
  });

  // Update status totals
  state.project.completedPhases = state.phases.filter(p => p.status === 'COMPLETED').length;
  state.project.totalPhases = state.phases.length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressBars = '█'.repeat(Math.round(progressPercent / 5)) + '░'.repeat(20 - Math.round(progressPercent / 5));

  // 1. Write project-status.md
  let activePhaseName = 'N/A';
  const activePhase = state.phases.find(p => p.status === 'IN_PROGRESS');
  if (activePhase) activePhaseName = `${activePhase.id} — ${activePhase.name}`;

  const projStatusMd = `# Project Status

> This file is automatically synced by status-manager.js. Do not edit manually.

---

## Current Status

| Field | Value |
|-------|-------|
| **Project** | ${state.project.name} |
| **Status** | ${state.project.status} |
| **Current Phase** | ${activePhaseName} |
| **Total Phases** | ${state.project.totalPhases} |
| **Completed Phases** | ${state.project.completedPhases} |
| **Active Blockers** | ${state.project.activeBlockers} |
| **Started At** | ${state.project.startedAt} |
| **Last Updated** | ${state.project.lastUpdated} |

## Status Legend

| Status | Meaning |
|-------|---------|
| 🟡 AWAITING_PRD | System initialized, waiting for PRD at \`doc/prd.md\` |
| 🔵 PLANNING | Discovery Q&A and Architecture planning active |
| 🟢 IN_PROGRESS | Phase execution active |
| 🟠 BLOCKED | Phase halted due to unresolved blocker |
| 🔴 FAILED | Critical failure requiring human intervention |
| ✅ COMPLETED | All phases finished, ready for deployment |
| 🚀 DEPLOYED | Application deployed to production |

## Phase Summary

| Phase | Name | Status | Tasks | Completed | Failed | Blocked |
|-------|------|--------|-------|-----------|--------|---------|
${state.phases.map(p => {
  const pTasks = p.tasks.length;
  const pComp = p.tasks.filter(t => t.status === 'COMPLETED').length;
  const pFail = p.tasks.filter(t => t.status === 'FAILED').length;
  const pBlock = p.tasks.filter(t => t.status === 'BLOCKED').length;
  return `| ${p.id} | ${p.name} | ${p.status} | ${pTasks} | ${pComp} | ${pFail} | ${pBlock} |`;
}).join('\n') || '| — | No phases defined | — | — | — | — | — |'}

## Key Metrics

| Metric | Value |
|-------|-------|
| Total Tasks | ${totalTasks} |
| Tasks Completed | ${completedTasks} |
| Tasks In Progress | ${inProgressTasks} |
| Tasks Failed | ${failedTasks} |
| Tasks Blocked | ${blockedTasks} |

## Timeline

| Event | Date | Notes |
|-------|------|-------|
${state.timeline.map(t => `| ${t.event} | ${t.date} | ${t.notes} |`).join('\n')}

---

*Last updated: ${state.project.lastUpdated}*
`;
  fs.writeFileSync(path.join(__dirname, '../project-management/project-status.md'), projStatusMd);

  // 2. Write progress.md
  let progressMd = `# Progress Tracker

> This file is automatically synced by status-manager.js. Do not edit manually.

---

## Overall Progress

\`\`\`
Total:     [${progressBars}] ${progressPercent}%  (${completedTasks}/${totalTasks} tasks)
${state.phases.map(p => {
  const pT = p.tasks.length;
  const pC = p.tasks.filter(t => t.status === 'COMPLETED').length;
  const pPct = pT > 0 ? Math.round((pC / pT) * 100) : 0;
  return `${p.id}:   ${p.status} (${pPct}%)`;
}).join('\n')}
\`\`\`

## Progress by Agent

| Agent | Assigned | Completed | In Progress | Failed | Blocked |
|-------|----------|-----------|-------------|--------|---------|
${Object.entries(agentStats).map(([agent, stats]) => {
  return `| ${agent} | ${stats.assigned} | ${stats.completed} | ${stats.inProgress} | ${stats.failed} | ${stats.blocked} |`;
}).join('\n')}
| **Total** | **${totalTasks}** | **${completedTasks}** | **${inProgressTasks}** | **${failedTasks}** | **${blockedTasks}** |

## Task Status Legend

| Symbol | Status | Description |
|--------|--------|-------------|
| ⬜ | PENDING | Task not yet started |
| 🔄 | IN_PROGRESS | Agent is actively working on this task |
| ✅ | COMPLETED | Task completed and validated |
| ❌ | FAILED | Task failed (will be retried) |
| 🚫 | BLOCKED | Task blocked, escalated to blockers.md |

## Detailed Task Progress
`;

  state.phases.forEach(phase => {
    progressMd += `\n### ${phase.id}: ${phase.name}\n\n`;
    progressMd += `| # | Task ID | Title | Agent | Priority | Status | Retries |\n`;
    progressMd += `|---|---------|-------|-------|----------|--------|---------|\n`;
    phase.tasks.forEach((task, index) => {
      let sym = '⬜';
      if (task.status === 'COMPLETED') sym = '✅';
      else if (task.status === 'IN_PROGRESS' || task.status === 'RETRYING') sym = '🔄';
      else if (task.status === 'FAILED') sym = '❌';
      else if (task.status === 'BLOCKED') sym = '🚫';
      progressMd += `| ${index + 1} | ${task.id} | ${task.title} | ${task.agent} | ${task.priority} | ${sym} | ${task.retries || 0}/3 |\n`;
    });
  });

  fs.writeFileSync(path.join(__dirname, '../project-management/progress.md'), progressMd);

  // 3. Write current-phase.md
  let curPhaseMd = `# Current Phase

> This file is automatically synced by status-manager.js. Do not edit manually.

---
`;
  if (activePhase) {
    curPhaseMd += `
## Active Phase

| Field | Value |
|-------|-------|
| **Phase** | ${activePhase.id} |
| **Name** | ${activePhase.name} |
| **Status** | ${activePhase.status} |
| **Started At** | ${activePhase.startedAt || 'N/A'} |
| **Estimated Completion** | ${activePhase.completionEstimate || 'N/A'} |

---

## Phase Tasks

### Backend Tasks
| Task ID | Title | Agent | Priority | Status |
|---------|-------|-------|----------|--------|
${activePhase.tasks.filter(t => t.agent === 'backend-agent').map(t => `| ${t.id} | ${t.title} | ${t.agent} | ${t.priority} | ${t.status} |`).join('\n') || '| None |'}

### Frontend Tasks
| Task ID | Title | Agent | Priority | Status |
|---------|-------|-------|----------|--------|
${activePhase.tasks.filter(t => t.agent === 'frontend-agent').map(t => `| ${t.id} | ${t.title} | ${t.agent} | ${t.priority} | ${t.status} |`).join('\n') || '| None |'}

### QA & Review Tasks
| Task ID | Title | Agent | Priority | Status |
|---------|-------|-------|----------|--------|
${activePhase.tasks.filter(t => t.agent === 'qa-agent' || t.agent === 'code-review-agent').map(t => `| ${t.id} | ${t.title} | ${t.agent} | ${t.priority} | ${t.status} |`).join('\n') || '| None |'}
`;
  } else {
    curPhaseMd += `\n## No Active Phase\n\nProject Status: ${state.project.status}\n`;
  }
  fs.writeFileSync(path.join(__dirname, '../project-management/current-phase.md'), curPhaseMd);

  // 4. Write roadmap.md
  let roadmapMd = `# Roadmap

> This file is automatically synced by status-manager.js. Do not edit manually.

---
`;
  state.phases.forEach(phase => {
    roadmapMd += `\n### ${phase.id}: ${phase.name} (Status: ${phase.status})\n`;
    phase.tasks.forEach(t => {
      roadmapMd += `- **[${t.status}]** ${t.id}: ${t.title} (Agent: ${t.agent}, Priority: ${t.priority})\n`;
      if (t.acceptance_criteria) roadmapMd += `  * Criteria: ${t.acceptance_criteria}\n`;
    });
  });
  fs.writeFileSync(path.join(__dirname, '../project-management/roadmap.md'), roadmapMd);

  // 5. Write completed-tasks.md
  let compTasksMd = `# Completed Tasks

> This file is automatically synced by status-manager.js. Do not edit manually.

---

| Task ID | Title | Agent | Date Completed | Notes |
|---------|-------|-------|----------------|-------|
`;
  completedList.forEach(t => {
    compTasksMd += `| ${t.id} | ${t.title} | ${t.agent} | ${t.completedDate || 'N/A'} | ${t.notes || ''} |\n`;
  });
  fs.writeFileSync(path.join(__dirname, '../memory/completed-tasks.md'), compTasksMd);

  log('All markdown files synchronized successfully!', colors.green);
}

// CLI commands router
const command = process.argv[2];
const stateData = loadState();

if (command === 'sync') {
  syncMarkdowns(stateData);
} else if (command === 'init') {
  const name = process.argv[3] || "SaaS AI Factory";
  stateData.project.name = name;
  stateData.project.status = "🟡 AWAITING_PRD";
  saveState(stateData);
  log(`Initialized state database for ${name}`, colors.green);
} else if (command === 'add-phase') {
  const id = process.argv[3];
  const name = process.argv[4];
  if (!id || !name) {
    log('Usage: node status-manager.js add-phase <id> <name>', colors.red);
    process.exit(1);
  }
  stateData.phases.push({
    id,
    name,
    status: 'PENDING',
    tasks: []
  });
  saveState(stateData);
} else if (command === 'add-task') {
  const phaseId = process.argv[3];
  const taskId = process.argv[4];
  const title = process.argv[5];
  const agent = process.argv[6] || 'backend-agent';
  const priority = process.argv[7] || 'P0';
  
  if (!phaseId || !taskId || !title) {
    log('Usage: node status-manager.js add-task <phaseId> <taskId> <title> [agent] [priority]', colors.red);
    process.exit(1);
  }

  const phase = stateData.phases.find(p => p.id === phaseId);
  if (!phase) {
    log(`Phase ${phaseId} not found!`, colors.red);
    process.exit(1);
  }

  phase.tasks.push({
    id: taskId,
    title,
    agent,
    priority,
    status: 'PENDING',
    retries: 0
  });
  saveState(stateData);
} else if (command === 'update-task') {
  const taskId = process.argv[3];
  const field = process.argv[4]; // 'status', 'retries', 'notes'
  const value = process.argv[5];

  if (!taskId || !field || !value) {
    log('Usage: node status-manager.js update-task <taskId> <field> <value>', colors.red);
    process.exit(1);
  }

  let found = false;
  stateData.phases.forEach(phase => {
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      found = true;
      if (field === 'status') {
        task.status = value;
        if (value === 'COMPLETED') {
          task.completedDate = new Date().toISOString().split('T')[0];
        }
      } else if (field === 'retries') {
        task.retries = parseInt(value, 10);
      } else if (field === 'notes') {
        task.notes = value;
      } else {
        task[field] = value;
      }
    }
  });

  if (!found) {
    log(`Task ${taskId} not found!`, colors.red);
    process.exit(1);
  }
  saveState(stateData);
} else if (command === 'update-project') {
  const status = process.argv[3];
  if (!status) {
    log('Usage: node status-manager.js update-project <status>', colors.red);
    process.exit(1);
  }
  stateData.project.status = status;
  saveState(stateData);
} else {
  console.log(`
Usage: node status-manager.js <command> [options]

Commands:
  init <name>                           Initialize project state database
  add-phase <id> <name>                 Add a development phase
  add-task <phaseId> <taskId> <title>   Add a task to a phase
  update-task <taskId> <field> <value>  Update a task field (status, retries, notes)
  update-project <status>               Update project status (e.g. IN_PROGRESS)
  sync                                  Force sync JSON state database to Markdown logs
`);
}
