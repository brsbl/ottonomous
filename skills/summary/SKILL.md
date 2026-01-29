---
name: summary
description: Consolidates doc entries into a styled HTML summary. Reads from .otto/docs/, creates unified view of changes, opens in browser. Use after /doc to create PR descriptions or release notes.
model: opus
---

Consolidate documentation entries into a styled HTML webpage.

### 1. Check for Docs

```bash
ls .otto/docs/*.md 2>/dev/null
```

If no docs exist, run `/doc` first, then continue.

### 2. Read Doc Entries

Read all `.otto/docs/*.md` files. Each entry has:
- Title
- Files
- What (implementation/change)
- Why (motivation)
- Notable Details (technical decisions, behavioral changes, data flow, patterns)

### 3. Write Summary

Synthesize doc entries into a cohesive summary (don't just copy them).

**Prioritize by importance:**
1. User-facing changes (what users will notice)
2. Breaking changes
3. New capabilities
4. Security/performance impacts
5. Architectural changes

```markdown
# {Branch/Feature Name}

## Overview
{1-2 paragraphs: what this branch accomplishes and why it matters}

## Key Changes
{Bullet points of the most important changes - not everything}

## Technical Notes
{Breaking changes, new patterns, gotchas - omit if none}

## Files Changed
{List of files}
```

### 4. Convert to HTML

Save to `.otto/summaries/{branch}-{date}.html` using `skills/summary/scripts/md-to-html.js`.

### 5. Report

```
Summary: .otto/summaries/{branch}-{date}.html
```

Open in browser.
