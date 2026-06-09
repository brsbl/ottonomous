---
name: next
description: Pick or implement the next task or session. Use when continuing work, picking the next task, or implementing tasks from a task list.
argument-hint: [task | session | batch]
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

**If no task files:** "No tasks found. Run `task <spec-name>` to generate."

**If multiple specs have pending work**, use an interactive prompt:
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

**If on `main` or `master`**, use an interactive prompt:
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

**Delegate to a subagent:**
- subagent role: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks), personas defined in `$SKILL_DIR/agents/`
- Include in prompt: task context + planning workflow (see below)
- Wait for subagent to complete

**Subagent prompt must include:**

```markdown
## Task Context
- **Task:** {task title}
- **Description:** {task description}
- **Files:** {file list}
- **Done when:** {done condition}
- **Spec path:** {spec_path from task file}

## Required Workflow

**Always plan before implementing.** Simple tasks get simple plans.

### Phase 1: Plan
1. Read the spec's Technical Design section at {spec_path}
2. Explore relevant files to understand existing patterns
3. Write your implementation plan to `.otto/plans/task-{task_id}.md`:
   - Describe your approach
   - List files to modify and key changes
   - Note any spec decisions that affect implementation

### Phase 2: Implement
4. Implement according to your plan
5. Verify the done condition is met

Keep the plan concise - it's for your reference and audit trail.
```

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

**Delegate to a subagent:**
- subagent role: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks), personas defined in `$SKILL_DIR/agents/`
- Include in prompt: session context + planning workflow (see below)
- Subagent implements tasks sequentially, marking each "done" as completed
- Wait for subagent to complete

**Subagent prompt must include:**

```markdown
## Session Context
- **Session:** {session title}
- **Tasks:** {task titles with descriptions}
- **Files:** {file lists from all tasks}
- **Done when:** {done conditions for each task}
- **Spec path:** {spec_path from task file}

## Required Workflow

**Always plan before implementing.** Simple tasks get simple plans.

### Phase 1: Plan
1. Read the spec's Technical Design section at {spec_path}
2. Explore relevant files to understand existing patterns
3. Write your implementation plan to `.otto/plans/{session_id}.md`:
   - List each task you will implement
   - For each task, describe: approach, files to modify, key changes
   - Note any spec decisions that affect implementation

### Phase 2: Implement
4. Implement each task according to your plan
5. After each task: verify the done condition is met
6. Mark each task "done" as completed

Keep the plan concise - it's for your reference and audit trail.
```

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

**Launch all sessions in parallel as background subagents** (one per session, each in an isolated/forked context):
- subagent role: `frontend-developer` (frontend tasks) or `backend-architect` (backend tasks), personas defined in `$SKILL_DIR/agents/`
- Include in prompt: session context + planning workflow (see below)
- Subagent implements tasks sequentially, marking each "done" as completed

Example (3 sessions → 3 background subagents launched together):
```
spawn subagent(role="frontend-developer", background=true, description="Implement S1", prompt="...")
spawn subagent(role="backend-architect", background=true, description="Implement S2", prompt="...")
spawn subagent(role="frontend-developer", background=true, description="Implement S3", prompt="...")
```

**Subagent prompt must include:**

```markdown
## Session Context
- **Session:** {session title}
- **Tasks:** {task titles with descriptions}
- **Files:** {file lists from all tasks}
- **Done when:** {done conditions for each task}
- **Spec path:** {spec_path from task file}

## Required Workflow

**Always plan before implementing.** Simple tasks get simple plans.

### Phase 1: Plan
1. Read the spec's Technical Design section at {spec_path}
2. Explore relevant files to understand existing patterns
3. Write your implementation plan to `.otto/plans/{session_id}.md`:
   - List each task you will implement
   - For each task, describe: approach, files to modify, key changes
   - Note any spec decisions that affect implementation

### Phase 2: Implement
4. Implement each task according to your plan
5. After each task: verify the done condition is met
6. Mark each task "done" as completed

Keep the plan concise - it's for your reference and audit trail.
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
- Suggest: "Run `next batch` again for next priority level."

