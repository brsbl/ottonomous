---
name: task-management
description: Generate and manage task lists from specs. Use when user has a spec and mentions tasks/work/implementation, wants to break features into steps, or asks "what's next?".
---

# Task Management

Break specs into actionable tasks and track progress.

## Prime Directive

**Ask before generating tasks.**

When triggered near a spec:

> "I see you have an approved spec. Would you like me to generate a task list from it?"

If the user agrees, run the `/task` command.

## Generate Tasks

The `/task` command will:
1. Analyze the spec content
2. Identify discrete, implementable tasks
3. Propose tasks with priorities and dependencies
4. Write to `.kit/tasks/<spec-id>.json` after approval

## Pick Next Task

```bash
kit task next [--spec <id>]
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

## CLI Reference (read/update operations)

```bash
kit task list [--spec <id>]           # List tasks
kit task next [--spec <id>]           # Get next unblocked task
kit task update <id> --status <s>     # Update status
kit task close <id>                   # Mark complete
```
