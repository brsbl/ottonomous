---
name: task
description: Generates parallelizable task lists from specs. Breaks specs into atomic, prioritized tasks with dependencies. Activates when user has a spec and mentions tasks, implementation, breakdown, work plan, or what to do next.
---

# Task Generation

Generate implementation tasks from an approved spec.

**Usage:** `/task <spec-id>`

## Task Design Principles

Each task should be an **atomic unit of work**:

- **One deliverable**: Clear output that indicates completion
- **Verifiable**: Specific "done" condition
- **Atomic scope**: Completable in one agent session
- **File limit**: Ideally ≤3 files modified (split larger tasks)
- **Minimal dependencies**: Only add `depends_on` when task truly cannot start without another

## Workflow

### 1. Read Spec

Read the spec from `.otto/specs/$ARGUMENTS.md`

If not found, list available specs:
```bash
ls .otto/specs/*.md 2>/dev/null
```

If spec status is not "approved", report: "Spec has status '{status}'. Only approved specs can generate tasks."

### 2. Analyze & Break Down

Break spec into discrete, implementable tasks following the design principles above.

**Assign priorities:**
- 0 = Critical (blocks other work)
- 1 = High (core functionality)
- 2 = Normal (default)
- 3 = Low (can defer)
- 4 = Nice to have

### 3. Present for Confirmation

Show task list as a table:

```
Proposed tasks for {spec-name}:

| ID | Title | Priority | Depends On | Description |
|----|-------|----------|------------|-------------|
| 1 | Setup project | P0 | - | Initialize project structure |
| 2 | Core feature | P1 | 1 | Implement main functionality |
```

Note parallelism:
- "**Parallel:** Tasks {ids} can run concurrently"
- "**Sequential:** {chain}" (e.g., "1 → 2 → 3")

Use `AskUserQuestion` to confirm or get changes.

### 4. Save

Write to `.otto/tasks/{spec-id}.json`:
```json
{
  "spec_id": "{spec-id}",
  "spec_path": ".otto/specs/{spec-id}.md",
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "Success: [done condition]. Files: [paths]. Scope: [estimate]",
      "status": "pending",
      "priority": 1,
      "depends_on": []
    }
  ]
}
```

Stage: `git add .otto/tasks/{spec-id}.json`

Confirm: "Created {n} tasks for {spec-name}"

### 5. Next Steps

Offer to start:
> "Run `/next` to begin working on the first task."
