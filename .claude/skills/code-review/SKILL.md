---
name: code-review
description: Review code changes for bugs with prioritized, actionable feedback. Provides matter-of-fact analysis with severity levels. Invoke with /code-review.
---

# Code Review

Review code changes for bugs and issues with prioritized, actionable feedback.

## Workflow

### 1. Determine Review Scope

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
```

### 2. Gather Changes

Based on scope selection:

```bash
# Staged
git diff --cached

# Uncommitted
git diff

# Branch
git diff main...HEAD

# Specific commits
git show <commit-sha>
```

### 3. Review the Changes

Apply the bug detection criteria and generate findings.

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
