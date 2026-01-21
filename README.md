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

**`/otto <idea>`** — Fully autonomous product development loop. Takes a product idea and builds it end-to-end: researches competitors via web search, generates a 3-tier spec (core/expected/delightful), breaks into parallel task groups, and executes with fresh subagents (isolated context per task).

Progress is committed every N tasks (configurable). At each commit, otto can run a **self-improvement cycle**: analyzes workflow friction from feedback that agents capture as they work, generates improvement tasks (max 3), executes them, then resumes product work. This lets the workflow adapt and get better as it runs.

### Planning

**`/spec`** — Interactive specification writing. Gathers context through an interview, researches via web search and browser automation (for navigating sites, capturing screenshots), and outputs structured specs. When called by `/otto`, chooses recommended options based on best practices instead of prompting.

**`/task <spec>`** — Breaks specs into atomic, parallelizable tasks. Each task has status (pending → in_progress → done), priority (0-4), and dependencies. Targets < 1 day per task, ≤ 3 files modified.

**`/next`** — Picks and executes the highest priority unblocked task. Resolves dependencies, spawns a subagent for execution, then marks complete.

### Quality

**`/test`** — Canonical testing skill. Detects test runners (npm/vitest/jest/pytest/cargo), implements tests if none exist, runs automated tests, and performs visual UI verification with browser automation and screenshots.

**`/review`** — Parallel code review using multiple subagents. Finds bugs with priority levels: P0 (blocking), P1 (urgent), P2 (normal), P3 (low). When called by `/otto`, auto-fixes P0/P1 issues.

**`/summary`** — Generates audience-specific change walkthroughs (developers, reviewers, stakeholders). Analyzes git diff, explains the "why" not just "what", and opens an HTML summary in your browser.

### Utilities

**`/doc`** — Institutional memory for the codebase. Captures how features work, why code is structured a certain way, gotchas, and non-obvious patterns—anchored to specific source files. During `/otto` sessions, agents automatically add discoveries after each task. Entries auto-detect staleness when their anchored code changes. Use `/doc init` for first-time setup.

**`/clean`** — Reset project to fresh state. Removes `.otto/`, generated code, and build artifacts. Preserves plugin files and git history.

## Workflows

### Manual
```
/spec → /task → /next (repeat) → /test → /review → /summary
```

### Autonomous
```
/otto <idea>   # Runs full loop: spec → tasks → execute → test → review
```

## Architecture

```
.otto/                       # Workflow artifacts (git-ignored)
├── specs/                   # Specification documents (.md)
├── tasks/                   # Task definitions (.json)
├── docs/                    # Engineering knowledge base
└── otto/
    ├── .active              # Lock file during /otto sessions
    └── sessions/            # Session state, feedback, screenshots

skills/                      # Skill implementations (SKILL.md + support files)
├── otto/
│   └── lib/browser/         # Shared Playwright-based browser automation
├── summary/
│   └── scripts/md-to-html.js  # Markdown → HTML renderer
└── ...
```

## Configuration

`.otto/config.yaml` (auto-created on first `/otto` run):

```yaml
otto:
  commit_interval: 5         # Commit progress every N tasks
  max_duration_hours: 4      # Session timeout
  self_improve: true         # Run self-improvement cycles at each commit (on/off)
```

## License

MIT
