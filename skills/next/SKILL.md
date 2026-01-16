---
name: next
description: Pick and work on the next highest priority unblocked task. Invoke with /next.
---

# Next Task

Pick and work on the next highest priority unblocked task.

## Auto Mode

**Check for AUTO_MODE at the start of every workflow:**

```bash
AUTO_MODE=$(grep -q "auto_pick: true" .kit/config.yaml 2>/dev/null && echo "true" || echo "false")
MAX_BLOCKERS=$(grep "max_blockers:" .kit/config.yaml 2>/dev/null | awk '{print $2}' || echo "3")
```

**When `AUTO_MODE=true`:**
- Skip `AskUserQuestion` when multiple specs have pending tasks
- Auto-select spec with highest priority pending task (tie-break by task count)
- Log: `[AUTO] Selected spec {id} with {n} pending tasks`

## Workflow

### 1. Find Tasks

- Glob `.kit/tasks/*.json` to find task files
- Read each file, check for pending tasks
- If multiple specs have pending tasks, use `AskUserQuestion`:

```
Multiple specs have pending tasks:

1. {spec-id-1}: {n} pending ({next-task-title})
2. {spec-id-2}: {n} pending ({next-task-title})

Which spec should I work on?
```

- Read the selected task file

### 2. Select Next Task

Apply the "next task" algorithm:
1. Filter to tasks with status "pending"
2. Filter to unblocked tasks (all depends_on are "done")
3. Sort by priority (lower number = higher priority)
4. Tie-break by ID (lower ID first)

**If no unblocked tasks:**

| State | Message |
|-------|---------|
| All tasks "done" | "All tasks complete for {spec-name}!" |
| Pending but blocked | "{n} tasks blocked. Waiting on: {blocker-ids}" |
| No tasks in file | "No tasks found. Run `/task {spec-id}` to generate." |

### 3. Start Work

- Update task status to "in_progress" in JSON file
- Stage: `git add .kit/tasks/{spec-id}.json`
- Tell user: "Starting task {id}: {title}"
- Begin implementing the task

### 4. Complete

When task is done:
- Update task status to "done" in JSON file
- Stage changes

**Next Steps:**
> "Task complete! Next options:
> - `/code-review` - Review changes for bugs before continuing
> - `/next` - Pick up the next task
> - `/semantic-review` - Generate change documentation (if ready for PR)"

### 5. Handle Blockers (AUTO_MODE)

When task execution fails in AUTO_MODE:

1. **Increment blocker_count** in the task JSON:
   ```json
   {
     "blocker_count": 1
   }
   ```

2. **Check against MAX_BLOCKERS:**
   - If `blocker_count < MAX_BLOCKERS`: Retry the task
   - If `blocker_count >= MAX_BLOCKERS`: Skip the task

3. **On skip, update task:**
   ```json
   {
     "skipped": true,
     "skip_reason": "Exceeded max blocker attempts: {error_message}"
   }
   ```

4. **Log the outcome:**
   - Retry: `[BLOCKER] Task {id} failed ({blocker_count}/{MAX_BLOCKERS}): {error}. Retrying...`
   - Skip: `[SKIPPED] Task {id} skipped after {MAX_BLOCKERS} failures: {error}`

5. **Return to task selection** to pick the next unblocked task.

**Blocker categories:**
| Type | Examples | Response |
|------|----------|----------|
| `build` | TypeScript error, missing import | Attempt fix once, then skip |
| `test` | Unit test fails | Log, continue |
| `dependency` | Missing package | Try install, skip if fails |
| `external` | API timeout, rate limit | Retry 2x, then skip |
