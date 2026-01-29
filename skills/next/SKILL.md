---
name: next
description: Pick or implement the next task or session. Selection modes return IDs; implementation modes launch subagents. Use to continue working through a task list.
argument-hint: [task|session|{id}|batch]
model: opus
---

**Argument:** $ARGUMENTS

| Argument | Behavior |
|----------|----------|
| (none) | Select and return next task id |
| `task` | Select and return next task id (explicit) |
| `session` | Select and return next session id |
| `{task-id}` | Launch subagent to implement the specified task |
| `{session-id}` | Launch subagent to implement all tasks in that session |
| `batch` | Launch subagents for highest priority unblocked sessions |

---

### 1. Find Tasks

```bash
ls .otto/tasks/*.json 2>/dev/null
```

Read each file, check for pending sessions/tasks.

**If multiple specs have pending work**, use `AskUserQuestion`:
```
Multiple specs have pending work:
1. {spec-id-1}: {n} sessions pending
2. {spec-id-2}: {n} sessions pending

Which spec should I work on?
```

---

### 2. Select Next Task

If `$ARGUMENTS` is empty or `task`, select the next task:

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
Session: {session_id}
```

Stop here — do NOT implement.

---

### 2a. Select Next Session

If `$ARGUMENTS` is `session`, select the next session:

1. Filter to sessions with status "pending"
2. Filter to unblocked sessions (all `depends_on` sessions are "done")
3. Sort by priority (lower number = higher priority)
4. Tie-break by ID (S1 before S2)

**If no unblocked sessions:**

| State | Message |
|-------|---------|
| All sessions "done" | "All sessions complete for {spec-name}!" |
| Pending but blocked | "{n} sessions blocked. Waiting on: {blocker-ids}" |
| No sessions in file | "No sessions found. Run `/task {spec-id}` to generate." |

**Report the selected session:**
```
Next session: {id}
Title: {title}
Priority: {priority}
Tasks: {task_count}
```

Stop here — do NOT implement.

---

### 2b. Batch Mode

If `$ARGUMENTS` is `batch`:

1. Filter to sessions with status "pending"
2. Filter to unblocked sessions (all `depends_on` sessions are "done")
3. Select only sessions at the **highest priority level** (lowest number)

**If no unblocked sessions:** Show same messages as session mode.

**If only 1 session:** Fall through to session implementation (Section 3b).

**Launch parallel subagents:**

For each session at the highest priority level, launch a subagent using the Task tool:
- Use `run_in_background: true` for concurrent execution
- Each subagent implements all tasks in its session following Section 3b logic
- Mark all sessions as "in_progress" before launching

**Report:**
```
Launching {n} priority-{p} sessions in parallel:
- Session {id1}: {title1} ({n} tasks)
- Session {id2}: {title2} ({n} tasks)
...
```

**Monitor and complete:**
- Wait for all subagents to finish
- Report results: "Completed {n}/{total} sessions"
- Suggest: "Run `/next batch` again for next priority level."

---

### 3. Implement Task

If `$ARGUMENTS` is a task id (numeric, not starting with "S"):

1. Read the task from tasks.json
2. Update task status to "in_progress"
3. Stage: `git add .otto/tasks/{spec-id}.json`
4. Report: "Starting task {id}: {title}"

**Launch subagent using Task tool:**
- Provide task title, description, and file hints
- Select subagent based on task type:
  - If task type is `frontend`: use `subagent_type: "frontend-developer"`
  - If task type is `backend`: use `subagent_type: "backend-architect"`
- Subagent implements the task as described
- Wait for subagent to complete

**After subagent completes:**
- Update task status to "done"
- Check if all tasks in session are "done"; if so, mark session "done"
- Stage: `git add -A`

Report: "Task {id} complete."

---

### 3b. Implement Session

If `$ARGUMENTS` is a session id (starts with "S"):

1. Read the session and its tasks from tasks.json
2. Update session status to "in_progress"
3. Stage: `git add .otto/tasks/{spec-id}.json`
4. Report: "Starting session {id}: {title} ({n} tasks)"

**Launch subagent using Task tool:**
- Provide session title and all task details
- For each task, select subagent based on task type:
  - If task type is `frontend`: use `subagent_type: "frontend-developer"`
  - If task type is `backend`: use `subagent_type: "backend-architect"`
- Subagent implements tasks sequentially, respecting internal `depends_on`
- For each task: mark "in_progress", implement, mark "done", stage
- Wait for subagent to complete

**After subagent completes:**
- Update session status to "done"
- Stage: `git add -A`

Report: "Session {id} complete. {n} tasks done."
