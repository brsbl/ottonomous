---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools. Use when running tests, linting, type checking, or writing tests.
argument-hint: <run | write | browser | electron | all> [staged | branch]
model: opus
allowed-tools: Bash(code *), Bash(open *), Bash(npm *), Bash(npx *), Bash(kill *), Bash(sleep *), Bash(curl *), Bash(lsof *), Bash(git *), Bash(mkdir *), Read, Write, Edit, Glob, Grep, Agent
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
```

Filter to source files (exclude tests, configs, docs).

## 2. Launch Test Writers

Hand off files to test-writer subagents. They determine testability and write tests.

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

## 3. Run Pipeline

Same as Run Mode step 3.

---

# Browser Mode

Visual verification for web apps. The legacy standalone UI automation workflow has been removed; use the host environment's available browser automation tool directly.

1. Detect dev server URL from package.json or running processes
2. Open the URL, capture an accessibility/DOM snapshot, interact through semantic selectors, and take screenshots
3. Screenshots go to `.otto/test-screenshots/`
4. Cleanup any browser session/tool process and remove `.otto/test-screenshots` when no longer needed

---

# Electron Mode

Visual verification for Electron/VS Code apps. The legacy standalone UI automation workflow has been removed; use the app's project-specific harness first when available, otherwise use the host environment's available browser automation tool directly.

1. Detect app type: `engines.vscode` in package.json → VS Code extension, `electron` in dependencies → Electron app
2. Build first: `npm run compile`
3. Launch with CDP/automation hooks, connect, inspect snapshots/webviews, interact through semantic selectors, and take screenshots
4. Screenshots go to `.otto/test-screenshots/`
5. Cleanup browser/app processes and remove `.otto/test-screenshots` when no longer needed

---

# All Mode

1. Run Mode (lint, type check, test)
2. Auto-detect: web → Browser Mode, Electron/VS Code → Electron Mode
3. Report results
