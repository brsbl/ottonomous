# Otto

Fully autonomous product development from idea to working code with milestone-based self-improvement.

## Usage

```bash
/otto Build a CLI todo app with local JSON storage and colored output
```

## What It Does

1. **Researches competitors** via web search (MANDATORY - finds 2+ similar products)
2. **Generates comprehensive spec** with 3 feature tiers (Core/Expected/Delightful)
3. **Breaks into atomic tasks** with parallel groups for concurrent execution
4. **Executes tasks in parallel** where possible (multiple Task tool calls per message)
5. **Self-improves** at milestones (MANDATORY cycles every 5 tasks, max 3 cycles)
6. **Verifies build & tests** before review (runs build, smoke test, and test suite)
7. **Code reviews in parallel** by component, associates issues with tasks
8. **Generates task-centric report** with per-task metrics and rollup summaries

## Key Features

- **Fully autonomous** - no human approval needed at any step
- **Skip blockers** - logs issues and continues (doesn't stop on failures)
- **Self-improving** - tracks workflow observations in `feedback.md`, generates improvements
- **Context isolation** - spawns fresh agent per task via Task tool
- **Guard rails** - enforces time limits, task limits, and stall detection
- **Crash recovery** - persists state to `state.json`, can resume interrupted sessions

## Configuration

Located in `.otto/config.yaml`:

```yaml
auto_verify: true
auto_pick: true

otto:
  enabled: true
  mode: autonomous
  max_blockers: 3           # Skip task after N failures
  checkpoint_interval: 5    # Commit every N tasks
  improvement_milestone: 5  # Run improvement cycle every N tasks
  max_improvement_cycles: 3 # Cap improvement cycles per session
  self_improve: true        # Generate improvement suggestions
  max_tasks: 50             # Safety limit on total tasks
  max_duration_hours: 4     # Time limit for session
  feedback_rotation_interval: 10
  open_report: false        # Auto-open report in browser (skipped if headless)
  skip_improvement_cycles: false  # Skip self-improvement loops (faster but less thorough)
```

## Live Report

Otto includes a real-time web report that shows progress during execution.

```
┌────────────────────────────────────────────────────────────┐
│ 🚀 Otto: cli-todo-app          Session: otto-... │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Phase: [■■■■□] Execution    Duration: 2m 34s    Status: ● │
│                                                            │
│ Tasks: 7/10 ████████░░  Cycles: 1/2  Issues: 3 found, 1 fix│
└────────────────────────────────────────────────────────────┘
```

The report server starts automatically and is available at `http://localhost:3456`

Features:
- Real-time task progress with status indicators
- Improvement cycle tracking
- Code review issue summary
- Per-task drill-down for retries and issues

## Session Artifacts

Each session creates artifacts in `.otto/otto/sessions/{session-id}/`:

| File | Description |
|------|-------------|
| `state.json` | Orchestrator state (for recovery) |
| `feedback.md` | Task-centric execution report |
| `improvements.md` | Generated improvement suggestions |
| `research/competitors.md` | Competitive research from web search |
| `e2e-report.md` | E2E test results |
| `visual-checks/` | UI verification screenshots |

## Dev-Browser Integration

Otto uses `/dev-browser` for:

- **Research** (Phase 1) - Navigate reference sites, capture screenshots
- **Visual Verification** (Phase 3) - Screenshot UI after each UI task
- **E2E Testing** (Phase 4) - Test user flows with screenshots

## Architecture

```
                    ┌─────────────────────┐
                    │   /otto        │
                    │   (orchestrator)    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Task 1  │   │  Task 2  │   │  Task N  │
        │ (fresh   │   │ (fresh   │   │ (fresh   │
        │  agent)  │   │  agent)  │   │  agent)  │
        └──────────┘   └──────────┘   └──────────┘
```

Each task spawns a fresh `general-purpose` subagent with:
- Task description + file paths only
- No shared context from previous tasks
- Results written back to files

## Milestone-Based Improvement Loop

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5
                                      │
                           ┌──────────▼──────────┐
                           │  Improvement Cycle  │
                           │  - Analyze feedback │
                           │  - Generate tasks   │
                           │  - Execute fixes    │
                           └─────────────────────┘
                                      │
Task 6 → Task 7 → Task 8 → Task 9 → Task 10
                                      │
                           ┌──────────▼──────────┐
                           │  Improvement Cycle  │
                           └─────────────────────┘
                                      │
                                     ...
```

## Example Output

```
Starting autonomous build session: otto-20260115-143022-a3b2

[Phase 1] Researching & generating specification...
  - Researched 3 competitors (see research/competitors.md)
  - Features: 12 total (5 core, 4 expected, 3 delightful)
  - Generated spec: cli-weather-app-f2e1

[Phase 2] Breaking into tasks...
  - Created 10 tasks
  - Parallel groups: [2,3] [4,5,6,7,8]

[Phase 3] Executing tasks...
  - Group 0: Task 1 (setup)... SUCCESS (45s)
  - Group 1: Tasks 2,3 (parallel)... SUCCESS (38s, 42s)
  - Group 2: Tasks 4,5,6,7,8 (parallel)... SUCCESS
    🔄 IMPROVEMENT CYCLE #1 - Analyzing workflow...
    - Found 2 issues, executed 2 improvements
  - Group 3: Tasks 9,10 (parallel)... SUCCESS
    🔄 FINAL IMPROVEMENT CYCLE - Last chance to improve...

[Phase 4] Running final review...
  - Code review (3 parallel agents): 7 issues found
  - Fixed 2/2 P0+P1 issues, deferred 5 P2/P3

Session complete!
- Tasks: 10/10 completed, 0 skipped
- Improvement cycles: 2/2 possible (max 3)
- Code review: 7 issues, 2 fixed
- Branch: otto/otto-20260115-143022-a3b2

## Task Execution Details

| # | Task | Status | Duration | Retries | Review Issues |
|---|------|--------|----------|---------|---------------|
| 1 | Initialize project | ✓ | 45s | 0 | - |
| 2 | Implement types | ✓ | 38s | 0 | - |
| 3 | Implement storage | ✓ | 42s | 1 | P2: validation |
| ... | ... | ... | ... | ... | ... |
```

## Recovery

If a session is interrupted, otto can resume:

1. Run `/otto` again
2. It detects existing `state.json` with `status: "in_progress"`
3. Offers to resume from last successful task
4. Continues execution loop from saved state
