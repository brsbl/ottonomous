---
name: skill-diff
description: Shows side-by-side diffs of skill changes. Generates HTML comparison of before/after for changed SKILL.md files. Use when reviewing skill changes.
argument-hint: [base-commit]
---

Generate visual diffs for changed skills.

**Argument:** $ARGUMENTS (base commit to compare against, defaults to `main`)

## Usage

```bash
node .claude/skills/skill-diff/scripts/skill-diff.js $ARGUMENTS
```

Opens `.otto/skill-diffs/index.html` in browser with side-by-side diffs for all changed skills.
