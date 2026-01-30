---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools (ESLint/Biome, TypeScript/mypy, vitest/jest/pytest/cargo). Use when running tests, linting, type checking, or writing tests.
argument-hint: <run | write | browser | all> [staged | uncommitted | branch]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Lint + type check + run tests (branch) |
| `run staged` | Lint + type check + run tests (staged) |
| `run uncommitted` | Lint + type check + run tests (uncommitted) |
| `run branch` | Lint + type check + run tests (branch) |
| `write` | Generate tests, then run full pipeline (branch) |
| `write staged` | Generate tests, then run full pipeline (staged) |
| `write uncommitted` | Generate tests, then run full pipeline (uncommitted) |
| `write branch` | Generate tests, then run full pipeline (branch) |
| `browser` | Visual verification + element interaction (branch) |
| `browser staged` | Visual verification + element interaction (staged) |
| `browser uncommitted` | Visual verification + element interaction (uncommitted) |
| `browser branch` | Visual verification + element interaction (branch) |
| `all` | run + browser combined (branch) |
| `all staged` | run + browser combined (staged) |
| `all uncommitted` | run + browser combined (uncommitted) |
| `all branch` | run + browser combined (branch) |

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

## 3. Detect Linter

| File/Config | Linter | Command |
|-------------|--------|---------|
| `.eslintrc*` or `eslint.config.*` | ESLint | `npx eslint .` |
| `biome.json` | Biome | `npx biome check .` |
| `pyproject.toml` with `[tool.ruff]` | Ruff | `ruff check .` |
| `Cargo.toml` | Clippy | `cargo clippy -- -D warnings` |
| `go.mod` | go vet | `go vet ./...` |

If no linter found, set one up:

## 4. Setup Linter (if needed)

**JavaScript/TypeScript:**
```bash
npm install -D eslint @eslint/js
```

Create `eslint.config.js`:
```javascript
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
]
```

**Python:**
```bash
pip install ruff
```

Add to `pyproject.toml`:
```toml
[tool.ruff]
line-length = 100
select = ["E", "F", "W"]
```

**Rust:** Clippy is included with rustup, no setup needed.

**Go:** go vet is built-in, no setup needed.

---

## 5. Detect Type Checker

| File/Config | Checker | Command |
|-------------|---------|---------|
| `tsconfig.json` | TypeScript | `npx tsc --noEmit` |
| `pyproject.toml` with mypy | mypy | `mypy .` |
| `Cargo.toml` | (built into cargo) | (covered by `cargo clippy`) |
| `go.mod` | (built into go) | (covered by `go vet`) |

If no type checker found for TypeScript/Python projects, set one up:

## 6. Setup Type Checker (if needed)

**TypeScript (if .ts/.tsx files exist but no tsconfig.json):**
```bash
npm install -D typescript
npx tsc --init
```

The generated `tsconfig.json` provides sensible defaults. Adjust `strict` and `target` as needed.

**Python (if .py files exist but no mypy config):**
```bash
pip install mypy
```

Add to `pyproject.toml`:
```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_ignores = true
```

**Rust/Go:** Type checking is built into the compiler, no setup needed.

---

## 7. Run Lint

Run the detected linter command.

**If lint errors found:** Fix the issues before proceeding. Re-run until all lint checks pass.

## 8. Run Type Check

Run the detected type checker command.

**If type errors found:** Fix the issues before proceeding. Re-run until all type checks pass.

---

## 9. Generate Tests (write mode)

If `write` is specified, generate tests for code changes before running.

### Get Changed Files

Use the git command from the scope table above.

### Identify Testable Code

**Only write tests for pure functions** - functions with no side effects that take inputs and return outputs.

**Good candidates:**
- Input validation/parsing (argument parsers, validators)
- String formatting/transformation (template generators, formatters)
- Data aggregation/calculation (reducers, calculators)
- Configuration parsing (frontmatter, YAML, JSON parsers)

**Signs of pure functions:**
- No `fs.readFile`, `fetch`, `console.log`, or other I/O
- No modification of external state
- Same inputs always produce same outputs

**Do NOT write tests for:**
- Files with only I/O operations (API calls, file reads, database queries)
- Simple pass-through functions or wrappers
- Configuration files or constants
- Files that already have adequate test coverage

If no testable pure functions exist in the changed files, skip test generation and report: "No testable pure functions found in changed files."

### Extract Pure Functions (if needed)

If testable logic is mixed with I/O, extract pure functions into separate modules that can be imported and tested independently.

### Scale Test Writers

Group changed files by module and launch parallel `test-writer` subagents:

| Files | Subagents | Grouping |
|-------|-----------|----------|
| 1-3 | 1 | All files |
| 4-8 | 2-3 | By directory |
| 9+ | 3-5 | By module/component |

**Launch using Task tool with `subagent_type: "test-writer"`**

**Each subagent receives:**
- File list to write tests for
- Test runner detected (vitest/jest/pytest/etc.)
- Test file naming convention (e.g., `*.test.ts`)
- Instruction to skip files with no pure functions

Wait for all subagents to complete before running tests.

### Write Tests

For each testable function, ensure coverage of:

**Test Categories Checklist:**
- [ ] **Happy path** - normal expected inputs
- [ ] **Edge cases** - empty, null, undefined, boundary values
- [ ] **Invalid inputs** - wrong types, malformed data
- [ ] **Boundary conditions** - min/max values, array limits
- [ ] **Error handling** - graceful failures, meaningful errors

---

## 10. Run Tests

Run the detected test command and save output to `.otto/test-results/output.log`.

**If tests fail:** Read the error output, fix the code, and re-run until all tests pass.

## 11. Update Docs (write mode only)

After writing tests, update the `related_tests` field in `.otto/docs/files/` for each source file that got new tests.

```bash
# For src/auth/users.ts with new test src/auth/users.test.ts
# Update .otto/docs/files/src-auth-users.json
```

If the doc file doesn't exist, skip this step (docs will be created on next `/doc` run).

## 12. Report (run/write modes)

Summarize results:
- Lint: pass/fail (errors fixed if any)
- Type check: pass/fail (errors fixed if any)
- Unit test pass/fail counts
- Tests written (write mode): count and files
- Location of test logs

---

# Browser Mode

Use `browser` mode for visual verification and element interaction testing.

**Important:** Create ONE browser client at the start and reuse it for all testing. Do not create multiple browser instances.

### 1. Initialize Browser

Create a single browser client at the start of browser testing:
```javascript
import { connect, waitForPageLoad } from '../otto/lib/browser/client.js'
const client = await connect() // headless by default, reuse throughout session
```

Keep this `client` instance and reuse it for all subsequent steps. Only call `client.disconnect()` at the very end when all testing is complete.

### 2. Get Changed Files

Use the scope to determine which files changed (see git commands in table above).

### 3. Identify Affected Pages

Map code changes to UI locations:
- Component files → pages that render them
- API routes → pages that call them
- Style files → pages that use them

### 4. Navigate to Page

Reuse the existing client to get or create named pages:
```javascript
// Get or create a named page (reuses existing page if already open)
const page = await client.page('test')
await page.goto('http://localhost:3000/affected-route')
await waitForPageLoad(page)
```

**Page reuse:** `client.page('test')` returns the same page instance if called again with the same name. Use this to navigate to different URLs without opening new windows.

### 5. Visual Inspection

1. Capture screenshot to `.otto/test-screenshots/`
2. Read the screenshot and check for:
   - Layout issues (overlapping elements, broken alignment)
   - Missing or incorrect content
   - Styling problems (wrong colors, fonts, spacing)
   - Error states or blank screens

### 6. Get ARIA Snapshot

Use `getAISnapshot()` to get the accessibility tree with refs:
```javascript
const snapshot = await client.getAISnapshot('test')
```

**Snapshot format:**
```yaml
- banner:
  - link "Home" [ref=e1]
- main:
  - heading "Welcome" [ref=e2]:
    - /level: 1
  - button "Submit" [disabled] [ref=e3]
```

### 7. Interact with Elements

Use `selectSnapshotRef()` to get element handles:
```javascript
const button = await client.selectSnapshotRef('test', 'e3')
await button.click()
```

**Interaction types:**
- Click buttons, links, interactive elements
- Fill form inputs with test data
- Check state changes ([checked], [disabled], [expanded])
- Verify expected behavior after interactions

### 8. Multi-Step Flows

Test user journeys by chaining interactions:
1. Fill form inputs
2. Submit form
3. Verify success state or navigation
4. Check for expected content changes

### 9. Fix Issues

If problems found:
1. Fix the code causing the issue
2. Re-navigate to the page
3. Re-verify the fix

### 10. Cleanup & Report

**Close the browser** when all testing is complete:
```javascript
await client.disconnect()
```

Summarize results:
- Pages tested
- Interactions performed
- Issues found and fixed
- Location of screenshots

---

# All Mode

Use `all` mode to run both `run` and `browser` modes sequentially.

1. Execute Run Mode (steps 1-11)
2. Execute Browser Mode (steps 1-10)
3. Combined report with all results
