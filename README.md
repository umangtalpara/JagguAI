# SaaS AI Factory

Welcome to the **SaaS AI Factory**! This repository is designed as an autonomous, multi-agent software development environment. It utilizes cooperative AI agents to process Product Requirements Documents (PRDs) and automatically generate, test, review, and prepare code for a complete SaaS application.

## Repository Structure

The repository is structured as follows:

```
saasAiAgentWorkFLow/
├── AGENTS.md            ← Shared spine containing core rules & directory references
├── CLAUDE.md            ← Claude Code adapter directing to AGENTS.md
├── GEMINI.md            ← Google Antigravity adapter directing to AGENTS.md
├── README.md            ← This human entry point
│
├── .ai/                 ← Canonical store of AI Agent rules and context
│   ├── settings.json    ← Global tech stack and directory configurations
│   ├── context/         ← Development, naming, architecture, and UI rules
│   ├── skills/          ← Technical capabilities for specific agent domains (.md)
│   ├── agents/          ← Base personas and instructions for each agent (.md)
│   ├── workflows/       ← Step-by-step agent workflow checklists (.md)
│   ├── templates/       ← PRD and Code Review templates (.md)
│   ├── memory/          ← Session log, blocker tracker, and decision log
│   └── project-management/ ← Progress tracker, roadmap, and phase status
│
├── .claude/             ← Claude Code configuration and skill/command stubs
├── .cursor/             ← Cursor rules (.mdc) and command shims
├── .agents/             ← Google Antigravity workspace rules and workflow shims
│
├── doc/                 ← Product Requirements Documents (doc/prd.md)
│
└── codebase/            ← Generated applications
    ├── backend/         ← NestJS 11 backend codebase (flexible database, caching, and scheduling setup)
    └── frontend/        ← Next.js 14 frontend codebase (Tailwind & Shadcn UI)
```

## How to Get Started

1. Check the **[How-To Guide](doc/how-to-use-ai.md)** for detailed instructions on utilizing the AI Factory workflow.
2. Complete your Product Requirements Document at **[doc/prd.md](doc/prd.md)**.
3. Use your preferred AI coder tool to initiate the development loop.

### 🚀 Running the Workflow Across Different AI Tools

Here is how to launch the pipeline and start code generation in each tool:

#### 1. Claude Code
Claude Code reads the root `CLAUDE.md` and dynamically imports capabilities from `.claude/skills/` as needed.
- **To Start**: Open your terminal in the repository root and run:
  ```bash
  claude
  ```
- **Execution**: Instruct Claude in the chat:
  > *I have completed the PRD at doc/prd.md. Please ingest it, start the deep planning phase, and execute the roadmap.*
- **Slash Commands**: Run slash workflows directly from the terminal (e.g. `/testing`, `/deployment`).

#### 2. Cursor
Cursor automatically loads conventions from `AGENTS.md` and `.cursor/rules/*.mdc` (including `core.mdc`).
- **To Start**: Open the repository folder in Cursor.
- **Execution**: Open Cursor Composer (`Ctrl+I` / `Cmd+I`) or Chat (`Ctrl+L` / `Cmd+L`) and instruct:
  > *I have completed the PRD at doc/prd.md. Please ingest it, run the deep planning phase, and generate the roadmap.*
  Rules will auto-attach based on the files in your session context.

#### 3. Google Antigravity
Google Antigravity automatically detects conventions from `AGENTS.md` and uses the rules, skills, and workflows under `.agents/`.
- **To Start**: Open the workspace in your IDE with the Google Antigravity extension enabled.
- **Execution**: Message the agent in the chat:
  > *I have completed my PRD. Please ingest doc/prd.md and start code generation.*
- **Workflows**: Trigger specific pre-defined workflows using commands like `/prd-to-plan` or `/testing`.

---

## ⚙️ Developer CLI Commands

* **Codebase Compliance Auditor**:
  ```bash
  node .ai/scripts/validate-project.js
  ```
  *(Audits naming styles, class lengths, direct Mongoose service calls, and type safety)*
* **Project Scaffolding Builder**:
  ```bash
  node .ai/scripts/scaffold-starter.js
  ```
  *(Scaffolds standard monorepos vs decoupled projects, DB ORMs, caching setups, and environment variables)*
* **Status Logs Synchronizer**:
  ```bash
  node .ai/scripts/status-manager.js sync
  ```
  *(Synchronizes JSON database state to markdown logs)*
* **Downstream Repositories Synchronizer**:
  ```bash
  node .ai/scripts/git-sync.js push-all
  ```
  *(Automates pushing and pulling codebase subdirectories to separate frontend/backend Git repositories via subtrees)*

---

## 🔧 Post-Development Maintenance

### 🐛 1. Fixing Bugs
1. Create a new bug file: **`doc/bugs/[bug-name].md`** (use template **`.ai/templates/bug-template.md`**).
2. Detail the issue, steps to reproduce, and logs.
3. Chat message to the agent:
   > *"I have created a bug report at doc/bugs/[bug-name].md. Please investigate, write a reproducing test, and patch the codebase."*

### 🚀 2. Adding Features
1. Create a new feature spec: **`doc/features/[feature-name].md`** (use template **`.ai/templates/feature-template.md`**).
2. Chat message to the agent:
   > *"I have added a new feature request at doc/features/[feature-name].md. Please analyze the impact on our current architecture, add it as a new phase, and implement it."*

