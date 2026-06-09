---
name: summary
description: Synthesizes code docs into user-facing HTML summary. Creates semantic narrative explaining what changed and why it matters. Use when creating PR summaries, release notes, or change overviews.
argument-hint: [staged | branch]
---

**Scope:** $ARGUMENTS

| Argument | Files to summarize |
|----------|-------------------|
| (none) or `branch` | Branch diff: `git diff main...HEAD --name-only` |
| `staged` | Staged changes: `git diff --cached --name-only` |

---

## Workflow

| Phase | Purpose |
|-------|---------|
| 1. Analyze | Get changed files and diffs |
| 2. Read | Read changed files and their diffs |
| 3. Synthesize | Create semantic narrative from code and diffs |
| 4. Generate | Convert to HTML, open in browser |

### 1. Analyze Changes

Get changed files using scope command. If no changes found, report: "No changes to summarize."

```bash
git diff main...HEAD --name-only
```

### 2. Read Changes

For each changed file, read the file content and diff:

```bash
git diff main...HEAD -- <file>
```

Read the full file for context when the diff alone isn't sufficient to understand the change.

### 3. Synthesize Summary

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
- **Performance considerations:** Changes to scan frequency, read/write patterns, potential bottlenecks
- **Subtle bug risks:** Race conditions, stale data, cache invalidation, timing issues introduced
- **Dependencies affected:** What other parts of the codebase might be impacted?

### [src/api/routes.ts](https://github.com/{org}/{repo}/blob/{branch}/src/api/routes.ts)

- **Purpose of changes:** ...
- **Behavioral changes:** ...
- **Data flow impact:** ...
- **Performance considerations:** ...
- **Subtle bug risks:** ...
- **Dependencies affected:** ...

## Breaking Changes

{If any exist - before/after comparison, migration path. Omit section entirely if none.}

## Files Changed

<details>
<summary>{count} files</summary>

| File | Summary |
|------|---------|
| [src/auth/users.ts](https://github.com/{org}/{repo}/blob/{branch}/src/auth/users.ts) | Added profile CRUD |
| [src/api/routes.ts](https://github.com/{org}/{repo}/blob/{branch}/src/api/routes.ts) | New profile endpoints |

**List every file individually — no wildcards.** Count must match table rows.

</details>
```

**Key principles:**
- Focus on **"why" and "what it means"** not just "what changed"
- Explain **semantic meaning and implications**
- Link to code in branch for easy navigation
- Per-component sections with consistent 6-field structure
- **Highlight performance impacts**: scan frequency changes, read/write pattern modifications
- **Flag subtle bug sources**: race conditions, stale data, cache issues, timing problems
- Breaking changes prominent if they exist
- Omit Breaking Changes section entirely if none exist

### 4. Generate HTML

**Create directories:**
```bash
mkdir -p .otto/summaries
```

**Save markdown** to `.otto/summaries/{branch}-{date}.md`

**Convert to HTML** using the md-to-html script:
```bash
node skills/summary/scripts/md-to-html.js .otto/summaries/{branch}-{date}.md .otto/summaries/{branch}-{date}.html
```

**Open in browser:**
```bash
open .otto/summaries/{branch}-{date}.html
```

**Report:**
```
Summary generated: .otto/summaries/{branch}-{date}.html
```
