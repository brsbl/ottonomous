---
name: next
description: Pick or implement the next task or session. Use when continuing work, picking the next task, or implementing tasks from a task list.
argument-hint: [task | session | batch]
model: opus
---

**Argument:** $ARGUMENTS

| Argument | Behavior |
|----------|----------|
| (none) or `task` | Select and return next task id (Section 2) |
| `session` | Select and return next session id (Section 3) |
| `batch` | Implement all highest-priority unblocked sessions (Section 4) |
| `{task-id}` (numeric) | Implement the specified task (Section 5) |
| `{session-id}` (starts with "S") | Implement all tasks in the specified session (Section 6) |

**Always start with Section 1 (Find Tasks).**

---

## 1. Find Tasks

```bash
ls .otto/tasks/*.json 2>/dev/null
```

Read each file, check for pending sessions/tasks.

**If no task files:** "No tasks found. Run `/task {spec-id}` to generate."

**If multiple specs have pending work**, use `AskUserQuestion`:
```
Multiple specs have pending work:
1. {spec-id-1}: {n} sessions pending
2. {spec-id-2}: {n} sessions pending

Which spec should I work on?
```

---

## 2. Select Task

Select the next task:

1. Filter to tasks with status "pending"
2. Filter to unblocked tasks (all `depends_on` tasks are "done")
3. Sort by priority (lower number = higher priority)
4. Tie-break by ID (lower ID first)

**If no unblocked tasks:**

| State | Message |
|-------|---------|
| All tasks "done" | "All tasks complete for {spec-name}!" |
| Pending but blocked | "{n} tasks blocked. Waiting on: {blocker-ids}" |

**Report the selected task:**
```
Next task: {id}
Title: {title}
Priority: {priority}
Session: {session_id}
```

Stop here — do NOT implement.

---

## 3. Select Session

Select the next session:

1. Filter to sessions with status "pending"
2. Filter to unblocked sessions (all `depends_on` sessions are "done")
3. Sort by priority (lower number = higher priority)
4. Tie-break by ID (S1 before S2)

**If no unblocked sessions:**

| State | Message |
|-------|---------|
| All sessions "done" | "All sessions complete for {spec-name}!" |
| Pending but blocked | "{n} sessions blocked. Waiting on: {blocker-ids}" |

**Report the selected session:**
```
Next session: {id}
Title: {title}
Priority: {priority}
Tasks: {task_count}
```

Stop here — do NOT implement.

---

## 4. Batch Mode

Select sessions to implement:

1. Filter to sessions with status "pending"
2. Filter to unblocked sessions (all `depends_on` sessions are "done")
3. Select only sessions at the **highest priority level** (lowest number)

**If no unblocked sessions:** Show same messages as Section 3.

**If only 1 session:** Continue to Section 6 with that session.

**If multiple sessions:** Launch parallel subagents.

Mark all sessions as "in_progress" before launching.

For each session, launch a subagent using Task tool with `run_in_background: true`:
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Provide: session title, task titles, descriptions, files, done conditions
- Subagent implements tasks sequentially, marking each "done" as completed

**Report:**
```
Launching {n} priority-{p} sessions in parallel:
- Session {id1}: {title1} ({n} tasks)
- Session {id2}: {title2} ({n} tasks)
```

**Monitor and complete:**
- Wait for all subagents to finish
- Mark sessions as "done"
- Stage: `git add -A`
- Report: "Completed {n}/{total} sessions"
- Suggest: "Run `/next batch` again for next priority level."

---

## 5. Implement Task

1. Read the task from tasks.json
2. Update task status to "in_progress"
3. Stage: `git add .otto/tasks/{spec-id}.json`
4. Report: "Starting task {id}: {title}"

**Launch subagent using Task tool:**
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Provide: task title, description, files, done condition
- Wait for subagent to complete

**After subagent completes:**
- Update task status to "done"
- Check if all tasks in session are "done"; if so, mark session "done"
- Stage: `git add -A`

Report: "Task {id} complete."

---

## 6. Implement Session

1. Read the session and its tasks from tasks.json
2. Update session status to "in_progress"
3. Stage: `git add .otto/tasks/{spec-id}.json`
4. Report: "Starting session {id}: {title} ({n} tasks)"

**Launch subagent using Task tool:**
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Provide: session title, task titles, descriptions, files, done conditions
- Subagent implements tasks sequentially, marking each "done" as completed
- Wait for subagent to complete

**After subagent completes:**
- Update session status to "done"
- Stage: `git add -A`

Report: "Session {id} complete. {n} tasks done."
