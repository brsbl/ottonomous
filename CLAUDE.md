# Ottonomous repository guide

## Product contract

Ottonomous publishes exactly three provider-agnostic skills:

- `spec` creates or revises a researched, independently reviewed product spec,
  writes it to the caller's destination, and ends with a link.
- `review` runs parallel P0-P2 code review, validates false positives, and can
  implement caller-approved fixes.
- `build` implements a caller-supplied spec through bounded delegation,
  integration, and repeated verification.

Each skill is independently invocable. Do not introduce a required sequence,
fixed working directory, implicit artifact location, resumable workflow state,
or hidden persistence. Callers provide references, working locations, output
destinations, and delivery constraints.

## Compatibility boundary

Version 2 is an intentional breaking migration:

- The former `next` surface is replaced by `build` without an alias.
- The former planning, testing, summarization, autopilot, and reset skills are
  removed.
- The former `.otto/` convention is removed. No source skill, generated skill,
  manifest, build step, or test may depend on it.
- Storage is caller-controlled. `spec` requires a destination for its link-only
  handoff; other skills default to inline output when none is supplied.

Keep this migration prominent in README and pull-request release notes. Do not
reintroduce compatibility aliases or an equivalent hidden state system.

## Skill behavior

### `spec`

Preserve its quality loop: working-context inspection, current primary-source
research when needed, collaborative requirements interview, one canonical
decision-led spec, technical-product-manager review, and user resolution of
genuine decisions before delivery.

The source may be an idea, inline draft, or exact reference. The destination
and format are caller-supplied; an existing spec can be its own destination.
If no destination is available, ask for one before drafting. Write the complete
reviewed spec there, verify it, and end with only a clickable link. Do not show
the full spec inline or request a sign-off.

### `review`

Preserve the review semantics:

- Architectural and implementation scopes may run in parallel.
- Findings use P0-P2 and must be concrete, actionable, and introduced by the
  reviewed change.
- The false-positive validator reads full source context and never adds new
  findings.
- Fix mode uses caller-supplied, caller-approved findings and verifies the
  integrated result.

Review output is inline unless the caller supplies a destination. Do not stage,
commit, or publish fixes unless separately requested.

### `build`

The spec is the completion contract. The orchestrator keeps an in-context list
of unmet acceptance criteria, chooses the next bounded slice, delegates it with
an explicit ownership boundary and done condition, integrates the returned
diff, runs focused verification, and repeats. It owns final repository and
product verification.

Do not require generated work lists, sessions, plan files, status files, or a
particular repository layout. Do not create branches, commits, pull requests,
or releases unless the caller explicitly includes them.

## Provider-agnostic source and generated package

`skills/` is the single source of truth. Keep `SKILL.md` frontmatter neutral:

```yaml
---
name: skill-name
description: What the skill does and when to use it
argument-hint: "[caller inputs]"
---
```

Do not add provider-specific model or tool declarations. Describe delegation
in tool-neutral prose; the runtime chooses the available subagent mechanism.

Claude Code reads `skills/` through `.claude-plugin/plugin.json`. Codex reads
the generated `plugins/ottonomous/` package. `scripts/build-codex-plugin.mjs`
copies the three source skills, rewrites persona references for Codex, and emits
per-skill `agents/openai.yaml` metadata.

Never hand-edit `plugins/ottonomous/`. Run `npm run build` after any source
skill or packaging change.

## Subagent conventions

Personas live at `skills/{skill}/agents/{name}.md` with neutral frontmatter:

```yaml
---
name: agent-name
description: When and why this persona is used
---
```

Every implementation handoff must provide a concrete outcome, exact working
location, owned files/components, relevant constraints, observable done
condition, and focused verification. Parallel owners must have disjoint scopes.

Review personas return findings only in their documented format. The
orchestrator synthesizes, validates, integrates, and reports.

## Repository structure

```text
skills/
├── build/
├── review/
└── spec/
plugins/ottonomous/              # Generated; do not hand-edit
scripts/build-codex-plugin.mjs
scripts/validate-skills.mjs
.claude-plugin/
.codex-plugin/
.agents/plugins/
```

No other skill directory belongs in the published or repository-local skill
surface.

## Development commands

```bash
npm run build
npm run validate
npm test
npm run lint
```

The validator enforces the exact three-skill surface, neutral frontmatter,
manifest agent paths, generated-package parity, and the absence of legacy
storage coupling in runtime skill content. Focused tests cover the standalone
contracts and build loop.
