# Ottonomous

A Claude Code plugin providing structured workflows for planning, implementation, review, and knowledge management.

## Installation

Install as a Claude Code plugin:

```bash
/plugin install brsbl/ottonomous
```

Or manually clone and install:

```bash
git clone https://github.com/brsbl/ottonomous.git
cd your-project
claude --plugin-dir /path/to/ottonomous
```

## Skills

### Planning

- **`/spec`** — Interactive interview that gathers context, researches best practices, and outputs a spec to `.otto/specs/{id}.md`
- **`/task`** — Breaks specs into tasks with status (`pending` → `in_progress` → `done`), priority (0-4), and dependencies
- **`/next`** — Finds highest priority unblocked task and starts work
- **`/log`** — Documents discoveries anchored to files; entries marked stale when anchors change. Use `/log init` for setup, `/log rebuild` to regenerate index

### Development

- **`/orchestrator`** — Transforms Claude into an Engineering Manager who delegates all technical work (exploration, planning, coding, review) to specialized subagents
- **`/otto`** — Fully autonomous product development from idea to working code. Spawns fresh agents per task, runs self-improvement cycles, integrates dev-browser for visual verification

### Review

- **`/semantic-review`** — Generates audience-specific walkthrough (developers, reviewers, stakeholders) with per-component analysis. Opens HTML in browser
- **`/code-review`** — Finds bugs with priority levels: P0 (blocking), P1 (urgent), P2 (normal), P3 (low)

### Browser Automation

- **`/dev-browser`** — Browser automation using Playwright with persistent page state. Two modes: standalone (launches Chromium) or extension (connects to existing Chrome). Use for web testing, scraping, screenshots, and form automation

## Plugin Structure

```
ottonomous/
├── .claude-plugin/
│   └── plugin.json   # Plugin metadata
├── skills/           # Skill definitions
│   ├── spec/         # /spec command
│   ├── task/         # /task command
│   ├── next/         # /next command
│   ├── log/          # /log command
│   ├── orchestrator/ # /orchestrator command
│   ├── otto/         # /otto command
│   ├── semantic-review/  # /semantic-review command
│   ├── code-review/  # /code-review command
│   └── dev-browser/  # /dev-browser command
└── .otto/             # Runtime data (created in your project)
    ├── specs/        # Specifications (*.md)
    ├── tasks/        # Tasks (*.json)
    ├── logs/         # Engineering logs with INDEX.md
    ├── reviews/      # Review outputs (*.md, *.html)
    └── config.yaml   # Configuration
```

## Configuration

`.otto/config.yaml`:

```yaml
auto_verify: false  # Auto-verify stale log entries
auto_pick: false    # Auto-pick next task without confirmation
```

## Migration Note

This repository was renamed from `claude-code-kit` to `ottonomous` on 2026-01-16.

**What changed:**
- Repository: `brsbl/claude-code-kit` → `brsbl/ottonomous`
- Command: `/autopilot` → `/otto`
- Data directory: `.kit/` → `.otto/`
- Branch prefix: `autopilot/` → `otto/`
- Session ID: `autopilot-YYYYMMDD-HHMMSS` → `otto-YYYYMMDD-HHMMSS`

**For existing users:**
1. Pull latest: `git pull origin main`
2. Rename local directory: `mv claude-code-kit ottonomous`
3. Use `/otto` command going forward

Historical `autopilot/` branches preserved for reference.

## License

MIT
