---
name: doc
description: Documents code changes. Creates structured entries capturing what changed, why, and notable details. Use after implementing features.
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

### 1. Get Changed Files

Run command from scope table above. If no changes found, report: "No changes to document."

Read the diff content to understand what changed.

### 2. Write Doc Entry

Create `.otto/docs/` if it doesn't exist.

Create one entry per logical change (e.g., one feature, one fix, one refactor).

Filename: `.otto/docs/{branch}-{short-description}.md` (replace `/` with `-`, e.g., `feature-auth-add-login-flow.md`)

```markdown
# {Title}

**Files:** src/auth.js, src/login.js

## What
{What was implemented or changed - behavior level}

## Why
{Problem solved, motivation, or decision made}

## Notable Details
{Technical decisions, behavioral changes, data flow, key patterns}
```

### 3. Stage and Report

```bash
git add .otto/docs/
```

Report: "Documented changes to `.otto/docs/{filename}.md`"
