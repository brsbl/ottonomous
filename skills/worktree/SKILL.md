---
name: worktree
description: Manage git worktrees for task-based development with isolated branches. Handles stashing uncommitted work and PR creation. Invoke with /worktree.
---

# Worktree Management

Manage git worktrees for isolated, task-based development. Worktrees let you work on multiple branches simultaneously without switching contexts.

## Commands

- `/worktree <task-description>` — Create a new worktree for a task
- `/worktree cleanup [branch]` — Merge worktree back to main and clean up
- `/worktree list` — Show all active worktrees
- `/worktree pr [branch]` — Create a PR for a worktree branch

---

## Create Worktree

### 1. Check for Uncommitted Changes

Before creating a worktree, check if there are uncommitted changes:

```bash
git status --porcelain
```

**If changes exist:**
> "You have uncommitted changes. I'll stash them before creating the worktree."

```bash
# Stash with descriptive message
git stash push -m "WIP: stashed for worktree $(date +%Y-%m-%d-%H%M)"
```

Remember to remind the user about the stash when they return.

### 2. Generate Branch Name

Convert task description to kebab-case branch name:
- "add user auth" → `add-user-auth`
- "Fix login bug" → `fix-login-bug`
- Keep under 50 characters
- Lowercase, hyphens only

### 3. Ensure Worktree Directory Exists

```bash
mkdir -p ~/worktrees
```

### 4. Create the Worktree

```bash
git worktree add ~/worktrees/<branch-name> -b <branch-name>
```

### 5. Set Up the Worktree

```bash
cd ~/worktrees/<branch-name>

# Install dependencies if package.json exists
if [ -f package.json ]; then
  npm install  # or bun install, yarn, etc.
fi
```

### 6. Confirm to User

> "Worktree created at `~/worktrees/<branch-name>`
>
> To start working:
> ```bash
> cd ~/worktrees/<branch-name>
> ```
>
> When done, use `/worktree cleanup <branch-name>` to merge and clean up."

**If changes were stashed:**
> "Note: Your previous changes were stashed. When you return to the main worktree, run `git stash pop` to restore them."

---

## List Worktrees

```bash
git worktree list
```

Present in a table format:
> | Path | Branch | Status |
> |------|--------|--------|
> | /path/to/main | main | (main worktree) |
> | ~/worktrees/feature-x | feature-x | active |

---

## Cleanup Worktree

### 1. Identify the Branch

If branch not specified, list worktrees and ask user which to clean up.

### 2. Check for Uncommitted Changes

```bash
cd ~/worktrees/<branch-name>
git status --porcelain
```

**If changes exist:**
> "There are uncommitted changes in this worktree. Would you like to:
> 1. Commit them first
> 2. Stash them
> 3. Discard them (caution)"

### 3. Switch to Main Repository

```bash
cd <main-repo-path>
git checkout main
git pull origin main
```

### 4. Merge the Branch

```bash
git merge <branch-name>
```

**If conflicts:**
Help the user resolve conflicts before proceeding.

### 5. Remove the Worktree

```bash
git worktree remove ~/worktrees/<branch-name>
```

**If force needed:**
```bash
git worktree remove ~/worktrees/<branch-name> --force
```

### 6. Delete the Branch

```bash
git branch -d <branch-name>
```

### 7. Verify Cleanup

```bash
git worktree list
git branch
```

> "Cleanup complete:
> - Branch `<branch-name>` merged into main
> - Worktree removed from `~/worktrees/<branch-name>`
> - Branch deleted"

---

## Create Pull Request

When ready to submit work from a worktree:

### 1. Ensure Changes Are Committed

```bash
cd ~/worktrees/<branch-name>
git status
```

If uncommitted changes, prompt user to commit first.

### 2. Push the Branch

```bash
git push -u origin <branch-name>
```

### 3. Create the PR

```bash
gh pr create --title "<PR title>" --body "$(cat <<'EOF'
## Summary
<Brief description of changes>

## Changes
- <Change 1>
- <Change 2>

## Test Plan
- [ ] <Test case 1>
- [ ] <Test case 2>

---
Generated from worktree: `~/worktrees/<branch-name>`
EOF
)"
```

### 4. Report to User

> "PR created: <PR URL>
>
> Next steps:
> - Wait for review
> - After merge, run `/worktree cleanup <branch-name>` to clean up"

---

## Mid-Session Stash Handling

When returning to the main worktree after working in another:

### Check for Stashed Changes

```bash
git stash list
```

**If stashes exist that match the session pattern:**
> "You have stashed changes from earlier:
> ```
> stash@{0}: WIP: stashed for worktree 2025-01-13-1430
> ```
>
> Would you like to restore them with `git stash pop`?"

---

## Best Practices

1. **One task per worktree** — Keep branches focused
2. **Clean up promptly** — Don't let worktrees accumulate
3. **Commit before switching** — Or use stash explicitly
4. **Name descriptively** — Branch names should indicate the task
5. **Pull main before merging** — Reduce conflicts
