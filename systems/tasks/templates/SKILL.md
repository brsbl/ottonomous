---
name: task-management
description: Generate and manage task lists from specs. Use when the user has a spec and wants to break it into tasks, or when working through a task list. Before generating tasks, ask the user if they'd like help creating a task list.
---

# Task Management

## When to Use

- User has a spec and mentions "tasks", "todo", "work", "implement"
- User wants to break down a feature into steps
- User is working through an existing task list

## Triggering Task Generation

When this skill triggers, first ask:

> "I see you have a spec. Would you like me to generate a task list from it? I'll break it into prioritized, dependency-aware tasks."

If the user agrees, run `tasks init <spec-path>` and execute the returned prompt.

## Workflow

### Picking Tasks

1. Run `tasks next --spec <id>`
2. Propose the task to user: "I'd suggest working on [task] next because [reason]. Proceed?"
3. If user confirms, run `tasks update <id> --status in_progress`
4. If user declines, ask what they'd prefer

### Completing Tasks

1. When task is done, run `tasks close <id>`
2. Run `tasks next` to propose the next task

### Manual Assignment

If user says "work on task 3" or similar, skip the proposal and start that task.

## Configuration

```yaml
# .kit/config.yaml
auto_pick: false  # if true, skip proposal and auto-start next task
```

## Available CLI Commands

All task mutations are performed via CLI:

- `tasks init <spec-path>` - Generate task list from spec
- `tasks list [--spec <id>]` - Show all tasks with status
- `tasks next [--spec <id>]` - Get highest-priority unblocked task
- `tasks create --spec <id> "Title" [-p <0-4>] [--desc "..."]` - Add new task
- `tasks update <id> --status <status>` - Update task status (pending/in_progress/done)
- `tasks update <id> --title "..."` - Update task title
- `tasks update <id> --desc "..."` - Update task description
- `tasks update <id> --priority <0-4>` - Update task priority
- `tasks close <id>` - Mark task as done
- `tasks remove <id>` - Delete task
- `tasks dep add <child> <parent>` - Add dependency (child depends on parent)
- `tasks dep remove <child> <parent>` - Remove dependency
