<img width="3072" height="1428" alt="image" src="https://github.com/user-attachments/assets/5df66efc-5ca3-4624-b0d2-741f0308d89a" />

# Ottonomous

A Claude Code plugin for autonomous product development. Takes an idea and builds it end-to-end with specs, tasks, code, tests, and reviews.

## Installation

```bash
/install brsbl/ottonomous
```

## Quick Start

**Autonomous** — one command, full automation:
```bash
/otto Build a CLI todo app with local JSON storage
```

**Manual** — step-by-step control:
```bash
/spec              # Write specification
/task my-spec      # Break into tasks
/next              # Execute next task
/review            # Review for bugs
```

## Workflows

### Manual Workflow

```
Idea
  ↓
/spec ────→ .otto/specs/{id}.md
  ↓
/task ────→ .otto/tasks/{id}.json
  ↓
/next ────→ Execute highest priority task
  ↓  ⤴
  └──────→ Repeat until done
  ↓
/review ──→ Find bugs (P0-P3)
  ↓
/summary ─→ Document changes
  ↓
Done
```

### Autonomous Workflow

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

**What `/otto` does:**
1. Researches competitors via web search
2. Generates spec with Core/Expected/Delightful features
3. Breaks into parallel task groups
4. Executes tasks with fresh subagents (isolated context)
5. Self-improves every 5 tasks (max 3 cycles)
6. Reviews and fixes P0/P1 bugs
7. Generates session report

## Commands

| Command | Description |
|---------|-------------|
| `/otto` | Autonomous product development from idea to code |
| `/spec` | Interactive specification writing |
| `/task` | Break specs into prioritized tasks |
| `/next` | Execute highest priority unblocked task |
| `/test` | Run tests and visual verification |
| `/review` | Find bugs with P0-P3 priority levels |
| `/summary` | Generate change documentation |
| `/delegate` | Delegate work to specialized subagents |
| `/doc` | Document discoveries anchored to files |
| `/dev-browser` | Browser automation with Playwright |
| `/clean` | Clean workflow artifacts |

## Configuration

`.otto/config.yaml` (created automatically on first `/otto` run):

```yaml
otto:
  enabled: true
  mode: autonomous
  max_blockers: 3
  checkpoint_interval: 5
  improvement_milestone: 5
  max_improvement_cycles: 3
  max_tasks: 50
  max_duration_hours: 4
```

## Data

All artifacts stored in `.otto/`:

```
.otto/
├── config.yaml          # Session configuration
├── specs/               # Specification documents
├── tasks/               # Task JSON files
├── reviews/             # Code review outputs
├── docs/                # Engineering knowledge
└── otto/
    ├── .active          # Exists only during active sessions
    └── sessions/        # Session state, feedback, screenshots
```

## License

MIT
