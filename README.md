# Ottonomous

## Installation

```bash
/install brsbl/ottonomous
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
/log               # 7. Document changes
```

<img width="1536" height="714" alt="thinner 1" src="https://github.com/user-attachments/assets/16405ada-0a77-4ba3-aed2-339997924eac" />


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

### Testing & Review (with Browser Automation)

- **`/test`** — Canonical testing skill: run automated tests and visual verification with browser automation. Detects test runners, captures results, and walks through UI flows
- **`/review`** — Finds bugs with priority levels: P0 (blocking), P1 (urgent), P2 (normal), P3 (low)
- **`/summary`** — Generates audience-specific walkthrough (developers, reviewers, stakeholders) with per-component analysis. Opens HTML in browser

### Engineering Knowledge Base

- **`/log`** — Document information about the codebase anchored to files; entries marked stale when anchors change. Use `/log init` for setup, `/log rebuild` to regenerate index

### Maintenance

- **`/clean`** — Reset project to freshly installed plugin state. Preserves plugin files (.claude/, .git/, README.md, etc.) and removes everything else



## Local Development

Skills are kept in both `skills/` (plugin package) and `.claude/skills/` (standalone local use). Keep them in sync by copying updates to the other location after edits. For example:

```bash
cp -R skills/. .claude/skills/
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
    Test (via browser automation)
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
5. Self-improves every 5 tasks
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
| `/doc` | Document discoveries anchored to files |
| `/clean` | Clean workflow artifacts |

## Configuration

`.otto/config.yaml` (created automatically on first `/otto` run):

```yaml
otto:
  max_blockers: 3
  checkpoint_interval: 5
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
