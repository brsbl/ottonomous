---
name: task
description: Generates parallelizable task lists from specs. Breaks specs into atomic, prioritized tasks with dependencies. Use when you have a spec and need tasks, implementation breakdown, or a work plan.
argument-hint: list | <spec-id>
model: opus
---

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

**Session sizing:** 2-5 tasks per session (minimum 1)

**Session dependencies:**
- Session A depends on Session B if any task in A depends on any task in B
- Session priority = minimum priority of its tasks

### 3. Save Draft

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

### 4. Review Task List

Launch `senior-code-reviewer` subagent with Task tool (forked context):
- Prompt includes: task list JSON, full spec content, review criteria below
- Subagent has no access to conversation - all context in prompt

**Review Criteria:**
- Atomicity: Tasks too large (should split)
- Ordering: Tasks in wrong order, should be resequenced
- Dependencies: Missing dependencies that will cause blocked work
- Circular dependencies: Will cause deadlock
- Completeness: Tasks missing from spec
- Verifiability: Missing "done when" conditions

**Finding format (P0 = critical, P1 = important, P2 = minor):**
```
### [P{0-2}] {title}
**Tasks:** {task IDs affected}
**Issue:** {what's wrong}
**Suggestion:** {split, merge, reorder, add dependency}
**Alternatives:** {if non-obvious, options}
```

Wait for review to complete.

### 5. Interview User on Findings

If no findings, skip to step 6.

For each finding (highest priority first):
1. Present the finding with its priority level
2. If suggestion is clear: `AskUserQuestion` with "Accept", "Reject", "Modify"
3. If alternatives exist: `AskUserQuestion` with the options
4. If accepted: Update the task list JSON file with the change
5. If rejected: Skip to next finding
6. If modify: Apply user's modified version to the JSON file

After processing all findings, continue to step 6.

### 6. Approval

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

**Use `AskUserQuestion`** with options:
- "Approve"
- "Request changes"

Revise until approved.

Report: "Created {n} tasks in {m} sessions for {spec-name}"

### 7. Next Steps

Offer to start:
> "Run `/next session` to see the first session, or `/next batch` to run all unblocked sessions in parallel."
