# Next Command

Pick and work on the next highest priority unblocked task.

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
- Offer to run `/next` again for next task
