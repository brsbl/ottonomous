---
id: unified-cli-q6wh
name: Unified CLI
status: approved
created: 2026-01-11
updated: 2026-01-11
---

# Unified CLI

## Overview

The unified CLI (`kit`) is a minimal, read-only entry point for the AI Developer Kit. It provides fast access to view project state while delegating all write operations and intelligent work to agent commands (`/spec`, `/task`, `/log`).

## Goals

- Minimal surface area - strictly read-only operations
- Fast, scriptable, no agent dependency
- Simple project setup and status overview
- List and search capabilities for all subsystems

## Non-Goals

- Write operations (handled by agent commands)
- Status updates (handled by agent commands)
- Task recommendations (handled by `/task next` agent command)
- Creation commands (handled by `/spec`, `/task`, `/log` agent commands)
- Show commands (read files directly)
- Interactive workflows (agent commands handle these)

## Detailed Design

### Architecture

The CLI is strictly read-only. All write operations flow through agent commands.

```
CLI (read-only)              Agent Commands (read-write)
─────────────────            ──────────────────────────
kit init                     /spec - create, edit, update status, remove
kit status                   /task - generate, update status, close, next
kit spec list                /log  - create, verify, update
kit task list
kit log list
kit log search
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `kit init` | Create `.kit/specs`, `.kit/tasks`, `.kit/logs` directories |
| `kit status` | Show project overview: specs by status, tasks by status, log entry counts |
| `kit spec list` | List all specs with status |
| `kit task list` | List all tasks |
| `kit log list` | List all log entries with staleness status (computed on read) |
| `kit log search <term>` | Search across all log entry content |
| `kit --help` | Usage information |
| `kit --version` | Version number |

### Agent Commands

All intelligent and write operations are handled by agent slash commands:

**`/spec`** - Spec management
- Create new specs via interview workflow
- Edit existing spec content
- Update spec status (draft, approved, implemented)
- Remove specs

**`/task`** - Task management
- Generate tasks from approved specs
- Update task status (not_started, in_progress, blocked, done)
- Close tasks (mark as done)
- `/task next` - Get intelligent recommendation for next unblocked task

**`/log`** - Log management
- Create entries anchored to source files
- Verify stale entries (mark as current)
- Update entry content or anchors
- Staleness is computed on file read, prompting agent to verify outdated entries

### Subsystem Routing

Routes `kit <system> <command>` to `systems/<system>/bin/<system> <command>`:

| Route | Delegates To | Env Var Set |
|-------|--------------|-------------|
| `kit spec ...` | `systems/spec/bin/spec` | `SPEC_DIR=.kit/specs` |
| `kit task ...` | `systems/tasks/bin/tasks` | `TASKS_DIR=.kit/tasks` |
| `kit log ...` | `systems/log/bin/log` | `LOG_DIR=.kit/logs` |

Uses `exec` for clean process handoff.

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `KIT_ROOT` | Parent of bin/kit | Locate project files |
| `SPEC_DIR` | `.kit/specs` | Spec file location |
| `TASKS_DIR` | `.kit/tasks` | Task file location |
| `LOG_DIR` | `.kit/logs` | Log file location |

## Commands Summary

### CLI (Read-Only)

| Command | Description |
|---------|-------------|
| `kit init` | Setup `.kit/` directories |
| `kit status` | Project overview |
| `kit spec list` | List specs |
| `kit task list` | List tasks |
| `kit log list` | List log entries (staleness computed on read) |
| `kit log search` | Search log content |

### Agent Commands (Read-Write)

| Command | Description |
|---------|-------------|
| `/spec` | Create, edit, update status, remove specs |
| `/task` | Generate tasks, update status, close tasks |
| `/task next` | Get intelligent next task recommendation |
| `/log` | Create entries, verify stale, update content |
