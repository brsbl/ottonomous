---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools (ESLint/Biome, TypeScript/mypy, vitest/jest/pytest/cargo) and sets up missing ones.
argument-hint: <run | write> [staged | uncommitted | branch]
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Lint + type check + tests + visual verify (branch) |
| `run staged` | Lint + type check + tests + visual verify staged changes |
| `run uncommitted` | Lint + type check + tests + visual verify uncommitted changes |
| `run branch` | Lint + type check + tests + visual verify branch changes |
| `write` | Generate tests, then run full pipeline (branch) |
| `write staged` | Generate tests for staged, then run full pipeline |
| `write uncommitted` | Generate tests for uncommitted, then run full pipeline |
| `write branch` | Generate tests for branch, then run full pipeline |

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

## 10. Run Tests

Run the detected test command and save output to `.otto/test-results/output.log`.

**If tests fail:** Read the error output, fix the code, and re-run until all tests pass.

## 11. Visual Verification

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

## 12. Report

Summarize results:
- Lint: pass/fail (errors fixed if any)
- Type check: pass/fail (errors fixed if any)
- Unit test pass/fail counts
- Pages/components visually verified
- Location of screenshots and logs
