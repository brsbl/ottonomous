# Claude Code Kit

A skills toolkit for Claude Code.

## Installation

```bash
git clone https://github.com/brsbl/claude-code-kit.git
cp -r claude-code-kit/.claude your-project/
```

## Commands

| Command | Purpose |
|---------|---------|
| `/spec` | Create feature specifications via interactive interview |
| `/task <spec-id>` | Generate prioritized, dependency-aware tasks from a spec |
| `/next` | Pick and work on the next unblocked task |
| `/log` | Capture code discoveries anchored to source files |
| `/orchestrator` | Engineering Manager mode—delegates to specialized subagents |
| `/worktree <task>` | Create isolated git worktrees for task-based development |
| `/semantic-review` | Generate change walkthrough (markdown + HTML preview) |
| `/code-review` | Review code for bugs with prioritized feedback |

## Skill Details

### Planning

- **`/spec`** — Interactive interview that gathers context, researches best practices, and outputs a spec to `.kit/specs/{id}.md`
- **`/task`** — Breaks specs into tasks with status (`pending` → `in_progress` → `done`), priority (0-4), and dependencies
- **`/next`** — Finds highest priority unblocked task and starts work
- **`/log`** — Documents discoveries anchored to files; entries marked stale when anchors change. Use `/log init` for setup, `/log rebuild` to regenerate index

### Development

- **`/orchestrator`** — Transforms Claude into an Engineering Manager who delegates all technical work (exploration, planning, coding, review) to specialized subagents
- **`/worktree`** — Manages git worktrees: `add`, `list`, `cleanup`, `pr`. Auto-stashes changes and handles branch naming

### Review

- **`/semantic-review`** — Generates audience-specific walkthrough (developers, reviewers, stakeholders) with per-component analysis. Opens HTML in browser
- **`/code-review`** — Finds bugs with priority levels: P0 (blocking), P1 (urgent), P2 (normal), P3 (low)

## Directory Structure

```
your-project/
├── .kit/
│   ├── specs/        # Specifications (*.md)
│   ├── tasks/        # Tasks (*.json)
│   ├── logs/         # Engineering logs with INDEX.md
│   ├── reviews/      # Review outputs (*.md, *.html)
│   └── config.yaml   # Configuration
└── .claude/
    └── skills/       # Skill definitions
```

## Configuration

`.kit/config.yaml`:

```yaml
auto_verify: false  # Auto-verify stale log entries
auto_pick: false    # Auto-pick next task without confirmation
```

## Dependencies

- Claude Code with skills support
- Git (for worktrees and staleness tracking)
- gh CLI (for PR creation)

## License

MIT
