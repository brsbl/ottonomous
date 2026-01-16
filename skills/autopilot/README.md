# Autopilot

Fully autonomous product development from idea to working code with milestone-based self-improvement.

## Usage

```bash
/autopilot Build a CLI todo app with local JSON storage and colored output
```

## What It Does

1. **Generates specification** from your product idea (with optional research via dev-browser)
2. **Breaks into atomic tasks** with dependencies and priorities
3. **Executes tasks** with fresh subagents (isolated context per task)
4. **Self-improves** at milestones (every 5 tasks, max 3 cycles)
5. **Verifies UI changes** with dev-browser screenshots
6. **Runs E2E tests** via dev-browser before final review
7. **Code reviews** and auto-fixes P0/P1 issues
8. **Generates summary** with artifacts and next steps

## Key Features

- **Fully autonomous** - no human approval needed at any step
- **Skip blockers** - logs issues and continues (doesn't stop on failures)
- **Self-improving** - tracks workflow observations in `feedback.md`, generates improvements
- **Context isolation** - spawns fresh agent per task via Task tool
- **Guard rails** - enforces time limits, task limits, and stall detection
- **Crash recovery** - persists state to `state.json`, can resume interrupted sessions

## Configuration

Located in `.kit/config.yaml`:

```yaml
auto_verify: true
auto_pick: true

autopilot:
  enabled: true
  mode: autonomous
  max_blockers: 3           # Skip task after N failures
  checkpoint_interval: 5    # Commit every N tasks
  improvement_milestone: 5  # Run improvement cycle every N tasks
  max_improvement_cycles: 3 # Cap improvement cycles per session
  max_tasks: 50             # Safety limit on total tasks
  max_duration_hours: 4     # Time limit for session
```

## Session Artifacts

Each session creates artifacts in `.kit/autopilot/sessions/{session-id}/`:

| File | Description |
|------|-------------|
| `state.json` | Orchestrator state (for recovery) |
| `feedback.md` | Workflow observations |
| `improvements.md` | Generated improvement suggestions |
| `e2e-report.md` | E2E test results |
| `visual-checks/` | UI verification screenshots |
| `research/` | Research screenshots |

## Dev-Browser Integration

Autopilot uses `/dev-browser` for:

- **Research** (Phase 1) - Navigate reference sites, capture screenshots
- **Visual Verification** (Phase 3) - Screenshot UI after each UI task
- **E2E Testing** (Phase 4) - Test user flows with screenshots

## Architecture

```
                    ┌─────────────────────┐
                    │   /autopilot        │
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
Starting autonomous build session: autopilot-20260115-143022-a3b2

[Phase 1] Generating specification...
  - Product type: CLI application
  - Generated spec: cli-weather-app-f2e1

[Phase 2] Breaking into tasks...
  - Created 8 tasks (5 parallel, 3 sequential)

[Phase 3] Executing tasks...
  - Task 1: Set up project structure... SUCCESS
  - Task 2: Implement API client... SUCCESS
  - Task 3: Implement CLI parser... SUCCESS
  - Task 4: Implement display... SUCCESS
  - Task 5: Add color output... SUCCESS
    [MILESTONE] Running improvement cycle #1

  - Task 6: Add error handling... SUCCESS
  - Task 7: Add loading spinner... SUCCESS
    [UI task] Visual verification captured
  - Task 8: Add help command... SUCCESS

[Phase 4] Running final review...
  - E2E testing: 3/3 flows passed
  - Code review: P0:0 P1:1 P2:2 P3:1
  - Fixed P1: Missing null check

Session complete!
- Tasks: 8/8 completed
- Branch: autopilot/autopilot-20260115-143022-a3b2
```

## Recovery

If a session is interrupted, autopilot can resume:

1. Run `/autopilot` again
2. It detects existing `state.json` with `status: "in_progress"`
3. Offers to resume from last successful task
4. Continues execution loop from saved state
