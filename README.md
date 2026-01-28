# Ottonomous 🚌💨

Claude Code skills for every stage of product development: spec writing, task prioritization, testing, code review, and documentation. 

Use each skill individually, or let `/otto` run the full loop with subagents.
  
<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

## Workflow

```
                 ┌─────────────────────────────────┐
/spec → /task →  │ /next → /test → /review → /doc  │ → /summary
                 └─────── repeat per session ──────┘
```

Sessions group related tasks that share context and can be implemented together by a single agent.

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


## Skills

| Skill | Description |
|-------|-------------|
| `/spec [product idea]` | Researches best practices then interviews you to define product requirements and technical design. |
| `/task <spec-id>` | Creates atomic tasks grouped into sessions. Each session is a unit of work with shared context. |
| `/next [task\|session\|id\|batch]` | `task`/`session`: returns next id. `{id}`: launches subagent to implement. `batch`: parallel sessions. |
| `/test <run\|write> [scope]` | `run` lint, type check, run tests, verify UI. `write` set up tests, linting and typechecking (if needed). |
| `/review [scope]` | Multi-agent code review split by directory or component. Creates a fix plan for issues found. |
| `/review fix [P0\|P0-P1\|all]` | Multi-agent fix implementation. Runs fixes from the plan in parallel batches. |
| `/doc [scope]` | Documents code changes with what/why/notable details. One entry per logical change. |
| `/summary` | Combines `/doc` entries into styled HTML summary that opens in your browser. |
| `/otto <product idea>` | Autonomous spec → tasks → [next/test/review/doc] per session → summary. |
| `/reset` | Resets project to fresh state. Removes `.otto/` and generated code, preserves plugin files. |

**Scopes:** `staged`, `uncommitted`, `branch` (default)

## Architecture

```
.otto/                       # Workflow artifacts (git-ignored)
├── specs/                   # Specification documents (.md)
├── tasks/                   # Sessions and tasks (.json)
├── docs/                    # Change documentation entries
├── summaries/               # Generated HTML summaries
└── otto/
    └── sessions/            # Otto session state (state.json)

skills/                      # Skill implementations (SKILL.md + support files)
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
