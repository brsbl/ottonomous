---
name: test
description: Canonical testing skill that runs automated tests and visual verification with browser automation. Detects test runners, captures results, and walks through UI flows with screenshots. Used both manually and by /otto for consistent verification. Invoke with /test.
---

# Test

Canonical testing skill: run automated tests and visually verify UI flows with browser automation. Provides consistent testing behavior whether invoked manually or from `/otto`.

## Usage

```bash
/test              # Run all tests + visual verification
/test --unit       # Run only unit/automated tests
/test --visual     # Run only visual verification with browser automation
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

If `--unit` flag is NOT set, perform visual verification using browser automation.

#### Step 3.1: Check Browser Availability

```bash
# Check if browser server is running
curl -s http://localhost:9222/health > /dev/null 2>&1
BROWSER_AVAILABLE=$?
```

**If browser not available:**
```
⚠️ Browser server not running.

Options:
1. Start browser server: node skills/otto/lib/browser/server.js
2. Skip visual verification (--unit flag)
3. Cancel

Would you like me to start the browser server?
```

If user agrees, start the server:
```bash
nohup node skills/otto/lib/browser/server.js > /tmp/browser.log 2>&1 &
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

#### Step 3.4: Build Verification Checklist

Before taking screenshots, create a checklist from the spec/requirements:

**Extract requirements to verify:**
```
Requirements Checklist for {feature/page}:
[ ] Requirement 1: {description}
[ ] Requirement 2: {description}
[ ] Requirement 3: {description}
...
```

**Categories to check:**
- **Layout:** Component positioning, spacing, alignment
- **Content:** Text, labels, placeholder text
- **Styling:** Colors, fonts, borders, shadows
- **State:** Default states, hover states, error states
- **Responsiveness:** Breakpoint behavior (if applicable)
- **Functionality:** Interactive elements work correctly

#### Step 3.5: Multi-Level Screenshot Strategy

Take screenshots at TWO levels for comprehensive verification:

**Level 1: Full Page Screenshots**
- Capture entire viewport/page for overall context
- Shows how components fit within the broader layout
- Reveals navigation, headers, footers in context

**Level 2: Component-Level Screenshots**
- Capture specific components/areas being changed
- Use element selectors to screenshot targeted regions
- Better detail for verifying specific requirements

Write targeted verification scripts using the browser module:

```bash
cd skills/otto/lib/browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "./client.js";

const client = await connect();
const page = await client.page("test-{flow_name}");

await page.goto("http://localhost:3000/{page}");
await waitForPageLoad(page);

// === FULL PAGE SCREENSHOT ===
await page.screenshot({
  path: "../../{SCREENSHOT_DIR}/page-{name}-full.png",
  fullPage: true
});
console.log("SCREENSHOT_CAPTURED: page-{name}-full.png (full page)");

// === COMPONENT-LEVEL SCREENSHOTS ===
// Target specific elements/components being verified

// Example: Capture a specific component
const component = await page.$('.my-component');
if (component) {
  await component.screenshot({
    path: "../../{SCREENSHOT_DIR}/component-{name}-{component}.png"
  });
  console.log("SCREENSHOT_CAPTURED: component-{name}-{component}.png");
}

// Example: Capture a form section
const form = await page.$('form.login-form');
if (form) {
  await form.screenshot({
    path: "../../{SCREENSHOT_DIR}/component-{name}-form.png"
  });
  console.log("SCREENSHOT_CAPTURED: component-{name}-form.png");
}

// Example: Capture header/nav area
const header = await page.$('header, nav, [role="navigation"]');
if (header) {
  await header.screenshot({
    path: "../../{SCREENSHOT_DIR}/component-{name}-header.png"
  });
  console.log("SCREENSHOT_CAPTURED: component-{name}-header.png");
}

await client.disconnect();
EOF
```

#### Step 3.6: Read & Analyze Each Screenshot Immediately

**CRITICAL: After taking EACH screenshot, immediately read it and verify against the checklist.**

```
1. Take screenshot → 2. Read screenshot with Read tool → 3. Check against requirements → 4. Document findings
```

**Verification workflow:**

```
# After each screenshot capture:

Read the screenshot file:
Read tool: {SCREENSHOT_DIR}/component-{name}.png

Analyze what's visible and check against requirements:

✓ Requirement 1: {description}
  - VERIFIED: {what you see that confirms this}

✓ Requirement 2: {description}
  - VERIFIED: {what you see that confirms this}

✗ Requirement 3: {description}
  - DISCREPANCY: Expected {X}, but screenshot shows {Y}
  - Location: {describe where in the screenshot}

? Requirement 4: {description}
  - UNCLEAR: Cannot verify from this screenshot, need {additional check}
```

**For each component/page, document:**
1. What the screenshot shows
2. Which requirements it satisfies (with evidence)
3. Which requirements it violates (with specifics)
4. What couldn't be verified visually

#### Step 3.7: Execute User Flows with Verification

For interactive flows, take before/after screenshots at each step:

```bash
cd skills/otto/lib/browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "./client.js";

const client = await connect();
const page = await client.page("test-{flow_name}");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Step 1: Initial state - FULL PAGE
await page.screenshot({
  path: "../../{SCREENSHOT_DIR}/flow-{flow}-step1-full.png",
  fullPage: true
});
console.log("SCREENSHOT_CAPTURED: flow-{flow}-step1-full.png");

// Step 1: Initial state - TARGET COMPONENT
const loginForm = await page.$('.login-form, form[action*="login"]');
if (loginForm) {
  await loginForm.screenshot({
    path: "../../{SCREENSHOT_DIR}/flow-{flow}-step1-form.png"
  });
  console.log("SCREENSHOT_CAPTURED: flow-{flow}-step1-form.png");
}

// === PAUSE: Read screenshots and verify initial state ===

// Execute action
await page.fill('input[name="email"]', 'test@example.com');
await page.fill('input[name="password"]', 'testpass');
await page.click('button[type="submit"]');
await waitForPageLoad(page);

// Step 2: After action - FULL PAGE
await page.screenshot({
  path: "../../{SCREENSHOT_DIR}/flow-{flow}-step2-full.png",
  fullPage: true
});
console.log("SCREENSHOT_CAPTURED: flow-{flow}-step2-full.png");

// Step 2: After action - TARGET COMPONENT (e.g., dashboard)
const dashboard = await page.$('.dashboard, main, [role="main"]');
if (dashboard) {
  await dashboard.screenshot({
    path: "../../{SCREENSHOT_DIR}/flow-{flow}-step2-dashboard.png"
  });
  console.log("SCREENSHOT_CAPTURED: flow-{flow}-step2-dashboard.png");
}

// === PAUSE: Read screenshots and verify result state ===

console.log(JSON.stringify({
  flow: "{flow_name}",
  url: page.url(),
  screenshots: [
    "flow-{flow}-step1-full.png",
    "flow-{flow}-step1-form.png",
    "flow-{flow}-step2-full.png",
    "flow-{flow}-step2-dashboard.png"
  ]
}));

await client.disconnect();
EOF
```

#### Step 3.8: Compile Discrepancy Report

After all screenshots are reviewed, compile findings:

```
## Visual Verification Report

### Passed Checks ✓
- [x] {Requirement}: Verified in {screenshot}
- [x] {Requirement}: Verified in {screenshot}

### Failed Checks ✗
- [ ] {Requirement}: DISCREPANCY
  - **Expected:** {what the spec/requirement says}
  - **Actual:** {what the screenshot shows}
  - **Screenshot:** {filename}
  - **Severity:** {Critical/Major/Minor}

### Unable to Verify ?
- [ ] {Requirement}: Could not verify visually
  - **Reason:** {why it couldn't be verified}
  - **Suggested:** {manual test or alternative approach}

### Screenshots Captured
| Screenshot | Type | Purpose |
|------------|------|---------|
| page-login-full.png | Full Page | Login page overall layout |
| component-login-form.png | Component | Login form styling/fields |
| flow-login-step2-full.png | Full Page | Post-login redirect |
```

#### Step 3.9: Handle Discrepancies

When discrepancies are found:

1. **Document clearly:** Specific expected vs actual
2. **Include evidence:** Reference exact screenshot
3. **Suggest fix:** What needs to change
4. **Prioritize:** Critical (blocks usage) > Major (wrong behavior) > Minor (cosmetic)

**If called from /otto:**
Return discrepancies in structured format for task creation:

```json
{
  "discrepancies": [
    {
      "requirement": "Login button should be blue (#0066cc)",
      "expected": "Background color #0066cc",
      "actual": "Background color #333333 (gray)",
      "screenshot": "component-login-button.png",
      "severity": "minor",
      "suggested_fix": "Update button background-color in login.css"
    }
  ]
}
```

### Phase 4: Generate Test Report

Create a comprehensive test report with checklist verification results:

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
| Visual Checks | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** |

## Unit Test Results

{test output summary}

## Visual Verification Results

### Requirements Checklist

#### Passed ✓
- [x] {Requirement 1}: Verified in `{screenshot}`
- [x] {Requirement 2}: Verified in `{screenshot}`

#### Failed ✗
- [ ] {Requirement 3}: **DISCREPANCY**
  - Expected: {expected behavior/appearance}
  - Actual: {what screenshot shows}
  - Screenshot: `{screenshot}`
  - Severity: {Critical/Major/Minor}
  - Suggested Fix: {what to change}

#### Unable to Verify ?
- [ ] {Requirement 4}: Could not verify visually
  - Reason: {why}

### Screenshots Captured

| Screenshot | Level | Description |
|------------|-------|-------------|
| `page-{name}-full.png` | Full Page | Overall page layout |
| `component-{name}-{area}.png` | Component | {specific area} |
| `flow-{name}-step{n}-full.png` | Full Page | Flow step {n} state |
| `flow-{name}-step{n}-{component}.png` | Component | {component} at step {n} |

### Flow: {flow_name}
- **Status:** {PASS/FAIL}
- **Steps Verified:**
  1. {step description} - ✓/✗
  2. {step description} - ✓/✗
- **Full Page Screenshots:**
  - ![Step 1](./screenshots/flow-{flow_name}-step1-full.png)
  - ![Step 2](./screenshots/flow-{flow_name}-step2-full.png)
- **Component Screenshots:**
  - ![Form](./screenshots/flow-{flow_name}-step1-form.png)
  - ![Result](./screenshots/flow-{flow_name}-step2-result.png)
- **Discrepancies:** {list any issues found}

{repeat for each flow}

## Artifacts

- Test output: `.otto/test-results/test-output.log`
- Screenshots: `{SCREENSHOT_DIR}/`
- Full verification log: `.otto/test-results/verification.log`
EOF
```

### Phase 5: Report to User

Present results summary with clear discrepancy reporting:

```
Test Results
============

Unit Tests: {passed}/{total} passed ({failed} failed)
Visual Checks: {passed}/{total} verified, {failed} discrepancies

{if discrepancies found:}
⚠️ Visual Discrepancies Found:

┌─────────────────────────────────────────────────────────────┐
│ DISCREPANCY: {requirement}                                  │
├─────────────────────────────────────────────────────────────┤
│ Expected: {what the spec says}                              │
│ Actual:   {what the screenshot shows}                       │
│ Screenshot: {filename}                                      │
│ Severity: {Critical/Major/Minor}                            │
│ Suggested Fix: {what needs to change}                       │
└─────────────────────────────────────────────────────────────┘

{repeat for each discrepancy}
{end if}

{if unit test failures:}
⚠️ Unit Test Failures:

- {test}: {error}
{end if}

Verification Summary:
✓ Requirements Passed: {n}
✗ Requirements Failed: {n}
? Unable to Verify: {n}

Full report: .otto/test-results/report.md
Screenshots: {SCREENSHOT_DIR}/

{if all passed:}
✓ All tests passed! All requirements verified.
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
| Browser unavailable | Skip visual verification, warn user |

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
    "requirements_checked": 12,
    "requirements_passed": 10,
    "requirements_failed": 1,
    "unable_to_verify": 1,
    "flows_tested": 3,
    "flows_passed": 2,
    "screenshots": {
      "full_page": [
        ".otto/otto/sessions/{session_id}/visual-checks/page-login-full.png",
        ".otto/otto/sessions/{session_id}/visual-checks/flow-login-step2-full.png"
      ],
      "component": [
        ".otto/otto/sessions/{session_id}/visual-checks/component-login-form.png",
        ".otto/otto/sessions/{session_id}/visual-checks/component-dashboard-header.png"
      ]
    },
    "discrepancies": [
      {
        "requirement": "Login button should be blue (#0066cc)",
        "expected": "Background color #0066cc",
        "actual": "Background color #333333 (gray)",
        "screenshot": "component-login-button.png",
        "severity": "minor",
        "suggested_fix": "Update button background-color in login.css"
      }
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
Browser server: running

Building requirements checklist from spec...
Found 8 requirements to verify.

Testing page: login
  📸 Taking full page screenshot: page-login-full.png
  📖 Reading screenshot...
  📸 Taking component screenshot: component-login-form.png
  📖 Reading screenshot...

  Checklist verification:
  ✓ Login form has email and password fields
  ✓ Submit button is visible and styled correctly
  ✓ "Forgot password" link is present
  ✗ DISCREPANCY: Button color should be blue (#0066cc)
    Expected: Blue button (#0066cc)
    Actual: Gray button (#333333)

Testing flow: login → dashboard
  Step 1: Initial state
    📸 page-flow-login-step1-full.png (full page)
    📸 component-flow-login-step1-form.png (login form)
    📖 Reading screenshots... verified initial state

  Step 2: After login
    📸 page-flow-login-step2-full.png (full page)
    📸 component-flow-login-step2-dashboard.png (dashboard)
    📖 Reading screenshots...
    ✓ Redirected to /dashboard
    ✓ User name displayed in header
    ✓ Navigation menu visible

Test Results
============
Unit Tests: 23/23 passed
Visual Checks: 7/8 verified, 1 discrepancy

⚠️ Visual Discrepancies Found:

┌─────────────────────────────────────────────────────────────┐
│ DISCREPANCY: Login button color                             │
├─────────────────────────────────────────────────────────────┤
│ Expected: Blue (#0066cc)                                    │
│ Actual:   Gray (#333333)                                    │
│ Screenshot: component-login-form.png                        │
│ Severity: Minor                                             │
│ Suggested Fix: Update .login-button background-color        │
└─────────────────────────────────────────────────────────────┘

Verification Summary:
✓ Requirements Passed: 7
✗ Requirements Failed: 1
? Unable to Verify: 0

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
Found 3 pages/flows to verify.

Building requirements checklist...
Found 12 requirements to verify.

Verifying: home page
  📸 Full page: page-home-full.png
  📸 Component: component-home-hero.png
  📸 Component: component-home-features.png
  📖 Reading and verifying...
  ✓ 4/4 requirements passed

Verifying: login page
  📸 Full page: page-login-full.png
  📸 Component: component-login-form.png
  📖 Reading and verifying...
  ✓ 3/3 requirements passed

Verifying: settings page
  📸 Full page: page-settings-full.png
  📸 Component: component-settings-profile.png
  📸 Component: component-settings-preferences.png
  📖 Reading and verifying...
  ✓ 5/5 requirements passed

Visual Checks: 12/12 verified
✓ All requirements verified!

Screenshots: ./test-screenshots/
```

---

## Adding Tests to a Project

When a project needs tests, follow this strategy:

### Step 1: Identify Testable Code

Look for pure functions - functions with no side effects that take inputs and return outputs:

- **Input validation/parsing** - argument parsers, validators
- **String formatting/transformation** - template generators, formatters
- **Data aggregation/calculation** - reducers, calculators
- **Configuration parsing** - frontmatter, YAML, JSON parsers

Signs of pure functions:
- No `fs.readFile`, `fetch`, `console.log`, or other I/O
- No modification of external state
- Same inputs always produce same outputs

### Step 2: Extract Pure Functions

Move testable logic from main files into `.utils.js` files:

```
# Before
server.js (mixed I/O and logic)

# After
server.js (orchestrator, imports utils)
server.utils.js (pure functions, exported)
```

**Example extraction:**

```javascript
// Before: server.js
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};

// After: server.utils.js
export function getArg(args, name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}

// After: server.js
import { getArg } from './server.utils.js';
const args = process.argv.slice(2);
const port = getArg(args, 'port', '3000');
```

### Step 3: Write Unit Tests

Test each pure function with:

```javascript
import { describe, it, expect } from 'vitest'
import { getArg, isValidPort } from '../server.utils.js'

describe('getArg', () => {
  // Happy path
  it('returns value after named argument', () => {
    expect(getArg(['--port', '8080'], 'port', '3000')).toBe('8080')
  })

  // Default/fallback
  it('returns default when not found', () => {
    expect(getArg([], 'port', '3000')).toBe('3000')
  })

  // Edge cases
  it('returns default for empty array', () => {
    expect(getArg([], 'config', 'default.json')).toBe('default.json')
  })
})

describe('isValidPort', () => {
  // Valid inputs
  it('accepts valid ports', () => {
    expect(isValidPort(80)).toBe(true)
    expect(isValidPort(8080)).toBe(true)
    expect(isValidPort(65535)).toBe(true)
  })

  // Boundary conditions
  it('rejects port 0', () => {
    expect(isValidPort(0)).toBe(false)
  })

  it('rejects ports above 65535', () => {
    expect(isValidPort(65536)).toBe(false)
  })

  // Invalid inputs
  it('rejects NaN', () => {
    expect(isValidPort(NaN)).toBe(false)
  })
})
```

### Step 4: Set Up Test Runner

**Project structure:**

```
project/
├── package.json          # workspace test scripts
├── vitest.config.js      # points to skill configs
└── skills/
    └── my-skill/
        ├── package.json      # skill dependencies + test script
        ├── vitest.config.js  # skill test config
        ├── __tests__/
        │   └── utils.test.js
        └── src/
            ├── main.js
            └── main.utils.js
```

**Root package.json:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  }
}
```

**Root vitest.config.js:**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'skills/*/vitest.config.js',
    ],
  },
})
```

**Skill vitest.config.js:**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.js'],
    environment: 'node',
  },
})
```

### Test Categories Checklist

When adding tests, ensure coverage of:

- [ ] **Happy path** - normal expected inputs
- [ ] **Edge cases** - empty, null, undefined, boundary values
- [ ] **Invalid inputs** - wrong types, malformed data
- [ ] **Boundary conditions** - min/max values, array limits
- [ ] **Error handling** - graceful failures, meaningful errors
