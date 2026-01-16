---
name: otto
description: Fully autonomous product development loop with milestone-based self-improvement. Takes a product idea and builds it end-to-end using spec, task, and review skills. Spawns fresh subagents per task, tracks workflow feedback, rotates logs, and integrates dev-browser for visual verification. Invoke with /otto <product idea>.
---

# Otto

Fully autonomous product development from idea to working code with milestone-based self-improvement.

## Quick Start

```bash
/otto Build a CLI todo app with local JSON storage and colored output
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
cat .otto/config.yaml 2>/dev/null | grep "otto:" || echo "CONFIG_MISSING"
```

If `CONFIG_MISSING`, create default config at `.otto/config.yaml`:

```yaml
auto_verify: true
auto_pick: true
otto:
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
  open_report: false               # Auto-open report in browser (skipped if headless)
  skip_improvement_cycles: false  # Skip self-improvement loops (faster but less thorough)
```

#### Step 0.2: Generate Session ID

```bash
session_id="otto-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"
```

#### Step 0.3: Create Session Directory Structure

```bash
mkdir -p .otto/otto/sessions/${session_id}/{research/screenshots,visual-checks}
```

#### Step 0.4: Initialize state.json

Write to `.otto/otto/sessions/${session_id}/state.json`:

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

  // Product task counters - SOURCE OF TRUTH for product build progress
  "product_tasks": {
    "total": 0,           // Total product tasks from spec
    "completed": 0,       // SOURCE OF TRUTH: Count of product tasks with status "done"
    "skipped": 0,         // Count of product tasks skipped due to blockers
    "current_task_id": null,
    "current_task_started_at": null
  },

  // Improvement cycle tracking - separate from product tasks
  "improvement": {
    "cycles_run": 0,
    "max_cycles": 3,
    "current_cycle_tasks_completed": 0,  // Tracks improvement tasks only (resets each cycle)
    "cycle_history": []
  },

  // Guard rails - includes ALL execution attempts for safety limits
  "guard_rails": {
    "consecutive_failures": 0,
    "total_tasks_executed": 0,  // Includes retries + improvement tasks (for max_tasks limit)
    "feedback_rotations": 0
  },

  "recovery": {
    "can_resume": true,
    "last_successful_task_id": null,
    "last_error": null
  },

  // Integration availability - set during Phase 0 initialization
  "integrations": {
    "dev_browser_available": false,
    "report_available": false
  }
}
```

#### Step 0.5: Initialize feedback.md

Write to `.otto/otto/sessions/${session_id}/feedback.md`:

```markdown
---
session_id: {session_id}
product_idea: "{user's product idea}"
started: {YYYY-MM-DD HH:MM:SS}
status: in_progress
---

# Otto Session: {Product Name}

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

# Start server in background and verify it started
if [ -f "skills/dev-browser/server.sh" ]; then
  nohup skills/dev-browser/server.sh > .otto/otto/sessions/${session_id}/dev-browser.log 2>&1 &
  echo $! > .otto/otto/sessions/${session_id}/dev-browser.pid
  sleep 3  # Wait for server to initialize

  # Verify server is responding
  curl -s http://localhost:9222/json/version > /dev/null
  # Exit code 0 = server running, non-zero = failed
fi
```

**Orchestrator action after server check:**
- If curl succeeded: Set `state.integrations.dev_browser_available = true`, announce "✓ Dev-browser server running"
- If curl failed: Set `state.integrations.dev_browser_available = false`, announce "⚠️ Dev-browser server failed to start - visual verification disabled"

#### Step 0.7: Start Report Server

```bash
if [ -f "skills/otto/report/server.js" ]; then
  node skills/otto/report/server.js --session ${session_id} --port 3456 &
  echo $! > .otto/otto/sessions/${session_id}/report.pid
  sleep 1
  echo "Report: http://localhost:3456"

  # Verify report server is responding
  curl -s http://localhost:3456 > /dev/null
fi
```

**Orchestrator action after report start:**
- If curl succeeded: Set `state.integrations.report_available = true`
- If curl failed: Set `state.integrations.report_available = false`, announce "⚠️ Report server failed to start"

**Auto-open logic (orchestrator handles):**
- If `config.open_report` is true AND (DISPLAY env var is set OR running on macOS):
  - macOS: Run `open "http://localhost:3456"`
  - Linux: Run `xdg-open "http://localhost:3456"`

#### Step 0.8: Create Feature Branch

```bash
branch_name="otto/${session_id}"
git checkout -b ${branch_name}
```

#### Step 0.9: Update State

Update `state.json`:
- `status`: "in_progress"
- `current_phase`: "spec"
- `timestamps.last_heartbeat`: current time

Announce: "Starting autonomous build session: {session_id}"

---

### Phase 1: Auto-Spec

**Purpose:** Generate a comprehensive specification with competitive research.

#### MANDATORY: Step 1.1 - Research Similar Products (Parallel)

Before generating spec, you MUST research competitors using WebSearch. Launch 2-3 search agents IN PARALLEL in a single message:

```
Use Task tool with subagent_type: "Explore" - launch all 3 in ONE message:

Agent 1: "Search for 'best {product type} tools 2026' and list top 3 with their key features"
Agent 2: "Search for '{product type} comparison' and summarize pros/cons of popular options"
Agent 3: "Search for '{product type} user complaints reddit' to find common pain points"
```

Wait for all 3 to complete, then synthesize findings into:
`.otto/otto/sessions/${session_id}/research/competitors.md`

```markdown
## Competitive Research

| Product | Key Features | User Praise | User Complaints |
|---------|--------------|-------------|-----------------|
| {name} | {features} | {praise} | {complaints} |

### Differentiation Opportunity
{How our product can be better}
```

#### Step 1.2: Extract Key Concepts

From the product idea, identify:
- Product type (CLI, web app, library, API, etc.)
- Core features mentioned
- Technical constraints mentioned
- Target users/use cases

#### Step 1.3: Generate Comprehensive Spec

Write specification to `.otto/specs/{spec_id}.md` with THREE feature tiers:

```markdown
## Features

### Tier 1: Core (Must Have)
Essential functionality that defines the product. Without these, it doesn't work.

### Tier 2: Expected (Should Have)
Features users would expect from a polished product. Missing these feels incomplete.

### Tier 3: Delightful (Nice to Have)
Features that differentiate from competitors. Surprise and delight users.
```

**Feature Categories to Consider by Product Type:**

For CLI Tools:
- [ ] Configuration file support (~/.{app}rc or config.yaml)
- [ ] Environment variable overrides
- [ ] Multiple output formats (table, json, csv)
- [ ] Filtering and sorting options
- [ ] Import/export functionality
- [ ] Quiet/verbose flags

For Web Apps:
- [ ] User preferences/settings
- [ ] Search and filtering
- [ ] Loading states and error handling
- [ ] Keyboard shortcuts
- [ ] Dark mode

For APIs:
- [ ] Pagination
- [ ] Filtering/sorting query params
- [ ] Error response format
- [ ] Health check endpoint

**Spec must also include:**
- Overview and goals
- Technical architecture
- Data model with all fields
- API/interface design
- At least 3 user flows (for E2E testing)
- Future Considerations (NOT "Non-Goals")

Set `status: approved` in frontmatter.

#### Step 1.4: Spec Completeness Check

⚠️ **STOP** - Before proceeding, verify spec has:
- [ ] At least 8-12 distinct features (not just basic CRUD)
- [ ] Configuration/customization options
- [ ] Error handling strategy documented
- [ ] At least 3 user flows
- [ ] Data model with all fields
- [ ] Edge cases identified

**If spec has fewer than 8 features, expand it before continuing.**

#### Step 1.5: Update State and Feedback

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
- **Research:** Analyzed {n} competitors (see research/competitors.md)
- **Features:** {n} total ({tier1} core, {tier2} expected, {tier3} delightful)
- **Observations:**
  - Differentiation: {key differentiator from research}
  - Identified {n} user flows for E2E testing
```

---

### Phase 2: Auto-Task

**Purpose:** Break specification into atomic, executable tasks.

#### Step 2.1: Read Spec

```bash
cat .otto/specs/${SPEC_ID}.md
```

#### Step 2.2: Generate Tasks

Create tasks following these principles:
- **Atomic:** Each task produces one deliverable
- **Verifiable:** Clear "done" condition
- **Minimal dependencies:** Default to parallel, explicit dependencies only when required
- **Prioritized:** P0 (setup) -> P1 (core) -> P2 (enhancement)
- **UI-tagged:** Mark tasks that modify UI for visual verification

Task schema with execution tracking and parallel groups:

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

      "execution": {
        "started_at": null,
        "completed_at": null,
        "duration_ms": null,
        "attempts": [
          {
            "attempt": 1,
            "status": "success | failed",
            "error": "string or null",
            "started_at": "ISO8601",
            "completed_at": "ISO8601",
            "duration_ms": 45000
          }
        ],
        "files_modified": []
      },

      "review": {
        "issues": [
          {
            "severity": "P0 | P1 | P2 | P3",
            "description": "Issue description",
            "file": "path/to/file.ts",
            "line": 15,
            "suggested_fix": "Add null check",
            "status": "pending | fixed | deferred"
          }
        ]
      }
    }
  ],

  "parallel_groups": [
    {"group": 1, "task_ids": ["2", "3"], "after": ["1"]},
    {"group": 2, "task_ids": ["4", "5", "6", "7", "8"], "after": ["2", "3"]}
  ]
}
```

**Parallel Groups:** Explicitly identify which tasks can run concurrently. During execution, launch all tasks in a group with multiple Task tool calls in a single message.

#### Step 2.3: Save Tasks

Write to `.otto/tasks/${SPEC_ID}.json`

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

#### Main Execution Loop (Parallel Groups)

Execute tasks by parallel groups. For each group, launch ALL tasks in a SINGLE message with multiple Task tool calls.

```
for group in parallel_groups (sorted by group number):

    # --- GUARD RAILS ---
    check_time_limit()
    check_task_limit()
    check_stall()

    # --- WAIT FOR DEPENDENCIES ---
    wait_for_tasks(group.after)  # Ensure prerequisite tasks completed

    tasks_completed_before_group = state.product_tasks.completed  # Capture BEFORE execution

    # --- EXECUTE GROUP IN PARALLEL ---
    # Launch ALL tasks in this group with multiple Task tool calls in ONE message
    tasks_in_group = get_tasks(group.task_ids)

    Announce: "Executing parallel group {group.group}: tasks {group.task_ids}"

    # Use Task tool multiple times in SINGLE message:
    results = []
    for task in tasks_in_group:
        # Each of these Task tool calls goes in the SAME message
        result = Task(subagent_type="general-purpose", prompt="Execute task {task.id}...")
        results.append(result)

    # --- PROCESS RESULTS ---
    for task, result in zip(tasks_in_group, results):
        task.execution.completed_at = now()
        task.execution.duration_ms = result.duration

        if result.success:
            task.status = "done"
            task.execution.files_modified = result.files_modified
            task.execution.attempts.append({"attempt": 1, "status": "success"})
            state.product_tasks.completed++
            state.recovery.last_successful_task_id = task.id

            if task.is_ui_task:
                invoke_visual_verification(task)
        else:
            task.blocker_count++
            task.execution.attempts.append({"attempt": 1, "status": "failed", "error": result.error})

            if task.blocker_count >= max_blockers:
                task.skipped = true
                task.skip_reason = result.error
                state.product_tasks.skipped++

    state.guard_rails.total_tasks_executed += len(tasks_in_group)

    save_tasks()
    save_state()

    # --- CHECKPOINT COMMIT ---
    if state.product_tasks.completed % checkpoint_interval == 0:
        perform_checkpoint_commit()

#### Checkpoint Commit

**IMPORTANT:** Only the orchestrator commits - subagents only stage changes. This prevents race conditions.

```bash
# Stage all changes from parallel group
git add -A

# Commit with descriptive message (use HEREDOC for multiline)
git commit -m "$(cat <<'EOF'
otto: checkpoint - {completed}/{total} tasks complete

Session: {session_id}
Phase: execution
Group: {group_number}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" || true
```

    # --- FEEDBACK ROTATION CHECK ---
    if state.guard_rails.total_tasks_executed % FEEDBACK_ROTATION_INTERVAL == 0:
        archive_feedback_batch()
        state.guard_rails.feedback_rotations++

    # --- MANDATORY IMPROVEMENT CYCLE CHECK ---
    # Track tasks_before_group at start of each group execution
    previous_completed = tasks_completed_before_group
    current_completed = state.product_tasks.completed
    cycles_run = state.improvement.cycles_run

    if (previous_completed // IMPROVEMENT_MILESTONE < current_completed // IMPROVEMENT_MILESTONE
        AND cycles_run < MAX_IMPROVEMENT_CYCLES
        AND NOT config.skip_improvement_cycles):

        ⚠️ STOP - DO NOT PROCEED TO NEXT GROUP
        You MUST run the improvement cycle NOW.

        Announce: "🔄 IMPROVEMENT CYCLE #{cycles_run + 1} - Analyzing workflow..."
        run_improvement_cycle()
        state.improvement.cycles_run++
        save_state()

# --- MANDATORY FINAL IMPROVEMENT CYCLE ---
⚠️ STOP - Before proceeding to Phase 4:

if state.improvement.cycles_run < MAX_IMPROVEMENT_CYCLES AND NOT config.skip_improvement_cycles:
    Announce: "🔄 FINAL IMPROVEMENT CYCLE - Last chance to improve workflow..."
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

Read task details from: .otto/tasks/{spec_id}.json (task id: {id})
Read spec context from: .otto/specs/{spec_id}.md
Read session state from: .otto/otto/sessions/{session_id}/state.json

**Before coding, briefly outline your approach:**
1. What files will you create or modify?
2. What's the implementation sequence?
3. Any edge cases to handle?

Instructions:
1. Implement the task as described
2. Write at least one test for your implementation:
   - For functions: unit test with basic input/output
   - For components: render test or snapshot
   - For API endpoints: request/response test
3. Verify implementation compiles/runs
4. Update task status to "done" in the task file
5. Append observations to feedback.md
6. Stage all changes with: git add -A

Return JSON: {"success": bool, "files_modified": [], "observations": "string", "error": "string or null"}
```

**For UI tasks, add to prompt:**
```
This is a UI task. After implementation:
1. Start the dev server if not running
2. Use dev-browser to capture a screenshot
3. Save to: .otto/otto/sessions/{session_id}/visual-checks/task-{id}.png
4. Include screenshot_path in your return JSON

Return JSON: {"success": bool, "files_modified": [], "observations": "string", "error": "string or null", "screenshot_path": "string or null"}
```

#### Visual Verification (for UI Tasks)

After any task with `is_ui_task: true`:

**Prerequisite check:**
```
if NOT state.integrations.dev_browser_available:
    log("Skipping visual verification - dev-browser not available")
    Continue to next task
```

Invoke `/dev-browser` and write a verification script:

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
  path: "../../.otto/otto/sessions/{session_id}/visual-checks/task-{id}.png",
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

    # Termination commit
    ```bash
    git add -A
    git commit -m "$(cat <<'EOF'
    otto: terminated ({reason})

    Session: {session_id}
    Tasks completed: {completed}/{total}
    Can resume: true

    Co-Authored-By: Claude <noreply@anthropic.com>
    EOF
    )" || true
    ```

    announce("Session terminated: {reason}. Can resume from state.json.")
```

#### Improvement Cycle (MUST Complete All Steps)

```
function run_improvement_cycle():
    cycle_num = state.improvement.cycles_run + 1

    # ============================================
    # STEP 1: Analyze Feedback (REQUIRED)
    # ============================================
    Use Task tool:
    - subagent_type: "general-purpose"
    - prompt: """
        Analyze the otto session feedback.

        Read: .otto/otto/sessions/{session_id}/feedback.md
        Read: .otto/tasks/{spec_id}.json (check task.execution.attempts for retries)

        Identify:
        1. Tasks that required retries (look at attempts array)
        2. Repeated error patterns
        3. Long-running tasks (duration_ms > average)
        4. Friction points in the workflow

        Write findings to: .otto/otto/sessions/{session_id}/improvements.md

        Format:
        ## Improvement Cycle {cycle_num}

        ### Issues Found
        | Issue | Affected Tasks | Severity |
        |-------|----------------|----------|

        ### Suggested Improvements
        1. {actionable improvement}
        2. {actionable improvement}
      """

    # ============================================
    # STEP 2: Verify improvements.md Created (REQUIRED)
    # ============================================
    Read .otto/otto/sessions/{session_id}/improvements.md

    If file is empty or missing:
        Write: "## Improvement Cycle {cycle_num}\n\nNo improvements identified this cycle."
        Log to state: {"cycle": cycle_num, "improvements_found": 0}
        RETURN (cycle complete with no improvements)

    # ============================================
    # STEP 3: Generate Improvement Tasks (CONDITIONAL)
    # ============================================
    If improvements.md has actionable items:

        Use Task tool:
        - subagent_type: "general-purpose"
        - prompt: """
            Read: .otto/otto/sessions/{session_id}/improvements.md

            Generate max 3 improvement tasks.
            Save to: .otto/tasks/improvements-{cycle_num}.json

            Task format:
            {
              "tasks": [
                {"id": "imp-1", "title": "...", "description": "..."}
              ]
            }
          """

    # ============================================
    # STEP 4: Execute Improvement Tasks (CONDITIONAL)
    # ============================================
    If .otto/tasks/improvements-{cycle_num}.json exists and has tasks:

        For each task (max 3):
            Use Task tool:
            - subagent_type: "general-purpose"
            - prompt: "Execute improvement task {id}: {description}"

        Log results to feedback.md

    # ============================================
    # STEP 5: Update State (REQUIRED)
    # ============================================
    Add to state.improvement.cycle_history:
    {
      "cycle": cycle_num,
      "triggered_after_task": state.product_tasks.completed,
      "improvements_found": {count from improvements.md},
      "tasks_executed": {count executed}
    }
```

#### Improvement Cycle Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
otto: improvement cycle #{cycle_num}

Improvements found: {improvements_found}
Tasks executed: {tasks_executed}
Session: {session_id}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" || true
```

#### Feedback Rotation

```
function archive_feedback_batch():
    batch_num = state.guard_rails.feedback_rotations + 1
    source = ".otto/otto/sessions/{session_id}/feedback.md"
    archive = ".otto/otto/sessions/{session_id}/feedback-batch-{batch_num}.md"

    # Move current feedback to archive
    mv source archive

    # Create fresh feedback.md with header only
    write_fresh_feedback_header(source)

    log("Rotated feedback.md to feedback-batch-{batch_num}.md")

function write_fresh_feedback_header(path):
    Write to {path}:
    ---
    session_id: {session_id}
    product_idea: "{product_idea}"
    started: {timestamp}
    status: in_progress
    batch: {batch_num + 1}
    ---

    # Feedback (continued)

    ## Workflow Timeline
    | Time | Task | Status | Duration | Notes |
    |------|------|--------|----------|-------|
```

---

### Phase 4: Final Review

**Purpose:** Build verification, E2E testing, code review, and fix critical issues.

#### Step 4.0: Build Verification

Before code review, verify the product builds and runs.

Announce: "Running build verification..."

**Build check:**

```bash
# For web apps (detect by package.json scripts)
if grep -q '"build"' package.json 2>/dev/null; then
  npm run build 2>&1 | tee .otto/otto/sessions/${session_id}/build.log
  # Capture exit code: BUILD_EXIT=$?
fi
```

**Orchestrator action after build:**
- If BUILD_EXIT is 0: Announce "✓ Build succeeded"
- If BUILD_EXIT is non-zero: Announce "⚠️ Build failed - creating fix task", then:
  ```
  add_task({
    id: "fix-build",
    title: "Fix build errors",
    priority: 0,
    description: "Build failed. See build.log for errors."
  })
  spawn_task_agent("fix-build")
  ```

**Smoke test:**

Announce: "Running smoke test..."

```bash
# Start dev server briefly to check for runtime errors
# Note: On macOS, use 'gtimeout' from coreutils if 'timeout' is unavailable
if grep -q '"dev"' package.json 2>/dev/null; then
  timeout 15 npm run dev 2>&1 | tee .otto/otto/sessions/${session_id}/dev.log &
  DEV_PID=$!
  sleep 8

  # Try common ports to find the dev server
  DEV_PORT=""
  for port in 5173 3000 8080 4000; do
    if curl -s "http://localhost:${port}" > /dev/null 2>&1; then
      DEV_PORT=$port
      break
    fi
  done

  kill $DEV_PID 2>/dev/null || true
fi
```

**Orchestrator action after smoke test:**
- If DEV_PORT was found: Announce "✓ Dev server responding on port ${DEV_PORT}"
- If DEV_PORT is empty: Announce "⚠️ Dev server not responding on common ports - check dev.log for errors"

#### Step 4.0b: Test Verification

Run automated tests using the `/test` skill with session context:

```
Invoke Skill: skill="test", args="--unit --session {session_id}"
```

The `/test` skill will:
1. Detect the test runner (npm test, pytest, etc.)
2. Run all unit/automated tests
3. Capture results to `.otto/test-results/`
4. Return JSON with pass/fail status

**Orchestrator action after /test returns:**

```json
// Expected return format from /test
{
  "success": true,
  "unit_tests": {
    "passed": 15,
    "failed": 0,
    "skipped": 2,
    "duration_ms": 4500
  }
}
```

- If `success` is true: Announce "✓ Tests passed ({passed}/{total})"
- If `success` is false: Announce "⚠️ Tests failed - creating fix task", then:
  ```
  add_task({
    id: "fix-tests",
    title: "Fix failing tests",
    priority: 1,
    description: "Tests failed. See .otto/test-results/test-output.log for errors."
  })
  spawn_task_agent("fix-tests")
  ```

#### Step 4.1: E2E Testing (via /test)

Run visual verification and E2E tests using the `/test` skill:

```
Invoke Skill: skill="test", args="--visual --session {session_id} --spec {spec_id}"
```

The `/test` skill will:
1. Check dev-browser availability (skip if not running)
2. Read user flows from the spec file
3. Execute each flow with dev-browser
4. Capture screenshots to `.otto/otto/sessions/{session_id}/visual-checks/`
5. Generate `.otto/otto/sessions/{session_id}/e2e-report.md`
6. Return JSON with results

**Orchestrator action after /test --visual returns:**

```json
// Expected return format from /test --visual
{
  "success": true,
  "visual_tests": {
    "flows_tested": 3,
    "flows_passed": 3,
    "screenshots": [
      ".otto/otto/sessions/{session_id}/visual-checks/flow-login-1-start.png",
      ".otto/otto/sessions/{session_id}/visual-checks/flow-login-2-result.png"
    ]
  }
}
```

- If `success` is true: Announce "✓ E2E tests passed ({flows_passed}/{flows_tested} flows)"
- If `success` is false: Log failures to feedback.md, continue to code review (don't block)

#### Step 4.2: Code Review (Parallel by Component)

Launch multiple review agents IN PARALLEL in a single message, split by file groups:

```
# Get list of modified files
files = git diff --name-only main...HEAD

# Group files by component
command_files = files matching src/commands/*
storage_files = files matching src/storage* or src/types*
util_files = files matching src/utils/*
other_files = remaining files

# Launch parallel review agents in ONE message:
Use Task tool (multiple calls in single message):

Agent 1: "Review {command_files} for code issues. Return JSON with issues array."
Agent 2: "Review {storage_files} for code issues. Return JSON with issues array."
Agent 3: "Review {util_files} for code issues. Return JSON with issues array."

# Wait for all to complete, then merge results
```

Each agent returns:
```json
{
  "issues": [
    {
      "file": "src/commands/add.ts",
      "line": 15,
      "severity": "P1",
      "description": "Missing null check",
      "suggested_fix": "Add if (!text) return"
    }
  ]
}
```

#### Helper: find_task_by_file

```
function find_task_by_file(file_path):
    for task in tasks:
        if file_path in task.execution.files_modified:
            return task
    return null  # Orphan issue - file not tracked to any task
```

#### Step 4.3: Associate Issues with Tasks

For each issue found, link it to the task that created the file:

```
for issue in all_issues:
    task = find_task_by_file(issue.file)
    if task is None:
        # Orphan issue - log to session-level review
        session_orphan_issues.append(issue)
        continue
    task.review.issues.append({
      "severity": issue.severity,
      "description": issue.description,
      "line": issue.line,
      "status": "pending"
    })

save_tasks()
```

#### Step 4.4: Auto-Fix P0/P1 Issues

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

If fix succeeds, update the task's review issue status to "fixed".
If fix fails, log to feedback.md and continue (do not block).

#### Step 4.5: Final Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
otto: complete - {completed}/{total} tasks, {fixes} fixes applied

Session: {session_id}
Phase: review complete
Improvement cycles: {cycles_run}/{max_cycles}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### Step 4.6: Update State

Update `state.json`:
- `status`: "completed"
- `current_phase`: "summary"
- `timestamps.last_heartbeat`: current time

---

### Phase 5: Session Summary

**Purpose:** Generate final summary and cleanup.

#### Step 5.1: Stop Servers

```bash
# Stop dev-browser server
if [ -f ".otto/otto/sessions/${session_id}/dev-browser.pid" ]; then
  kill $(cat .otto/otto/sessions/${session_id}/dev-browser.pid) 2>/dev/null || true
  rm .otto/otto/sessions/${session_id}/dev-browser.pid
fi

# Stop report server
if [ -f ".otto/otto/sessions/${session_id}/report.pid" ]; then
  kill $(cat .otto/otto/sessions/${session_id}/report.pid) 2>/dev/null || true
  rm .otto/otto/sessions/${session_id}/report.pid
fi
```

#### Step 5.2: Generate Task-Centric Summary

Write session summary to feedback.md. All metrics roll up FROM task data.

```markdown
## Session Complete

**Product:** {product name from spec}
**Duration:** {total time}
**Branch:** otto/{session_id}

### Session Summary

| Metric | Value |
|--------|-------|
| Tasks | {completed}/{total} completed, {skipped} skipped |
| Duration | {total time} |
| Improvement cycles | {cycles_run}/{possible_cycles} possible (max 3) |
| Code review | {total_issues} issues found, {fixed_count} fixed |
| Commits | {n} |

### Task Execution Details

| # | Task | Status | Duration | Retries | Review Issues | Notes |
|---|------|--------|----------|---------|---------------|-------|
{for each task in tasks:}
| {id} | {title} | {status_icon} | {duration} | {attempts.length - 1} | {review.issues summary} | {notes} |
{end for}

**Legend:** ✓ = completed, ✗ = failed, ⊘ = skipped

### Tasks with Issues (Expanded)

{for each task with retries > 0 or review.issues.length > 0:}

#### Task {id}: {title}

| Metric | Value |
|--------|-------|
| Status | {status} |
| Duration | {duration} |
| Files modified | {files list} |

{if attempts.length > 1:}
**Retry Details:**
{for each attempt:}
- Attempt {n}: {status} - {error if failed}
{end for}
{end if}

{if review.issues.length > 0:}
**Code Review Issues:**
| Severity | Issue | Status |
|----------|-------|--------|
{for each issue:}
| {severity} | {description} | {status} |
{end for}
{end if}

---
{end for}

### Improvement Cycles

| Cycle | Triggered After | Improvements Found | Tasks Executed |
|-------|-----------------|-------------------|----------------|
{for each cycle in cycle_history:}
| {cycle} | Task {triggered_after_task} | {improvements_found} | {tasks_executed} |
{end for}

### Code Review Summary

| Severity | Found | Fixed | Deferred | Tasks Affected |
|----------|-------|-------|----------|----------------|
| P0 (Critical) | {n} | {n} | {n} | {task_ids} |
| P1 (High) | {n} | {n} | {n} | {task_ids} |
| P2 (Medium) | {n} | {n} | {n} | {task_ids} |
| P3 (Low) | {n} | {n} | {n} | {task_ids} |
| **Total** | **{n}** | **{n}** | **{n}** | |

### Artifacts
- Spec: `.otto/specs/{spec_id}.md`
- Tasks: `.otto/tasks/{spec_id}.json`
- Research: `.otto/otto/sessions/{session_id}/research/competitors.md`
- State: `.otto/otto/sessions/{session_id}/state.json`

### Suggested Next Steps
1. Review the generated code on branch `otto/{session_id}`
2. Run tests: `{test command}`
3. Create PR: `gh pr create`

### Report Improvement Suggestions

While managing subagents this session, the orchestrator noted:

**Missing information:**
{if had to read task files directly to understand status:}
- Report should show: task error messages
{end if}
{if couldn't tell which tasks were blocked:}
- Report should show: blocker_count per task
{end if}
{if couldn't see subagent progress:}
- Report should show: current subagent activity / files being modified
{end if}

**Suggested report additions:**
- {specific field or view that would have helped manage subagents}
```

#### Step 5.3: Announce Completion

```
Session complete!
- Tasks: {completed}/{total} completed, {skipped} skipped
- Improvement cycles: {cycles}/3
- Total duration: {time}
- Branch: otto/{session_id}

Review artifacts in .otto/otto/sessions/{session_id}/
```

---

## State Management

### state.json Schema

```json
{
  "schema_version": 1,
  "session_id": "otto-20260115-143022-a3b2",
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
    "current_cycle_tasks_completed": 0,
    "cycle_history": [
      {
        "cycle": 1,
        "triggered_after_task": 5,
        "improvements_found": 2,
        "tasks_executed": 2
      }
    ]
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
  },

  "commits": {
    "total": 0,
    "last_commit_sha": null,
    "history": []
  },

  "integrations": {
    "dev_browser_available": false,
    "report_available": false
  }
}
```

### Recovery on Startup

When `/otto` is invoked, check for existing session:

```
1. Check for state.json with status: "in_progress" or "terminated"
2. If last_heartbeat > 30 minutes ago:
   - Task likely hung, reset current task to "pending"
3. If recovery.can_resume is true:
   - Offer to resume from last_successful_task_id
4. Run state consistency verification
5. Resume execution loop from saved state
```

### State Consistency Verification

On resume, verify state.json matches the tasks file to detect and fix any drift:

```
function verify_state_consistency():
    tasks_data = readJson(".otto/tasks/{spec_id}.json")
    state = readJson("state.json")

    actual_completed = tasks_data.tasks.filter(t => t.status === "done").length
    actual_skipped = tasks_data.tasks.filter(t => t.skipped === true).length

    if actual_completed != state.product_tasks.completed:
        log.warn("State inconsistency: completed count mismatch (state: {state}, actual: {actual})")
        state.product_tasks.completed = actual_completed

    if actual_skipped != state.product_tasks.skipped:
        log.warn("State inconsistency: skipped count mismatch")
        state.product_tasks.skipped = actual_skipped

    save_state()
```

Run this check during Phase 0 if resuming an existing session, before continuing execution.

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
# .otto/config.yaml
auto_verify: true
auto_pick: true

otto:
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
  open_report: false               # Auto-open report in browser (skipped if headless)
  skip_improvement_cycles: false   # Skip self-improvement loops (faster but less thorough)
```

---

## Directory Structure

```
.otto/
├── config.yaml                           # Automation config
├── specs/
│   ├── {product-spec-id}.md              # Product specification
│   └── improvements-{cycle}.md           # Improvement specs (generated)
├── tasks/
│   ├── {product-spec-id}.json            # Product tasks
│   └── improvements-{cycle}.json         # Improvement tasks (generated)
├── reviews/
│   └── {session-id}.md                   # Code review results
└── otto/
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
/otto Build a CLI weather app that fetches forecasts from OpenWeatherMap API
```

**Output (abbreviated):**
```
Starting autonomous build session: otto-20260115-143022-a3b2
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
- Branch: otto/otto-20260115-143022-a3b2

Review artifacts in .otto/otto/sessions/otto-20260115-143022-a3b2/
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
