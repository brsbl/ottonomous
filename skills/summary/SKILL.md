---
name: summary
description: "Creates a reader-first Moss change summary with an embedded, interactive HTML change map. Use for pull-request summaries, release notes, branch or diff overviews, implementation handoffs, and explanations of what changed and why it matters. Accepts a caller-supplied change target, working location, and output destination; it does not require a repository layout or persistent workflow state."
argument-hint: "[change target] [working location] [output destination]"
---

# Summary

Turn a code change into a durable Moss note that explains the product outcome,
implementation shape, review risks, and verification evidence. The note should
help a reader understand the change before they inspect individual files.

## 1. Resolve the caller's inputs

Identify:

- **Change target:** pull request, branch and merge base, commit range, staged
  changes, supplied diff, or explicit file set
- **Working location:** repository or other source context to inspect
- **Output destination:** exact caller-selected Moss Markdown file
- **Audience and emphasis:** optional reviewer, product, release, or handoff
  focus

Ask only for inputs that block accurate work. Never assume `main` is the merge
base when repository or pull-request metadata can identify it. If the output
destination is missing, ask for it before drafting.

Use exactly the destination the caller supplies. Do not create a summary
registry, fixed directory, hidden state, duplicate HTML file, sidecar, symlink,
or resumable workflow record.

## 2. Inspect the complete change

Resolve the exact before and after revisions. Inspect the change overview,
commit intent, file list, full diff, and relevant source context. Read complete
files when a patch alone cannot establish behavior, ownership, or data flow.

Build an evidence-backed model of:

- the user or product outcome;
- the implementation approach and important integration points;
- behavior, data-flow, persistence, performance, security, and compatibility
  effects;
- subtle risks such as races, stale state, cache invalidation, ordering, or
  timing dependence;
- validation already performed and meaningful gaps;
- every changed file, including generated files, tests, documentation, and
  configuration.

Do not turn the note into a line-by-line diff recital. Explain why each
meaningful change exists and what it means for readers.

## 3. Compose a reader-first narrative

Lead with one standalone takeaway after the H1. Order the rest from decision
value to supporting detail:

1. **Change overview:** two or three short paragraphs explaining the outcome
   and implementation shape.
2. **Interactive change map:** a filterable view of the major outcome,
   architecture, risk, and evidence cards.
3. **Reviewer focus:** the few places where review attention has the highest
   leverage.
4. **Breaking changes:** before, after, affected consumers, and migration. Omit
   this section when there are none.
5. **Validation:** what ran, what passed or failed, and what remains unverified.
6. **Files changed:** every changed file exactly once, with a concise semantic
   summary and a link when a stable source URL is available.
7. **Sources and limits:** relevant references and any evidence limitation that
   affects confidence.

Keep each fact in one canonical home. Use native Moss Markdown for the
narrative, review focus, validation, migration guidance, and file inventory.
The embedded HTML owns only the interactive change map.

## 4. Populate the Moss template

Read the complete bundled `templates/moss-summary.md` file before writing. Copy
its structure into the caller's destination and replace every `{{TOKEN}}` with
evidence from the inspected change.

For repeated HTML cards and Markdown rows, duplicate or remove the marked
examples as needed. Classify each HTML card by one coherent narrative lens:
`outcome`, `architecture`, `risk`, or `evidence`. Use the same vocabulary in
filter controls and `data-kind` attributes. Remove a lens and its filter button
when it has no cards instead of displaying an empty category. Keep the all-cards
first frame complete and useful without JavaScript.

Preserve the template's `moss-html` document shell, version metadata,
self-contained CSS and JavaScript, fixed theme-neutral palette, native buttons,
and accessible pressed-state behavior. Do not add remote images, fonts,
scripts, fetches, local file URLs, Moss internals, or dependencies on browser
storage. Escape inserted HTML text and attributes so source code and file names
cannot break the embedded document.

Remove all unused optional sections, example cards, example rows, instructional
comments, and placeholder tokens. Keep exactly one Markdown H1. Do not create
or edit Moss-owned `meta.json`, `.folder.json`, `layout.json`, or other sidecars.

## 5. Verify the written note

Read the destination back and confirm:

- it has one H1 followed immediately by a standalone takeaway;
- it contains one complete `moss-html` fence with `<!DOCTYPE html>` and
  `<meta name="moss-html-version" content="v1">`;
- the initial HTML frame shows every change card without script execution;
- every visible filter button has a matching, non-empty card category and the
  script updates `aria-pressed`, visibility, and the live result count;
- the note contains no unresolved `{{TOKEN}}`, sample content, or invented
  evidence;
- the file inventory count matches the inspected change target;
- links, breaking-change claims, validation claims, and stated limitations are
  accurate.

When a Moss runtime is available and the caller requested product-level
verification, activate the HTML node and exercise every filter in note and
fullscreen views. Otherwise report the static structural verification
accurately; do not claim live interaction testing.

## 6. Hand off the summary

Return a clickable link to the caller-selected Moss note plus one short clause
for any material evidence limitation. Do not open a browser, create a separate
HTML artifact, or start another workflow unless the caller separately asks.
