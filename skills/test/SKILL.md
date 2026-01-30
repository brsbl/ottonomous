---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools. Use when running tests, linting, type checking, or writing tests.
argument-hint: <run | write | browser | all> [staged | uncommitted | branch]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Lint + type check + run tests |
| `write` | Generate tests, then run pipeline |
| `browser` | Visual verification |
| `all` | run + browser combined |

**Scope (optional, default: branch):**

| Scope | Command |
|-------|---------|
| `branch` | `git diff main...HEAD --name-only` |
| `staged` | `git diff --cached --name-only` |
| `uncommitted` | `git diff --name-only` |

---

# Run Mode

## 1. Detect Tools

| Config | Tool | Command |
|--------|------|---------|
| `package.json` + vitest | Vitest | `npx vitest run` |
| `package.json` + jest | Jest | `npx jest` |
| `package.json` + `"test"` | npm | `npm test` |
| `pyproject.toml` | pytest | `pytest` |
| `Cargo.toml` | cargo | `cargo test` |
| `go.mod` | go | `go test ./...` |
| `.eslintrc*` / `eslint.config.*` | ESLint | `npx eslint .` |
| `biome.json` | Biome | `npx biome check .` |
| `tsconfig.json` | TypeScript | `npx tsc --noEmit` |

## 2. Setup (if missing)

```bash
# JS/TS test runner
npm install -D vitest

# JS/TS linter
npm install -D eslint @eslint/js

# JS/TS types
npm install -D typescript && npx tsc --init

# Python
pip install pytest ruff mypy
```

## 3. Run Pipeline

```bash
# 1. Lint
npx eslint . --fix  # or: npx biome check . --write

# 2. Type check
npx tsc --noEmit    # or: mypy .

# 3. Test
npx vitest run      # or: pytest, cargo test, go test ./...
```

Fix errors, re-run until all pass.

---

# Write Mode

## 1. Get Changed Files

```bash
git diff main...HEAD --name-only  # branch scope
git diff --cached --name-only     # staged scope
git diff --name-only              # uncommitted scope
```

## 2. Identify Testable Code

Test pure functions only:
- Input validation, parsing
- String formatting, transformation
- Data aggregation, calculation

Skip:
- I/O operations (fetch, fs, db)
- Pass-through wrappers
- Config files

## 3. Launch Test Writers

| Files | Subagents |
|-------|-----------|
| 1-3 | 1 |
| 4-8 | 2-3 |
| 9+ | 3-5 |

```javascript
// Task tool
{
  subagent_type: "test-writer",
  prompt: "Write tests for: [file list]. Runner: vitest. Convention: *.test.ts"
}
```

## 4. Test Coverage

Each function needs:
- Happy path
- Edge cases (empty, null, boundary)
- Invalid inputs
- Error handling

## 5. Run Pipeline

Same as Run Mode step 3.

---

# Browser Mode

## Setup

```javascript
import { connect, waitForPageLoad } from '../otto/lib/browser/client.js'

const client = await connect({ headless: true })
```

## Navigate & Capture

```javascript
const page = await client.page('test')
await page.goto('http://localhost:3000')
await waitForPageLoad(page)

await page.screenshot({ path: '.otto/test-screenshots/page.png' })
const snapshot = await client.getAISnapshot('test')
```

## Interact

```javascript
const btn = await client.selectSnapshotRef('test', 'e3')
await btn.click()

const input = await client.selectSnapshotRef('test', 'e5')
await input.fill('test@example.com')

await waitForPageLoad(page)
```

## Cleanup

```javascript
await client.disconnect()
```

---

# All Mode

1. Run Mode (lint, type check, test)
2. Browser Mode (visual verification)
3. Report results
