---
name: spec
description: "Writes high-quality product specifications through codebase research, web research, a collaborative requirements interview, independent review, and user approval. Use when planning a feature, defining requirements, revising an existing draft, or creating a spec/PRD. Accepts caller-supplied source references, working locations, formats, and output destinations; it does not require a repository layout or persistent workflow state."
argument-hint: "[idea or existing draft/spec reference] [working location] [output destination]"
---

**Input:** $ARGUMENTS

Create or revise one product specification. The caller may provide the idea or
draft inline, as a file reference, or through the surrounding conversation.

## Resolve the invocation

Identify these inputs from the caller's request:

- **Source:** product idea, inline draft, or existing spec reference
- **Working location:** codebase or context to research
- **Output destination:** optional caller-selected file or external destination
- **Format constraints:** optional template, frontmatter, note system, or style

Ask only for information that blocks useful progress. If the caller omits an
output destination, return the approved spec inline and do not write a file.
Never invent a spec registry, fixed directory, hidden state file, duplicate
copy, or symlink. If the caller supplies a destination, use exactly that
destination and keep any supporting assets beside it or in a caller-selected
asset location.

When revising an existing file, read it completely before editing. Preserve
user-authored content, required metadata, comments, links, and layout unless a
requested change requires otherwise.

## 1. Gather product and codebase context

For a new idea, ask whether reference products or examples matter. For an
existing draft, treat its decided requirements as constraints rather than
reopening them without evidence.

Inspect the supplied working location:

- Find the relevant files, interfaces, data models, and product surfaces.
- Trace the current behavior and name important architectural constraints.
- Search repository history when the proposal changes a public contract or a
  previously decided behavior.
- Separate observed facts from assumptions and open decisions.

If no working location is supplied, continue with product discovery and mark
codebase-dependent claims as assumptions.

## 2. Research the problem

Use web research when current external evidence would improve the decision:

- Primary documentation for APIs, platforms, standards, or constraints
- Established product patterns and comparable implementations
- Known failure modes, security concerns, and accessibility expectations

Prefer primary sources. Record links and the decision each source informed.
Do not save research artifacts unless the caller supplied a destination.

## 3. Interview for consequential decisions

Interview the caller about requirements that materially change scope, behavior,
architecture, rollout, or risk. Group related decisions to reduce interruption.

For each decision:

- State why the decision matters.
- Offer two or three concrete options when reasonable.
- Put the recommended option first and explain its tradeoff.
- Preserve unresolved decisions explicitly instead of inventing an answer.

Cover the relevant parts of:

- Problem, users, and desired outcome
- Goals and non-goals
- Primary workflow and edge cases
- Data ownership, lifecycle, permissions, and failure behavior
- Public interfaces and compatibility
- Rollout, observability, migration, and reversal
- Objective acceptance criteria

## 4. Draft one canonical spec

Write for fast product and implementation review: lead with the decision,
prefer short sections and tables where they improve comparison, keep one
concept in one canonical place, and make every requirement observable.

Adapt the structure to the feature, but cover these concerns when relevant:

```markdown
# {Name}

> {One sentence: what approving and building this spec means, plus any open decision.}

**Proposal:** {One plain sentence describing the change.}

## Today
{Current behavior, evidence, and the problem.}

## Goals and non-goals
{Explicit scope boundaries.}

## User workflow and rules
{Primary flow, states, edge cases, and error behavior.}

## Design
{Architecture, data flow, interfaces, ownership, and compatibility.}

## What ships when
{Stages with observable enablement or rollout conditions, not arbitrary dates.}

## Done looks like
{Testable acceptance criteria.}

## Risks and open questions
{Unresolved decisions, mitigations, and reversal plan.}

## Research
{Source links and what each informed.}
```

Use portable Markdown by default. If the destination is a Moss note or the
caller requests Moss syntax, read and follow the current Moss authoring rules
and use Moss-native nodes where they add value. For any other destination,
follow that format's conventions. Add metadata only when the caller or target
format requires it.

Mark missing information as `[TBD: reason]`. Do not hide unresolved decisions
behind vague language.

## 5. Run an independent spec review

Delegate the draft to the `technical-product-manager` subagent using the
persona in `agents/technical-product-manager.md`.

Provide:

- The full draft inline or the exact caller-supplied reference
- Relevant working-location and codebase context
- Decided constraints and deliberately open questions
- Any required output format or metadata

The reviewer checks completeness, consistency, feasibility, ambiguity,
technical correctness, simplicity, and acceptance criteria. Wait for its P0-P2
findings.

Validate each finding against the draft and source context. Discard false
positives. For valid findings, apply unambiguous corrections and ask the caller
to decide genuine product alternatives. Do not silently choose a breaking
contract or architecture decision.

## 6. Get approval and deliver

Present the full revised spec for approval. Offer focused choices:

- **Approve**
- **Request changes**
- **Choose an unresolved alternative**, when one remains

After each revision, present the complete updated spec again. On approval:

- If the caller supplied an output destination, write or update that exact
  destination and report it.
- Otherwise, return the complete approved spec inline.

Report the source/context used, decisions still open, and any research or
codebase limitation that affects confidence. Do not start implementation or
create additional workflow artifacts unless the caller separately requests it.
