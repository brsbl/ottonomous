---
name: task
description: Generates parallelizable task lists from specs. Breaks specs into atomic, prioritized tasks with dependencies. Activates when user has a spec and mentions tasks, implementation, breakdown, work plan, or what to do next.
argument-hint: list | <spec-id>
model: opus
---

# Task Generation

Generate implementation tasks from an approved spec.

**Argument:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/task list` | List all task files with spec, sessions, tasks, progress |
| `/task {spec-id}` | Generate tasks from approved spec |

---

## List Mode

If `$ARGUMENTS` is `list`:

1. List `.otto/tasks/*.json`
2. For each file, read and calculate:
   - spec_id
   - session count
   - task count
   - progress (done tasks / total tasks)
3. Display as table:
   ```
   | Spec ID | Sessions | Tasks | Progress |
   |---------|----------|-------|----------|
   | design-skill-a1b2 | 3 | 12 | 4/12 (33%) |
   ```
4. If no task files found: "No task files found. Run `/task {spec-id}` to generate."
5. Stop here — do not continue to task generation workflow.

---

## Generate Mode

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

**Assign task type:**
- `frontend` - UI components, styling, client-side state, React/Vue/etc., browser APIs
- `backend` - APIs, database, server logic, authentication, infrastructure

### 2b. Group into Sessions

Group related tasks into **sessions** — units of work that can be completed in one agent session.

**Grouping criteria:**
- **Component cohesion**: Tasks affecting the same module/directory
- **File overlap**: Tasks modifying shared files
- **Sequential dependencies**: Dependent tasks that naturally chain

**Session sizing:**
- Target: 2-5 tasks per session
- Maximum: 7 tasks
- Minimum: 1 task

**Session dependencies:**
- Session A depends on Session B if any task in A depends on any task in B
- Session priority = minimum priority of its tasks

### 3. Present for Confirmation

Show sessions with nested task tables:

```
Proposed sessions for {spec-name}:

## Session S1: {session-title} (P{priority})
| ID | Title | Type | Priority | Depends On |
|----|-------|------|----------|------------|
| 1 | Setup project | backend | P0 | - |
| 2 | Core types | backend | P0 | 1 |

## Session S2: {session-title} (P{priority}, depends on S1)
| ID | Title | Type | Priority | Depends On |
|----|-------|------|----------|------------|
| 3 | Core feature | frontend | P1 | 2 |
| 4 | Feature tests | frontend | P1 | 3 |
```

Note parallelism:
- "**Parallel sessions:** S{ids} can run concurrently"
- "**Sequential sessions:** S1 → S2 → S3"

Use `AskUserQuestion` to confirm or get changes.

### 4. Save

Write to `.otto/tasks/{spec-id}.json`:
```json
{
  "spec_id": "{spec-id}",
  "spec_path": ".otto/specs/{spec-id}.md",
  "sessions": [
    {
      "id": "S1",
      "title": "Session title",
      "status": "pending",
      "priority": 0,
      "depends_on": [],
      "task_ids": ["1", "2"]
    }
  ],
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "Success: [done condition]. Files: [paths]. Scope: [estimate]",
      "status": "pending",
      "priority": 1,
      "type": "frontend | backend",
      "depends_on": [],
      "session_id": "S1"
    }
  ]
}
```

Stage: `git add .otto/tasks/{spec-id}.json`

Confirm: "Created {n} tasks in {m} sessions for {spec-name}"

### 5. Next Steps

Offer to start:
> "Run `/next session` to see the first session, or `/next batch` to run all unblocked sessions in parallel."
