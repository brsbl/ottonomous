---
name: next
description: Pick or implement the next task. Without argument, returns the next task id. With task id, implements that task. Use to continue working through a task list.
argument-hint: [task-id]
---

**Argument:** $ARGUMENTS

| Argument | Behavior |
|----------|----------|
| (none) | Select and return next task id |
| `{task-id}` | Implement the specified task |

---

### 1. Find Tasks

```bash
ls .otto/tasks/*.json 2>/dev/null
```

Read each file, check for pending tasks.

**If multiple specs have pending tasks**, use `AskUserQuestion`:
```
Multiple specs have pending tasks:
1. {spec-id-1}: {n} pending
2. {spec-id-2}: {n} pending

Which spec should I work on?
```

---

### 2. Select Next Task

If `$ARGUMENTS` is empty, select the next task:

1. Filter to tasks with status "pending"
2. Filter to unblocked tasks (all `depends_on` tasks are "done")
3. Sort by priority (lower number = higher priority)
4. Tie-break by ID (lower ID first)

**If no unblocked tasks:**

| State | Message |
|-------|---------|
| All tasks "done" | "All tasks complete for {spec-name}!" |
| Pending but blocked | "{n} tasks blocked. Waiting on: {blocker-ids}" |
| No tasks in file | "No tasks found. Run `/task {spec-id}` to generate." |

**Report the selected task:**
```
Next task: {id}
Title: {title}
Priority: {priority}
```

Stop here if no argument was provided.

---

### 3. Implement Task

If `$ARGUMENTS` contains a task id, implement that task:

1. Read the task from tasks.json
2. Update task status to "in_progress"
3. Stage: `git add .otto/tasks/{spec-id}.json`
4. Tell user: "Starting task {id}: {title}"
5. Implement the task as described

### 4. Complete

When task is done:
- Update task status to "done" in JSON file
- Stage changes: `git add -A`

Report: "Task {id} complete."
