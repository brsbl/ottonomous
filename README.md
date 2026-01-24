# Ottonomous 🚌💨

Claude Code skills for every stage of product development: spec writing, task prioritization, testing, code review, and documentation. 

Use each skill individually, or let `/otto` run the full loop with subagents.
  
<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

## Workflow 

```
                 ┌─────────────────────────────────┐
/spec → /task →  │ /next → /test → /review → /doc  │ → /summary
                 └──────── repeat per task ────────┘
```

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
| `/spec [idea]` | Interview + research to define requirements and technical design. |
| `/task <spec-id>` | Break spec into atomic tasks with priority (P0-P4) and dependencies. |
| `/next [task-id]` | Get next unblocked task, or implement a specific one. |
| `/test <run\|write> [scope]` | Lint, type check, test, verify UI. `write` generates tests first. Auto-detects/sets up tools. |
| `/review [scope]` | Parallel code review via subagents. Prioritizes bugs P0-P3, auto-fixes critical. |
| `/doc [scope]` | Document changes: what, why, notable details. |
| `/summary` | Combine docs into styled HTML summary. |
| `/otto <idea>` | Autonomous: spec → tasks → [next/test/review/doc] loop → summary. |
| `/reset` | Remove `.otto/` and generated code, keep plugin files. |

**Scopes:** `staged`, `uncommitted`, `branch` (default)

## Architecture

```
.otto/                       # Workflow artifacts (git-ignored)
├── specs/                   # Specification documents (.md)
├── tasks/                   # Task definitions (.json)
├── docs/                    # Change documentation entries
├── summaries/               # Generated HTML summaries
└── otto/
    └── sessions/            # Session state (state.json)

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
