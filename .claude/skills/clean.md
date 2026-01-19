---
name: clean
description: Clean ottonomous workflow artifacts from the .otto directory. Supports selective cleaning of sessions, specs, tasks, and reviews while preserving configuration. Invoke with /clean.
---

# Clean

Clean ottonomous workflow artifacts from the `.otto/` directory. Use this to reset your project's otto state without affecting the ottonomous plugin itself.

## Context

When ottonomous is installed as a Claude Code plugin, users have `.otto/` in their own projects containing:
- `config.yaml` - User settings (otto config)
- `specs/` - Specification documents
- `tasks/` - Task JSON files
- `reviews/` - Review outputs (markdown, HTML)
- `docs/` - Engineering docs with INDEX.md
- `otto/sessions/` - Session state, feedback.md, improvements.md, screenshots

## Usage

```bash
/clean              # Interactive mode: choose what to clean
/clean --all        # Full reset including config.yaml
/clean --sessions   # Clean only otto sessions
/clean --keep-config # Clean all except config.yaml (default)
/clean --feedback   # Clear only feedback.md files from sessions (keep state)
```

---

## Workflow

### Step 1: Parse Arguments

Check for flags in the user's invocation:

| Flag | Behavior |
|------|----------|
| (none) | Interactive mode - ask what to clean |
| `--all` | Remove everything in .otto/ including config.yaml |
| `--sessions` | Remove only .otto/otto/sessions/ |
| `--keep-config` | Remove everything except config.yaml (default for non-interactive) |
| `--feedback` | Clear only feedback.md and improvements.md from sessions (keep state) |

### Step 2: Check for Active Sessions

Before any cleaning, check if otto sessions are currently running:

```bash
# Find state.json files with status: "in_progress"
find .otto/otto/sessions -name "state.json" -exec grep -l '"status": "in_progress"' {} \; 2>/dev/null
```

**If active sessions found:**
```
⚠️ Active otto session detected: {session_id}

The session appears to be in progress. Cleaning now may cause:
- Loss of current execution state
- Orphaned processes (dev-browser, report server)

Options:
1. Stop the session first (kill processes, set status to "terminated")
2. Clean anyway (force)
3. Cancel
```

Use `AskUserQuestion` to let user decide.

**To stop an active session:**
```bash
# Kill dev-browser if running
if [ -f ".otto/otto/sessions/{session_id}/dev-browser.pid" ]; then
  kill $(cat .otto/otto/sessions/{session_id}/dev-browser.pid) 2>/dev/null || true
fi

# Kill report server if running
if [ -f ".otto/otto/sessions/{session_id}/report.pid" ]; then
  kill $(cat .otto/otto/sessions/{session_id}/report.pid) 2>/dev/null || true
fi
```

### Step 3: Interactive Mode (if no flags)

If invoked without flags, ask user what to clean:

```
Use AskUserQuestion with multiSelect: true

Question: "What would you like to clean from .otto/?"

Options:
- Sessions (.otto/otto/sessions/) - Session state, feedback.md, improvements.md, screenshots
- Specs (.otto/specs/) - Specification documents
- Tasks (.otto/tasks/) - Task JSON files
- Reviews (.otto/reviews/) - Review outputs
- Docs (.otto/docs/) - Engineering docs
- Config (.otto/config.yaml) - User settings (will reset to defaults)
```

### Step 4: Execute Cleaning

Based on selection or flags:

#### --sessions (or "Sessions" selected)
```bash
rm -rf .otto/otto/sessions/*
mkdir -p .otto/otto/sessions
touch .otto/otto/sessions/.gitkeep

# Remove orphaned active session marker
rm -f .otto/otto/.active
```

#### --feedback (clear feedback files only)
```bash
# Clear feedback.md and improvements.md files while preserving session state
find .otto/otto/sessions -name "feedback.md" -delete
find .otto/otto/sessions -name "feedback-batch-*.md" -delete
find .otto/otto/sessions -name "improvements.md" -delete
```

This allows users to clear accumulated feedback without losing session state.

#### --keep-config (default behavior)
```bash
# Remove all except config.yaml
find .otto -mindepth 1 -maxdepth 1 ! -name "config.yaml" -exec rm -rf {} \;

# Recreate directory structure
mkdir -p .otto/specs .otto/tasks .otto/reviews .otto/docs .otto/otto/sessions

# Add .gitkeep files to preserve structure
touch .otto/specs/.gitkeep
touch .otto/tasks/.gitkeep
touch .otto/reviews/.gitkeep
touch .otto/docs/.gitkeep
touch .otto/otto/sessions/.gitkeep

# Remove orphaned active session marker (in case .otto/otto was recreated)
rm -f .otto/otto/.active
```

#### --all (full reset)
```bash
rm -rf .otto
```

**Confirmation required for --all:**
```
⚠️ This will delete ALL otto data including your config.yaml.
You will need to reconfigure ottonomous settings.

Type 'yes' to confirm:
```

### Step 5: Report Results

```
Cleaned:
- {n} session(s) removed
- {n} spec(s) removed
- {n} task file(s) removed
- {n} review(s) removed
- {n} doc entries removed
{if config removed: "- Config reset (will use defaults)"}

Directory structure preserved. Ready for new otto session.
```

---

## Auto Mode

When AUTO_MODE is active (`.otto/otto/.active` exists during an otto session):

| Flag | Auto Behavior |
|------|---------------|
| `--sessions` | Clean immediately, no confirmation |
| `--keep-config` | Clean immediately, no confirmation |
| `--feedback` | Clean immediately, no confirmation |
| `--all` | ALWAYS ask for confirmation (destructive) |
| (none) | Default to `--keep-config`, no confirmation |

---

## Examples

### Clean only sessions (quick reset)
```
/clean --sessions
```
Output:
```
Cleaned 3 otto session(s).
Session artifacts removed, ready for new session.
```

### Clean feedback files only (preserve state)
```
/clean --feedback
```
Output:
```
Cleaned feedback files from 3 session(s).
Session state preserved, feedback cleared.
```

### Interactive cleanup
```
/clean
```
Output:
```
What would you like to clean from .otto/?
[x] Sessions (3 items)
[x] Tasks (2 items)
[ ] Specs (1 item)
[ ] Reviews (0 items)
[ ] Docs (5 entries)
[ ] Config

Cleaned:
- 3 session(s) removed
- 2 task file(s) removed

Directory structure preserved.
```

### Full reset
```
/clean --all
```
Output:
```
⚠️ This will delete ALL otto data including your config.yaml.

Type 'yes' to confirm: yes

Removed .otto/ directory completely.
Run /otto to start fresh with default configuration.
```

---

## Directory Structure After Clean

After `--keep-config` or selective clean:

```
.otto/
├── config.yaml     # Preserved (unless --all)
├── specs/
│   └── .gitkeep
├── tasks/
│   └── .gitkeep
├── reviews/
│   └── .gitkeep
├── docs/
│   └── .gitkeep
└── otto/
    └── sessions/
        └── .gitkeep
```
