---
name: test
description: Canonical testing skill that runs automated tests and visual verification with dev-browser. Detects test runners, captures results, and walks through UI flows with screenshots. Used both manually and by /otto for consistent verification. Invoke with /test.
---

# Test

Canonical testing skill: run automated tests and visually verify UI flows with dev-browser. Provides consistent testing behavior whether invoked manually or from `/otto`.

## Usage

```bash
/test              # Run all tests + visual verification
/test --unit       # Run only unit/automated tests
/test --visual     # Run only visual verification with dev-browser
/test --flows      # Run specific user flows (prompts for selection)
```

### Otto Integration

When called from `/otto`, pass the session context:
```bash
/test --session {session_id} --spec {spec_id}
```

This ensures screenshots are saved to the correct session directory and user flows are read from the spec.

---

## Workflow

### Phase 1: Detect Test Environment

Identify the project's test runner and configuration:

```bash
# Check for common test configurations
ls package.json pyproject.toml setup.py Cargo.toml go.mod Makefile 2>/dev/null
```

#### Test Runner Detection

| File | Test Runner | Command |
|------|-------------|---------|
| `package.json` with `"test"` | npm/yarn/pnpm | `npm test` |
| `package.json` with vitest | Vitest | `npx vitest run` |
| `package.json` with jest | Jest | `npx jest` |
| `pyproject.toml` or `pytest.ini` | pytest | `pytest` |
| `setup.py` | unittest | `python -m unittest` |
| `Cargo.toml` | cargo test | `cargo test` |
| `go.mod` | go test | `go test ./...` |
| `Makefile` with test target | make | `make test` |

```bash
# Example: Detect npm test
if [ -f "package.json" ]; then
  if grep -q '"test"' package.json; then
    TEST_CMD="npm test"
  fi
fi
```

### Phase 2: Run Automated Tests (unless --visual only)

If `--visual` flag is NOT set, run the detected test suite:

```bash
# Create output directory
mkdir -p .otto/test-results

# Run tests and capture output
${TEST_CMD} 2>&1 | tee .otto/test-results/test-output.log
TEST_EXIT=${PIPESTATUS[0]}
```

#### Parse Test Results

Extract key metrics from test output:

```
Tests: {passed} passed, {failed} failed, {skipped} skipped
Duration: {time}
```

**If tests fail:**
```
⚠️ {failed} test(s) failed

Failed tests:
- {test_name}: {error_message}
- {test_name}: {error_message}

Full output: .otto/test-results/test-output.log
```

### Phase 3: Visual Verification (unless --unit only)

If `--unit` flag is NOT set, perform visual verification using dev-browser.

#### Step 3.1: Check Dev-Browser Availability

```bash
# Check if dev-browser server is running
curl -s http://localhost:9222/json/version > /dev/null 2>&1
DEV_BROWSER_AVAILABLE=$?
```

**If dev-browser not available:**
```
⚠️ Dev-browser server not running.

Options:
1. Start dev-browser server: skills/dev-browser/server.sh
2. Skip visual verification (--unit flag)
3. Cancel

Would you like me to start the dev-browser server?
```

If user agrees, start the server:
```bash
nohup skills/dev-browser/server.sh > /tmp/dev-browser.log 2>&1 &
sleep 3
```

#### Step 3.2: Determine Screenshot Location

```bash
# If called from otto session
if [ -n "${SESSION_ID}" ]; then
  SCREENSHOT_DIR=".otto/otto/sessions/${SESSION_ID}/visual-checks"
else
  SCREENSHOT_DIR="./test-screenshots"
fi

mkdir -p "${SCREENSHOT_DIR}"
```

#### Step 3.3: Identify User Flows

**If --session and --spec provided (from otto):**
Read user flows from the spec file:
```bash
# Extract user flows section from spec
grep -A 50 "## User Flows" .otto/specs/${SPEC_ID}.md
```

**If --flows flag:**
Use `AskUserQuestion` to let user select which flows to test.

**Otherwise:**
Detect common flows based on project structure:
- Login/auth pages
- Main dashboard/home
- Key feature pages
- Forms and submissions

#### Step 3.4: Execute Visual Tests

For each user flow, invoke dev-browser and capture screenshots:

```
Invoke Skill: skill="dev-browser"
```

Once dev-browser skill is loaded, write verification scripts:

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("test-{flow_name}");

// Navigate to starting point
await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Capture initial state
await page.screenshot({
  path: "../../{SCREENSHOT_DIR}/flow-{flow_name}-1-start.png",
  fullPage: true
});

// Execute flow steps (example: login)
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'testpass');
await page.click('button[type="submit"]');
await waitForPageLoad(page);

// Capture result
await page.screenshot({
  path: "../../{SCREENSHOT_DIR}/flow-{flow_name}-2-result.png",
  fullPage: true
});

// Verify expected state
const success = page.url().includes('/dashboard');
console.log(JSON.stringify({
  flow: "{flow_name}",
  success,
  url: page.url(),
  screenshots: [
    "flow-{flow_name}-1-start.png",
    "flow-{flow_name}-2-result.png"
  ]
}));

await client.disconnect();
EOF
```

#### Step 3.5: Analyze Visual Results

After each flow, check for:
- Expected URL patterns
- Expected page titles
- Element visibility
- Console errors

```bash
# Check for console errors during flow
cd skills/dev-browser && npx tsx <<'EOF'
import { connect } from "@/client.js";
const client = await connect();
const page = await client.page("test-{flow_name}");

// Get console messages
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('CONSOLE_ERROR:', msg.text());
  }
});

await client.disconnect();
EOF
```

### Phase 4: Generate Test Report

Create a comprehensive test report:

```bash
# Write report
cat > .otto/test-results/report.md << 'EOF'
# Test Report

**Generated:** {timestamp}
**Project:** {project_name}

## Summary

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| Unit Tests | {n} | {n} | {n} |
| Visual Flows | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** |

## Unit Test Results

{test output summary}

## Visual Verification Results

### Flow: {flow_name}
- **Status:** {PASS/FAIL}
- **Screenshots:**
  - ![Start](./screenshots/flow-{flow_name}-1-start.png)
  - ![Result](./screenshots/flow-{flow_name}-2-result.png)
- **Notes:** {any observations}

{repeat for each flow}

## Artifacts

- Test output: `.otto/test-results/test-output.log`
- Screenshots: `{SCREENSHOT_DIR}/`
EOF
```

### Phase 5: Report to User

Present results summary:

```
Test Results
============

Unit Tests: {passed}/{total} passed ({failed} failed)
Visual Flows: {passed}/{total} verified

{if failures:}
⚠️ Issues found:

Unit test failures:
- {test}: {error}

Visual verification issues:
- {flow}: {issue}
{end if}

Full report: .otto/test-results/report.md
Screenshots: {SCREENSHOT_DIR}/

{if all passed:}
✓ All tests passed!
{end if}
```

---

## Auto Mode

When AUTO_MODE is active (`.otto/otto/.active` exists during an otto session):

| Scenario | Behavior |
|----------|----------|
| Called from `/otto` | Run silently, return JSON results |
| Called manually | Show progress, ask about failures |
| Test failures | Continue and report (don't block) |
| Dev-browser unavailable | Skip visual verification, warn user |

---

## Return Format (for /otto integration)

When called with `--session`, return structured JSON:

```json
{
  "success": true,
  "unit_tests": {
    "passed": 15,
    "failed": 0,
    "skipped": 2,
    "duration_ms": 4500
  },
  "visual_tests": {
    "flows_tested": 3,
    "flows_passed": 3,
    "screenshots": [
      ".otto/otto/sessions/{session_id}/visual-checks/flow-login-1-start.png",
      ".otto/otto/sessions/{session_id}/visual-checks/flow-login-2-result.png"
    ]
  },
  "report_path": ".otto/test-results/report.md"
}
```

---

## Examples

### Run all tests
```
/test
```
Output:
```
Detecting test environment...
Found: npm test (Jest)

Running unit tests...
✓ 23 tests passed (2.3s)

Starting visual verification...
Dev-browser server: running

Testing flow: login
  - Navigating to /login... ✓
  - Filling credentials... ✓
  - Submitting... ✓
  - Verifying redirect to /dashboard... ✓
  - Screenshot captured

Testing flow: create-item
  - Navigating to /items... ✓
  - Clicking "New Item"... ✓
  - Filling form... ✓
  - Submitting... ✓
  - Verifying item appears in list... ✓
  - Screenshot captured

Test Results
============
Unit Tests: 23/23 passed
Visual Flows: 2/2 verified

✓ All tests passed!

Screenshots: ./test-screenshots/
Report: .otto/test-results/report.md
```

### Run only unit tests
```
/test --unit
```
Output:
```
Running unit tests...
✓ 23 tests passed (2.3s)

Report: .otto/test-results/report.md
```

### Run visual verification only
```
/test --visual
```
Output:
```
Starting visual verification...
Found 3 user flows in current project.

Testing flow: home... ✓
Testing flow: login... ✓
Testing flow: settings... ✓

Visual Flows: 3/3 verified
Screenshots: ./test-screenshots/
```
