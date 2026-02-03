---
name: review
description: Reviews code changes for bugs with P0-P2 prioritized feedback. Uses parallel subagents for thorough analysis, then creates fix plans. Use when reviewing code, finding bugs, checking quality, or before merging. Use /review fix to implement fixes.
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

**Handoff to reviewer subagents:**
- File list to review
- Diff command: `git diff main...HEAD -- <files>` (or `--cached` / no flag for staged/uncommitted)
- Scope context (branch, staged, or uncommitted)

Subagents return prioritized findings (P0-P2) in consistent format with Files, Problem, Fix, and Done when.

Wait for all subagents to complete.

### Step 3: Synthesize Findings

1. **Collect** all findings from subagents
2. **Deduplicate** overlapping findings
3. **Sort** by priority (P0 first)
4. **Present** findings table for review:

```markdown
## Code Review Findings

| P | Problem | Fix Approach | Files | Done When |
|---|---------|--------------|-------|-----------|
| P0 | Null pointer in user lookup | Add early return with 404 | `users.ts:47` | Returns 404 for missing user |
| P1 | Race condition in cache | Use mutex lock | `cache.ts:23` | Concurrent requests don't corrupt |
| ... | ... | ... | ... | ... |

**Verdict: CORRECT | NEEDS FIXES**
```

**If no findings:** Report "No issues found" and stop.

### Step 4: Resolve and Approve

**Resolve ambiguous fixes first.** If any fix contains multiple approaches ("Either...OR", "Option A/B"), use `AskUserQuestion` to pick one before approval:

```
[P0] Plugin discovery limited to 3 hardcoded paths

The fix has multiple options:
A) Restore two-pass file fetching (more complete, adds complexity)
B) Remove dead countCommands/countSkills functions (simpler, less data)

Which approach?
```

Update the fix with the chosen approach.

**Then ask for approval** using `AskUserQuestion`:
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
   - `fix` or `fix all`: P0-P2
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
