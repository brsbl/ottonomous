---
name: doc
description: Creates per-file documentation capturing intent and context that can't be inferred from code alone. Establishes baseline docs then layers branch changes as narrative. Use after implementing features or when documenting code.
argument-hint: [staged | branch]
model: opus
---

**Scope:** $ARGUMENTS

| Argument | Command |
|----------|---------|
| (none) or `branch` | `git diff main...HEAD --name-only` |
| `staged` | `git diff --cached --name-only` |

---

## Workflow

### 1. Initialize (first run only)

Check if CLAUDE.md contains the doc discovery section. If not, append:

```
## Code Docs

`.otto/docs/files/{file-path-with-dashes}.json` contains per-file documentation with purpose, patterns, gotchas, and change history.
```

### 2. Get Changed Files

Run scope command. If no changes, report: "No changes to document."

Group files by module (parent directory) for subagent batching.

### 3. Get Commit Sequence

For each file group:
```bash
git log main..HEAD --oneline --reverse -- <files>
```

### 4. Launch Subagents

| Files | Subagents |
|-------|-----------|
| 1-4 | 1 |
| 5-10 | 2-3 |
| 11+ | 3-5 |

**Handoff to file-documenter:**
- Module name
- File list
- Commit sequence (oldest first)
- Git commands for main version, full diff, per-commit diffs

### 5. Report

Collect results and report:

```
## Documentation Updated

Files documented: {count}
Location: .otto/docs/files/

| File | Purpose |
|------|---------|
| src/auth/users.ts | User CRUD operations |

Run /summary to generate a user-facing summary.
```
