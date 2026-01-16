# Task

Break specifications into atomic, implementable tasks.

## Usage

```bash
/task <spec-id>
```

## What It Does

- Reads approved spec from `.otto/specs/{spec-id}.md`
- Breaks into atomic tasks (≤3 files per task)
- Assigns priorities (P0-P4) and dependencies
- Identifies parallel vs sequential execution

## Configuration

```yaml
auto_pick: true  # Skip confirmation prompt
```

## Output

Task list saved to `.otto/tasks/{spec-id}.json`

## Example

```bash
/task user-auth-a4f2

# Output: .otto/tasks/user-auth-a4f2.json
# - Task 1: Setup database schema (P0, no deps)
# - Task 2: Implement auth service (P1, depends on 1)
# - Task 3: Add login endpoint (P1, depends on 2)
```

Use `/next` to execute tasks
