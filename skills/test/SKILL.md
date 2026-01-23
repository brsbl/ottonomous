---
name: test
description: Runs automated tests and visual verification. Detects test runners (vitest/jest/pytest/cargo), captures screenshots, and can generate tests for code changes.
argument-hint: <run | write> [staged | uncommitted | branch]
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Run tests + visual verify (branch) |
| `run staged` | Run tests + visual verify staged changes |
| `run uncommitted` | Run tests + visual verify uncommitted changes |
| `run branch` | Run tests + visual verify branch changes |
| `write` | Generate tests, then run (branch) |
| `write staged` | Generate tests for staged, then run |
| `write uncommitted` | Generate tests for uncommitted, then run |
| `write branch` | Generate tests for branch, then run |

**Scope determines which files to analyze:**

| Scope | Git command |
|-------|-------------|
| `branch` (default) | `git diff main...HEAD --name-only` |
| `staged` | `git diff --cached --name-only` |
| `uncommitted` | `git diff --name-only` |

---

## 1. Detect Test Runner

| File | Runner | Command |
|------|--------|---------|
| `package.json` with vitest | Vitest | `npx vitest run` |
| `package.json` with jest | Jest | `npx jest` |
| `package.json` with `"test"` | npm | `npm test` |
| `pyproject.toml` or `pytest.ini` | pytest | `pytest` |
| `Cargo.toml` | cargo | `cargo test` |
| `go.mod` | go | `go test ./...` |

If no test runner found, set one up:

## 2. Setup Test Harness (if needed)

**JavaScript/TypeScript:**
```bash
npm install -D vitest
```

Create `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.{js,ts}'],
  },
})
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

**Python:** `pip install pytest`

**Rust/Go:** Built-in test runners, no setup needed.

---

## 3. Generate Tests (write mode)

If `write` is specified, generate tests for code changes before running.

### Get Changed Files

Use the git command from the scope table above.

### Identify Testable Code

Look for **pure functions** - functions with no side effects that take inputs and return outputs.

**Good candidates:**
- Input validation/parsing (argument parsers, validators)
- String formatting/transformation (template generators, formatters)
- Data aggregation/calculation (reducers, calculators)
- Configuration parsing (frontmatter, YAML, JSON parsers)

**Signs of pure functions:**
- No `fs.readFile`, `fetch`, `console.log`, or other I/O
- No modification of external state
- Same inputs always produce same outputs

### Extract Pure Functions (if needed)

If testable logic is mixed with I/O, extract pure functions into separate modules that can be imported and tested independently.

### Write Tests

For each testable function, ensure coverage of:

**Test Categories Checklist:**
- [ ] **Happy path** - normal expected inputs
- [ ] **Edge cases** - empty, null, undefined, boundary values
- [ ] **Invalid inputs** - wrong types, malformed data
- [ ] **Boundary conditions** - min/max values, array limits
- [ ] **Error handling** - graceful failures, meaningful errors

---

## 4. Run Tests

Run the detected test command and save output to `.otto/test-results/output.log`.

**If tests fail:** Read the error output, fix the code, and re-run until all tests pass.

## 5. Visual Verification

Verify UI changes based on scope (use matching git diff command from table above):
1. Identify which pages/routes were affected by code changes
2. Navigate to those pages using browser automation (`skills/otto/lib/browser/client.js`)
3. Capture screenshots to `./test-screenshots/`
4. Read each screenshot and check for:
   - Layout issues (overlapping elements, broken alignment)
   - Missing or incorrect content
   - Styling problems (wrong colors, fonts, spacing)
   - Error states or blank screens

**If issues found:** Fix the code causing the visual problem, retake screenshots, and verify the fix.

**Repeat until both unit tests and visual verification pass.**

## 6. Report

Summarize results:
- Unit test pass/fail counts
- Pages/components visually verified
- Location of screenshots and logs
