# Ottonomous 🚌💨

Three independently invocable product-development skills that work in both
Claude Code and OpenAI Codex:

- `spec` turns an idea or draft into an approved, implementation-ready product
  specification.
- `review` produces validated P0-P2 code-review findings and can implement
  caller-approved fixes.
- `build` implements a caller-supplied spec through bounded subagent work,
  integration, and verification loops.

Ottonomous is a skill collection, not a workflow engine. Callers choose the
spec references, working locations, output destinations, and delivery boundary
for each invocation.

## Breaking migration to v2

Version 2 intentionally replaces the old prescribed workflow:

- `next` becomes `build`. There is no compatibility alias. `build` reads a
  caller-supplied spec directly, delegates bounded implementation slices,
  integrates them, verifies the result, and repeats until complete or genuinely
  blocked.
- `task`, `test`, `summary`, `otto`, and `reset` are removed.
- The `.otto/` storage convention is removed. No remaining skill reads or
  writes implicit workflow state, work lists, sessions, plans, review files, or
  generated artifacts there.
- Storage is caller-controlled. Supply an output destination when you want an
  artifact saved; otherwise the skills return their result inline.

Existing automation must replace the old invocations explicitly. There is no
hidden replacement state system.

## Install

### Claude Code

```bash
/plugin marketplace add brsbl/ottonomous
/plugin install ottonomous@ottonomous
```

### Codex

```bash
codex plugin marketplace add brsbl/ottonomous
```

Invocation differs by provider: Claude Code uses `/spec`, while Codex uses
`$spec`. The examples below use bare skill names.

## Skills

| Skill | Caller supplies | Result |
| --- | --- | --- |
| `spec` | Idea or existing draft/spec reference; optional working location, format, and output destination | Researched, reviewed, user-approved spec, written only to the caller's destination or returned inline |
| `review` | Diff, branch, staged changes, pull request, or file set; optional output destination | Parallel P0-P2 review filtered by a false-positive validator; optional fix plan or approved fixes |
| `build` | Spec reference, working location, and delivery constraints | Integrated implementation with focused and final verification, repeated until the spec is complete or genuinely blocked |

### `spec`

`spec` preserves the original quality loop without prescribing storage:

1. Inspect the supplied codebase or product context.
2. Research current primary sources when external evidence matters.
3. Interview the caller about consequential requirements and tradeoffs.
4. Draft one canonical, decision-led spec with observable acceptance criteria.
5. Run an independent technical-product-manager review.
6. Resolve findings with the caller, get approval, and deliver to the supplied
   destination or inline.

Example:

```text
spec: Design offline export for the dashboard. Work in /repo/dashboard.
Write the approved spec to /docs/offline-export.md.
```

If the destination is a Moss note or another specialized format, the skill
uses that destination's authoring conventions. It does not assume every spec is
a Moss note or require frontmatter.

### `review`

`review` preserves the existing review semantics:

- Architectural and implementation reviewers inspect independent scopes in
  parallel where useful.
- Findings are discrete, actionable, introduced by the reviewed change, and
  prioritized P0-P2.
- A false-positive validator reads the full source context and keeps,
  downgrades, or removes findings without inventing new ones.
- Fix mode operates only on caller-supplied, caller-approved findings. It
  integrates and verifies fixes without implicitly staging or committing them.

Examples:

```text
review the current branch against its merge base
review staged; save the findings to /tmp/review.md
review fix using /tmp/review.md, P0-P1 only
```

### `build`

`build` is a lightweight implementation loop rather than a work-list runner:

```text
caller-supplied spec
        │
        ▼
choose a bounded slice
        │
        ▼
delegate to a scoped subagent
        │
        ▼
inspect and integrate the diff
        │
        ▼
run focused verification
        │
        └──── repeat against unmet spec criteria
        │
        ▼
final repository and product verification
```

The orchestrator keeps the completion checklist in active context. It does not
create state, planning, work, or session files unless the caller explicitly
provides an output destination. Branches, commits, pull requests, publishing,
and releases are outside the skill's authority unless separately requested.

Example:

```text
build the spec at /docs/offline-export.md in /repo/dashboard; stop after
verified local implementation
```

## Design principles

### Independent invocation

Each skill resolves its own caller-supplied inputs and can run without either
of the other skills. There is no required sequence or implicit handoff.

### Caller-controlled storage

Returning a result inline is the default. A skill writes only to a destination
provided by the caller and never creates a hidden registry, duplicate copy,
symlink, or resumable workflow store.

### Bounded delegation

Skills use subagents for context isolation and independent judgment. Every
handoff names the exact reference, working location, ownership boundary, done
condition, and verification. The orchestrator owns integration and does not
treat a subagent success report as proof.

## Repository architecture

```text
skills/                              # Neutral source of truth
├── build/
│   ├── SKILL.md
│   └── agents/
│       └── implementation-worker.md
├── review/
│   ├── SKILL.md
│   └── agents/
│       ├── architect-reviewer.md
│       ├── false-positive-validator.md
│       └── senior-code-reviewer.md
└── spec/
    ├── SKILL.md
    └── agents/
        └── technical-product-manager.md

plugins/ottonomous/                  # Generated Codex package
scripts/build-codex-plugin.mjs       # Package generator
scripts/validate-skills.mjs          # Three-skill contract validator
.claude-plugin/                      # Claude Code manifests
.codex-plugin/                       # Codex root compatibility manifest
.agents/plugins/                     # Codex marketplace entry
```

`skills/` is the provider-agnostic source. `npm run build` regenerates
`plugins/ottonomous/`, including each skill's Codex `agents/openai.yaml`.
Never hand-edit the generated package.

## Development

Requires Node.js 18+ and Git.

```bash
npm ci
npm run build       # Regenerate the Codex package
npm run validate    # Validate the exact three-skill surface and manifests
npm test            # Run focused contract tests
npm run lint        # Check repository formatting and lint rules
```

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/brsbl/ottonomous/issues).

## License

MIT
