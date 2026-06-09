# Ottonomous 🚌💨

Skills for every stage of product development — spec writing, task prioritization, implementation, testing, code review, and summaries — that work in **both Claude Code and OpenAI Codex**.

<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

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

## Dependencies

- [Claude Code](https://claude.ai/claude-code) **or** [Codex](https://openai.com/codex)
- Node.js 18+
- Git

## Philosophy

> Invocation differs per provider: Claude Code uses `/spec`, Codex uses `$spec`. Throughout these docs skills are referred to by bare name (e.g. the `spec` skill).

### Subagents for Context Isolation

Use subagents to isolate concerns and prevent context pollution:

- **Context isolation**: Each subagent gets only what it needs, nothing more. The orchestrator agent delegates to and manages subagents
- **Specialization**: Different expertise per agent (frontend-developer vs backend-architect, senior-code-reviewer vs architect-reviewer, test-writer, etc)

### Skill/Subagent Separation

Skills and subagents have distinct responsibilities:

- **Skills** define *what* to hand off (file list, diff command, scope, context) and are instructions for the orchestrator agent
- **Subagents** define *how* to process what's handed off (criteria, detection rules, output format)

This keeps subagents self-contained and reusable while skills orchestrate the workflow. Skills describe delegation in tool-neutral prose so the same source runs on either provider — the runtime decides the actual model and delegation mechanics.

### Swarm Orchestration

Skills coordinate multiple subagents working in parallel using **background subagents** — spawning concurrent work and waiting on the results:

**Coordination patterns:**
- **Fan-out/Fan-in** — Spawn N agents, wait for all, synthesize results. Used by `review`.
- **Batches** — Complete batch N before starting N+1 (for dependent work). Used by `review fix`.
- **Pipeline** — Sequential handoff between specialists. Used by `otto`.

**Scaling:** 1-4 items = 1 agent, 5-10 = 2-3 agents, 11+ = 3-5 agents. Group by directory or component type.

### Iterative Review for Verification

Every phase has explicit verification:

- **Planning**: spec → spec review → user approval
- **Implementation**: code → code review → fix → commit
- **Verification criteria**: Each step defines "Done when..."
- **Prioritized findings**: P0-P2 across all skills (P0 = critical, P1 = important, P2 = minor)

## Recommended Workflow

> Invoke skills with `/x` in Claude Code or `$x` in Codex (e.g. `/spec` or `$spec`).

```
spec                      # define requirements via interview
  │
  ▼
task                      # break spec into sessions & tasks
  │
  ▼
┌───────────────────┐
│                   │
▼                   │
next batch          │     # implement sessions of tasks in parallel then stage results
│                   │
▼                   │
test write staged   │     # generate tests, then lint/typecheck/run all
│                   │
▼                   │
review staged       │     # multi-agent code review
│                   │
▼                   │
review fix staged   │     # fix P0-P2 issues
│                   │
▼                   │
commit ─────────────┘     # loop if more sessions/tasks
  │
  ▼
summary                   # generate semantic overview of changes, opened in browser
  │
  ▼
 PR
```

Reset context between steps (e.g. `/clear` in Claude Code).

## Skills

The 8 skills: `spec`, `task`, `next`, `test`, `review`, `summary`, `otto`, `reset`.

### Specification & Planning

| Skill | Description |
|-------|-------------|
| `spec [idea]` | Researches best practices, interviews you to define requirements and design. `technical-product-manager` validates completeness, consistency, feasibility, and technical correctness. |
| `spec revise {spec}` | Saves a comprehensive spec and goes straight to review with codebase exploration, skipping the interview. |
| `spec list` | Lists all specs with id, name, status, and created date. |
| `task <spec-id>` | Creates atomic tasks grouped into agent sessions. `principal-engineer` reviews work breakdown, dependencies, and completeness. |
| `task list` | Lists all tasks and their spec, sessions, status etc. |

### Implementation

| Skill | Description |
|-------|-------------|
| `next` | Returns next task id. |
| `next session` | Returns next session id. |
| `next <id>` | Launches a subagent to implement a task or session. Plans first, then implements. |
| `next batch` | Implements all highest-priority unblocked sessions in parallel. |

### Testing

| Skill | Description |
|-------|-------------|
| `test run` | Lint, type check, run tests. |
| `test write` | `test-writer` generates tests for pure functions with edge cases, then runs pipeline. |
| `test browser` | Visual verification with browser automation (a mode of the `test` skill). |
| `test all` | Run + browser combined. |

**Scope:** `staged`, `branch` (default)

### Code Review

| Skill | Description |
|-------|-------------|
| `review` | Multi-agent code review. `architect-reviewer` checks system structure and boundaries; `senior-code-reviewer` checks correctness, security, performance; `false-positive-validator` filters out invalid findings. |
| `review fix` | Implements all fixes from plan in parallel batches. |
| `review fix P0` | Implements only P0 (critical) fixes. |
| `review fix P0-P1` | Implements P0 and P1 fixes. |

**Scope:** `staged`, `branch` (default)

### Summary

| Skill | Description |
|-------|-------------|
| `summary` | Synthesizes code docs into a semantic HTML summary explaining what changed and why. Primarily a resource to complement or replace code review. |

**Scope:** `staged`, `branch` (default)

### Automation

| Skill | Description |
|-------|-------------|
| `otto <idea>` | Autonomous spec → tasks → [next/test/review] per session → summary. Best for greenfield explorations, prototyping, scoped migrations, and simple applications. **Not recommended for building complex apps end-to-end.** |
| `reset [targets]` | Resets workflow data. Targets: `tasks`, `specs`, `sessions`, `all` (default). |

## Architecture

```
skills/                      # Single source of truth — neutral SKILL.md + agent personas
├── spec/
│   ├── SKILL.md
│   └── agents/
│       └── technical-product-manager.md  # Spec validation (completeness, feasibility)
├── task/
│   ├── SKILL.md
│   └── agents/
│       └── principal-engineer.md         # Task decomposition review
├── next/
│   ├── SKILL.md
│   └── agents/                           # Implementation agents
│       ├── frontend-developer.md
│       └── backend-architect.md
├── test/
│   ├── SKILL.md
│   └── agents/
│       └── test-writer.md                # Test generation
├── review/
│   ├── SKILL.md
│   └── agents/                           # Code review agents
│       ├── architect-reviewer.md         # Architectural issues
│       ├── senior-code-reviewer.md       # Implementation issues
│       └── false-positive-validator.md   # Validates and filters review findings
├── summary/
│   ├── SKILL.md
│   └── scripts/md-to-html.js
├── otto/
│   └── SKILL.md
└── reset/
    └── SKILL.md

.otto/                       # Workflow artifacts (git-ignored)
├── specs/                   # Specification documents (.md)
├── tasks/                   # Sessions and tasks (.json)
├── reviews/                 # Review fix plans (.json)
├── summaries/               # Generated HTML summaries
└── otto/
    └── sessions/            # Otto session state (state.json)
```

### Provider-agnostic layout

`skills/` is the **single source of truth**: each `SKILL.md` is neutral (no `model:` or `allowed-tools:`), and agent personas describe delegation in tool-neutral prose. From this one source, both providers are wired up:

- **`skills/`** — neutral source skills and agent personas, read directly by Claude Code.
- **`scripts/build-codex-plugin.mjs`** (`npm run build`) — generates the Codex app package at **`plugins/ottonomous/`** by copying the skills and emitting a per-skill `agents/openai.yaml` Codex interface file.
- **`.claude-plugin/`** — Claude Code manifests (`plugin.json` points `skills` at `./skills` and lists the agent dirs; `marketplace.json`). Claude Code ignores the generated `openai.yaml` files.
- **`.codex-plugin/`** + **`.agents/plugins/`** — Codex manifests. The root `.codex-plugin/plugin.json` is a compatibility manifest, and `.agents/plugins/marketplace.json` points at `./plugins/ottonomous`.

The Codex package under `plugins/ottonomous/` is **generated, never hand-edited** — regenerate it with `npm run build` whenever `skills/` changes. This one-source-regenerate-the-mirror approach (modeled on the moss-skills repo) is the anti-drift mechanism.

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/brsbl/ottonomous/issues).

## License

MIT
