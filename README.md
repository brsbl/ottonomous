# Ottonomous

<img width="1536" height="714" alt="thinner 1" src="https://github.com/user-attachments/assets/16405ada-0a77-4ba3-aed2-339997924eac" />

## Installation

```bash
# Add marketplace
/plugin marketplace add brsbl/ottonomous

# Install plugin
/plugin install ottonomous@brsbl-ottonomous
```

## Skills

### Orchestration

**`/otto <idea>`** — Autonomous product development. Takes an idea and builds it end-to-end with subagents: writes a spec, generates tasks, implements each task with test/review/doc phases, then produces a final summary. All skills are invoked via subagents with auto-approval of recommended options.

### Planning

**`/spec [idea]`** — Interactive specification writing. Gathers context, researches via web search and browser automation, conducts an interview, and outputs structured specs with product requirements and technical design.

**`/task <spec-id>`** — Generates parallelizable tasks from a spec. Each task has status (pending → in_progress → done), priority (0-4), and dependencies. Targets atomic units completable in one session, ≤3 files modified.

**`/next [task-id]`** — Two modes: without argument, selects and returns the next unblocked task. With task id, implements that specific task.

### Quality

**`/test [scope]`** — Runs automated tests and visual verification. Detects test runners (vitest/jest/pytest/cargo), sets up test harness if missing, captures screenshots for UI verification. Scopes: `staged`, `uncommitted`, `branch` (default). Use `write` to generate tests for branch changes.

**`/review [scope]`** — Code review with P0-P3 prioritized findings. Uses parallel subagents for large changes, creates fix plans, and implements critical issues. Scopes: `staged`, `uncommitted`, `branch` (default).

### Documentation

**`/doc [scope]`** — Documents code changes. Creates structured entries capturing what changed, why, and notable details. Scopes: `staged`, `uncommitted`, `branch` (default).

**`/summary`** — Consolidates `/doc` entries into a styled HTML summary. Synthesizes documentation into a cohesive overview and opens in browser.

### Utilities

**`/clean`** — Resets project to fresh plugin state. Removes `.otto/`, generated code, and build artifacts. Preserves plugin files (skills/, .claude/) and git history. Requires confirmation.

## Workflows

### Manual
```
/spec → /task → /next (repeat) → /test → /review → /doc → /summary
```

### Autonomous
```
/otto <idea>   # Full loop: spec → tasks → implement/test/review/doc per task → summary
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
