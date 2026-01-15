# Claude Code Kit

A Claude Code plugin providing structured workflows for planning, implementation, review, and knowledge management.

## Installation

Install as a Claude Code plugin:

```bash
/plugin install brsbl/claude-code-kit
```

Or manually clone and install:

```bash
git clone https://github.com/brsbl/claude-code-kit.git
cd your-project
claude --plugin-dir /path/to/claude-code-kit
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

## Plugin Structure

```
claude-code-kit/
├── .claude-plugin/
│   └── plugin.json   # Plugin metadata
├── skills/           # Skill definitions
│   ├── spec/         # /spec command
│   ├── task/         # /task command
│   ├── next/         # /next command
│   ├── log/          # /log command
│   ├── orchestrator/ # /orchestrator command
│   ├── worktree/     # /worktree command
│   ├── semantic-review/  # /semantic-review command
│   └── code-review/  # /code-review command
└── .kit/             # Runtime data (created in your project)
    ├── specs/        # Specifications (*.md)
    ├── tasks/        # Tasks (*.json)
    ├── logs/         # Engineering logs with INDEX.md
    ├── reviews/      # Review outputs (*.md, *.html)
    └── config.yaml   # Configuration
```

## Configuration

`.kit/config.yaml`:

```yaml
auto_verify: false  # Auto-verify stale log entries
auto_pick: false    # Auto-pick next task without confirmation
```

## License

MIT
