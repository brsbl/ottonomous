---
name: verify
description: Launches a built app and verifies it against spec acceptance criteria using browser/electron automation. Includes fix loop with parallel subagents. Use after implementation to verify the app works as specified.
argument-hint: [web | electron]
model: opus
allowed-tools: Bash(agent-browser *), Bash(npx agent-browser *), Bash(code *), Bash(open *), Bash(npm *), Bash(npx *), Bash(kill *), Bash(sleep *), Bash(curl *), Bash(lsof *), Bash(mkdir *), Bash(rm *), Bash(git *), Read, Write, Edit, Glob, Grep, Agent
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| (none) | Auto-detect app type, verify all criteria for completed sessions |
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

## Step 2: Extract Criteria

Read spec from `.otto/specs/{spec_id}.md`.
Read tasks from `.otto/tasks/{spec_id}.json`.

For each **completed session's tasks**, extract `done_when` conditions that are visually verifiable.
From the spec, extract:
- User Story acceptance criteria (behavioral checks)
- Definition of Done checkboxes (existence checks)
- Architecture requirements (structural checks)

Write to `.otto/verify/criteria.json`:
```json
{
  "app_type": "vscode-extension",
  "criteria": [
    { "id": "v1", "source": "DoD", "description": "Extension activates without errors" },
    { "id": "v2", "source": "US-2", "description": "Chat panel visible in auxiliary bar" },
    { "id": "v3", "source": "S1:task-3", "description": "Session rail shows in sidebar" }
  ]
}
```

Only include criteria for features that have been implemented (completed sessions).

## Step 3: Build

```bash
npm run compile  # or npm run build
```

If build fails, stop and report build failure.

## Step 4: Launch & Verify

Launch `smoke-tester` subagent with:
- App type + launch command
- Criteria list
- Spec path

The smoke-tester launches the app, connects agent-browser, and checks each criterion.

## Step 5: Fix Loop

If any criteria fail, loop up to **3 attempts**:

1. **Collect evidence:** smoke-tester returns ARIA snapshot, screenshots, failure descriptions
2. **Launch fixers:** 1-3 `verify-fixer` subagents based on failure count
   - 1-2 failures: 1 fixer
   - 3-4 failures: 2 fixers
   - 5+ failures: 3 fixers
   - Each receives: failure evidence, relevant source file contents, spec section
3. **Rebuild:** `npm run compile`
4. **Re-verify:** Re-run smoke-tester on **failed criteria only**
5. All pass: done. Still failing: next attempt.

After 3 attempts: log remaining failures, continue pipeline.

## Step 6: Report

```markdown
## Verification Results

| # | Criterion | Status | Attempts | Evidence |
|---|-----------|--------|----------|----------|
| v1 | Extension activates | Pass | 1 | No errors |
| v2 | Chat panel renders | Pass | 2 | Fixed CSP nonce |
| v3 | Session rail visible | Pass | 1 | Tree view found |
| v4 | Streaming works | Fail | 3 | No response after 10s |

Passed: 3/4
```

## Step 7: Cleanup

```bash
agent-browser close
kill $APP_PID 2>/dev/null
rm -rf .otto/verify-screenshots .otto/verify
```
