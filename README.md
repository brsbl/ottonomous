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

## Quick Start

### Manual Workflow
Step-by-step control over each phase:

```bash
/spec              # 1. Write specification
/task my-spec      # 2. Break into tasks
/next              # 3. Execute next task
/code-review       # 4. Review for bugs
/semantic-review   # 5. Document changes
```

### Ottonomous Workflow
Fully autonomous from idea to working code:

```bash
/otto Build a CLI todo app with local JSON storage
```

Automatically: researches → specs → tasks → executes → reviews → reports

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

## Workflows

### Manual Workflow (Step-by-Step)

```
Idea
  ↓
/spec ────→ .otto/specs/{id}.md
  ↓
/task ────→ .otto/tasks/{id}.json
  ↓
/next ────→ Execute highest priority task
  ↓  ⤴
  └──────→ Repeat /next until done
  ↓
/code-review ──→ Find bugs (P0-P3)
  ↓
/semantic-review ─→ .otto/reviews/{id}.html
  ↓
Done
```

**Commands:**
1. **`/spec`** - Interactive interview → specification
2. **`/task <spec-id>`** - Break spec → atomic tasks
3. **`/next`** - Pick and execute next task (repeat)
4. **`/code-review`** - Review for bugs
5. **`/semantic-review`** - Generate documentation
6. **`/log`** - Document discoveries (`.otto/logs/`)
7. **`/dev-browser`** - Browser automation (research, testing, screenshots)
8. **`/orchestrator`** - Delegate work to specialized subagents

**Best for:** Learning the system, complex features needing review at each step, when you want full control

**Configuration:** Set `auto_pick: false` for manual confirmations

---

### Ottonomous Workflow (Fully Autonomous)

```
Idea → /otto
         ↓
    Research (web search)
         ↓
    Spec (3-tier features)
         ↓
    Tasks (parallel groups)
         ↓
    Execute ←──┐
         ↓     │
    Milestone? ┘ (every 5 tasks: self-improve)
         ↓
    Code Review (fix P0/P1)
         ↓
    Session Report
         ↓
    Done
```

**Commands:**
- **`/otto <idea>`** - One command, full automation

**What it does:**
1. Researches 2+ competitors (web search)
2. Generates spec (Core/Expected/Delightful features)
3. Breaks into parallel task groups
4. Executes tasks (fresh agent per task)
5. Self-improves every 5 tasks (max 3 cycles)
6. Reviews and fixes P0/P1 bugs
7. Generates session report

**Best for:** New projects from scratch, prototyping quickly, trusted automation

**Session artifacts:** `.otto/otto/sessions/{session-id}/`
- `state.json` - Recovery state
- `feedback.md` - Execution report
- `improvements.md` - Self-improvement suggestions
- `research/competitors.md` - Competitive research

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
# Workflow automation settings
auto_verify: true    # Auto-verify stale log entries (affects /log)
auto_pick: true      # Auto-pick next task (affects /next, /task)
                     # false = manual confirmation prompts

# Ottonomous workflow settings (/otto command)
otto:
  enabled: true
  mode: autonomous   # autonomous | supervised

  # Execution
  max_blockers: 3              # Skip task after N failures
  checkpoint_interval: 5        # Commit every N tasks

  # Self-improvement
  self_improve: true           # Generate improvement suggestions
  improvement_milestone: 5      # Run improvement cycle every N tasks
  max_improvement_cycles: 3     # Max cycles per session

  # Safety limits
  max_tasks: 50                # Stop after N tasks (prevent runaway)
  max_duration_hours: 4        # Session time limit

  # Review
  review_frequency: milestone  # always | milestone | end
```

### Config Flag Descriptions

**Workflow Flags:**
- `auto_verify` - When `true`, auto-verifies stale log entries without prompts
- `auto_pick` - When `true`, `/next` and `/task` skip confirmation prompts
  - `false` = Manual workflow with confirmations
  - `true` = Semi-autonomous workflow

**Otto Flags:**
- `enabled` - Enable/disable `/otto` command
- `mode` - `autonomous` (no prompts) or `supervised` (asks before major steps)
- `max_blockers` - Retry limit before skipping a failing task
- `checkpoint_interval` - Create git commit every N completed tasks
- `self_improve` - Enable milestone-based self-improvement cycles
- `improvement_milestone` - Run improvement analysis every N tasks
- `max_improvement_cycles` - Cap total improvement cycles per session
- `max_tasks` - Safety limit to prevent infinite loops
- `max_duration_hours` - Maximum session duration
- `review_frequency` - When to run code review:
  - `always` - After every task
  - `milestone` - At checkpoint intervals
  - `end` - Once at session end

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
