# Ottonomous
<img width="3072" height="1428" alt="image" src="https://github.com/user-attachments/assets/5df66efc-5ca3-4624-b0d2-741f0308d89a" />

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
/test              # 4. Run tests + visual verification with browser automation 
/review            # 5. Review for bugs
/summary           # 6. Overview of changes
/log               # 6. Document changes
```

### Ottonomous Workflow
Fully autonomous from idea to working code:

```bash
/otto Build a CLI todo app with local JSON storage
```
This workflow is essentially 2 nested loops:
- **outter loop**: manager agent delegates to subagents to research a product idea (argument for the skill) → write a spec → generate tasks from spec → execute tasks in parallel → test & review in parallel → regularly report status to manager agent → document the codebase as they work
- **inner loop**: subagents and manager agent document feedback about the workflow as they work. after each milestone, manager agent creates a plan for subagents to improve the workflow

these loops run continuously until the product is built to spec (with stop hooks to validate after each task).

## Skills

- **`/otto`** — Fully autonomous product development from idea to working code. Spawns fresh agents per task, iteratively reviews code and runs self-improvement cycles to improve overall process.

### Planning

- **`/spec`** — Interactive interview that gathers context, researches best practices, and outputs a spec to `.otto/specs/{id}.md`
- **`/task`** — Breaks specs into tasks with status (`pending` → `in_progress` → `done`), priority (0-4), and dependencies

### Development

- **`/delegate`** — Transforms Claude into an Engineering Manager who delegates all technical work (exploration, planning, coding, review) to specialized subagents

### Testing & Review (with Browser Automation)

- **`/test`** — Canonical testing skill: run automated tests and visual verification with dev-browser. Detects test runners, captures results, and walks through UI flows
- **`/review`** — Finds bugs with priority levels: P0 (blocking), P1 (urgent), P2 (normal), P3 (low)
- **`/summary`** — Generates audience-specific walkthrough (developers, reviewers, stakeholders) with per-component analysis. Opens HTML in browser

### Browser Automation

- **`/dev-browser`** — Browser automation using Playwright with persistent page state. Two modes: standalone (launches Chromium) or extension (connects to existing Chrome). Use for web testing, scraping, screenshots, and form automation
- 
### Engineering Knowledge Base

- **`/log`** — Document information about the codebase anchored to files; entries marked stale when anchors change. Use `/log init` for setup, `/log rebuild` to regenerate index

### Maintenance

- **`/clean`** — Clean ottonomous workflow artifacts from `.otto/`. Supports selective cleaning of sessions, specs, tasks, and reviews while preserving configuration



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
/test ────→ Run tests + visual verification
  ↓
/review ──→ Find bugs (P0-P3)
  ↓
/summary ─→ .otto/reviews/{id}.html
  ↓
Done
```

**Commands:**
1. **`/spec`** - Interactive interview → specification
2. **`/task <spec-id>`** - Break spec → atomic tasks
3. **`/next`** - Pick and execute next task (repeat)
4. **`/test`** - Run tests and visual verification
5. **`/review`** - Review for bugs
6. **`/summary`** - Generate documentation
7. **`/log`** - Document discoveries (`.otto/logs/`)
8. **`/dev-browser`** - Browser automation (research, testing, screenshots)
9. **`/delegate`** - Delegate work to specialized subagents
10. **`/clean`** - Clean .otto artifacts (sessions, specs, tasks)

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
│   ├── test/         # /test command
│   ├── review/       # /review command
│   ├── summary/      # /summary command
│   ├── delegate/     # /delegate command
│   ├── otto/         # /otto command
│   ├── clean/        # /clean command
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
