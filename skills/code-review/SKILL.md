---
name: code-review
description: Review code changes for bugs with prioritized, actionable feedback. Uses parallel subagents for thorough review of large changes, then creates fix plans and delegates implementation. Invoke with /code-review.
---

# Code Review

Review code changes for bugs and issues with prioritized, actionable feedback. For large changesets, distributes review across multiple subagents for thorough coverage.

## Auto Mode

**Check for AUTO_MODE at the start of every workflow:**

```bash
AUTO_MODE=$(grep -q "auto_pick: true" .otto/config.yaml 2>/dev/null && echo "true" || echo "false")
```

**When `AUTO_MODE=true`:**
- **Phase 0 (Config):** Skip agent selection prompt, use defaults or existing config
- **Phase 1 (Scope):** Default to "Branch diff" (`git diff main...HEAD`), skip scope selection
- **Phase 4 (Fix Plan):** Auto-approve fix plan for P0 and P1 issues only
  - P0/P1: Implement fixes
  - P2/P3: Log as known issues, skip implementation
  - Log: `[AUTO] Auto-approved {n} fixes (P0: {n}, P1: {n})`
- **Phase 5 (Implement):** If any fix fails, log the failure and continue with remaining fixes
  - Do not block on any single fix failure
  - Log: `[AUTO] Fix failed for {issue}: {error}. Continuing...`

## Workflow Overview

| Phase | Purpose | Subagents Used |
|-------|---------|----------------|
| 0. Config | Discover and configure agents | None |
| 1. Scope | Determine what to review | None |
| 2. Review | Thoroughly analyze all changes | Review agents (parallel) |
| 3. Synthesize | Collect and deduplicate findings | None |
| 4. Fix Plan | Create implementation plan for issues | None |
| 5. Implement | Fix all issues found | Implementation agents (parallel) |

---

## Phase 0: Discover Available Subagents

**First run only** — Configure which agents to use.

```bash
# Check for existing config
cat .claude/skills/code-review/config.json 2>/dev/null
```

**If config.json doesn't exist:**

1. **Discover available agents:**
   ```bash
   ls ~/.claude/agents/*.md .claude/agents/*.md 2>/dev/null
   ```

2. **Read each agent's frontmatter** to understand their purpose

3. **Categorize agents by role:**

   | Role | Agent Types | Purpose |
   |------|-------------|---------|
   | **Review** | `senior-code-reviewer`, `architect-reviewer` | Find bugs and issues |
   | **Implementation** | `frontend-developer`, `backend-architect`, `general-purpose` | Fix issues |

4. **Use AskUserQuestion** (multiSelect: true) to confirm:
   > "I found these agents for code review:
   > - Review: [list review agents]
   > - Implementation: [list impl agents]
   >
   > Which agents should I use for each role?"

5. **Save config.json:**
   ```json
   {
     "review_agents": ["senior-code-reviewer", "architect-reviewer"],
     "implementation_agents": {
       "frontend": "frontend-developer",
       "backend": "backend-architect",
       "default": "general-purpose"
     },
     "configured_at": "2025-01-14"
   }
   ```

**If config.json exists**, load it and proceed.

---

## Phase 1: Determine Review Scope

Ask the user what to review:

**Options:**
- **Staged changes** — `git diff --cached`
- **All uncommitted changes** — `git diff`
- **Branch diff** — `git diff main...HEAD`
- **Specific files** — User provides file paths
- **Recent commits** — `git diff HEAD~N`

```bash
# Show available options
git status --short

# Count changed files for distribution planning
git diff main...HEAD --stat | tail -1
```

### 1b. Gather Changes

Based on scope selection:

```bash
# Staged
git diff --cached

# Uncommitted
git diff

# Branch
git diff main...HEAD --name-only

# Get full diff for review
git diff main...HEAD
```

---

## Phase 2: Distribute Review to Subagents

### When to Use Parallel Review

- **Small changes** (<5 files, <300 lines): Review directly yourself
- **Medium changes** (5-15 files): Launch 2-3 parallel review subagents
- **Large changes** (15+ files): Launch 4-5 parallel review subagents, grouped by directory/feature

### Agent Selection Strategy

Use ALL configured review agents for comprehensive coverage. Each agent brings a different perspective:

| Agent | Focus | Best For |
|-------|-------|----------|
| `senior-code-reviewer` | Bugs, quality, security | All code changes |
| `architect-reviewer` | Patterns, SOLID, structure | Structural changes, new services |

**Routing by file type:**
- `.tsx`, `.jsx`, `.css` → Include `frontend-developer` perspective if available
- `api/`, `services/`, `.controller.` → Include `backend-architect` perspective if available
- All files → Always include `senior-code-reviewer`

### Grouping Strategy

Group files for subagent review by:
1. **Directory** — Files in the same folder are likely related
2. **Feature area** — Components, hooks, services, tests
3. **Dependencies** — Files that import each other

```bash
# List files by directory for grouping
git diff main...HEAD --name-only | sort | uniq

# Identify file types for agent routing
git diff main...HEAD --name-only | xargs -I {} basename {} | sort | uniq -c
```

### Launch Review Subagents

For thorough coverage, launch **multiple types** of review agents in parallel:

**Strategy A: By file group** — Same agent reviews related files
**Strategy B: By perspective** — Multiple agents review same files for different concerns

Recommended: Use **both strategies** for critical reviews.

For each file group, launch review subagents **in parallel**:

```
## Task Context

### Background
Code review for branch changes. Reviewing files in [directory/area].

### Your Assignment
Review these files for bugs, using [P0-P3] severity levels:

Files to review:
- `path/to/file1.ts`
- `path/to/file2.ts`
- `path/to/file3.ts`

Run `git diff main...HEAD -- <file>` to see changes for each file.

### Bug Detection Criteria
A finding should only be flagged if it meets ALL of these:
1. Meaningful impact on accuracy, performance, security, or maintainability
2. Discrete and actionable (specific issue, not general concern)
3. Introduced in this change (not pre-existing)
4. Author would fix it if aware
5. No unstated assumptions about intent

### Expected Output
For each issue found:
### [P{N}] {Brief title}
**Location:** `file/path.ts:123`
{1 paragraph: why it's a bug, triggers, severity factors}
{Optional: up to 3 lines showing fix}

If no issues found, state: "No issues found in [file list]"
```

**IMPORTANT**: Launch all review subagents in a single message with multiple Task tool calls to maximize parallelism.

### Example: Multi-Agent Review Launch

For a branch with frontend and backend changes, launch in parallel:

```
Task 1: senior-code-reviewer → src/components/*.tsx (bug focus)
Task 2: senior-code-reviewer → src/api/*.ts (bug focus)
Task 3: architect-reviewer → all structural changes (architecture focus)
Task 4: frontend-developer → src/components/*.tsx (React patterns, a11y)
Task 5: backend-architect → src/api/*.ts (API design, performance)
```

All 5 subagents run simultaneously, each bringing their specialized perspective.

---

## Phase 3: Synthesize Findings

After all review subagents complete:

1. **Collect** all findings from each subagent
2. **Deduplicate** — Remove duplicate findings across file groups
3. **Sort by priority** — P0 first, then P1, P2, P3
4. **Cross-reference** — Note if issues in one file affect others

Present unified findings to user:

```markdown
## Code Review Findings

[All findings sorted by priority]

---

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | N | [Blocking issues] |
| P1 | N | [Urgent issues] |
| P2 | N | [Normal priority] |
| P3 | N | [Low priority] |

**Overall Correctness: [CORRECT / NEEDS FIXES]**

{If NEEDS FIXES}: Found {total} issues. {P0+P1 count} are blocking.
```

---

## Phase 4: Create Fix Plan

If issues were found, create an implementation plan:

> "I found {N} issues that need fixing. Let me create an implementation plan."

### Plan Structure

For each issue, define:
1. **What to fix** — The specific code change needed
2. **Where** — File path and line numbers
3. **How** — Approach (may reference the suggested fix from review)
4. **Dependencies** — Other fixes that must happen first/after

```markdown
## Fix Implementation Plan

### Fix 1: [P0] {Issue title}
**File:** `src/utils/users.ts:45`
**Change:** Add null check before array access
**Approach:** Check array length before accessing index 0
**Dependencies:** None

### Fix 2: [P1] {Issue title}
**File:** `src/hooks/useData.ts:78`
**Change:** Add cleanup to prevent race condition
**Approach:** Use AbortController to cancel pending requests
**Dependencies:** None (can be done in parallel with Fix 1)

...
```

### Group Fixes for Parallel Implementation

Group independent fixes for parallel subagent execution:
- **Batch A**: Fixes 1, 3, 5 (independent, can run in parallel)
- **Batch B**: Fixes 2, 4 (depend on Batch A)

Present plan to user:

> "Here's the fix plan:
> - {N} independent fixes can be done in parallel (Batch A)
> - {M} fixes depend on others (Batch B)
>
> Should I proceed with implementing these fixes?"

**CHECKPOINT**: Wait for user approval before Phase 5.

---

## Phase 5: Implement Fixes

Launch subagents to implement the fixes using the configured implementation agents.

### Agent Routing for Fixes

Route fixes to the appropriate agent based on file location and type:

| File Pattern | Agent | Reason |
|--------------|-------|--------|
| `components/`, `*.tsx`, `*.jsx`, `*.css` | `frontend-developer` | React, styling, a11y |
| `api/`, `services/`, `*.controller.*` | `backend-architect` | API, database, services |
| `hooks/`, `utils/`, other | `general-purpose` | General TypeScript/JS |

### Group Fixes by Agent

Before launching, group fixes so each agent handles related files:

```
Batch A (parallel):
  - frontend-developer: Fix 1, Fix 3 (both in components/)
  - backend-architect: Fix 2 (in api/)
  - general-purpose: Fix 4, Fix 5 (in utils/)

Batch B (after A completes):
  - frontend-developer: Fix 6 (depends on Fix 1)
```

### Launch Fix Subagents (Parallel)

For each batch, launch all agents **in parallel**:

```
## Task Context

### Background
Implementing fixes from code review. You are the [agent-type] specialist.

### Your Assignment
Fix these issues in your domain:

#### Fix 1: [P0] {Issue title}
**File:** `src/components/Button.tsx:45`
**Problem:** Missing accessibility attributes
**Fix:** Add aria-label and keyboard handler

#### Fix 3: [P1] {Issue title}
**File:** `src/components/Form.tsx:123`
**Problem:** Uncontrolled input warning
**Fix:** Add value prop and onChange handler

### Your Expertise
[For frontend-developer]: Focus on React patterns, accessibility, TypeScript types
[For backend-architect]: Focus on API contracts, error handling, data validation
[For general-purpose]: Focus on logic correctness, edge cases, type safety

### Constraints
- Make minimal changes — only fix the specific issues
- Don't refactor surrounding code
- Preserve existing patterns and style
- Run TypeScript check after changes

### Expected Output
- List of files changed with descriptions
- Verification status (TypeScript passes)
- Any issues encountered
```

### Example: Parallel Fix Launch

For 5 fixes across different domains:

```
Single message with 3 Task tool calls:

Task 1: frontend-developer
  "Fix these React/UI issues:
   - Fix 1: Missing aria-label in Button.tsx:45
   - Fix 3: Uncontrolled input in Form.tsx:123"

Task 2: backend-architect
  "Fix these API issues:
   - Fix 2: Missing validation in UserController.ts:89"

Task 3: general-purpose
  "Fix these utility issues:
   - Fix 4: Off-by-one in pagination.ts:34
   - Fix 5: Race condition in cache.ts:56"
```

All 3 agents work simultaneously on their assigned fixes.

### After Fixes Complete

Collect results from all fix subagents:

```markdown
## Fix Implementation Results

### Completed Fixes
| Issue | File | Status |
|-------|------|--------|
| [P0] Null reference | `users.ts:45` | ✓ Fixed |
| [P1] Race condition | `useData.ts:78` | ✓ Fixed |

### Verification
- TypeScript: Pass
- Files changed: {N}

### Remaining Work
{Any fixes that couldn't be completed}
```

---

## Phase 6: Verification Review (Optional)

After fixes are implemented, optionally run a quick verification:

> "Fixes complete. Should I run a quick verification review to ensure the fixes are correct?"

If yes, launch a single `senior-code-reviewer` subagent to review only the fix changes:

```bash
git diff HEAD~1  # Review only the fix commit
```

### Visual Verification (Optional)

For UI changes, offer visual verification:

> "Should I use `/dev-browser` to visually verify the UI changes are correct?"

If yes:
- Launch browser to affected pages
- Capture screenshots of the changes
- Compare against expected behavior
- Include findings in review report

---

## Quick Mode

If user specifies "quick" or the changeset is small:
- Skip parallel subagent distribution
- Review directly yourself
- Still offer to create fix plan and implement

---

## Bug Detection Criteria

A finding should only be flagged if it meets ALL of these criteria:

1. **Meaningful impact** — It meaningfully affects accuracy, performance, security, or maintainability

2. **Discrete and actionable** — It's a specific issue, not a general code quality concern

3. **Appropriate rigor** — Fixing it doesn't demand more rigor than exists in the rest of the codebase

4. **Introduced in this change** — Pre-existing issues should not be flagged

5. **Author would fix it** — The original author would likely fix this if aware

6. **No unstated assumptions** — The issue doesn't rely on assumptions about intent

7. **Provably affects other code** — If claiming disruption, identify the specific affected code

8. **Not intentional** — The issue is clearly not an intentional design choice

---

## Finding Format

For each issue found, use this format:

### [P{N}] {Brief title describing the issue}

**Location:** `file/path.ts:123`

{1 paragraph explaining:
- Why this is a bug
- The specific scenarios/inputs that trigger it
- The severity depends on these factors}

{Optional: up to 3 lines of code showing the fix}

---

## Priority Levels

Tag each finding with priority:

| Level | Meaning | When to Use |
|-------|---------|-------------|
| **[P0]** | Drop everything | Universal issues, blocking release. Only for issues that don't depend on any assumptions. |
| **[P1]** | Urgent | Should be fixed in the next cycle |
| **[P2]** | Normal | Should be fixed eventually |
| **[P3]** | Low | Nice to have |

---

## Comment Guidelines

When writing findings:

1. **Be clear about why** — Explain why it's a bug, not just what's wrong

2. **Communicate severity accurately** — Don't overstate the impact

3. **Be brief** — Body should be at most 1 paragraph

4. **Limit code snippets** — No chunks longer than 3 lines, use inline code or code blocks

5. **Specify triggers** — Clearly state the scenarios, environments, or inputs required

6. **Use matter-of-fact tone** — Helpful AI assistant, not accusatory or overly positive

7. **Enable quick understanding** — The author should grasp the idea without close reading

8. **Avoid flattery** — No "Great job...", "Thanks for...", or unnecessary praise

---

## What to Ignore

Do NOT flag:

- Trivial style issues (unless they obscure meaning)
- Pre-existing problems
- Hypothetical issues without specific affected code
- Intentional design decisions
- Documentation gaps (unless causing bugs)
- Missing tests (unless specifically requested)

---

## Output Format

Present findings as a markdown list:

```markdown
## Code Review Findings

### [P1] Null reference when user array is empty

**Location:** `src/utils/users.ts:45`

The `getFirstUser()` function returns `users[0]` without checking if the array is empty. When called with an empty user list (e.g., new accounts with no team members), this returns `undefined` which will cause the caller at `Dashboard.tsx:23` to throw when accessing `.name`.

```typescript
return users.length > 0 ? users[0] : null;
```

---

### [P2] Race condition in async state update

**Location:** `src/hooks/useData.ts:78`

...
```

---

## Overall Verdict

After all findings, provide a correctness verdict:

> **Overall Correctness: [CORRECT / NEEDS FIXES]**
>
> {If CORRECT}: The changes are free of blocking bugs. Existing code and tests will not break.
>
> {If NEEDS FIXES}: Found {N} issues that should be addressed before merging. {P0/P1 count} are blocking.

**Note:** Only blocking issues (bugs, breaks) affect this verdict. Style, formatting, typos, and documentation issues do not affect correctness.

---

## Example Review

### [P1] Division by zero when progress is 0%

**Location:** `src/components/ProgressBar.tsx:34`

The percentage calculation `100 / progress` will throw when `progress` is 0, which occurs when a task is newly created. This affects the TaskList component which renders ProgressBar for all tasks.

```tsx
const width = progress > 0 ? (100 / progress) : 0;
```

---

### [P2] Stale closure captures initial count

**Location:** `src/hooks/useCounter.ts:15`

The `increment` callback captures the initial `count` value due to missing dependency. Rapid clicks will not accumulate correctly. This occurs when users click the increment button multiple times before re-render.

```tsx
const increment = useCallback(() => setCount(c => c + 1), []);
```

---

**Overall Correctness: NEEDS FIXES**

Found 2 issues. The P1 division by zero is blocking and will cause runtime errors for new tasks.
