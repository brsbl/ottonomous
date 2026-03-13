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

Launch `smoke-tester` subagent with the spec path and app launch command.

The smoke-tester launches the app, connects agent-browser, and checks whether the UI matches the spec.

## Step 4: Fix Loop

If smoke-tester reports failures, loop up to **3 attempts**:

1. Launch a `verify-fixer` subagent with failure evidence (ARIA snapshots, screenshots, error descriptions)
2. Rebuild
3. Re-run smoke-tester

After 3 attempts, log remaining failures and continue.

## Step 5: Cleanup

```bash
agent-browser close
kill $APP_PID 2>/dev/null
rm -rf .otto/verify-screenshots
```
