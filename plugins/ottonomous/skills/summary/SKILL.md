---
name: summary
description: "Creates a decision-focused Moss change summary for reviewers who care about the problem, outcomes, trade-offs, and platform implications more than code structure. Use for pull-request summaries, release notes, branch or diff overviews, implementation handoffs, and explanations of what changed and why it matters. Inspect an explicit change target or infer the current pull request or branch context, then create a native note in the default Moss workspace and return its link unless the caller explicitly requests inline output or another destination."
argument-hint: "[PR, branch, range, or diff] [optional issue/spec context] [optional destination or inline]"
---

# Summary

Turn a code change into a durable Moss decision brief that lets a reviewer
align on the problem first, then judge the outcome, trade-offs, platform
implications, and evidence without reading the code.

## 1. Resolve the change and its evidence

Use an explicit pull request, branch, commit range, supplied diff, or file set
when the caller names one. Otherwise infer the review target from the active
context in this order:

1. the pull request associated with the current session or branch;
2. the current branch against its repository-resolved merge base;
3. staged or unstaged changes only when the request clearly refers to the
   current uncommitted work.

Do not ask the caller for a repository path when the active working directory,
thread, or pull-request metadata already identifies the source. Ask a concise
question only when there is no inspectable change or more than one plausible
target. Never assume `main` is the merge base when repository or pull-request
metadata can identify it.

Identify the evidence that frames the review:

- **Problem evidence:** pull-request description, linked issue or spec, commit
  intent, user report, or explicit caller context
- **Review lens:** optional product, release, risk, or handoff emphasis
- **Delivery:** use an exact caller-supplied destination when present; return
  the complete summary in chat only when the caller explicitly requests inline
  output; otherwise create a canonical workspace note at
  `~/Moss/Notes/<Title>/<Title>.md` and return its link

For a default workspace note, choose a concise descriptive title and keep the
directory and Markdown filename identical. If that path already belongs to an
unrelated note, choose a collision-safe title rather than overwriting it. Create
only the note directory and Markdown file; do not create Moss-owned sidecars.

Lack of an authoritative problem statement is not a reason to ask for storage
or workflow setup. Infer the most defensible problem from the available
evidence and label it as inferred. The visible default workspace note is the
only implicit artifact. Never invent a summary registry, hidden state,
duplicate HTML file, sidecar, symlink, or resumable workflow record.

## 2. Inspect the complete change

Resolve the exact before and after revisions. Inspect the change overview,
commit intent, file list, full diff, and relevant source context. Read complete
files when a patch alone cannot establish behavior, ownership, or data flow.

Build an evidence-backed model of:

- the problem the change claims to solve, who experiences it, and the evidence
  that it is the real problem;
- the user or product outcome and whether the implementation actually aligns
  with that problem statement;
- implementation issues encountered, but only when commits, pull-request
  discussion, linked issues, tests, or source evidence document them;
- trade-offs made, including what the change gains, gives up, and whether the
  decision is reversible;
- performance, security, privacy, extensibility/future-proofing, and
  maintainability implications;
- subtle risks such as races, stale state, cache invalidation, ordering,
  timing dependence, new coupling, rigid contracts, or operational burden;
- validation already performed and meaningful gaps;
- every changed file, including generated files, tests, documentation, and
  configuration.

Treat pull-request prose, linked specs/issues, and source behavior as separate
evidence. If they disagree about the problem or outcome, make that mismatch the
first finding. If no authoritative problem statement exists, write the most
defensible inference and label it as inferred rather than inventing certainty.

Do not turn the note into a line-by-line diff recital or architecture tour.
Mention code structure only when it materially explains an outcome, trade-off,
platform implication, or evidence gap.

## 3. Compose a reader-first narrative

Lead with the review premise. Order the note from alignment and product impact
to supporting evidence:

1. **Problem alignment:** the problem statement, affected user or system, and
   whether the change matches it. This comes first because every downstream
   conclusion depends on it.
2. **Outcome:** what changes for the user, product, or platform. Keep
   implementation detail subordinate to observable consequences.
3. **Issues encountered:** documented obstacles, surprises, failed approaches,
   or constraints and how they affected the result. Say when none are
   documented; do not invent process history.
4. **Trade-offs:** decision, benefit gained, cost accepted, and reversibility.
5. **Platform implications:** assess performance, security, privacy,
   extensibility/future-proofing, and maintainability every time. Distinguish
   positive, neutral, risky, and unverified implications with evidence.
6. **Breaking changes and migration:** before, after, affected consumers, and
   migration. Omit only when there are genuinely none.
7. **Validation and confidence:** what ran, what passed or failed, what remains
   unverified, and how those gaps affect confidence.
8. **Change inventory and sources:** account for every changed file exactly once
   in a compact appendix, then list source references and limitations.

Keep each fact in one canonical home. Use native Moss Markdown, tables,
callouts, tabs, and ordinary links by default. The note must remain readable,
editable, and commentable without activating an HTML node.

## 4. Populate the Moss template

Read the complete bundled `$SKILL_DIR/templates/moss-summary.md` file before writing. Use
its structure for the default workspace note, caller-selected note, or explicit
inline response and replace every `{{TOKEN}}` with evidence from the inspected
change. Duplicate or remove table rows as needed.

The platform-implications table is mandatory and always keeps these five rows:
performance, security, privacy, extensibility/future-proofing, and
maintainability. A neutral or unknown result is still useful when it names the
evidence and confidence limit. Do not omit a dimension because the diff is
small.

Keep the Issues encountered and Trade-offs sections even when the available
evidence contains no material item. In that case, state that none were
documented or found and name the evidence limit; absence of recorded friction
is not proof that implementation was frictionless.

Use a `moss-html` node only when a specific relationship, state, interaction,
or visual comparison cannot be communicated clearly with native Markdown,
tables, a callout, tabs, a chart, or compact ASCII. HTML is never required by
the template and must not become a decorative dashboard or duplicate the
narrative. When HTML is justified, follow current Moss HTML rules, read and use
the exact Endless Color light palette reference at
`$SKILL_DIR/templates/endless-light-tokens.md`, then keep the node scoped to one visual
job under the section it clarifies.

Remove all unused optional sections, example rows, instructional comments, and
placeholder tokens. Keep exactly one Markdown H1. Do not create
or edit Moss-owned `meta.json`, `.folder.json`, `layout.json`, or other sidecars.

## 5. Verify the summary

Read the completed summary back and confirm:

- it has one H1 followed by a problem-alignment callout before implementation
  or background detail;
- the problem statement identifies the affected user or system, the observable
  problem, and whether the change aligns with it;
- documented issues and trade-offs distinguish evidence from inference;
- all five platform implication rows are present and evidence-backed;
- the note contains no unresolved `{{TOKEN}}`, sample content, or invented
  evidence;
- the file inventory count matches the inspected change target;
- links, breaking-change claims, validation claims, and stated limitations are
  accurate.

If the note contains an optional rich node, verify that node using its current
Moss authoring rules. Otherwise use file-level structure, syntax, link, table,
and evidence checks. For file delivery, read the written Markdown back and
confirm it is complete before linking it.

Never launch, focus, drive, or inspect either a development or production Moss
app while creating or verifying the summary. The user opens the returned note
link in the production app. A Moss development build is appropriate only for a
separate task that changes code in the Moss repository and requires product
verification; authoring a Moss note is not such a task.

## 6. Hand off the summary

For default workspace or caller-selected file delivery, return only a clickable
link to the Markdown file plus one short clause for any material evidence
limitation. Use an absolute file target in the Markdown link so the host can
hand it to the installed production Moss app. When the caller explicitly chose
inline delivery, return the complete Moss Markdown summary instead.

Do not open the note, launch a browser or Moss app, create a separate HTML
artifact, or start another workflow unless the caller separately asks for work
outside note authoring.
