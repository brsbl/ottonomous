---
name: summary
description: Synthesizes code docs into user-facing HTML summary. Creates semantic narrative explaining what changed and why it matters. Use when creating PR summaries, release notes, or change overviews.
argument-hint: [staged | uncommitted | branch]
model: opus
---

**Scope:** $ARGUMENTS

| Argument | Files to summarize |
|----------|-------------------|
| (none) or `branch` | Branch diff: `git diff main...HEAD --name-only` |
| `staged` | Staged changes: `git diff --cached --name-only` |
| `uncommitted` | Uncommitted changes: `git diff --name-only` |

---

## Workflow

| Phase | Purpose |
|-------|---------|
| 1. Analyze | Get changed files |
| 2. Check docs | If per-file docs missing, run `/doc` first |
| 3. Collect | Read per-file docs for changed files |
| 4. Create snapshot | Write branch snapshot to `.otto/docs/branches/` |
| 5. Synthesize | Transform docs into semantic narrative |
| 6. Generate | Convert to HTML, open in browser |

### 1. Analyze Changes

Get changed files using scope command. If no changes found, report: "No changes to summarize."

```bash
git diff main...HEAD --name-only
```

### 2. Check Documentation

For each changed file, check if docs exist:

```bash
# Convert path: src/auth/users.ts → src-auth-users.json
ls .otto/docs/files/src-auth-users.json
```

**If any docs are missing**, run `/doc` first:
> "Documentation missing for some files. Running /doc first..."

Then continue with the workflow.

### 3. Collect Documentation

Read per-file docs from `.otto/docs/files/` for all changed files.

### 4. Create Branch Snapshot

**Create directories:**
```bash
mkdir -p .otto/docs/branches
```

**Get branch name:**
```bash
git branch --show-current
```

**Write snapshot** to `.otto/docs/branches/{branch-with-dashes}.json`:

```json
{
  "version": 2,
  "branch": "feature/user-profiles",
  "created": "2026-01-29T12:00:00Z",
  "commit_range": "abc123..def456",
  "files": ["src/auth/users.ts", "src/api/routes.ts"],
  "file_docs": [
    { "...per-file doc structure..." }
  ]
}
```

### 5. Synthesize Summary

**Get repo info for links:**
```bash
git remote get-url origin
```

Parse to get `{org}/{repo}` for GitHub links.

**Generate semantic summary** following this format:

```markdown
# {Branch Name}

## Overview

{2-3 sentences: what this branch accomplishes from a business/feature perspective}

### Technical Implementation
{Integration points, architecture decisions, key patterns used}

### Key Review Areas
{What reviewers should focus on, potential risks, areas needing careful attention}

### What Changed
{High-level summary of functionality changes and why they matter}

## Semantic Changes by Component

### [src/auth/users.ts](https://github.com/{org}/{repo}/blob/{branch}/src/auth/users.ts)

- **Purpose of changes:** What problem does this solve or what feature does it add?
- **Behavioral changes:** How does the behavior differ from before?
- **Data flow impact:** How do these changes affect data flow through the system?
- **Dependencies affected:** What other parts of the codebase might be impacted?

### [src/api/routes.ts](https://github.com/{org}/{repo}/blob/{branch}/src/api/routes.ts)

- **Purpose of changes:** ...
- **Behavioral changes:** ...
- **Data flow impact:** ...
- **Dependencies affected:** ...

## Breaking Changes

{If any exist - before/after comparison, migration path. Omit section entirely if none.}

## Files Changed

<details>
<summary>{count} files</summary>

| File | Summary |
|------|---------|
| src/auth/users.ts | Added profile CRUD |
| src/api/routes.ts | New profile endpoints |

</details>
```

**Key principles:**
- Focus on **"why" and "what it means"** not just "what changed"
- Explain **semantic meaning and implications**
- Link to code in branch for easy navigation
- Per-component sections with consistent 4-field structure
- Breaking changes prominent if they exist
- Omit Breaking Changes section entirely if none exist

### 6. Generate HTML

**Create directories:**
```bash
mkdir -p .otto/summaries
```

**Save markdown** to `.otto/summaries/{branch}-{date}.md`

**Convert to HTML** using the md-to-html script:
```bash
node skills/summary/scripts/md-to-html.js .otto/summaries/{branch}-{date}.md .otto/summaries/{branch}-{date}.html
```

**Stage files:**
```bash
git add .otto/docs/branches/ .otto/summaries/
```

**Open in browser:**
```bash
open .otto/summaries/{branch}-{date}.html
```

**Report:**
```
Summary generated: .otto/summaries/{branch}-{date}.html
```
