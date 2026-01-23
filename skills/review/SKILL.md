---
name: review
description: Reviews code changes for bugs with P0-P3 prioritized feedback. Uses parallel subagents for thorough analysis, then creates fix plans and implements critical issues. Activates when reviewing code, finding bugs, checking quality, or before merging.
argument-hint: [staged | uncommitted | branch]
---

**Scope:** $ARGUMENTS

| Argument | What to review |
|----------|----------------|
| (none) or `branch` | Branch diff: `git diff main...HEAD` |
| `staged` | Staged changes: `git diff --cached` |
| `uncommitted` | Uncommitted changes: `git diff` |

---

## Workflow

| Phase | Purpose |
|-------|---------|
| 1. Review | Analyze changes using review criteria |
| 2. Synthesize | Collect and deduplicate findings |
| 3. Fix Plan | Create implementation plan |
| 4. Implement | Fix issues |

### Review Criteria

**Priority Levels:**
- **P0**: Crashes, data loss, security vulnerabilities, breaks core functionality
- **P1**: Wrong behavior affecting users, but has workarounds
- **P2**: Edge cases, minor bugs, non-critical issues
- **P3**: Code smells, maintainability issues, minor improvements

**A finding should meet ALL of these:**
1. Meaningful impact on correctness, performance, usability, security, or maintainability
2. Discrete and actionable (specific issue, not general concern)
3. Introduced in this change (not pre-existing)
4. Author would fix it if aware (not intentional design choice)
5. No assumptions about unstated intent

**Do NOT flag:** trivial style issues, pre-existing problems, hypothetical issues, documentation gaps, or missing tests.

**Output Format:**
```
### [P{N}] {Brief title}
**Location:** `file/path.ts:123`
{1 paragraph: why it's a bug, triggers, severity}
{Optional: up to 3 lines showing fix}
```

### 2. Review Changes

**Small Changes (<5 files, <300 lines):**
Review directly using the criteria above.

**Medium/Large Changes (5+ files):**
Launch parallel review subagents, grouped by directory or component.

**When spawning review subagents, include:**
- File list to review
- How to get diff: `git diff main...HEAD -- <file>`
- Priority levels from above
- Detection criteria from above
- Output format from above

### 3. Synthesize Findings

After review completes (yours or subagents'):

1. **Collect** all findings
2. **Deduplicate** if multiple reviewers covered overlapping areas
3. **Sort by priority** — P0 first
4. **Cross-reference** — Note related issues

Present unified findings:

```markdown
## Code Review Findings

{Findings sorted by priority}

## Summary

| Priority | Count |
|----------|-------|
| P0 | {n} |
| P1 | {n} |
| P2 | {n} |
| P3 | {n} |

**Verdict: [CORRECT / NEEDS FIXES]**
```

### 4. Create Fix Plan

For each issue, define:
- What to fix
- Where (file, line)
- How (approach)
- Dependencies

Group fixes for parallel implementation:
- **Batch A**: Independent fixes (can run in parallel)
- **Batch B**: Dependent fixes (must wait)

Present plan to user for approval.

### 5. Implement Fixes

Launch subagents to fix issues. For each fix, provide:
- Issue description and location
- Instructions: read file, implement fix, verify it compiles, stage changes

After fixes complete, report:
```
## Fix Results

| Issue | Status |
|-------|--------|
| [P0] Null reference | ✓ Fixed |
| [P1] Race condition | ✓ Fixed |
```

---

## Example Finding

### [P1] Division by zero when progress is 0%

**Location:** `src/components/ProgressBar.tsx:34`

The percentage calculation `100 / progress` will throw when `progress` is 0, which occurs when a task is newly created. This affects TaskList which renders ProgressBar for all tasks.

```tsx
const width = progress > 0 ? (100 / progress) : 0;
```
