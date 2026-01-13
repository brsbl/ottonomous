---
id: task-system-refactor-x81a
name: Task System Refactor
status: implemented
created: 2026-01-12
updated: 2026-01-12
---

# Task System Refactor

Target state for the task system after removing the CLI layer.

## Overview

The task system breaks approved specs into prioritized, dependency-aware work items. This spec defines the target state after removing the CLI - a pure skills + commands architecture.

**Two commands:**
- `/task <spec-id>` at `.claude/commands/task.md` - Generate tasks from a spec (one-time creation)
- `/next` at `.claude/commands/next.md` - Pick and work on the next highest priority unblocked task

## Goals

- Ultra-thin skill linking to both commands
- Commands use native file operations (Read, Write) instead of CLI
- Agent edits JSON directly to update task status
- Keep sequential task IDs (simple, human-readable)
- Maintain "next task" algorithm (priority + dependencies)
- `/task` takes spec ID as parameter

## Non-Goals

- Migration path (separate task)
- Hash-based IDs or hierarchical structure (like beads)
- Separate commands for status updates (agent edits directly)

---

## Architecture

```
User Context
     │
     ▼
┌─────────────────────────────────────┐
│  Skill: .claude/skills/task/SKILL.md │
│  - Triggers on task/work context      │
│  - Links to /task and /next commands  │
└─────────────────────────────────────┘
     │
     ├──────────────────┐
     ▼                  ▼
┌──────────────┐  ┌──────────────┐
│ /task        │  │ /next        │
│ (Generate)   │  │ (Pick+Work)  │
│ Takes spec-id│  │              │
└──────────────┘  └──────────────┘
     │                  │
     └────────┬─────────┘
              ▼
┌─────────────────────────────────────┐
│  Data: .kit/tasks/<spec-id>.json    │
│  - Tasks array with dependencies    │
│  - Agent edits directly for status  │
└─────────────────────────────────────┘
```

---

## Detailed Design

### Skill: `.claude/skills/task/SKILL.md`

```markdown
---
name: task-management
description: Generates and manages task lists from specs. Activates when user has a spec and mentions tasks, implementation, work, or asks "what's next?"
---

# Task Management

## Quick start

**Check for pending tasks** before starting new work:

```
/next
```

## Commands

- [/task <spec-id>](.claude/commands/task.md) - Generate tasks from a spec
- [/next](.claude/commands/next.md) - Pick and work on next task

## Workflow

1. Have an approved spec? Run `/task <spec-id>` to generate tasks
2. Ready to work? Run `/next` to pick highest priority unblocked task
3. Task done? Edit `.kit/tasks/<spec-id>.json` to set status: "done"
4. Repeat `/next` until all tasks complete
```

### Command: `/task` at `.claude/commands/task.md`

```markdown
# Task Command

Generate implementation tasks from an approved spec.

**Usage:** `/task <spec-id>`

## Workflow

### 1. Get Spec

Read the spec from `.kit/specs/$ARGUMENTS.md`

If spec not found, report error and list available specs.

### 2. Analyze

Break spec into discrete, implementable tasks:
- Each task = one focused unit of work
- Identify dependencies between tasks
- Assign priorities:
  - 0 = Critical (do first)
  - 1 = High
  - 2 = Normal (default)
  - 3 = Low
  - 4 = Nice to have

### 3. Propose

Present task list to user:
```
Proposed tasks for {spec-name}:

1. [P1] Task title
   Depends on: none

2. [P2] Another task
   Depends on: 1
```

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
      "status": "pending",
      "priority": 1,
      "depends_on": []
    }
  ]
}
```

Stage: `git add .kit/tasks/{spec-id}.json`

Confirm: "Created {n} tasks for {spec-name}"
```

### Command: `/next` at `.claude/commands/next.md`

```markdown
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
```

---

## Data Model

**Location:** `.kit/tasks/<spec-id>.json`

```json
{
  "spec_id": "feature-name-a1b2",
  "spec_path": ".kit/specs/feature-name-a1b2.md",
  "tasks": [
    {
      "id": "1",
      "title": "Brief, action-oriented description",
      "status": "pending",
      "priority": 2,
      "depends_on": [],
      "description": "Optional detailed explanation"
    }
  ]
}
```

**Task statuses:** `pending` → `in_progress` → `done`

**Priority scale:** 0 (critical) to 4 (nice-to-have)

**Dependencies:** Array of task ID strings (e.g., `["1", "2"]`) that must be "done" before this task is unblocked. String IDs support future subtask notation like "1.1", "1.2".

---

## API / Interface

### /task command

**Input:** `$ARGUMENTS` = spec ID (e.g., `spec-system-refactor-kafk`)

**Output:** Task file at `.kit/tasks/<spec-id>.json`

### /next command

**Input:** None (auto-selects from available task files)

**Output:** Updates task status, begins implementation

### Direct file editing

Agent edits `.kit/tasks/<spec-id>.json` directly to:
- Update status: `"pending"` → `"in_progress"` → `"done"`
- Modify task details if needed

---

## Error Handling

### /task errors

| Error | Detection | Response |
|-------|-----------|----------|
| Spec not found | `.kit/specs/{id}.md` missing | List available specs |
| Spec not approved | `status` ≠ "approved" | "Spec not approved (status: {status})" |
| Tasks exist | `.kit/tasks/{id}.json` exists | "Tasks already exist. Delete file to regenerate." |

### /next errors

| Error | Detection | Response |
|-------|-----------|----------|
| No task files | Glob returns empty | "No tasks found. Run `/task <spec-id>`" |
| Malformed JSON | Parse fails | "Task file malformed: {error}" |
| Circular dependency | Task depends on itself (directly or indirectly) | "Circular dependency: {chain}" |
| Invalid dependency | depends_on references non-existent ID | "Task {id} depends on unknown task {dep}" |

---

## What Gets Deleted

```
bin/kit (task routing)
systems/tasks/
  bin/tasks
  lib/commands/list.sh
  lib/config.sh
  lib/utils/json.sh
  lib/utils/tasks.sh
  lib/utils/git.sh
  templates/
```

---

## Verification

1. `/task spec-id` generates tasks from spec without CLI calls
2. `/next` picks correct task using priority + dependency logic
3. Status updates work via direct JSON editing
4. Skill triggers on "what should I work on next?"
5. Task file created with correct structure

---

## Future Considerations

- **Task templates**: Pre-defined task patterns for common spec types
- **Subtasks**: Hierarchical task breakdown (1.1, 1.2)
- **Time tracking**: Optional time estimates and actuals
- **Blocked status**: Explicit blocked state with reason
