# Ottonomous 🚌💨

Claude Code skills for every stage of product development: spec writing, task prioritization, testing, code review, and documentation.

Use each skill individually, or let `/otto` run the full loop with subagents.

<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

## Installation

```bash
# Add marketplace
/plugin marketplace add brsbl/ottonomous

# Install plugin
/plugin install ottonomous@brsbl-ottonomous
```

## Dependencies

- [Claude Code](https://claude.ai/claude-code) (CLI)
- Node.js 18+
- Git

## Workflow

```
                       ┌────────────────────────────┐
                       │  ┌──────────────────────┐  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  /next batch            │  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  /test run staged       │  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  /test write staged     │  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  /review staged         │  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  /review fix staged     │  │
                       │  │                      │  │
                       │  ▼                      │  │
                       │  commit ────────────────┘  │
                       │       (loop if more tasks) │
                       └────────────────────────────┘
                                    │
/spec ──► /task ──────────────────────────────────────────► /doc ──► /summary ──► PR
```

Use `/clear` between steps to reset context.

Sessions group related tasks that share context and can be implemented together by a single agent.

## Philosophy

### Subagents for Context Separation & Parallelization

Use subagents to isolate concerns and prevent context pollution:

- **Context isolation**: Each subagent gets only what it needs, nothing more
- **Parallelization**: Run independent tasks concurrently (e.g., reviewing multiple files)
- **Specialization**: Different expertise per agent (frontend vs backend, architect vs implementer)
- **Scaling**: 1-2 files = 1 agent, 10+ files = 3-5 agents

### Iterative Review for Verification

Every phase has explicit verification:

- **Planning**: spec → architect review → user approval
- **Implementation**: code → code review → fix → commit
- **Verification criteria**: Each step defines "Done when..."
- **Prioritized findings**: P0-P2 across all skills (P0 = critical, P1 = important, P2 = minor)

## Skills

### Specification & Planning

| Skill | Description |
|-------|-------------|
| `/spec [idea]` | Researches best practices, interviews you to define requirements and design. Includes architect review with P0-P2 findings. |
| `/spec list` | Lists all specs with id, name, status, and created date. |
| `/task <spec-id>` | Creates atomic tasks grouped into sessions. Includes review with P0-P2 findings for task structure. |
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
| `/test write` | Generate tests, then run pipeline. |
| `/test browser` | Visual verification with browser automation. |
| `/test all` | Run + browser combined. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Code Review

| Skill | Description |
|-------|-------------|
| `/review` | Multi-agent review with P0-P2 findings. Uses `architect-reviewer` and `senior-code-reviewer`. |
| `/review fix` | Implements all fixes from plan in parallel batches. |
| `/review fix P0` | Implements only P0 (critical) fixes. |
| `/review fix P0-P1` | Implements P0 and P1 fixes. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Documentation

| Skill | Description |
|-------|-------------|
| `/doc` | Creates per-file documentation with parallel subagents. Optimized for agent consumption. |
| `/summary` | Synthesizes docs into semantic HTML summary explaining what changed and why. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Automation

| Skill | Description |
|-------|-------------|
| `/otto <idea>` | Autonomous spec → tasks → [next/test/review/doc] per session → summary. Best for isolated components, scoped migrations, and prototyping. Not recommended for building apps end-to-end. |
| `/reset [targets]` | Resets workflow data. Targets: `tasks`, `specs`, `docs`, `sessions`, `all` (default). |

### Utilities

| Skill | Description |
|-------|-------------|
| `/browser <url>` | Navigate to URL, capture screenshot and ARIA snapshot. |
| `/browser explore` | Interactive browser exploration. |
| `/browser verify` | Verify specific UI behavior or state. |
| `/browser extract` | Extract specific data from the frontend. |

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
├── next/
│   └── agents/              # Implementation agents
│       ├── frontend-developer.md
│       └── backend-architect.md
├── review/
│   └── agents/              # Review agents
│       ├── architect-reviewer.md
│       └── senior-code-reviewer.md
├── otto/
│   └── lib/browser/         # Playwright-based browser automation
├── summary/
│   └── scripts/md-to-html.js
└── ...
```

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/brsbl/ottonomous/issues).

## License

MIT
