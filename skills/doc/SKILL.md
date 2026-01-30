---
name: doc
description: Documents code changes with parallel subagents. Creates structured per-file documentation optimized for agent consumption. Use after implementing features.
argument-hint: [staged | uncommitted | branch]
model: opus
---

**Scope:** $ARGUMENTS

| Argument | Files to document |
|----------|-------------------|
| (none) or `branch` | Branch diff: `git diff main...HEAD --name-only` |
| `staged` | Staged changes: `git diff --cached --name-only` |
| `uncommitted` | Uncommitted changes: `git diff --name-only` |

---

## Workflow

| Phase | Purpose |
|-------|---------|
| 1. Initialize | Add doc discovery to CLAUDE.md (first run only) |
| 2. Analyze | Get changed files, group by module/directory |
| 3. Document | Launch parallel file-documenter subagents |
| 4. Synthesize | Collect entries, merge into existing per-file docs |
| 5. Save & Report | Write/update per-file JSONs, present results, offer /summary |

### 1. Initialize (first run only)

Check if CLAUDE.md contains the doc discovery section. If not, append:

```markdown
## Code Docs

Before modifying a file, check `.otto/docs/files/{file-path-with-dashes}.json` for context.
```

### 2. Analyze Changes

Get changed files using scope command. If no changes found, report: "No changes to document."

**Read the diff** to understand what changed:
- Branch: `git diff main...HEAD`
- Staged: `git diff --cached`
- Uncommitted: `git diff`

**Group files by module** (parent directory):
- `src/auth/*` → auth module
- `src/api/*` → api module
- `src/utils/*` → utils module

**Calculate subagent count:**

| Files | Subagents | Grouping |
|-------|-----------|----------|
| 1-4 | 1 | All files |
| 5-10 | 2-3 | By directory |
| 11+ | 3-5 | By module/component |

### 3. Document with Subagents

**Launch file-documenter subagents using Task tool:**

Each subagent receives:
- File list to document
- Diff command for those files (use Bash tool directly):
  - Branch: `git diff main...HEAD -- <files>`
  - Staged: `git diff --cached -- <files>`
  - Uncommitted: `git diff -- <files>`
- Module assignment
- Output format specification from agent definition

**Example task prompt:**
```
Document the following files for agent consumption.

Module: auth
Files: src/auth/users.ts, src/auth/types.ts

Run this diff command to see what changed:
git diff main...HEAD -- src/auth/users.ts src/auth/types.ts

For each file:
1. Read the full file to understand context
2. Analyze the diff to understand what changed
3. Extract: purpose, exports, patterns, dependencies, changes, gotchas, related_tests
4. Return JSON array per the output format
```

Wait for all subagents to complete.

### 4. Synthesize Documentation

Collect outputs from all subagents:

1. **Parse JSON** from each subagent response
2. **Merge with existing docs** if file already has documentation in `.otto/docs/files/`
   - Update `purpose`, `exports`, `patterns`, `dependencies`, `gotchas` with latest
   - Append new entries to `changes` array (don't replace history)
3. **Set timestamps** - `updated` field on each file doc

### 5. Save & Report

**Create directories:**
```bash
mkdir -p .otto/docs/files
```

**Write per-file docs** to `.otto/docs/files/{path-with-dashes}.json`:
- Convert path: `src/auth/users.ts` → `src-auth-users.json`

**Per-file doc format:**
```json
{
  "path": "src/auth/users.ts",
  "module": "auth",
  "purpose": "User CRUD operations with profile management",
  "exports": [
    {"name": "getUser", "signature": "(id: string) => User", "description": "Fetch user by ID"}
  ],
  "patterns": ["Repository pattern", "Guard clauses"],
  "dependencies": {
    "internal": ["src/db/connection.ts"],
    "external": ["zod"]
  },
  "gotchas": ["Returns 404 for soft-deleted users, not null"],
  "related_tests": ["src/auth/users.test.ts"],
  "changes": [
    {
      "branch": "feature/user-profiles",
      "date": "2026-01-29",
      "type": "modified",
      "what": "Null-check guard before accessing user.profile",
      "why": "Prevents crash when user is soft-deleted",
      "lines": "47-52"
    }
  ],
  "updated": "2026-01-29T12:00:00Z"
}
```

**Stage docs:**
```bash
git add .otto/docs/files/
```

**Report:**
```
## Documentation Updated

Files documented: {count}
Location: .otto/docs/files/

| File | Purpose |
|------|---------|
| src/auth/users.ts | User CRUD operations with profile management |
| src/api/routes.ts | REST API endpoint definitions |

Run /summary to generate a user-facing summary.
```

---

## Agent Discovery

Agents can find documentation for any file:

```bash
# Find docs for src/auth/users.ts
cat .otto/docs/files/src-auth-users.json

# List all documented files
ls .otto/docs/files/
```

The per-file format ensures agents working on a specific file can quickly understand:
- What the file does (`purpose`)
- What it exports (`exports`)
- Patterns to follow (`patterns`)
- What to watch out for (`gotchas`)
- Recent changes and why (`changes`)
