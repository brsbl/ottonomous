---
name: review
description: Reviews code changes for bugs with P0-P3 prioritized feedback. Uses parallel subagents for thorough analysis, then creates fix plans. Use when reviewing code, finding bugs, checking quality, or before merging. Use /review fix to implement fixes.
argument-hint: [staged | uncommitted | branch] | fix [P0 | P0-P1 | all]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/review` | Review branch diff, synthesize findings, create fix plan |
| `/review staged` | Review staged changes only |
| `/review uncommitted` | Review uncommitted changes only |
| `/review fix` | Implement all fixes from saved plan |
| `/review fix P0` | Implement only P0 (critical) fixes |
| `/review fix P0-P1` | Implement P0 and P1 fixes |

| Scope | Git Command |
|-------|-------------|
| `branch` (default) | `git diff main...HEAD` |
| `staged` | `git diff --cached` |
| `uncommitted` | `git diff` |

---

## Review Criteria

Pass this section to all review subagents.

### Priority Levels

- **P0**: Crashes, data loss, security vulnerabilities, breaks core functionality
- **P1**: Wrong behavior affecting users, but has workarounds
- **P2**: Edge cases, minor bugs, non-critical issues
- **P3**: Code smells, maintainability issues, minor improvements

### Detection Rules

A finding must meet ALL of these:
1. Meaningful impact on correctness, performance, usability, security, or maintainability
2. Discrete and actionable (specific issue, not general concern)
3. Introduced in this change (not pre-existing)
4. Author would fix it if aware (not intentional design choice)
5. No assumptions about unstated intent

Do NOT flag: trivial style issues, pre-existing problems, hypothetical issues, documentation gaps, or missing tests.

### Finding Format

```
### [P{N}] {Brief title}
**Files:** `file/path.ts:123` (primary), `file/path.test.ts` (add test)
**Problem:** {Why it's a bug, what triggers it, severity}
**Fix:** {Specific approach, not just "fix the bug"}
**Done when:** {How to verify the fix worked}
```

**Example:**
```
### [P1] Division by zero when progress is 0%
**Files:** `src/components/ProgressBar.tsx:34` (primary)
**Problem:** `100 / progress` throws when progress is 0, which occurs for newly created tasks
**Fix:** Guard with `progress > 0 ? (100 / progress) : 0`
**Done when:** ProgressBar renders without error when progress is 0
```

---

## Review Mode

### Step 1: Categorize Changes

Get the diff and categorize files by change type:

**Architectural changes** → assign to `architect-reviewer`:
- API routes, endpoints, controllers
- Database schemas, migrations
- Service interfaces, dependency injection
- Configuration files (docker, CI/CD)
- Directory structure changes

**Implementation changes** → assign to `senior-code-reviewer`:
- UI components, styling
- Business logic within existing patterns
- Bug fixes, refactoring
- Test files
- Utility functions

If a file fits both categories, assign to both reviewers.

### Step 2: Launch Review Subagents

**Scale based on change size:**
- 1-4 files: 1 subagent
- 5-10 files: 2-3 subagents grouped by directory/component
- 10+ files: 3-5 subagents grouped by directory/component

**Each subagent receives:**
- File list to review
- Diff command: `git diff main...HEAD -- <files>` (or `--cached` / no flag for staged/uncommitted)
- Review Criteria section above (priority levels, detection rules, finding format)

Wait for all subagents to complete.

### Step 3: Synthesize and Approve

1. **Collect** all findings from subagents
2. **Deduplicate** overlapping findings
3. **Sort** by priority (P0 first)
4. **Present** unified findings with summary table:

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

**Verdict: CORRECT | NEEDS FIXES**
```

**If no findings:** Report "No issues found" and stop.

**If findings exist:** Use `AskUserQuestion` with options:
- "Approve and save plan"
- "Request changes" — revise based on feedback
- "Open in editor" — save to `.otto/reviews/fix-plan-draft.md` for editing

**On approval**, write fix plan to `.otto/reviews/fix-plan.json`:
```json
{
  "version": 1,
  "created": "{timestamp}",
  "scope": "{scope}",
  "branch": "{branch}",
  "commit_sha": "{HEAD}",
  "summary": { "p0": 0, "p1": 0, "p2": 0, "p3": 0 },
  "verdict": "NEEDS FIXES",
  "fixes": [
    {
      "id": "f1",
      "priority": "P0",
      "title": "Null pointer dereference in user lookup",
      "problem": "user.profile accessed without null check",
      "fix": "Add early return with 404 when user is null",
      "files": [
        { "path": "src/auth/users.ts", "line": 47, "role": "primary" },
        { "path": "src/auth/users.test.ts", "role": "add test" }
      ],
      "done_when": "Returns 404 for missing user; test covers case",
      "status": "pending",
      "depends_on": []
    }
  ]
}
```

Report: `Fix plan saved. Run /review fix to implement.`

---

## Fix Mode

### Step 1: Load and Filter

1. Check `.otto/reviews/fix-plan.json` exists
   - If missing or stale (code changed): run `/review` first
2. Filter by priority argument:
   - `fix` or `fix all`: P0-P3
   - `fix P0`: P0 only
   - `fix P0-P1`: P0 and P1
3. If no matching fixes: report "No {priority} issues to fix"

### Step 2: Implement in Waves

**Select unblocked fixes** — where all `depends_on` are done.

**Scale subagents:**
- 1-2 fixes: 1 subagent
- 3-5 fixes: 2-3 subagents
- 6+ fixes: 3-5 subagents

**Each subagent receives:**
- Fix details (priority, problem, fix approach, files, done_when)
- Instructions: implement fix, verify done_when, run `git add {files}`, mark status done in fix-plan.json

**After each wave:** re-evaluate unblocked fixes, launch next wave, repeat until done.

**Verify:** Run type check and linter, report errors.

### Step 3: Commit and Cleanup

1. Create commit:
   ```
   Fix review issues P{highest}-P{lowest}

   - [P{N}] Brief description
   - [P{N}] Brief description
   ```
2. Remove `.otto/reviews/fix-plan.json`
3. Report results:
   ```
   ## Fix Results
   | Issue | Status |
   |-------|--------|
   | [P0] Null reference | ✓ Fixed |
   | [P1] Race condition | ✓ Fixed |

   Commit: {hash}
   ```
