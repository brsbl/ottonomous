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
                 ┌─────────────────────────────────┐
/spec → /task →  │ /next → /test → /review → /doc  │ → /summary
                 └─────── repeat per session ──────┘
```

Sessions group related tasks that share context and can be implemented together by a single agent.

## Skills

### Specification & Planning

| Skill | Description |
|-------|-------------|
| `/spec&nbsp;[idea]` | Researches best practices, analyzes your codebase, then interviews you to define product requirements and technical design. |
| `/spec&nbsp;list` | Lists all specs with id, name, status, and created date. |
| `/task&nbsp;<spec-id>` | Creates atomic tasks from a spec, grouped into sessions. Each session is a unit of work with shared context that can be completed by a single agent. |
| `/task&nbsp;list` | Lists all task files with spec, sessions, tasks, and progress. |

### Implementation

| Skill | Description |
|-------|-------------|
| `/next` | Returns next task id. |
| `/next&nbsp;session` | Returns next session id. |
| `/next&nbsp;<id>` | Launches subagent to implement task (numeric) or session (S1, S2, etc.). Uses `frontend-developer` or `backend-architect` based on task type. |
| `/next&nbsp;batch` | Implements all highest-priority unblocked sessions in parallel. |

### Testing

| Skill | Description |
|-------|-------------|
| `/test&nbsp;run&nbsp;[scope]` | Lint, type check, run tests. |
| `/test&nbsp;write&nbsp;[scope]` | Generate tests, then run pipeline. |
| `/test&nbsp;browser&nbsp;[scope]` | Visual verification with browser automation. |
| `/test&nbsp;all&nbsp;[scope]` | Run + browser combined. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Code Review

| Skill | Description |
|-------|-------------|
| `/review&nbsp;[scope]` | Multi-agent code review split by directory or component. Uses `architect-reviewer` and `senior-code-reviewer` based on change type. Creates a fix plan for issues found. |
| `/review&nbsp;fix` | Multi-agent fix implementation. Runs all fixes from the plan in parallel batches. |
| `/review&nbsp;fix&nbsp;P0` | Runs only P0 (critical) fixes. |
| `/review&nbsp;fix&nbsp;P0-P1` | Runs P0 and P1 fixes. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Documentation

| Skill | Description |
|-------|-------------|
| `/doc&nbsp;[scope]` | Documents code changes with what/why/notable details. One entry per logical change. |
| `/summary&nbsp;[scope]` | Combines `/doc` entries into styled HTML summary that opens in your browser. |

**Scope:** `staged`, `uncommitted`, `branch` (default)

### Automation

| Skill | Description |
|-------|-------------|
| `/otto&nbsp;<idea>` | Autonomous spec → tasks → [next/test/review/doc] per session → summary. |
| `/reset&nbsp;[targets]` | Resets workflow data. Targets: `tasks`, `specs`, `docs`, `sessions`, `all` (default). |

### Utilities

| Skill | Description |
|-------|-------------|
| `/browser&nbsp;<url>` | Navigate to URL, capture screenshot and ARIA snapshot. |
| `/browser&nbsp;explore` | Interactive browser exploration. |
| `/browser&nbsp;verify&nbsp;<desc>` | Verify specific UI behavior or state. |
| `/browser&nbsp;extract&nbsp;<desc>` | Extract specific data from the frontend. |

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

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT
