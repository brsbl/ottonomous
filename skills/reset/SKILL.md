---
name: reset
description: Resets workflow artifacts (.otto/ directory). Removes sessions, tasks, and specs. Use when starting over. Destructive - requires confirmation.
model: opus
model-invokable: false
arguments:
  - name: targets
    description: "Subdirectories to clear: tasks, specs, sessions, or all (default: all). Docs are preserved."
    required: false
---

Reset workflow data. Selectively or fully clears the `.otto/` directory.

## Available Targets

| Target | Directory | Contents |
|--------|-----------|----------|
| `tasks` | `.otto/tasks/` | Task lists |
| `specs` | `.otto/specs/` | Specifications |
| `sessions` | `.otto/sessions/` | Browser sessions |
| `all` | Above targets | Everything except docs (default) |

## Usage Examples

- `/reset` - Clear everything (prompts for confirmation)
- `/reset tasks` - Clear only task lists
- `/reset specs tasks` - Clear specs and tasks
- `/reset sessions` - Clear browser sessions only
- `/reset all` - Explicit full reset

## Workflow

### 1. Check for .otto/

```bash
if [[ ! -d ".otto" ]]; then
  echo "No .otto/ directory found. Nothing to reset."
  exit 0
fi
```

If no `.otto/` exists, report and stop.

### 2. Parse Arguments

Map targets to directories:
```
tasks    -> .otto/tasks/
specs    -> .otto/specs/
sessions -> .otto/sessions/
all      -> tasks + specs + sessions (NOT docs)
```

If no arguments or `all` specified, target tasks, specs, and sessions. Docs are always preserved.

### 3. Kill Active Processes (if sessions targeted or all)

```bash
for pid_file in .otto/sessions/*/browser.pid .otto/otto/sessions/*/browser.pid; do
  [ -f "$pid_file" ] && kill $(cat "$pid_file") 2>/dev/null || true
done
```

### 4. Preview Removal

Show what will be removed with sizes:
```bash
du -sh <target_dirs> 2>/dev/null
```

Display to user:
```
Will remove:
  .otto/tasks/ (4K)
  .otto/specs/ (8K)
```

### 5. Confirm

Use `AskUserQuestion`:
> "This will delete the selected workflow data. Continue?"
> Options: "Yes, reset" / "Cancel"

### 6. Remove

After confirmation, remove only the targeted directories:
```bash
rm -rf <target_dirs>
```

For `all`, remove tasks, specs, and sessions (preserving docs):
```bash
rm -rf .otto/tasks .otto/specs .otto/sessions .otto/otto
```

### 7. Report

```
Reset complete. Cleared: tasks, specs
Run /otto or /spec to continue.
```
