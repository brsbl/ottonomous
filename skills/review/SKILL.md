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
| 1. Review | Analyze changes using review criteria (launches subagents) |
| 2. Synthesize | Collect and deduplicate findings |
| 3. Fix Plan | Create implementation plan and persist to file |

**Fix Mode** (`/review fix [priorities]`):
| Phase | Purpose |
|-------|---------|
| 4. Implement | Fix issues using parallel subagents |
| 5. Commit | Stage and commit fixes |

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

### 1b. Analyze Change Types

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
**Location:** `file/path.ts:123`
{1 paragraph: why it's a bug, triggers, severity}
{Optional: up to 3 lines showing fix}
```

### 2. Review Changes (Launch Subagents)

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

### 4. Create Fix Plan and Persist

For each issue, define:
- What to fix
- Where (file, line)
- How (approach)
- Dependencies

Group fixes for parallel implementation:
- **Batch A**: Independent fixes (can run in parallel)
- **Batch B**: Dependent fixes (must wait)

**Persist fix plan to `.otto/reviews/fix-plan.json`:**
```json
{
  "version": 1,
  "created": "{timestamp}",
  "scope": "{scope}",
  "branch": "{current branch}",
  "commit_sha": "{HEAD commit}",
  "findings": {
    "summary": { "p0": 0, "p1": 0, "p2": 0, "p3": 0 },
    "verdict": "CORRECT | NEEDS FIXES",
    "items": [
      {
        "id": "f1",
        "priority": "P0",
        "title": "Brief title",
        "location": { "file": "path/to/file.ts", "line": 123 },
        "description": "Why it's a bug",
        "suggested_fix": "Optional code snippet"
      }
    ]
  },
  "fix_plan": {
    "batches": [
      { "id": "A", "description": "Independent fixes", "fixes": [...] },
      { "id": "B", "description": "Dependent fixes", "fixes": [...] }
    ]
  },
  "status": "pending"
}
```

**If no findings (CORRECT):** Skip creating fix-plan.json, report "No issues found".

**Report:**
```
## Review Complete

Findings: {p0} P0, {p1} P1, {p2} P2, {p3} P3
Verdict: {CORRECT | NEEDS FIXES}

Fix plan saved to `.otto/reviews/fix-plan.json`
Run `/review fix` to implement all fixes, or `/review fix P0` for critical only.
```

---

## Fix Mode (`/review fix [priorities]`)

### F1. Load or Generate Fix Plan

Check if `.otto/reviews/fix-plan.json` exists:
- **If not found or stale** (code changed since plan created): Automatically run `/review` first, then continue
- **If found and valid**: Load the plan

### F2. Parse Priority Filter

| Argument | Fixes to include |
|----------|------------------|
| (none) or `all` | All priorities (P0-P3) |
| `P0` | Only P0 (critical) |
| `P0-P1` | P0 and P1 (critical + high) |

### F3. Filter and Validate

1. Filter fixes by requested priorities
2. Verify files still exist
3. If no matching fixes: Report "No {priority} issues to fix"

### F4. Implement Fixes (Launch Subagents)

**Always launch at minimum 1 fix subagent. Scale based on fix count:**
- 1-2 fixes: 1 subagent
- 3-5 fixes: 2-3 subagents grouped by file type/specialty
- 6+ fixes: 3-5 subagents grouped by file type/specialty

**Batch A (independent fixes) launch in parallel:**
Each subagent receives:
- Finding details (priority, description, location)
- Fix instructions (what, where, how)
- Verification: "Ensure file compiles, run type check"
- Stage: "Run `git add {file}` after fix"

Wait for all Batch A subagents to complete.

**Batch B (dependent fixes) run sequentially** after Batch A.

### F5. Verify Fixes

1. Run type check: `npx tsc --noEmit` (if TypeScript)
2. Run linter: detect and run appropriate linter
3. Report any remaining errors

### F6. Commit

1. Stage all modified files: `git add <files>`
2. Create commit:
   ```
   Fix review issues P{highest}-P{lowest}

   - [P{N}] Brief description of fix
   - [P{N}] Brief description of fix
   ...
   ```

### F7. Report and Cleanup

```
## Fix Results

| Issue | Status |
|-------|--------|
| [P0] Null reference | ✓ Fixed |
| [P1] Race condition | ✓ Fixed |

Commit: {hash}
```

After successful commit, remove the fix plan file:
```bash
rm .otto/reviews/fix-plan.json
```

---

## Example Finding

### [P1] Division by zero when progress is 0%

**Location:** `src/components/ProgressBar.tsx:34`

The percentage calculation `100 / progress` will throw when `progress` is 0, which occurs when a task is newly created. This affects TaskList which renders ProgressBar for all tasks.

```tsx
const width = progress > 0 ? (100 / progress) : 0;
```
