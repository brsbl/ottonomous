# Task Command

Generate implementation tasks from an approved spec.

**Usage:** `/task <spec-id>`

## Task Design Principles

Each task should be an **atomic unit of work**:

- **One deliverable**: What concrete output indicates completion?
- **One success state**: Clear, verifiable "done" condition
- **Atomic scope**: Completable in one session
  - Target: < 1 day of focused work
  - Guideline: ≤ 3 files modified (if more, consider splitting)
- **Minimal dependencies**: Only add `depends_on` when task truly cannot start without another completing
  - Default assumption: tasks run in parallel
  - Justify dependencies explicitly

## Workflow

### 1. Get Spec

Read the spec from `.kit/specs/$ARGUMENTS.md`

If spec not found, report error and list available specs.

If spec status is not "approved", report: "Spec '{spec-id}' has status '{status}'. Only approved specs can generate tasks."

### 2. Analyze

Break spec into discrete, implementable tasks.

**For each task, verify:**
- [ ] Clear success criterion (what's "done"?)
- [ ] Scope: completable in ~4-6 hours
- [ ] File scope: ≤ 3 files (if more, split the task)
- [ ] Dependencies justified (not arbitrary ordering)

**Assign priorities:**
- 0 = Critical (blocks other work)
- 1 = High (important, do soon)
- 2 = Normal (default)
- 3 = Low (can defer)
- 4 = Nice to have

### 3. Propose

Present task list as a table showing all fields:

```
Proposed tasks for {spec-name}:

| ID | Title | Priority | Depends On | Description |
|----|-------|----------|------------|-------------|
| 1 | Task title | P1 | none | Brief description of the task |
| 2 | Another task | P2 | 1 | Brief description of the task |
```

After the table, note parallelism:
- "**Parallelism:** Tasks {ids} have no dependencies and can run in parallel."
- "**Sequential:** {chain}" (e.g., "1→2→3")

Use `AskUserQuestion` to confirm or get changes.

### 4. Save

Write to `.kit/tasks/{spec-id}.json`:
```json
{
  "spec_id": "{spec-id}",
  "spec_path": ".kit/specs/{spec-id}.md",
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "Success: [what done looks like]. Touches: [files]. Scope: [estimate]",
      "status": "pending",
      "priority": 1,
      "depends_on": []
    }
  ]
}
```

Stage: `git add .kit/tasks/{spec-id}.json`

Confirm: "Created {n} tasks for {spec-name}"

### 5. Next Steps

Offer to start working:
> "Would you like me to start on the first task? Run `/next` to begin."

See [next command](.claude/commands/next.md).
