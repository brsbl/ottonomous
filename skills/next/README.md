# Next

Pick and execute the next highest priority unblocked task.

## Usage

```bash
/next
```

## What It Does

- Finds all task files in `.otto/tasks/`
- Selects highest priority pending task with no blockers
- Updates status: `pending` → `in_progress` → `done`
- Executes the task

## Configuration

```yaml
auto_pick: true   # Skip confirmation before execution
max_blockers: 3   # Retry limit before skipping task
```

## Output

- Updates task status in `.otto/tasks/{spec-id}.json`
- Makes code changes for the task
- Commits changes with `git add`

## Example

```bash
/next

# Picks: Task 1 (P0, no dependencies)
# Executes implementation
# Updates status to "done"

/next  # Picks next available task
```

Repeat until all tasks complete
