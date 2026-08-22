---
name: review
description: "Reviews code changes for concrete bugs with P0-P2 prioritized findings. Uses parallel architectural and implementation reviewers, then validates findings to remove false positives. Use when reviewing a caller-supplied diff, branch, staged changes, file set, or pull request, and use fix mode with caller-supplied findings to implement approved fixes. Results and output destinations are caller-controlled; no persistent workflow state is required."
argument-hint: "[target or scope] [output destination] | fix [findings reference] [P0 | P0-P1 | all]"
---

**Input:** $ARGUMENTS

Review the caller's target or implement fixes from caller-supplied findings.
Return results inline unless the caller provides an output destination.

## Resolve the invocation

Identify:

- **Working location:** repository or worktree to inspect
- **Target:** explicit diff command, refs/range, pull request, file set, staged
  changes, or branch changes
- **Mode:** review or fix
- **Output destination:** optional caller-selected location
- **Fix selection:** all findings, P0 only, or P0-P1

An explicit caller target always wins. When invoked without a target in a Git
repository, review the current branch against its merge base with the default
branch. `staged` means `git diff --cached`. State the exact scope and command
used so the review is reproducible.

Do not invent a review registry, fixed plan path, or hidden persistence. In fix
mode, use findings supplied inline, by exact reference, or from the current
conversation. If none are available, ask the caller for them.

## Review mode

### 1. Inspect and categorize the change

Read the complete diff, list changed and untracked files in scope, and inspect
the full source context needed to understand each change.

Assign architectural changes to the `architect-reviewer` persona in
`agents/architect-reviewer.md`:

- APIs, schemas, migrations, services, dependency boundaries, configuration,
  directory structure, and public contracts

Assign implementation changes to the `senior-code-reviewer` persona in
`agents/senior-code-reviewer.md`:

- UI, business logic, bug fixes, refactors, tests, and utilities

Assign a file to both when both lenses materially apply.

### 2. Delegate independent review

Scale to the change rather than a fixed ceremony:

- Small, cohesive diff: one reviewer with the appropriate persona
- Several independent components: one reviewer per meaningful component
- Large cross-cutting diff: multiple reviewers with explicit, non-overlapping scopes

Run independent scopes in parallel when the runtime supports it. Give every
reviewer:

- Exact working location and file list
- Exact diff command or target reference
- Relevant product/spec context supplied by the caller
- Instruction to read full surrounding source, not only the patch

Reviewers return only concrete P0-P2 findings in the documented format. Wait
for every delegated review before synthesis.

### 3. Synthesize findings

Collect, deduplicate, and sort findings by priority. Keep one discrete issue per
finding and preserve evidence and done conditions.

```markdown
## Code Review Findings

| P | Problem | Fix approach | Files | Done when |
| --- | --- | --- | --- | --- |
| P0 | Null pointer in user lookup | Add an early 404 return | `users.ts:47` | Missing user returns 404 |

**Verdict: CORRECT | NEEDS FIXES**
```

If no findings remain, report `CORRECT` and stop review mode.

### 4. Validate false positives

Delegate the synthesized list to `false-positive-validator` using the persona
in `agents/false-positive-validator.md`. Provide the exact target and working
location. The validator may keep, downgrade, or remove findings but may not add
new ones.

Replace the list with kept and downgraded findings, then report removed or
changed findings in a collapsed validation section with evidence. If all
findings are removed, report `CORRECT`.

### 5. Resolve ambiguity and produce the fix plan

For each valid finding whose fix requires a real product or architecture
choice, present the options and ask the caller to decide. Do not silently choose
a breaking contract or high-impact behavior.

Return a self-contained fix plan containing:

- Target identity and reviewed revision/range
- Priority, title, problem, fix, files, and done condition for each finding
- Dependencies between fixes only where ordering is genuinely required
- Validation removals and downgrades
- Final verdict

If the caller supplied an output destination, write the plan there after
showing it. Otherwise keep the full plan inline. Do not require approval merely
to report review findings; approval is required before entering fix mode.

## Fix mode

### 1. Load and validate the supplied findings

Read the inline findings or exact caller-supplied reference. Confirm the target
still matches the reviewed code; if it materially changed, explain the stale
scope and ask whether to continue or obtain a new review.

Filter by the requested priority:

- `fix` or `fix all`: P0-P2
- `fix P0`: P0 only
- `fix P0-P1`: P0 and P1

If no finding matches, report that and stop.

### 2. Implement approved fixes in bounded batches

Use only findings the caller approved. Select fixes whose dependencies are
satisfied, group nearby or overlapping files under one owner, and parallelize
only disjoint file scopes.

Each subagent receives:

- Complete finding details and done condition
- Current contents of the files it may modify
- Exact working location and ownership boundary
- Required focused verification

After each batch, inspect and integrate the diffs, run the focused checks, then
continue with newly unblocked fixes. Do not let subagents stage, commit, publish,
or mutate a shared plan file unless the caller explicitly asks for that action.

### 3. Verify and report

Run the repository's relevant type checks, lint, tests, and product verification
after all selected fixes. Correct integration failures within the approved
scope; do not run another deliberate code review unless the caller requests it.

Return:

```markdown
## Fix results

| Finding | Status | Evidence |
| --- | --- | --- |
| [P0] Null reference | Fixed | Focused regression test passes |
```

If the caller supplied an output destination, update that exact destination.
Do not create commits or delivery artifacts unless separately requested.
