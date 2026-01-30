---
name: review
description: Reviews code changes for bugs with P0-P3 prioritized feedback. Uses parallel subagents for thorough analysis, then creates fix plans. Use /review fix to implement fixes. Activates when reviewing code, finding bugs, checking quality, or before merging.
argument-hint: [staged | uncommitted | branch] | fix [P0 | P0-P1 | all]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/review` | Review → Synthesize → Create Fix Plan (branch diff). Launches parallel review subagents. |
| `/review staged` | Same as above, on staged changes |
| `/review uncommitted` | Same as above, on uncommitted changes |
| `/review fix` or `/review fix all` | Implement ALL fixes from saved plan using parallel fix subagents |
| `/review fix P0` | Implement only P0 fixes using parallel fix subagents |
| `/review fix P0-P1` | Implement P0 and P1 fixes using parallel fix subagents |

**Scope (for review mode):**

| Scope | Git command |
|-------|-------------|
| `branch` (default) | `git diff main...HEAD` |
| `staged` | `git diff --cached` |
| `uncommitted` | `git diff` |

---

## Workflow

**Review Mode** (`/review [scope]`):
| Phase | Purpose |
|-------|---------|
| 1. Analyze | Categorize changes and assign reviewers |
| 2. Review | Launch subagents to analyze changes |
| 3. Synthesize | Collect and deduplicate findings |
| 4. Approve | Present fix plan with approaches for user approval |
| 5. Persist | Save approved fix plan to JSON |

**Fix Mode** (`/review fix [priorities]`):
| Phase | Purpose |
|-------|---------|
| 1. Load | Load or generate fix plan |
| 2. Filter | Select fixes by priority |
| 3. Implement | Fix issues using parallel subagents |
| 4. Commit | Stage and commit fixes |

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

### 1. Analyze Change Types

Categorize files by change type to assign appropriate reviewers:

**Architectural changes** (use `architect-reviewer`):
- API routes, endpoints, controllers
- Database schemas, migrations
- Service interfaces, dependency injection
- Configuration files (docker, CI/CD)
- Directory structure changes

**Implementation changes** (use `senior-code-reviewer`):
- UI components, styling
- Business logic within existing patterns
- Bug fixes, refactoring
- Test files
- Utility functions

**Output Format:**
```
### [P{N}] {Brief title}
**Files:** `file/path.ts:123` (primary), `file/path.test.ts` (add test) — if multiple
**Problem:** {1 paragraph: why it's a bug, triggers, severity}
**Fix:** {How to fix it — specific approach, not just "fix the bug"}
**Done when:** {Verification condition — how to know it's fixed}
```

### 2. Review Changes

**Assign files to reviewer types:**
- Group architectural change files → assign to `architect-reviewer` subagents
- Group implementation change files → assign to `senior-code-reviewer` subagents
- If file fits both categories, assign to both reviewers

**Always launch at minimum 1 review subagent. Scale based on change size:**
- Small changes (1-4 files): 1 subagent
- Medium changes (5-10 files): 2-3 subagents grouped by directory/component
- Large changes (10+ files): 3-5 subagents grouped by directory/component

**Launch subagents using Task tool:**
- Use `subagent_type: "architect-reviewer"` for architectural files
- Use `subagent_type: "senior-code-reviewer"` for implementation files

**Each review subagent receives:**
- File list to review
- Diff command (use Bash tool directly, do NOT pipe output):
  - Branch: `git diff main...HEAD -- <files>`
  - Staged: `git diff --cached -- <files>`
  - Uncommitted: `git diff -- <files>`
- Priority levels from above
- Detection criteria from above
- Output format from above

Wait for all review subagents to complete before synthesizing.

### 3. Synthesize Findings

After all review subagents complete:

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

### 4. Present Fix Plan for Approval

**If no findings (CORRECT):** Report "No issues found" and stop.

**If findings exist**, create a fix plan with:
- What to fix (the problem)
- Files involved (primary file + any related files like tests or callers)
- How (specific fix approach — required, not optional)
- Done condition (how to verify the fix worked)
- Dependencies (which fixes must complete first)

**Output the full fix plan** as rendered markdown:

```markdown
## Fix Plan

### [P0] Null pointer dereference in user lookup
**Files:** `src/auth/users.ts:47` (primary), `src/auth/users.test.ts` (add test)
**Problem:** `user.profile` accessed without null check when user not found
**Fix:** Add early return with 404 response when user is null
**Done when:** Function returns 404 for missing user; test covers this case

### [P1] Race condition in cache invalidation
**Files:** `src/cache/store.ts:123` (primary)
**Problem:** Cache read and delete not atomic, stale data returned under load
**Fix:** Use Redis transaction (MULTI/EXEC) to make operation atomic
**Done when:** Cache operations are atomic; no stale reads under concurrent access

## Summary
| Priority | Count |
|----------|-------|
| P0 | 1 |
| P1 | 1 |
```

**Then use `AskUserQuestion`** with options:
- "Approve and save plan"
- "Request changes" — revise the fix approaches based on feedback
- "Open in editor" — save draft to `.otto/reviews/fix-plan-draft.md`, open it, then ask again

Revise until approved.

### 5. Persist Approved Plan

**Write fix plan to `.otto/reviews/fix-plan.json`:**
```json
{
  "version": 1,
  "created": "{timestamp}",
  "scope": "{scope}",
  "branch": "{current branch}",
  "commit_sha": "{HEAD commit}",
  "summary": { "p0": 0, "p1": 0, "p2": 0, "p3": 0 },
  "verdict": "NEEDS FIXES",
  "fixes": [
    {
      "id": "f1",
      "priority": "P0",
      "title": "Null pointer dereference in user lookup",
      "problem": "user.profile accessed without null check when user not found",
      "fix": "Add early return with 404 response when user is null",
      "files": [
        { "path": "src/auth/users.ts", "line": 47, "role": "primary" },
        { "path": "src/auth/users.test.ts", "role": "add test case" }
      ],
      "done_when": "Function returns 404 for missing user; test covers this case",
      "status": "pending",
      "depends_on": []
    }
  ]
}
```

**Report:**
```
Fix plan approved and saved to `.otto/reviews/fix-plan.json`
Run `/review fix` to implement all fixes, or `/review fix P0` for critical only.
```

---

## Fix Mode (`/review fix [priorities]`)

### 1. Load Fix Plan

Check if `.otto/reviews/fix-plan.json` exists:
- **If not found or stale** (code changed since plan created): Automatically run `/review` first, then continue
- **If found and valid**: Load the plan

### 2. Filter Fixes

| Argument | Fixes to include |
|----------|------------------|
| (none) or `all` | All priorities (P0-P3) |
| `P0` | Only P0 (critical) |
| `P0-P1` | P0 and P1 (critical + high) |

1. Filter fixes by requested priorities
2. Verify files still exist
3. If no matching fixes: Report "No {priority} issues to fix"

### 3. Implement Fixes

**Select unblocked fixes** — those where all `depends_on` fixes have status "done".

**Scale subagents based on unblocked fix count:**
- 1-2 unblocked: 1 subagent
- 3-5 unblocked: 2-3 subagents
- 6+ unblocked: 3-5 subagents

**Each subagent receives:**
- Fix details: priority, problem, fix approach, files (with roles), done_when
- Instructions: Implement the fix, verify done_when condition is met
- Stage: "Run `git add {files}` after fix"
- Update: "Mark fix status as done in fix-plan.json"

**After each wave completes:**
1. Re-evaluate which fixes are now unblocked
2. Launch next wave of subagents
3. Repeat until all fixes are done

**Verify all fixes:**
1. Run type check: `npx tsc --noEmit` (if TypeScript)
2. Run linter: detect and run appropriate linter
3. Report any remaining errors

### 4. Commit and Cleanup

1. Stage all modified files: `git add <files>`
2. Create commit:
   ```
   Fix review issues P{highest}-P{lowest}

   - [P{N}] Brief description of fix
   - [P{N}] Brief description of fix
   ...
   ```
3. Remove fix plan: `rm .otto/reviews/fix-plan.json`

**Report:**
```
## Fix Results

| Issue | Status |
|-------|--------|
| [P0] Null reference | ✓ Fixed |
| [P1] Race condition | ✓ Fixed |

Commit: {hash}
```

---

## Example Finding

### [P1] Division by zero when progress is 0%

**Files:** `src/components/ProgressBar.tsx:34` (primary)
**Problem:** The percentage calculation `100 / progress` will throw when `progress` is 0, which occurs when a task is newly created. This affects TaskList which renders ProgressBar for all tasks.
**Fix:** Guard against zero by checking `progress > 0` before division
**Done when:** ProgressBar renders without error when progress is 0

```tsx
const width = progress > 0 ? (100 / progress) : 0;
```
