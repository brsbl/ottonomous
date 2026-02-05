# Ottonomous 🚌💨

Claude Code skills for every stage of product development: spec writing, task prioritization, testing, code review, and documentation.

<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

## Add marketplace

```bash
/plugin marketplace add brsbl/ottonomous
```

## Install plugin
```bash
/plugin install ottonomous@brsbl-ottonomous
```

## Dependencies

- [Claude Code](https://claude.ai/claude-code) (CLI)
- Node.js 18+
- Git

## Philosophy

### Subagents for Context Isolation

Use subagents to isolate concerns and prevent context pollution:

- **Context isolation**: Each subagent gets only what it needs, nothing more. Orchestrator agent delegates to and manges subagent
- **Specialization**: Different expertise per agent (frontend-developer vs backend-architect, senior-code-reviewer vs architect-reviewer, file-documenter vs test-writer, etc)

### Skill/Subagent Separation

Skills and subagents have distinct responsibilities:

- **Skills** define *what* to hand off (file list, diff command, scope, context) and are instructions for the Orchestrator agent
- **Subagents** define *how* to process what's handed off (criteria, detection rules, output format)

This keeps subagents self-contained and reusable while skills orchestrate the workflow.

### Swarm Orchestration

Skills coordinate multiple subagents working in parallel using `run_in_background: true`:

**Coordination patterns:**
- **Fan-out/Fan-in** — Spawn N agents, wait for all, synthesize results. Used by `/review`, `/doc`.
- **Batches** — Complete batch N before starting N+1 (for dependent work). Used by `/review fix`.
- **Pipeline** — Sequential handoff between specialists. Used by `/otto`.

**Scaling:** 1-4 items = 1 agent, 5-10 = 2-3 agents, 11+ = 3-5 agents. Group by directory or component type.

### Iterative Review for Verification

Every phase has explicit verification:

- **Planning**: spec → spec review → user approval
- **Implementation**: code → code review → fix → commit
- **Verification criteria**: Each step defines "Done when..."
- **Prioritized findings**: P0-P2 across all skills (P0 = critical, P1 = important, P2 = minor)

## Skills

### Specification & Planning

| Skill | Description |
|-------|-------------|
| `/spec [idea]` | Researches best practices, interviews you to define requirements and design. `technical-product-manager` validates completeness, consistency, feasibility, and technical correctness. |
| `/spec revise {spec}` | Saves a comprehensive spec and goes straight to review with codebase exploration, skipping the interview. |
| `/spec list` | Lists all specs with id, name, status, and created date. |
| `/task <spec-id>` | Creates atomic tasks grouped into agent sessions. `principal-engineer` reviews work breakdown, dependencies, and completeness. |
| `/task list` | Lists all tasks and their spec, sessions, status etc. |

### Implementation

| Skill | Description |
|-------|-------------|
| `/next` | Returns next task id. |
| `/next session` | Returns next session id. |
| `/next <id>` | Launches subagent to implement task or session. Plans first, then implements. |
| `/next batch` | Implements all highest-priority unblocked sessions in parallel. |

### Testing

| Skill | Description |
|-------|-------------|
| `/test run` | Lint, type check, run tests. |
| `/test write` | `test-writer` generates tests for pure functions with edge cases, then runs pipeline. |
| `/test browser` | Visual verification with browser automation. |
| `/test all` | Run + browser combined. |

**Scope:** `staged`, `branch` (default)

### Code Review

| Skill | Description |
|-------|-------------|
| `/review` | Multi-agent code review. `architect-reviewer` checks system structure and boundaries; `senior-code-reviewer` checks correctness, security, performance. |
| `/review fix` | Implements all fixes from plan in parallel batches. |
| `/review fix P0` | Implements only P0 (critical) fixes. |
| `/review fix P0-P1` | Implements P0 and P1 fixes. |

**Scope:** `staged`, `branch` (default)

### Documentation

| Skill | Description |
|-------|-------------|
| `/doc` | for each file that was changed, `file-documenter` captures purpose, patterns, gotchas, and change history not apparent by just reading the code or git history. Primarily a resource for agents. |
| `/summary` | Synthesizes all docs from /doc into semantic HTML summary explaining what changed and why. Primarily a resource to compliment or replace code review  |

**Scope:** `staged`, `branch` (default)

### Automation

| Skill | Description |
|-------|-------------|
| `/otto <idea>` | Autonomous spec → tasks → [next/test/review/doc] per session → summary. Best for greenfield explorations, prototyping, scoped migrations, and simple applications. **Not recommended for building complex apps end-to-end.** |
| `/reset [targets]` | Resets workflow data. Targets: `tasks`, `specs`, `sessions`, `all` (default). Docs are preserved. |

### Utilities

| Skill | Description |
|-------|-------------|
| `/browser <url>` | Navigate to URL, capture screenshot and ARIA snapshot. |
| `/browser explore` | Interactive browser exploration. |
| `/browser verify` | Verify specific UI behavior or state. |
| `/browser extract` | Extract specific data from the frontend. |


## Recommended Workflow

```
/spec                     # define requirements via interview
  │
  ▼
/task                     # break spec into sessions & tasks
  │
  ▼
┌───────────────────┐
│                   │
▼                   │
/next batch         │     # implement sessions of tasks in parallel then stage results
│                   │
▼                   │
/test write staged  │     # generate tests, then lint/typecheck/run all
│                   │
▼                   │
/review staged      │     # multi-agent code review
│                   │
▼                   │
/review fix staged  │     # fix P0-P2 issues
│                   │
▼                   │
commit ─────────────┘     # loop if more sessions/tasks
  │
  ▼
/doc                      # per-file documentation of intent, learnings, etc.
  │
  ▼
/summary                  # generate semantic overview of changes, opened in browser
  │
  ▼
 PR
```

Use `/clear` between steps to reset context.


## Architecture

```
.otto/                       # Workflow artifacts (git-ignored)
├── specs/                   # Specification documents (.md)
├── tasks/                   # Sessions and tasks (.json)
├── reviews/                 # Review fix plans (.json)
├── docs/                    # Per-file documentation (.json)
│   ├── files/               # Individual file docs
│   └── branches/            # Branch snapshots
├── summaries/               # Generated HTML summaries
└── otto/
    └── sessions/            # Otto session state (state.json)

skills/                      # Skill implementations (SKILL.md + support files)
├── spec/
│   └── agents/
│       └── technical-product-manager.md  # Spec validation (completeness, feasibility)
├── task/
│   └── agents/
│       └── principal-engineer.md         # Task decomposition review
├── next/
│   └── agents/                    # Implementation agents
│       ├── frontend-developer.md
│       └── backend-architect.md
├── review/
│   └── agents/                    # Code review agents
│       ├── architect-reviewer.md  # Architectural issues
│       └── senior-code-reviewer.md # Implementation issues
├── doc/
│   └── agents/
│       └── file-documenter.md     # Per-file documentation
├── test/
│   └── agents/
│       └── test-writer.md         # Test generation
├── otto/
│   └── lib/browser/               # Playwright-based browser automation
├── summary/
│   └── scripts/md-to-html.js
└── ...
```

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/brsbl/ottonomous/issues).

## License

MIT
