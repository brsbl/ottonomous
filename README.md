# Ottonomous

<img width="350" height="163" alt="image 1" src="https://github.com/user-attachments/assets/71a86ba4-e069-4113-bc86-17bb3b21b19a" />


## Installation

```bash
# Add marketplace
/plugin marketplace add brsbl/ottonomous

# Install plugin
/plugin install ottonomous@brsbl-ottonomous
```

## Skills

### Planning

**`/spec [product idea]`** — Analyzes your codebase, researches best practices, takes screenshots of reference projects using browser automation, and interactively interviews you until it has comprehensive product requirements and technical design decisions for your product idea.

**`/task <spec-id>`** — Generates atomic, parallelizable tasks from a spec. Each task has status (pending → in_progress → done), priority (P0-P4), and optional dependencies.

**`/next [task-id]`** — Without argument, selects and returns the highest priority, unblocked task that is not in progress or done. With a task id, implements that specific task.

### Quality

**`/test <run | write> [scope]`** — Use `write` to set up a test harness and write tests following a recommended testing strategy. Use `run` to run automated tests and verify UI changes using browser automation. Scope: `staged`, `uncommitted`, `branch` (default).

**`/review [scope]`** — Runs a multi-tiered code review & bug fix process using subagents. For large changes (5+ files), orchestrator agent launches reiew subagents organized by directory or component. Subagents prioritize bugs (P0-P3), orchestrator agent synthesizes findings and creates a consolidated fix plan. Finally, orchestrator agent launches parallel subagents to auto-fix the P0 and P1 issues. Scope: `staged`, `uncommitted`, `branch` (default).

### Documentation

**`/doc [scope]`** — Documents code changes. Creates structured entries capturing what changed, why, and notable details (technical decisions, behavioral/data flow changes, key patterns). One doc entry created per logical change (e.g., one feature, one fix, one refactor). Scopes: `staged`, `uncommitted`, `branch` (default).

**`/summary`** — Synthesizes all `/doc` entries into a cohesive summary of changes. Summary is saved to a styled HTML page that automatically opens in your browser for each browsing.

### Orchestration

**`/otto <product idea>`** — Autonomously goes through all of the stages of product development to build your idea end-to-end: writes a research-based spec, generates parallelizable tasks, implements each task in a loop with tests/code review/doc phases, then produces a final summary of changes viewable in your browser when done. An orchestrator agent invokes all of the above skills using subagents and auto-approves any needed decisions using recommended options.

### Utilities

**`/clean`** — Resets project to fresh plugin state. Removes `.otto/`, generated code, and build artifacts. Preserves plugin files (skills/, .claude/) and git history. Requires confirmation.


## Workflow

```
                 ┌─────────────────────────────────┐
/spec → /task →  │ /next → /test → /review → /doc  │ → /summary
                 └──────── repeat per task ────────┘
```

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
