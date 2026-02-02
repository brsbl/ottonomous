---
name: skill-diff
description: Shows side-by-side diffs of skill changes. Generates HTML comparison of before/after for changed SKILL.md files. Use when reviewing skill changes.
model: opus
---

Generate visual diffs for changed skills, organized by scope.

## Scopes

| Scope | Comparison |
|-------|------------|
| **Uncommitted** | Working tree vs HEAD |
| **Staged** | Index vs HEAD |
| **Branch** | HEAD vs main |

## Usage

```bash
node .claude/skills/skill-diff/scripts/skill-diff.js
```

Opens `.otto/skill-diffs/index.html` in browser with side-by-side diffs organized by scope.
