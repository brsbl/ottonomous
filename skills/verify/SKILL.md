---
name: verify
description: "Builds and launches the app, then runs smoke-tester and verify-fixer subagents to click through UI flows, capture screenshots, and compare behavior against spec acceptance criteria. Loops fixes until all checks pass. Use when testing the app end-to-end, running a smoke test, doing QA verification, checking if the app works, or validating against the spec after implementation."
argument-hint: [web | electron]
model: opus
allowed-tools: Bash(agent-browser *), Bash(npx agent-browser *), Bash(code *), Bash(open *), Bash(npm *), Bash(npx *), Bash(kill *), Bash(sleep *), Bash(curl *), Bash(lsof *), Bash(mkdir *), Bash(rm *), Bash(git *), Read, Write, Edit, Glob, Grep, Agent
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| (none) | Auto-detect app type, verify against spec |
| `web` | Force web app verification |
| `electron` | Force Electron/VS Code verification |

---

## Step 1: Detect App Type

Read `package.json`:

| Signal | Type | Launch |
|--------|------|--------|
| `"engines": { "vscode" }` | VS Code extension | `code --extensionDevelopmentPath=./ --remote-debugging-port=9333` |
| `electron` in dependencies | Electron app | `npx electron . --remote-debugging-port=9333` or dev script |
| Dev script (vite/next/webpack) | Web app | `npm run dev` then `agent-browser open localhost:{port}` |
| None | CLI/Library | Skip visual verification |

## Step 2: Build

```bash
npm run compile  # or npm run build
```

If build fails, stop and report.

## Step 3: Launch & Verify

**Launch `smoke-tester` subagent using the Task tool:**
- `subagent_type`: `smoke-tester`
- Prompt includes: spec path, app launch command, list of acceptance criteria from the spec
- The subagent launches the app, connects via `agent-browser`, navigates key flows, captures ARIA snapshots and screenshots, and checks whether the UI matches spec criteria
- Wait for subagent to complete

**Subagent returns:** pass/fail per criterion with evidence (ARIA snapshots, screenshots, error descriptions).

## Step 4: Fix Loop

If smoke-tester reports failures, **keep looping until all criteria pass**:

1. **Launch `verify-fixer` subagent using the Task tool:**
   - `subagent_type`: `verify-fixer`
   - Prompt includes: failing criteria, ARIA snapshots, screenshots, error descriptions, relevant source file paths
   - The subagent reads the failure evidence, identifies root causes, and applies fixes to the source code
   - Wait for subagent to complete
2. Rebuild (`npm run compile` or `npm run build`)
3. Re-launch `smoke-tester` subagent with the same criteria
4. If failures remain, loop again (max 5 iterations — report and stop if still failing)

This is a hard gate — the workflow does not proceed until verification passes.

## Step 5: Cleanup

```bash
agent-browser close
kill $APP_PID 2>/dev/null
rm -rf .otto/verify-screenshots
```
