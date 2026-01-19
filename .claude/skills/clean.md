---
name: clean
description: Reset project to freshly installed plugin state. Removes workflow artifacts (.otto/) and app code while preserving plugin files. Invoke with /clean.
---

# Clean

Reset project to freshly installed plugin state. This is destructive and removes all generated code and workflow data.

## What Gets Removed

**Runtime artifacts:**
- `.otto/` - All workflow data (specs, tasks, reviews, docs, sessions, config)
- Active processes - dev-browser.pid, report.pid

**App artifacts:**
- Source: `src/`, `dist/`, `public/`, `server/`, `api/`
- Frameworks: `.next/`, `.nuxt/`, `.output/`
- Dependencies: `node_modules/`
- Configs: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`
- Build configs: `vite.config.*`, `tsconfig*.json`, `next.config.*`, `tailwind.config.*`, `postcss.config.*`
- Other: `components.json`, `.env*` (except `.env.example`)

## What Gets Preserved

**Plugin files:**
- `.claude/` - Skills and settings
- `.claude-plugin/` - Marketplace metadata
- `.git/`, `README.md`, `LICENSE`, `.gitignore`, `.gitmodules`

---

## Workflow

### Step 1: Kill Active Processes

Check for and kill any running otto processes:

```bash
# Check for active session
if [ -f ".otto/otto/.active" ]; then
  SESSION_ID=$(cat .otto/otto/.active)
  SESSION_DIR=".otto/otto/sessions/$SESSION_ID"

  # Kill dev-browser
  if [ -f "$SESSION_DIR/dev-browser.pid" ]; then
    kill $(cat "$SESSION_DIR/dev-browser.pid") 2>/dev/null || true
  fi

  # Kill report server
  if [ -f "$SESSION_DIR/report.pid" ]; then
    kill $(cat "$SESSION_DIR/report.pid") 2>/dev/null || true
  fi
fi
```

### Step 2: Detect and Preview

Scan for existing artifacts and calculate sizes:

```bash
# Runtime artifacts
du -sh .otto 2>/dev/null || echo "0B .otto"

# App artifacts - check each
for dir in src dist public server api .next .nuxt .output node_modules; do
  du -sh "$dir" 2>/dev/null
done

# Config files
ls -la package.json tsconfig*.json vite.config.* next.config.* tailwind.config.* 2>/dev/null
```

Display preview to user:

```
Will remove:

Runtime:
  .otto/              12M   (specs, tasks, reviews, sessions)

App artifacts:
  src/                 2M
  node_modules/      180M
  .next/              45M
  package.json
  tsconfig.json
  ...

Total: ~239M

Preserved:
  .claude/
  .git/
  README.md
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

### Step 4: Remove Artifacts

After confirmation, remove in order:

```bash
# 1. Runtime artifacts
rm -rf .otto

# 2. App directories
rm -rf src dist public server api
rm -rf .next .nuxt .output
rm -rf node_modules

# 3. Config files
rm -f package.json package-lock.json pnpm-lock.yaml yarn.lock bun.lockb
rm -f tsconfig.json tsconfig.*.json
rm -f vite.config.js vite.config.ts vite.config.mjs
rm -f next.config.js next.config.ts next.config.mjs
rm -f tailwind.config.js tailwind.config.ts
rm -f postcss.config.js postcss.config.mjs
rm -f components.json
rm -f .env .env.local .env.production .env.development
# Keep .env.example if it exists
```

### Step 5: Report Results

```
Cleaned:
  - .otto/ removed (12M)
  - src/ removed (2M)
  - node_modules/ removed (180M)
  - .next/ removed (45M)
  - 8 config files removed

Total freed: 239M

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

Runtime:
  .otto/              12M

App artifacts:
  src/                 2M
  node_modules/      180M
  package.json
  tsconfig.json

Total: ~194M

Preserved:
  .claude/
  .git/
  README.md

This will delete all app code and workflow data. Continue?
> Yes, reset to clean state

Cleaned:
  - .otto/ removed
  - src/ removed
  - node_modules/ removed
  - 2 config files removed

Project reset to fresh plugin state.
```
