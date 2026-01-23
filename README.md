# Ottonomous 🚌💨

A set of Claude Code skills for every stage of product development: research-based spec writing, task breakdown & priorization, unit & screen-shot based UI testing, multi-tier code review & bug auto-fix, and documentation of changes and key decisions. Each skill can be run manually as needed, or let `/otto` orchestrate the entire loop autonomously using subagents.

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
  
<img width="3072" height="1428" alt="image 1 (1)" src="https://github.com/user-attachments/assets/2e8b420b-8b85-43af-9db7-764f6d4dc269" />

## Workflow 

```
                 ┌─────────────────────────────────┐
/spec → /task →  │ /next → /test → /review → /doc  │ → /summary
                 └──────── repeat per task ────────┘
```


## Skills

| Skill | Description |
|-------|-------------|
| `/spec [idea]` | Analyzes codebase, researches best practices, captures reference screenshots, and interviews you to build product requirements and technical design. |
| `/task <spec-id>` | Generates atomic, parallelizable tasks from a spec with status, priority (P0-P4), and dependencies. |
| `/next [task-id]` | Without arg: returns next unblocked task. With arg: implements that task. |
| `/test <run\|write> [scope]` | `write`: set up test harness and generate tests. `run`: execute tests and verify UI with browser automation. |
| `/review [scope]` | Multi-agent code review. Parallelizes by directory for large changes, prioritizes bugs (P0-P3), auto-fixes critical issues. |
| `/doc [scope]` | Documents code changes with what/why/notable details. One entry per logical change. |
| `/summary` | Synthesizes `/doc` entries into styled HTML summary, opens in browser. |
| `/otto <idea>` | Autonomous end-to-end: spec → tasks → implement/test/review/doc loop → summary. Auto-approves decisions. |
| `/reset` | Resets project to fresh plugin state. Removes `.otto/` and generated code, preserves plugin files. |

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
