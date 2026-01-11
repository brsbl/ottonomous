# Task Command

Generate tasks from an approved spec through AI analysis.

## Workflow

### 1. Get Spec

If no spec ID provided, run `kit spec list` and use `AskUserQuestion` to ask which spec to generate tasks for.

Read the spec file from `.kit/specs/<spec-id>.md`.

### 2. Analyze

Analyze the spec to identify discrete, actionable tasks:
- Break down each section into implementable units
- Identify dependencies between tasks
- Assign priorities (0=critical, 1=high, 2=medium, 3=low, 4=nice-to-have)
- Consider implementation order

### 3. Propose Tasks

Present the proposed task list to the user:

```
Proposed tasks for <spec-name>:

1. [P1] Task title
   Depends on: none

2. [P2] Another task
   Depends on: 1

...
```

Use `AskUserQuestion` to confirm or request changes.

### 4. Save

Write tasks to `.kit/tasks/<spec-id>.json`:

```json
{
  "spec_id": "<spec-id>",
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "status": "pending",
      "priority": 1,
      "depends_on": []
    }
  ]
}
```

Report the result and suggest `kit task next` to find the first task to work on.

## CLI Reference

```
kit task list [--spec <id>]     List tasks
kit task next [--spec <id>]     Find next unblocked task
kit task update <id> --status   Update task status
kit task close <id>             Mark task done
```
