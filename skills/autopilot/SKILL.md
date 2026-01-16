---
name: autopilot
description: Fully autonomous product development loop with milestone-based self-improvement. Takes a product idea and builds it end-to-end using spec, task, and review skills. Spawns fresh subagents per task, tracks workflow feedback, rotates logs, and integrates dev-browser for visual verification. Invoke with /autopilot <product idea>.
---

# Autopilot

Fully autonomous product development from idea to working code with milestone-based self-improvement.

## Quick Start

```bash
/autopilot Build a CLI todo app with local JSON storage and colored output
```

The system will autonomously:
1. Initialize session and start dev-browser server
2. Generate a specification (with optional research via dev-browser)
3. Break it into atomic tasks
4. Execute tasks in a milestone-based loop (fresh subagent per task)
5. Run improvement cycles every 5 tasks (max 3 cycles)
6. Perform E2E testing and code review
7. Generate session summary

## Architecture

**Stateless Orchestrator Pattern:**
- All state persisted to `state.json` (no in-memory state between tasks)
- Fresh `general-purpose` subagent spawned for each task via Task tool
- Subagent receives ONLY: task description + file paths
- Subagent returns: result summary + files modified
- Orchestrator context accumulates; subagent context is isolated

**Key Constraints:**
- Max recursive agent depth: 2 levels
- Improvement cycles capped at 3 per session
- feedback.md rotated every 10 tasks to prevent bloat
- Guard rails enforce time/task/stall limits

---

## Workflow

### Phase 0: Initialization

**Purpose:** Set up session, config, and dev-browser server.

#### Step 0.1: Check/Create Config

```bash
cat .kit/config.yaml 2>/dev/null | grep "autopilot:" || echo "CONFIG_MISSING"
```

If `CONFIG_MISSING`, create default config at `.kit/config.yaml`:

```yaml
auto_verify: true
auto_pick: true
autopilot:
  enabled: true
  mode: autonomous
  max_blockers: 3
  checkpoint_interval: 5
  improvement_milestone: 5
  max_improvement_cycles: 3
  self_improve: true
  max_tasks: 50
  max_duration_hours: 4
  feedback_rotation_interval: 10
```

#### Step 0.2: Generate Session ID

```bash
session_id="autopilot-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"
```

#### Step 0.3: Create Session Directory Structure

```bash
mkdir -p .kit/autopilot/sessions/${session_id}/{research/screenshots,visual-checks}
```

#### Step 0.4: Initialize state.json

Write to `.kit/autopilot/sessions/${session_id}/state.json`:

```json
{
  "schema_version": 1,
  "session_id": "{session_id}",
  "product_spec_id": null,
  "status": "initializing",
  "current_phase": "init",

  "timestamps": {
    "started_at": "{ISO8601}",
    "last_heartbeat": "{ISO8601}",
    "last_checkpoint": null
  },

  "product_tasks": {
    "total": 0,
    "completed": 0,
    "skipped": 0,
    "current_task_id": null,
    "current_task_started_at": null
  },

  "improvement": {
    "cycles_run": 0,
    "max_cycles": 3,
    "current_cycle_tasks_completed": 0
  },

  "guard_rails": {
    "consecutive_failures": 0,
    "total_tasks_executed": 0,
    "feedback_rotations": 0
  },

  "recovery": {
    "can_resume": true,
    "last_successful_task_id": null,
    "last_error": null
  }
}
```

#### Step 0.5: Initialize feedback.md

Write to `.kit/autopilot/sessions/${session_id}/feedback.md`:

```markdown
---
session_id: {session_id}
product_idea: "{user's product idea}"
started: {YYYY-MM-DD HH:MM:SS}
status: in_progress
---

# Autopilot Session: {Product Name}

## Overview

| Metric | Value |
|--------|-------|
| Started | {timestamp} |
| Status | in_progress |
| Tasks | 0/0 |
| Blockers | 0 |
| Improvement Cycles | 0/3 |

## Workflow Timeline

### Phase 1: Specification
<!-- To be filled -->

### Phase 2: Task Generation
<!-- To be filled -->

### Phase 3: Execution
| Time | Task | Status | Duration | Notes |
|------|------|--------|----------|-------|

## Blockers Encountered
| Task | Type | Error | Resolution |
|------|------|-------|------------|

## Self-Improvement Suggestions
<!-- Generated at milestones -->

## Session Metrics
| Skill | Calls | Success Rate | Avg Duration |
|-------|-------|--------------|--------------|
```

#### Step 0.6: Start Dev-Browser Server

```bash
# Update dev-browser submodule if present
if [ -d "skills/dev-browser/.git" ]; then
  git submodule update --remote --merge skills/dev-browser 2>/dev/null || true
fi

# Install dependencies if needed
if [ -d "skills/dev-browser" ] && [ -f "skills/dev-browser/package.json" ]; then
  (cd skills/dev-browser && npm install 2>/dev/null) || true
fi

# Start server in background
if [ -f "skills/dev-browser/server.sh" ]; then
  nohup skills/dev-browser/server.sh > .kit/autopilot/sessions/${session_id}/dev-browser.log 2>&1 &
  echo $! > .kit/autopilot/sessions/${session_id}/dev-browser.pid
  sleep 2  # Wait for server to initialize
fi
```

#### Step 0.7: Create Feature Branch

```bash
branch_name="autopilot/${session_id}"
git checkout -b ${branch_name}
```

#### Step 0.8: Update State

Update `state.json`:
- `status`: "in_progress"
- `current_phase`: "spec"
- `timestamps.last_heartbeat`: current time

Announce: "Starting autonomous build session: {session_id}"

---

### Phase 1: Auto-Spec

**Purpose:** Generate a complete specification without human interaction.

#### Step 1.1: Research (Optional, via Dev-Browser)

If the product idea involves UI or web technologies, invoke `/dev-browser` for research:

```
Invoke Skill: skill="dev-browser"
```

Once the dev-browser skill is loaded, write a script to research similar products:

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("{session_id}-research");

// Navigate to reference/competitor sites
await page.goto("https://example-reference-site.com");
await waitForPageLoad(page);

// Capture screenshot for reference
await page.screenshot({ path: "../../.kit/autopilot/sessions/{session_id}/research/screenshots/reference-1.png" });

console.log({ title: await page.title(), url: page.url() });
await client.disconnect();
EOF
```

Save research artifacts to `.kit/autopilot/sessions/${session_id}/research/`

#### Step 1.2: Extract Key Concepts

From the product idea, identify:
- Product type (CLI, web app, library, API, etc.)
- Core features mentioned
- Technical constraints mentioned
- Target users/use cases

#### Step 1.3: Generate Spec Directly

Write a complete specification to `.kit/specs/{spec_id}.md` covering:
- Overview and goals
- Core features (MVP scope)
- Technical architecture
- Data model
- API/interface design
- User flows (for dev-browser E2E testing later)

Set `status: approved` in frontmatter.

#### Step 1.4: Update State and Feedback

Update `state.json`:
- `product_spec_id`: "{spec_id}"
- `current_phase`: "task"
- `timestamps.last_heartbeat`: current time

Append to feedback.md Phase 1 section:
```markdown
### Phase 1: Specification
- **Duration:** {time}
- **Outcome:** SUCCESS
- **Spec ID:** {spec_id}
- **Research:** {dev-browser invoked: yes/no}
- **Observations:**
  - Auto-selected {n} architectural decisions
  - Identified {n} user flows for E2E testing
```

---

### Phase 2: Auto-Task

**Purpose:** Break specification into atomic, executable tasks.

#### Step 2.1: Read Spec

```bash
cat .kit/specs/${SPEC_ID}.md
```

#### Step 2.2: Generate Tasks

Create tasks following these principles:
- **Atomic:** Each task produces one deliverable
- **Verifiable:** Clear "done" condition
- **Minimal dependencies:** Default to parallel, explicit dependencies only when required
- **Prioritized:** P0 (setup) -> P1 (core) -> P2 (enhancement)
- **UI-tagged:** Mark tasks that modify UI for visual verification

Task schema with blocker support:

```json
{
  "spec_id": "{SPEC_ID}",
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "What to implement",
      "priority": 1,
      "depends_on": [],
      "status": "pending",
      "is_ui_task": false,
      "blocker_count": 0,
      "skipped": false,
      "skip_reason": null,
      "duration_ms": null,
      "completed_at": null
    }
  ]
}
```

#### Step 2.3: Save Tasks

Write to `.kit/tasks/${SPEC_ID}.json`

#### Step 2.4: Update State and Feedback

Update `state.json`:
- `product_tasks.total`: {n}
- `current_phase`: "execution"
- `timestamps.last_heartbeat`: current time

Append to feedback.md Phase 2 section:
```markdown
### Phase 2: Task Generation
- **Duration:** {time}
- **Tasks created:** {n}
- **UI tasks:** {n} (will trigger visual verification)
- **Parallelizable:** {task IDs with no dependencies}
- **Sequential chains:** {dependency chains}
```

---

### Phase 3: Execution Loop (Milestone-Based Improvements)

**Purpose:** Execute all tasks with fresh subagents, run improvement cycles at milestones.

#### Constants

```
IMPROVEMENT_MILESTONE = 5  # from config: improvement_milestone
MAX_IMPROVEMENT_CYCLES = 3  # from config: max_improvement_cycles
FEEDBACK_ROTATION_INTERVAL = 10  # from config: feedback_rotation_interval
```

#### Main Execution Loop

```
while (product_tasks_remaining):

    # --- GUARD RAILS ---
    check_time_limit()      # Enforce max_duration_hours
    check_task_limit()      # Enforce max_tasks
    check_stall()           # Detect consecutive failures (5+)

    # --- UPDATE HEARTBEAT ---
    state.timestamps.last_heartbeat = now()
    save_state()

    # --- SELECT NEXT TASK ---
    task = select_next_product_task()  # lowest priority, then lowest ID, unblocked

    if task is None:
        if all_tasks_done_or_skipped:
            break
        if all_remaining_blocked:
            analyze_blockers()
            break

    # --- SPAWN FRESH AGENT FOR TASK ---
    state.product_tasks.current_task_id = task.id
    state.product_tasks.current_task_started_at = now()
    save_state()

    result = spawn_task_agent(task)

    # --- PROCESS RESULT ---
    if result.success:
        mark_task_done(task)
        state.product_tasks.completed++
        state.guard_rails.consecutive_failures = 0
        state.recovery.last_successful_task_id = task.id
        log_success_to_feedback(task, result)

        # --- VISUAL VERIFICATION FOR UI TASKS ---
        if task.is_ui_task:
            invoke_visual_verification(task)

        # --- CHECKPOINT COMMIT ---
        if state.product_tasks.completed % checkpoint_interval == 0:
            git_commit("checkpoint: completed {n} tasks")
            state.timestamps.last_checkpoint = now()

    else:
        task.blocker_count++
        state.guard_rails.consecutive_failures++
        log_failure_to_feedback(task, result.error)

        if task.blocker_count >= max_blockers:
            task.skipped = true
            task.skip_reason = result.error
            state.product_tasks.skipped++
            log_skip_to_feedback(task)

    state.guard_rails.total_tasks_executed++
    save_state()

    # --- MILESTONE CHECK ---
    tasks_completed = state.product_tasks.completed
    cycles_run = state.improvement.cycles_run

    if (tasks_completed % IMPROVEMENT_MILESTONE == 0
        AND tasks_completed > 0
        AND cycles_run < MAX_IMPROVEMENT_CYCLES):

        run_improvement_cycle()
        state.improvement.cycles_run++
        save_state()

        # --- FEEDBACK ROTATION ---
        if tasks_completed % FEEDBACK_ROTATION_INTERVAL == 0:
            archive_feedback_batch()
            state.guard_rails.feedback_rotations++
            save_state()

# --- FINAL IMPROVEMENT CYCLE ---
if state.improvement.cycles_run < MAX_IMPROVEMENT_CYCLES:
    run_improvement_cycle()
    state.improvement.cycles_run++
    save_state()
```

#### Spawning Task Agent

Use the Task tool with:
- `subagent_type`: "general-purpose"
- `prompt`: Contains ONLY file paths and task description

Example prompt:
```
Execute product task {id} for session {session_id}.

Read task details from: .kit/tasks/{spec_id}.json (task id: {id})
Read spec context from: .kit/specs/{spec_id}.md
Read session state from: .kit/autopilot/sessions/{session_id}/state.json

Instructions:
1. Implement the task as described
2. Write tests if applicable
3. Verify implementation compiles/runs
4. Update task status to "done" in the task file
5. Append observations to feedback.md
6. Stage all changes with: git add -A

Return JSON: {"success": bool, "files_modified": [], "observations": "string", "error": "string or null"}
```

#### Visual Verification (for UI Tasks)

After any task with `is_ui_task: true`, invoke `/dev-browser` and write a verification script:

```
Invoke Skill: skill="dev-browser"
```

Once the dev-browser skill is loaded, write a verification script:

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("{session_id}-task-{id}-verify");

// Navigate to local dev server
await page.goto("http://localhost:3000");  // Adjust port as needed
await waitForPageLoad(page);

// Capture screenshot for visual verification
await page.screenshot({
  path: "../../.kit/autopilot/sessions/{session_id}/visual-checks/task-{id}.png",
  fullPage: true
});

console.log({
  url: page.url(),
  title: await page.title(),
  verified: true
});

await client.disconnect();
EOF
```

Log verification result to feedback.md.

#### Guard Rail Functions

```
function check_time_limit():
    elapsed = now() - state.timestamps.started_at
    if elapsed > config.max_duration_hours * 3600:
        terminate_gracefully("TIME_LIMIT")

function check_task_limit():
    if state.guard_rails.total_tasks_executed >= config.max_tasks:
        terminate_gracefully("TASK_LIMIT")

function check_stall():
    if state.guard_rails.consecutive_failures >= 5:
        terminate_gracefully("STALL")

function terminate_gracefully(reason):
    state.status = "terminated"
    state.recovery.last_error = reason
    state.recovery.can_resume = true
    save_state()
    generate_partial_summary()
    git_commit("autopilot: terminated ({reason})")
    announce("Session terminated: {reason}. Can resume from state.json.")
```

#### Improvement Cycle

```
function run_improvement_cycle():
    cycle_num = state.improvement.cycles_run + 1
    announce("Running improvement cycle #{cycle_num}")

    # 1. Analyze feedback (only if enough data)
    if state.product_tasks.completed >= 3:
        spawn_agent("""
            Analyze .kit/autopilot/sessions/{session_id}/feedback.md
            Identify:
            - Friction points (retries, long operations)
            - Repeated error patterns
            - Missing capabilities
            Generate .kit/autopilot/sessions/{session_id}/improvements.md
        """)

    # 2. Validate improvements are actionable
    improvements = read(".kit/autopilot/sessions/{session_id}/improvements.md")
    if improvements has concrete suggestions:

        # 3. Generate improvement tasks
        spawn_agent("""
            Read .kit/autopilot/sessions/{session_id}/improvements.md
            Generate tasks for actionable improvements
            Save to .kit/tasks/improvements-{cycle_num}.json
            Limit to 5 tasks maximum
        """)

        # 4. Execute improvement tasks (max 5 per cycle)
        improvement_tasks = read(".kit/tasks/improvements-{cycle_num}.json")
        for task in improvement_tasks[:5]:
            spawn_agent("Execute improvement task {id} from improvements-{cycle_num}.json")
            state.improvement.current_cycle_tasks_completed++
            save_state()

    state.improvement.current_cycle_tasks_completed = 0
```

#### Feedback Rotation

```
function archive_feedback_batch():
    batch_num = state.guard_rails.feedback_rotations + 1
    source = ".kit/autopilot/sessions/{session_id}/feedback.md"
    archive = ".kit/autopilot/sessions/{session_id}/feedback-batch-{batch_num}.md"

    # Move current feedback to archive
    mv source archive

    # Create fresh feedback.md with header only
    write_fresh_feedback_header(source)

    log("Rotated feedback.md to feedback-batch-{batch_num}.md")
```

---

### Phase 4: Final Review

**Purpose:** E2E testing, code review, and fix critical issues.

#### Step 4.1: E2E Testing (via Dev-Browser)

Before code review, invoke `/dev-browser` for full product testing:

```
Invoke Skill: skill="dev-browser"
```

Once the dev-browser skill is loaded, write E2E test scripts for each user flow defined in the spec. Example for a login flow:

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("{session_id}-e2e-login");

// Test login flow
await page.goto("http://localhost:3000/login");
await waitForPageLoad(page);

// Capture initial state
await page.screenshot({
  path: "../../.kit/autopilot/sessions/{session_id}/visual-checks/e2e-login-1-initial.png"
});

// Fill form and submit
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'testpassword');
await page.click('button[type="submit"]');
await waitForPageLoad(page);

// Capture final state
await page.screenshot({
  path: "../../.kit/autopilot/sessions/{session_id}/visual-checks/e2e-login-2-result.png"
});

const success = page.url().includes('/dashboard');
console.log({ flow: "login", success, finalUrl: page.url() });

await client.disconnect();
EOF
```

**Process:**
1. Read user flows from spec (`.kit/specs/{spec_id}.md`)
2. Write and execute a script for each flow
3. Capture screenshots at key steps
4. Generate `.kit/autopilot/sessions/{session_id}/e2e-report.md` with results

Page naming convention: `{session_id}-e2e-{flow_name}`

#### Step 4.2: Code Review

Spawn fresh agent for code review:

```
Execute code review for session {session_id}.

Scope: git diff main...HEAD
Mode: AUTO_MODE (auto-approve P0/P1 fixes)

Process:
1. Run code review on branch diff
2. For P0 issues: Attempt fix immediately
3. For P1 issues: Attempt fix immediately
4. For P2/P3 issues: Log as known issues, skip
5. Save review to .kit/reviews/{session_id}.md
6. Stage changes: git add -A

Return: {"p0_fixed": n, "p1_fixed": n, "p2_deferred": n, "p3_deferred": n}
```

#### Step 4.3: Auto-Fix Critical Issues

For each P0/P1 issue, spawn a fresh agent:

```
Fix code review issue for session {session_id}.

Issue: {issue_description}
File: {file_path}
Line: {line_number}

Instructions:
1. Read the file and understand the issue
2. Implement the fix
3. Verify the fix compiles
4. Stage changes: git add -A

Return: {"success": bool, "error": "string or null"}
```

If fix fails, log to feedback.md and continue (do not block).

#### Step 4.4: Final Commit

```bash
git add -A
git commit -m "autopilot: complete - {completed}/{total} tasks, {fixes} fixes applied"
```

#### Step 4.5: Update State

Update `state.json`:
- `status`: "completed"
- `current_phase`: "summary"
- `timestamps.last_heartbeat`: current time

---

### Phase 5: Session Summary

**Purpose:** Generate final summary and cleanup.

#### Step 5.1: Stop Dev-Browser Server

```bash
if [ -f ".kit/autopilot/sessions/${session_id}/dev-browser.pid" ]; then
  kill $(cat .kit/autopilot/sessions/${session_id}/dev-browser.pid) 2>/dev/null || true
  rm .kit/autopilot/sessions/${session_id}/dev-browser.pid
fi
```

#### Step 5.2: Generate Summary

Write session summary to feedback.md:

```markdown
## Session Complete

**Product:** {product name from spec}
**Duration:** {total time}
**Branch:** autopilot/{session_id}

### Results
| Metric | Value |
|--------|-------|
| Tasks completed | {n}/{total} |
| Tasks skipped | {n} |
| Improvement cycles | {n}/3 |
| Code review findings | P0:{n} P1:{n} P2:{n} P3:{n} |
| Fixes applied | {n} |
| Visual verifications | {n} |
| E2E tests | {pass}/{total} |

### Files Created/Modified
{list of significant files from git diff --stat}

### Artifacts
- Spec: `.kit/specs/{spec_id}.md`
- Tasks: `.kit/tasks/{spec_id}.json`
- State: `.kit/autopilot/sessions/{session_id}/state.json`
- Feedback: `.kit/autopilot/sessions/{session_id}/feedback.md`
- Improvements: `.kit/autopilot/sessions/{session_id}/improvements.md`
- E2E Report: `.kit/autopilot/sessions/{session_id}/e2e-report.md`
- Review: `.kit/reviews/{session_id}.md`
- Visual Checks: `.kit/autopilot/sessions/{session_id}/visual-checks/`
- Research: `.kit/autopilot/sessions/{session_id}/research/`

### Suggested Next Steps
1. Review the generated code on branch `autopilot/{session_id}`
2. Run tests: `{test command}`
3. Review E2E report for visual regressions
4. Review improvement suggestions in `improvements.md`
5. Create PR: `gh pr create`
```

#### Step 5.3: Announce Completion

```
Session complete!
- Tasks: {completed}/{total} completed, {skipped} skipped
- Improvement cycles: {cycles}/3
- Total duration: {time}
- Branch: autopilot/{session_id}

Review artifacts in .kit/autopilot/sessions/{session_id}/
```

---

## State Management

### state.json Schema

```json
{
  "schema_version": 1,
  "session_id": "autopilot-20260115-143022-a3b2",
  "product_spec_id": "cli-todo-app-f2e1",
  "status": "in_progress | completed | terminated",
  "current_phase": "init | spec | task | execution | review | summary",

  "timestamps": {
    "started_at": "2026-01-15T14:30:22Z",
    "last_heartbeat": "2026-01-15T14:45:12Z",
    "last_checkpoint": "2026-01-15T14:40:00Z"
  },

  "product_tasks": {
    "total": 8,
    "completed": 3,
    "skipped": 0,
    "current_task_id": "4",
    "current_task_started_at": "2026-01-15T14:45:00Z"
  },

  "improvement": {
    "cycles_run": 1,
    "max_cycles": 3,
    "current_cycle_tasks_completed": 0
  },

  "guard_rails": {
    "consecutive_failures": 0,
    "total_tasks_executed": 5,
    "feedback_rotations": 0
  },

  "recovery": {
    "can_resume": true,
    "last_successful_task_id": "3",
    "last_error": null
  }
}
```

### Recovery on Startup

When `/autopilot` is invoked, check for existing session:

```
1. Check for state.json with status: "in_progress" or "terminated"
2. If last_heartbeat > 30 minutes ago:
   - Task likely hung, reset current task to "pending"
3. If recovery.can_resume is true:
   - Offer to resume from last_successful_task_id
4. Resume execution loop from saved state
```

---

## Dev-Browser Integration

Dev-browser provides browser automation with persistent page state using Playwright. When invoked, the skill loads instructions for writing automation scripts.

### How to Use

1. **Invoke the skill:** `Invoke Skill: skill="dev-browser"`
2. **Write a script:** Use the dev-browser API to navigate, interact, and screenshot
3. **Capture results:** Save screenshots and log outcomes

### Page Naming Convention

Prevent conflicts with unique page names:
- Research: `{session_id}-research`
- Visual verify: `{session_id}-task-{id}-verify`
- E2E testing: `{session_id}-e2e-{flow_name}`

### Integration Points

| Phase | Trigger | Action |
|-------|---------|--------|
| Phase 1 | UI/web product | Navigate reference sites, capture screenshots |
| Phase 3 | `is_ui_task: true` | Navigate local dev server, capture verification screenshot |
| Phase 4 | Before review | Test each user flow, capture screenshots at key steps |

### Script Pattern

All dev-browser scripts follow this pattern:

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("unique-page-name");

await page.goto("https://target-url.com");
await waitForPageLoad(page);
await page.screenshot({ path: "path/to/screenshot.png" });

console.log({ url: page.url(), title: await page.title() });
await client.disconnect();
EOF
```

### Key APIs

- `client.page("name")` - Get or create named page (persists across scripts)
- `client.getAISnapshot("name")` - Get accessibility tree for element discovery
- `client.selectSnapshotRef("name", "e5")` - Select element by ref from snapshot
- `page.goto(url)` - Navigate to URL
- `page.screenshot({ path })` - Capture screenshot
- `page.click(selector)` - Click element
- `page.fill(selector, value)` - Fill input field
- `waitForPageLoad(page)` - Wait for navigation to complete

---

## Blocker Categories & Handling

| Category | Examples | Auto-Response |
|----------|----------|---------------|
| **build** | TypeScript error, missing import | Attempt fix once, then skip |
| **test** | Unit test fails | Log, continue (catch in review) |
| **dependency** | Missing package | Try install, skip if fails |
| **external** | API timeout, rate limit | Retry 2x, then skip |
| **conflict** | Git merge conflict | Auto-resolve if trivial, skip if complex |
| **circular** | Task A needs B, B needs A | Detect cycle, skip lower priority |

---

## Configuration Reference

```yaml
# .kit/config.yaml
auto_verify: true
auto_pick: true

autopilot:
  enabled: true                    # Master switch
  mode: autonomous                 # autonomous | supervised
  max_blockers: 3                  # Skip task after N failures
  checkpoint_interval: 5           # Commit every N tasks
  improvement_milestone: 5         # Run improvement cycle every N tasks
  max_improvement_cycles: 3        # Cap improvement cycles per session
  feedback_rotation_interval: 10   # Rotate feedback.md every N tasks
  self_improve: true               # Generate improvement suggestions
  max_tasks: 50                    # Safety limit on total tasks
  max_duration_hours: 4            # Time limit for session
```

---

## Directory Structure

```
.kit/
├── config.yaml                           # Automation config
├── specs/
│   ├── {product-spec-id}.md              # Product specification
│   └── improvements-{cycle}.md           # Improvement specs (generated)
├── tasks/
│   ├── {product-spec-id}.json            # Product tasks
│   └── improvements-{cycle}.json         # Improvement tasks (generated)
├── reviews/
│   └── {session-id}.md                   # Code review results
└── autopilot/
    └── sessions/
        └── {session-id}/
            ├── state.json                # Orchestrator state (for recovery)
            ├── feedback.md               # Current observations log
            ├── feedback-batch-{n}.md     # Archived feedback (rotated)
            ├── improvements.md           # Current improvement suggestions
            ├── e2e-report.md             # End-to-end test results
            ├── dev-browser.log           # Dev-browser server log
            ├── dev-browser.pid           # Dev-browser process ID
            ├── research/                 # Dev-browser research artifacts
            │   └── screenshots/          # Reference screenshots
            └── visual-checks/            # UI verification screenshots
                └── task-{id}.png         # Per-task visual verification
```

---

## Example Session

**Input:**
```
/autopilot Build a CLI weather app that fetches forecasts from OpenWeatherMap API
```

**Output (abbreviated):**
```
Starting autonomous build session: autopilot-20260115-143022-a3b2
Starting dev-browser server...

[Phase 1] Generating specification...
  - Product type: CLI application
  - Generated spec: cli-weather-app-f2e1
  - Duration: 45s

[Phase 2] Breaking into tasks...
  - Created 8 tasks (5 parallel, 3 sequential)
  - UI tasks: 2 (will trigger visual verification)
  - Duration: 20s

[Phase 3] Executing tasks...
  - Task 1: Set up project structure... SUCCESS (1m)
  - Task 2: Implement API client... SUCCESS (2m)
  - Task 3: Implement CLI parser... SUCCESS (1m30s)
  - Task 4: Implement forecast display... SUCCESS (2m)
  - Task 5: Add color output... SUCCESS (1m)
    [MILESTONE] Running improvement cycle #1
    - Analyzed 5 tasks, generated 2 improvement suggestions
    - Executed 2 improvement tasks
    - Rotated feedback.md
  - Task 6: Add error handling... SUCCESS (1m)
  - Task 7: Add loading spinner... SUCCESS (45s)
    [UI task] Visual verification captured
  - Task 8: Add help command... SUCCESS (30s)
  - Duration: 12m

[Phase 4] Running final review...
  - E2E testing via dev-browser: 3/3 flows passed
  - Code review: P0:0 P1:1 P2:2 P3:1
  - Fixed P1: Missing null check
  - Deferred P2/P3 to known issues
  - Final improvement cycle #2
  - Duration: 2m

Session complete!
- Tasks: 8/8 completed, 0 skipped
- Improvement cycles: 2/3
- Total duration: 15m
- Branch: autopilot/autopilot-20260115-143022-a3b2

Review artifacts in .kit/autopilot/sessions/autopilot-20260115-143022-a3b2/
```

---

## Verification Checklist

1. **Subagent isolation**: Each task spawns fresh agent, no shared context
2. **Milestone improvements**: Improvement cycle runs every 5 tasks (not after each)
3. **State persistence**: Kill mid-task, restart resumes from state.json
4. **Feedback rotation**: After 10 tasks, feedback-batch-1.md created
5. **Guard rails**: max_tasks=3 terminates gracefully after 3 tasks
6. **Dev-browser integration**: Skill invocation works, screenshots captured
7. **End-to-end**: Real product idea produces working code + improved skills
