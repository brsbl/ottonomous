---
name: clean
description: Reset project to freshly installed plugin state. Removes workflow artifacts (.otto/) and app code while preserving plugin files. Invoke with /clean.
---

# Clean

Reset project to freshly installed plugin state. This is destructive and removes all generated code and workflow data.

## What Gets Preserved (allowlist)

Only these files/directories survive:
- `.claude/` - Settings and dev-browser submodule
- `.claude-plugin/` - Marketplace metadata
- `skills/` - Plugin skills
- `.git/` - Version control
- `README.md` - Project readme
- `LICENSE` - License file
- `.gitignore` - Git ignore rules
- `.gitmodules` - Git submodules

## What Gets Removed

**Everything else** - including but not limited to:
- `.otto/` - Workflow data (specs, tasks, sessions)
- `src/`, `dist/`, `public/` - App source code
- `node_modules/` - Dependencies
- `package.json`, lockfiles - Package configs
- Framework dirs (`.next/`, `.nuxt/`, etc.)
- Build configs (`vite.config.*`, `tsconfig*.json`, etc.)

This approach handles any framework without needing to enumerate them.

---

## Workflow

### Step 1: Kill Active Processes

Check for and kill any running otto processes:

```bash
if [ -f ".otto/otto/.active" ]; then
  SESSION_ID=$(cat .otto/otto/.active)
  SESSION_DIR=".otto/otto/sessions/$SESSION_ID"
  [ -f "$SESSION_DIR/dev-browser.pid" ] && kill $(cat "$SESSION_DIR/dev-browser.pid") 2>/dev/null || true
  [ -f "$SESSION_DIR/report.pid" ] && kill $(cat "$SESSION_DIR/report.pid") 2>/dev/null || true
fi
```

### Step 2: Preview What Will Be Removed

List everything except preserved files with sizes:

```bash
# List items that will be removed (everything except preserved files)
find . -maxdepth 1 \
  ! -name '.' \
  ! -name '.claude' \
  ! -name '.claude-plugin' \
  ! -name 'skills' \
  ! -name '.git' \
  ! -name 'README.md' \
  ! -name 'LICENSE' \
  ! -name '.gitignore' \
  ! -name '.gitmodules' \
  -exec du -sh {} \; 2>/dev/null | sort -hr
```

Display preview to user:

```
Will remove:
  node_modules/      180M
  .next/              45M
  .otto/              12M
  src/                 2M
  package.json         1K
  ...

Total: ~239M

Preserved:
  .claude/
  .claude-plugin/
  skills/
  .git/
  README.md
  LICENSE
  .gitignore
  .gitmodules
```

### Step 3: Confirm

**Always ask for confirmation** - this is destructive:

```
Use AskUserQuestion:

Question: "This will delete all app code and workflow data. Continue?"

Options:
- Yes, reset to clean state
- Cancel
```

### Step 4: Remove Everything Except Preserved Files

After confirmation, remove using find:

```bash
find . -maxdepth 1 \
  ! -name '.' \
  ! -name '.claude' \
  ! -name '.claude-plugin' \
  ! -name 'skills' \
  ! -name '.git' \
  ! -name 'README.md' \
  ! -name 'LICENSE' \
  ! -name '.gitignore' \
  ! -name '.gitmodules' \
  -exec rm -rf {} +
```

This operates on the filesystem directly (doesn't use git or read .gitignore).

### Step 5: Report Results

```
Cleaned. Removed all files except:
  .claude/
  .claude-plugin/
  skills/
  .git/
  README.md
  LICENSE
  .gitignore
  .gitmodules

Project reset to fresh plugin state.
Run /otto to start a new build.
```

---

## Example

```
/clean
```

Output:
```
Checking for active processes... none found.

Will remove:
  node_modules/      180M
  .next/              45M
  .otto/              12M
  src/                 2M
  package.json         1K
  tsconfig.json        1K

Total: ~239M

Preserved:
  .claude/
  .claude-plugin/
  skills/
  .git/
  README.md

This will delete all app code and workflow data. Continue?
> Yes, reset to clean state

Cleaned. Removed all files except preserved plugin files.

Project reset to fresh plugin state.
```
