---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools. Use when running tests, linting, type checking, or writing tests.
argument-hint: <run | write | browser | electron | all> [staged | uncommitted | branch]
model: opus
allowed-tools: Bash(agent-browser *), Bash(npx agent-browser *), Bash(code *), Bash(open *), Bash(npm *), Bash(npx *), Bash(kill *), Bash(sleep *), Bash(curl *), Bash(lsof *), Bash(git *), Bash(mkdir *), Read, Write, Edit, Glob, Grep, Agent
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Lint + type check + run tests |
| `write` | Generate tests, then run pipeline |
| `browser` | Visual verification (web apps) |
| `electron` | Visual verification (Electron/VS Code apps) |
| `all` | run + browser/electron combined |

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

Visual verification using agent-browser CLI. See [/browser skill](../browser/SKILL.md) for full API.

```bash
# Determine dev server URL from package.json or running processes
agent-browser open {url}  # e.g., http://localhost:5173
agent-browser wait 3000
agent-browser screenshot .otto/test-screenshots/page.png
agent-browser snapshot -i

# Interact and verify
agent-browser click @e3
agent-browser snapshot -i

agent-browser close
rm -rf .otto/test-screenshots
```

---

# Electron Mode

Visual verification for Electron/VS Code apps via CDP.

```bash
# Detect: engines.vscode in package.json → VS Code extension
# Detect: electron in dependencies → Electron app

# Build first
npm run compile

# Launch (VS Code extension example)
code --extensionDevelopmentPath=./ --disable-extensions \
     --remote-debugging-port=9333 . &
APP_PID=$!
sleep 8

# Connect and verify
agent-browser connect 9333
agent-browser snapshot -i
agent-browser screenshot .otto/test-screenshots/electron.png

# Check webviews if applicable
agent-browser tab
agent-browser tab 1
agent-browser snapshot -i

# Cleanup
agent-browser close
kill $APP_PID
rm -rf .otto/test-screenshots
```

---

# All Mode

1. Run Mode (lint, type check, test)
2. Auto-detect: web → Browser Mode, Electron/VS Code → Electron Mode
3. Report results
