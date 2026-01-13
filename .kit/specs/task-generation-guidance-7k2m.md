---
id: task-generation-guidance-7k2m
name: Task Generation Guidance
status: implemented
created: 2026-01-12
updated: 2026-01-12
---

# Task Generation Guidance

Improve the `/task` command with better guidance for generating well-scoped, atomic tasks.

## Overview

The current `/task` command lacks detailed guidance for how to break specs into well-scoped tasks. Add atomic task principles to guide the agent toward parallelizable, well-bounded tasks.

## Goals

- Add Task Design Principles section with atomic task patterns
- Improve Analyze step with verification checklist
- Enhance description field requirements
- Make dependency decisions visible

## Requirements

### 1. Task Design Principles Section

Add at top of command, before workflow:
- One task = one deliverable = one success state
- Atomic scope: <1 day, ≤3 files (soft guideline)
- Minimal dependencies: parallel by default

### 2. Enhanced Analyze Step

Add verification for each task:
- Clear success criterion
- Scope check (~4-6 hours)
- File count check (≤3 files)
- Dependency justification

### 3. Description Requirements

Task descriptions must include:
- What "done" looks like (success criteria)
- Key files to modify
- Scope estimate

### 4. Dependency Visibility

When proposing tasks, show:
- Which tasks can run in parallel
- Sequential chains (1→2→3)
