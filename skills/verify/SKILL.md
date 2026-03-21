---
name: verify
description: Launches a built app and verifies it against the spec using browser/electron automation. Includes fix loop. Use after implementation to verify the app works as specified.
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
| `--qa <path>` | Also verify against QA checklist manual items (combinable with above) |
| `--session <id>` | Scope QA checks to items relevant to this session's tasks (requires `--qa`) |

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

**If `--session` provided without `--qa`:** report error and stop.

**If `--qa` provided, parse and normalize QA criteria before handoff:**
1. Read the QA checklist at `<path>`
2. Extract Manual Verification items (M-prefixed rows from the checklist table)
3. If `--session` provided: filter M-items to only those whose `Sessions` column includes the given session ID
4. Normalize M-items into criteria list: `{ id: "M1", description: "...", expected: "..." }`

**Launch `smoke-tester` subagent** with:
- Spec path
- App launch command
- Combined criteria list (spec acceptance criteria + normalized QA items, if `--qa` provided)

The smoke-tester launches the app, connects agent-browser, and checks whether the UI matches all provided criteria.

## Step 4: Fix Loop

If smoke-tester reports failures, **keep looping until all criteria pass**:

1. Launch a `verify-fixer` subagent with failure evidence (ARIA snapshots, screenshots, error descriptions, and the original criterion text for each failure so the fixer can trace back to source requirements)
2. Rebuild
3. Re-run smoke-tester
4. If failures remain, loop again

This is a hard gate — the workflow does not proceed until verification passes.

## Step 5: Cleanup

```bash
agent-browser close
kill $APP_PID 2>/dev/null
rm -rf .otto/verify-screenshots
```
