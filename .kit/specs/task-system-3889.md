---
id: task-system-3889
name: Task System
status: approved
created: 2026-01-10
updated: 2026-01-11
---

# Task System

## Overview

The task system manages implementation work derived from approved specs.

**Architecture**: Agent Command vs CLI (separation of concerns)
- **Agent Command** (`/task`) - intelligence: analyzes spec, proposes tasks, writes task files, updates status, provides next recommendations
- **CLI** (`kit task`) - read-only: list tasks
- **Status** (`kit status`) - project overview

## Goals

- Generate tasks from approved specs via AI analysis
- Track task status: not_started, in_progress, blocked, done
- Smart task ordering considering priority, dependencies, and relationships
- Optional git commit linking via task ID references

## Non-Goals

- Real-time task syncing with external systems (Jira, Linear, etc.)
- Time tracking or estimation
- Multi-user task assignment

## User Stories

- As a developer, I want AI to generate tasks from my spec so I don't have to break it down manually
- As a developer, I want to approve generated tasks before they're created
- As a developer, I want to see the next unblocked task to work on
- As a developer, I want AI to suggest task dependencies based on spec content
- As a developer, I want to reference task IDs in commit messages

## Detailed Design

### Task Generation Flow

**Via `/task` Agent Command (primary flow):**
1. User runs `/task <spec-id>` in Claude Code
2. Agent reads the spec file directly
3. Agent analyzes spec content, proposes tasks with dependencies
4. User reviews and approves proposed tasks
5. Agent writes tasks directly to `.kit/tasks/<spec-id>.json`

**Key insight**: Task creation requires intelligence (understanding spec content, determining dependencies, proposing appropriate breakdown). This is agent work, not CLI work.

**Direct file access**: Users and agents read task files directly (`.kit/tasks/*.json`) - no `show` command needed.

### Task Statuses

| Status | Description |
|--------|-------------|
| not_started | Task created, not yet begun |
| in_progress | Currently being worked on |
| blocked | Waiting on dependencies |
| done | Task completed |

### Smart Ordering Algorithm

`/task next` (agent command) selects the next task by:
1. Filter to unblocked tasks (all dependencies done)
2. Sort by priority (lower number = higher priority)
3. Consider task relationships (prerequisite tasks first)
4. Tie-break by creation order (oldest first)

### Dependencies

- AI suggests dependencies based on spec content analysis
- User confirms/modifies during approval step
- Dependencies are stored as task ID references
- Circular dependencies are rejected

### Git Integration

- Task IDs can be referenced in commit messages: `[task-123]` or `closes task-123`
- Optional: `/task` agent command can auto-detect from recent commits to suggest closing tasks

### Data Format

Tasks stored as JSON in `.kit/tasks/<spec-id>.json`:

```json
{
  "spec_id": "feature-xxxx",
  "spec_path": ".kit/specs/feature-xxxx.md",
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "Details",
      "status": "not_started",
      "priority": 1,
      "depends_on": ["2", "3"]
    }
  ]
}
```

### Agent Command vs CLI

**Separation of concerns:**

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| Agent (`/task`) | Intelligence + Write | Analyze spec, propose tasks, determine dependencies, write files, update status, next recommendations |
| CLI (`kit task`) | Read-only | List tasks |

**Agent Command** (`/task` - Claude slash command):
- Reads spec file directly
- Analyzes content to understand implementation requirements
- Proposes tasks with appropriate granularity
- Suggests dependencies based on logical ordering
- Writes task JSON file after user approval
- Updates task status
- Provides `/task next` recommendations
- Can use `kit task list` for context

**CLI Commands** (`kit task` - shell):
- Read-only operations only
- `kit task list` - view all tasks
- Fast, scriptable, deterministic

## Commands

### CLI Commands (Read-Only)

| Command | Description |
|---------|-------------|
| `kit task list` | List tasks (all specs) |
| `kit status` | Overview of all specs, tasks, and logs |
| `kit init` | Set up `.kit/` directories |

The CLI is strictly read-only for tasks. It provides fast, scriptable access to view task information.

### Agent Command (`/task`)

| Action | Description |
|--------|-------------|
| Generate | Analyze spec and create tasks with dependencies |
| Update status | Change task status (not_started, in_progress, blocked, done) |
| Close | Mark task as done |
| `/task next` | Get recommendation for next unblocked task using smart ordering algorithm |

The `/task` command handles all intelligence and write operations: analyzing specs, proposing tasks, determining dependencies, writing task files, updating status, and closing tasks. The `/task next` subcommand provides intelligent task recommendations considering priority, dependencies, and relationships.

**Removed from CLI:**
- `create` - Task generation requires intelligence, use `/task` agent command
- `show` - Read files directly (`.kit/tasks/<spec-id>.json`)
- `next` - Moved to agent command `/task next` for intelligent recommendations
- `update` - Status updates handled by `/task` agent command
- `close` - Closing tasks handled by `/task` agent command

## Project Status

`kit status` provides project overview:
- Spec counts by status
- Task counts by status
- Recent activity

## References

- Spec system for upstream specs
- Log system for implementation notes
