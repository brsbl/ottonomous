---
name: task-management
description: Generate and manage task lists from specs. Use when user has a spec and mentions tasks/work/implementation, wants to break features into steps, or asks "what's next?".
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Task Management

Break specs into actionable tasks and track progress.

## Prime Directive

**Ask before generating tasks.**

When triggered near a spec:

> "I see you have a spec. Would you like me to generate a task list from it?"

## Generate Tasks

If the user agrees:

```bash
kit task init <spec-path>
```

Or create individual tasks:

```bash
kit task create --spec <id> "Task title" -p 1
```

## Pick Next Task

```bash
kit task next --spec <id>
```

Propose to the user:

> "I'd suggest working on [task] next because [reason]. Proceed?"

If confirmed:

```bash
kit task update <id> --status in_progress
```

## Complete Tasks

When work is done:

```bash
kit task close <id>
```

Then suggest the next task.

## Task Priorities

| Priority | Meaning |
|----------|---------|
| 0 | Critical - do first |
| 1 | High |
| 2 | Normal (default) |
| 3 | Low |
| 4 | Nice to have |

## Task Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Currently working |
| `done` | Completed |

## Dependencies

Tasks can depend on other tasks:
- Blocked tasks have incomplete dependencies
- `kit task next` returns only unblocked tasks
- Circular dependencies are prevented

## CLI Reference

```bash
kit task init <spec-path>                    # Generate tasks from spec
kit task create --spec <id> "Title" [-p N]   # Create task
kit task list [--spec <id>] [--json]         # List tasks
kit task next [--spec <id>]                  # Get next unblocked task
kit task update <id> --status <status>       # Update status
kit task close <id> [--spec <id>]            # Mark complete
kit task remove <id> [--spec <id>]           # Remove task
kit task dep add <child> <parent>            # Add dependency
kit task dep remove <child> <parent>         # Remove dependency
```
