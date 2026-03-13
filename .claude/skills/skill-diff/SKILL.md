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

Run the script (auto-opens in browser):

```bash
node .claude/skills/skill-diff/scripts/skill-diff.js
```

Do NOT run `open` manually — the script handles it.
