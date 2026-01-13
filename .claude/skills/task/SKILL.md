---
name: task-management
description: Generates and manages task lists from specs. Activates when user has a spec and mentions tasks, implementation, work, or asks "what's next?"
---

# Task Management

## Quick start

**Check for pending tasks** before starting new work:

```
/next
```

## Commands

- [/task <spec-id>](.claude/commands/task.md) - Generate tasks from a spec
- [/next](.claude/commands/next.md) - Pick and work on next task

## Workflow

1. Have an approved spec? Run `/task <spec-id>` to generate tasks
2. Ready to work? Run `/next` to pick highest priority unblocked task
3. Task done? Status updates automatically via `/next` workflow
4. Repeat `/next` until all tasks complete
