---
name: next
description: "Reads task list from .otto/tasks/, selects the highest-priority unblocked task or session, and launches a subagent to implement it. Supports single task, full session, or parallel batch modes. Use when continuing work, picking the next todo, resuming implementation, running the backlog, or asking what's next."
argument-hint: [task | session | batch]
model: opus
---

**Argument:** $ARGUMENTS

| Argument | Behavior |
|----------|----------|
| (none) or `task` | Select and implement next task (Section 2) |
| `session` | Select and implement next session (Section 3) |
| `batch` | Implement all highest-priority unblocked sessions (Section 4) |
| `task status` | Select and report next task without implementing (Section 2, stop before implementation) |
| `session status` | Select and report next session without implementing (Section 3, stop before implementation) |

**Always start with Section 1 (Find Tasks).**

---

## 1. Find Tasks

```bash
ls .otto/tasks/*.json 2>/dev/null
```

Read each file, check for pending sessions/tasks. For each task file, also read the corresponding spec file frontmatter to get the spec name.

**If no task files:** "No tasks found. Run `/task <spec-name>` to generate."

**If multiple specs have pending work**, use `AskUserQuestion`:
```
Multiple specs have pending work:
1. {spec-name} ({spec-id}): {n} sessions pending
2. {spec-name} ({spec-id}): {n} sessions pending

Which spec should I work on?
```

### Branch Check (Sections 2, 3, 4)

Before proceeding to any implementation section, check the current branch:

```bash
current_branch=$(git branch --show-current)
```

**If on `main` or `master`**, use `AskUserQuestion`:
```
You're on '{current_branch}'. Create a feature branch or continue here?

1. Create branch: otto/{spec-id} (recommended)
2. Stay on {current_branch}
```

If user picks 1, create the branch and continue. If 2, proceed as-is.

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

If invoked with `status` suffix, stop here — do NOT implement.

### Implement Task

1. Update task status to "in_progress"
2. Report: "Starting task {id}: {title}"

**Launch subagent using Task tool:**
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Include in prompt: task context + planning workflow (see below)
- Wait for subagent to complete

**Use the shared subagent prompt template** from the Subagent Prompt Template section below, with task-specific context:
- **Context type:** Task
- **Context variables:** task title, description, file list, done condition, spec_path
- **Plan path:** `.otto/plans/task-{task_id}.md`

**After subagent completes:**
- Update task status to "done"
- Check if all tasks in session are "done"; if so, mark session "done"
- Stage: `git add -u && git add .otto/`
- Commit: `git commit -m "otto: {spec-id} task {id} — {title}"`

Report: "Task {id} complete."

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

If invoked with `status` suffix, stop here — do NOT implement.

### Implement Session

1. Update session status to "in_progress"
2. Report: "Starting session {id}: {title} ({n} tasks)"

**Launch subagent using Task tool:**
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Use the shared subagent prompt template below with session-specific context
- Subagent implements tasks sequentially, marking each "done" as completed
- Wait for subagent to complete

**After subagent completes:**
- Update session status to "done"
- Stage: `git add -u && git add .otto/`
- Commit: `git commit -m "otto: {spec-id} session {id} — {title}"`

Report: "Session {id} complete. {n} tasks done."

---

## 4. Batch Mode

Select sessions to implement:

1. Filter to sessions with status "pending"
2. Filter to unblocked sessions (all `depends_on` sessions are "done")
3. Select only sessions at the **highest priority level** (lowest number)

**If no unblocked sessions:** Show same messages as Section 3.

**If only 1 session:** Continue to Section 3's "Implement Session" subsection with that session.

**If multiple sessions:** Launch parallel subagents.

Mark all sessions as "in_progress" before launching.

**Launch ALL sessions in a single message** with multiple Task tool calls (one per session), using `run_in_background: true`:
- `subagent_type`: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks)
- Use the shared subagent prompt template below with each session's context
- Subagent implements tasks sequentially, marking each "done" as completed

Example (3 sessions → 3 Task calls in one response):
```
Task(description="Implement S1", prompt="...", subagent_type="frontend-developer", run_in_background=true)
Task(description="Implement S2", prompt="...", subagent_type="backend-architect", run_in_background=true)
Task(description="Implement S3", prompt="...", subagent_type="frontend-developer", run_in_background=true)
```

**Report:**
```
Launching {n} priority-{p} sessions in parallel:
- Session {id1}: {title1} ({n} tasks)
- Session {id2}: {title2} ({n} tasks)
```

**Monitor and complete:**
- Wait for all subagents to finish
- Mark sessions as "done"
- Stage: `git add -u && git add .otto/`
- Commit: `git commit -m "otto: {spec-id} batch — {n} sessions at priority {p}"`
- Report: "Completed {n}/{total} sessions"
- Suggest: "Run `/next batch` again for next priority level."

---

## Subagent Prompt Template

All implementation subagents (task, session, and batch modes) use this shared template. Replace `{context_variables}` with the appropriate values for the mode.

```markdown
## Context
- **Title:** {title}
- **Tasks:** {task titles with descriptions (session/batch) or single task description (task mode)}
- **Files:** {file list(s)}
- **Done when:** {done condition(s)}
- **Spec path:** {spec_path from task file}

## Required Workflow

**Always plan before implementing.** Simple tasks get simple plans.

### Phase 1: Plan
1. Read the spec's Technical Design section at {spec_path}
2. Explore relevant files to understand existing patterns
3. Write your implementation plan to {plan_path}:
   - Describe your approach (task mode) or list each task with approach, files, key changes (session/batch mode)
   - Note any spec decisions that affect implementation

### Phase 2: Implement
4. Implement according to your plan
5. After each task: verify the done condition is met
6. Mark each task "done" as completed (session/batch mode)

Keep the plan concise - it's for your reference and audit trail.
```

