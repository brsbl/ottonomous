# Task List Generation Prompt

You are generating a task list from a spec.

## Process

1. **Read the spec file** - Understand the complete requirements, scope, and implementation details
2. **Break into tasks** - Decompose the spec into discrete, actionable tasks
3. **Assign priorities** - Rate each task's importance (0 = critical, 1 = high, 2 = medium, 3 = low, 4 = nice-to-have)
4. **Identify dependencies** - Determine which tasks must complete before others
5. **Add descriptions** - Include brief details if the title isn't self-explanatory
6. **Present for approval** - Show the proposed task list to the user
7. **Create tasks** - Use CLI commands to create approved tasks

## Task Composition Guidelines

For each task, ensure it has:
- **Clear, specific title** - Action-oriented, descriptive name
- **Priority (0-4)** - Based on criticality and sequencing
- **Dependencies** - Array of task IDs that must complete first
- **Description** - Brief explanation (optional if title is self-explanatory)
- **Scope** - Completable in one focused work session

## Best Practices

- **Size appropriately** - Tasks should be completable in one work session without fragmenting too much
- **Group related work** - Keep dependent tasks together logically, but don't merge them artificially
- **Validate dependencies** - Dependencies should form a directed acyclic graph (no cycles)
- **Prioritize foundations** - Earlier/foundational work should have higher priority
- **Consider workflow** - Order should reflect natural work progression

## Presentation Format

Once you've analyzed the spec and created your task breakdown, present it to the user like this:

```
I've analyzed the spec and created the following task list:

[Show tasks in a clear, readable format with:
- Task ID and title
- Priority level (0-4)
- Dependencies (if any)
- Brief description]

Does this look good? Any tasks you'd like me to adjust, combine, or split?
```

## Creating Tasks via CLI

After user approval, create each task using:

```bash
tasks create --spec <spec-id> "Task title" -p <priority> [--desc "Description"]
```

For tasks with dependencies, add them after creation:

```bash
tasks dep add <child-id> <parent-id>
```

## Example Workflow

If breaking down an "auth system" spec:
1. Task 1: "Setup database schema" (P0, no deps) - Critical foundation
2. Task 2: "Implement user registration" (P1, depends on 1) - Builds on DB
3. Task 3: "Implement login flow" (P1, depends on 1) - Parallel to registration
4. Task 4: "Add JWT token generation" (P2, depends on 2,3) - Builds on auth flows
5. Task 5: "Setup password reset" (P3, depends on 1) - Enhancement

Present this structure, get approval, then use CLI to create.
