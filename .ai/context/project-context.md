# Project Context

## Overview

This workspace is an autonomous AI-driven software factory designed to transform Product Requirement Documents (PRDs) into fully working, tested, and reviewed SaaS applications. The AI Factory operates through a master Super Agent that orchestrates specialized sub-agents in a defined workflow pipeline.

## Organization

- **Organization**: ProvenPeak Solutions
- **Project Type**: SaaS Application Factory
- **Status**: Initialized — awaiting PRD

## How It Works

### 1. Input
Place a completed PRD at `doc/prd.md` following the template at `.ai/templates/prd-template.md`.

### 2. Planning
The Super Agent reads the PRD and invokes the Deep Planning Agent to produce:
- System architecture
- Database schema design
- API contract design
- Task breakdown with dependencies
- Phased roadmap

### 3. Execution
For each phase, agents execute in order:
1. **Backend Agent** — Implements server-side code (NestJS, TypeScript)
2. **Frontend Agent** — Builds client-side UI (Next.js, React, Tailwind)
3. **QA Agent** — Runs comprehensive test suites
4. **Code Review Agent** — Reviews code for security, performance, quality

### 4. Iteration
- Failed tasks are retried (max 3 times) without affecting completed work.
- Blockers are logged and escalated for human input.
- Progress is tracked in `project-management/` and `memory/`.

### 5. Output
A fully working, tested, and reviewed SaaS application with:
- Production-grade backend API with Swagger docs
- Responsive frontend with modern UI
- Comprehensive test suites (unit, integration, E2E)
- Docker containerization
- CI/CD pipeline configuration

## Directory Structure

```
.ai/
├── agents/             → Agent definitions and behavior rules
├── skills/             → Technical capability definitions
├── workflows/          → Execution pipeline definitions
├── context/            → Project rules and conventions (this directory)
├── memory/             → Runtime state and decision log
├── project-management/ → Progress tracking and status
├── templates/          → Document templates
└── settings.json       → Global configuration

doc/
└── prd.md              → Product Requirements Document

codebase/
├── backend/            → NestJS backend application
├── frontend/           → Next.js frontend application
└── shared/             → Shared types, constants, validators

tests/
├── unit/               → Unit tests
├── integration/        → Integration tests
├── e2e/                → End-to-end tests
└── api/                → API contract tests
```

## Key Principles

1. **Autonomy**: The factory operates autonomously once a PRD is provided.
2. **Resilience**: Failed tasks are retried; successful work is never lost.
3. **Transparency**: Every decision, action, and failure is documented.
4. **Quality**: Code review and comprehensive testing are mandatory gates.
5. **Consistency**: All code follows established conventions and patterns.
