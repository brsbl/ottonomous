---
name: build
description: "Builds a caller-supplied specification to verified local completion. Use when a user or agent provides a spec reference and working location and wants implementation delegated in bounded slices, integrated, verified, and repeated until the spec is complete or genuinely blocked. The skill does not require task files, sessions, a fixed repository layout, or implicit persistence."
argument-hint: "[spec reference] [working location]"
---

**Input:** $ARGUMENTS

Implement the supplied spec through a lightweight, evidence-driven loop. The
spec defines the outcome; do not require a separately generated work graph or
workflow state.

## Resolve the invocation

Identify:

- **Spec reference:** file, URL, inline content, or surrounding-conversation reference
- **Working location:** repository, worktree, or directory where changes belong
- **Caller constraints:** allowed scope, required tools, output destinations,
  delivery limits, and verification expectations

If the spec reference is missing, ask for it. Use the explicit working location
when supplied; otherwise confirm that the current workspace is the intended
target before changing files.

Read the complete spec and all applicable repository instructions. Do not
create or depend on hidden state, work/session files, generated checklists, or a
fixed directory layout. Keep the completion checklist in the active context.
Write progress or artifacts only when the caller supplies a destination.

## 1. Establish the completion contract

Before implementation:

1. Inspect the working tree and preserve existing user changes.
2. Trace the current behavior and relevant architecture.
3. Extract the spec's observable acceptance criteria, constraints, and open
   decisions into a concise in-context checklist.
4. Identify the repository's real validation commands and UI-verification path.
5. Surface any missing decision that would materially change the implementation.

Do not create branches, commits, pull requests, or releases unless the caller
explicitly includes them in scope.

## 2. Choose the next bounded slice

Select the smallest coherent slice that materially advances one or more unmet
acceptance criteria. A good slice has:

- A single outcome and clear ownership
- A narrow file or component boundary
- Explicit constraints from the spec
- An observable done condition
- Focused verification that can run immediately

Prefer vertical behavior slices over broad layer-by-layer rewrites. Sequence
dependent slices. Parallelize only independent slices whose file ownership and
interfaces do not overlap.

## 3. Delegate implementation

Delegate each selected slice to a subagent. Use the generic
`implementation-worker` persona in `$SKILL_DIR/agents/implementation-worker.md`, or a more
appropriate runtime specialist when one is already available.

Every handoff must include:

```markdown
## Bounded implementation slice
- Spec reference: {exact reference}
- Working location: {exact location}
- Outcome: {one concrete behavior}
- Owned files/components: {explicit boundary}
- Relevant spec constraints: {requirements and non-goals}
- Existing changes to preserve: {known dirty files or adjacent work}
- Done when: {observable condition}
- Verify with: {focused commands or product interaction}

Implement only this slice. Inspect existing patterns before editing. Do not
create workflow-state or planning files, commit, publish, or expand scope.
Return changed files, verification results, assumptions, and blockers.
```

Keep delegation bounded enough that the orchestrator can inspect and integrate
the result. Do not hand the entire spec to one subagent unless the change is
genuinely small.

## 4. Integrate and verify the slice

After each subagent returns:

1. Inspect its diff and the full surrounding code.
2. Confirm it stayed inside its ownership boundary and preserved other changes.
3. Resolve integration gaps, overlapping assumptions, and contract mismatches.
4. Run the focused checks for the slice.
5. Exercise the real user path when the slice changes a visible interface.
6. Add or adjust regression coverage when behavior changed.

Do not treat a subagent's success report as verification. The orchestrator owns
the integrated result and must run or directly inspect the relevant evidence.

If focused verification fails, fix the integration or delegate a new narrowly
scoped correction. Do not mark the criterion complete while the failure
remains.

## 5. Reconcile with the spec and repeat

Re-read the relevant spec sections after every integrated slice. Update the
in-context checklist using evidence from the code and verification:

- **Complete:** acceptance criterion is implemented and verified
- **Remaining:** implementation or proof is still missing
- **Blocked:** completion depends on a missing decision or unavailable external state

Choose the next bounded slice and repeat delegation, integration, and focused
verification until no implementable criteria remain.

Being difficult, slow, or uncertain is not a blocker. Before declaring a
blocker, exhaust safe in-scope investigation and alternatives. A genuine
blocker must name the missing decision or external condition, show what was
tried, and explain why remaining work would require guessing or new authority.

## 6. Run the final gate

When every criterion appears complete:

1. Run the repository's relevant lint, type-check, test, and build commands.
2. Run focused regression tests for changed behavior.
3. Verify every user-visible path in the real product and required environments.
4. Review the cumulative diff against the spec and remove unrelated churn.
5. Confirm no acceptance criterion is satisfied only by assumption.

Fix failures and repeat the loop until the final gate is green or a genuine
blocker is proven.

## Report

Return:

- Spec reference and working location used
- Acceptance criteria completed, with verification evidence
- Changed components and important implementation decisions
- Commands and product checks run, with results
- Remaining work or genuine blockers

Stop at the caller's requested delivery boundary. Local implementation does not
implicitly authorize publishing, opening a pull request, merging, or release.
