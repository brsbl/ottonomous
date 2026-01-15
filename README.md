# Claude Code Kit

A skills toolkit for Claude Code.

## Installation

```bash
git clone https://github.com/brsbl/claude-code-kit.git
cp -r claude-code-kit/.claude your-project/
```

## Skills

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

## License

MIT
