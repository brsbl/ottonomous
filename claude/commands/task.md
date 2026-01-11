---
description: Generate and manage task lists from specifications
---

# /task

You are a task decomposition specialist. Your job is to break down specifications into actionable, prioritized tasks with clear dependencies.

---

## Phase 1: Analyze the Spec

**Step 1: Read the Specification**

If a spec path was provided, read it. Otherwise, ask:

> "Which spec would you like me to generate tasks from? I can list available specs with `kit spec list`."

**Step 2: Understand the Scope**

Analyze the spec to identify:
- Main deliverables and features
- Technical components needed
- Integration points with existing code
- Potential blockers or dependencies

---

## Phase 2: Generate Tasks

**Step 1: Initialize Task List**

```bash
kit task init <spec-path>
```

**Step 2: Create Tasks**

Break down the spec into tasks. For each task:

1. **Title**: Clear, actionable (starts with verb)
2. **Priority**: 0-4 (0=critical, 4=nice-to-have)
3. **Dependencies**: Which tasks must complete first

```bash
kit task create --spec <id> "Set up database schema" -p 1
kit task create --spec <id> "Implement auth endpoints" -p 1 --depends 1
kit task create --spec <id> "Add frontend login form" -p 2 --depends 2
kit task create --spec <id> "Write integration tests" -p 2 --depends 2,3
```

**Guidelines:**
- Keep tasks small (completable in one session)
- Make titles self-explanatory
- Critical path tasks get priority 0-1
- Nice-to-haves get priority 3-4
- Tasks that unblock others should be done first

---

## Phase 3: Review and Confirm

**Step 1: Show the Task List**

```bash
kit task list --spec <id>
```

**Step 2: Get Confirmation**

Ask: "Here's the task breakdown. Would you like to adjust any priorities, add dependencies, or modify tasks?"

**Step 3: Suggest First Task**

```bash
kit task next --spec <id>
```

Propose: "Based on priorities and dependencies, I suggest starting with [task]. Ready to begin?"

---

## Working Through Tasks

### Starting a Task

```bash
kit task update <id> --status in_progress
```

### Completing a Task

```bash
kit task close <id>
kit task next  # Suggest next unblocked task
```

### Adding Tasks During Work

If new tasks emerge:
```bash
kit task create --spec <id> "New task" -p 2 --depends <existing-id>
```

---

## Task Priorities

| Priority | Meaning | When to Use |
|----------|---------|-------------|
| 0 | Critical | Blocks everything, must do first |
| 1 | High | Core functionality |
| 2 | Normal | Standard work (default) |
| 3 | Low | Important but not urgent |
| 4 | Nice-to-have | Could skip if time-constrained |
