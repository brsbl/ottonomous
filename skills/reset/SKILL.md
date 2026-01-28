---
name: reset
description: Resets project to fresh plugin state. Removes all workflow artifacts (.otto/) and generated code while preserving plugin files and git history. Use when starting over or wiping generated code. Destructive - requires confirmation.
model: opus
---

Reset project to freshly installed plugin state. This is destructive.

## Preserved Files (allowlist)

Only these survive:
- `.claude/` - Settings
- `.claude-plugin/` - Marketplace metadata
- `skills/` - Plugin skills
- `.git/` - Version control
- `README.md`, `LICENSE`, `.gitignore`, `.gitmodules`

## Removed Files

Everything else, including:
- `.otto/` - Workflow data
- `src/`, `dist/`, `public/` - App code
- `node_modules/` - Dependencies
- `package.json`, lockfiles
- Framework dirs (`.next/`, `.nuxt/`, etc.)
- Build configs (`vite.config.*`, `tsconfig*.json`)

## Workflow

### 1. Kill Active Processes

```bash
for pid_file in .otto/otto/sessions/*/browser.pid; do
  [ -f "$pid_file" ] && kill $(cat "$pid_file") 2>/dev/null || true
done
```

### 2. Preview Removal

List items that will be removed with sizes:
```bash
to_remove=()
for item in ./* ./.*; do
  [[ ! -e "$item" ]] && continue
  name="${item##*/}"
  case "$name" in
    .|..|.claude|.claude-plugin|skills|.git|README.md|LICENSE|.gitignore|.gitmodules) ;;
    *) to_remove+=("$item") ;;
  esac
done

if [[ ${#to_remove[@]} -gt 0 ]]; then
  du -sh "${to_remove[@]}" 2>/dev/null | sort -hr
fi
```

Show user:
```
Will remove:
  node_modules/      180M
  .otto/              12M
  src/                 2M
  ...

Preserved:
  .claude/, skills/, .git/, README.md, LICENSE
```

### 3. Confirm

Use `AskUserQuestion`:
> "This will delete all app code and workflow data. Continue?"
> Options: "Yes, reset" / "Cancel"

### 4. Remove

After confirmation:
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

### 5. Report

```
Reset complete. Project restored to fresh plugin state.
Run /otto to start a new build.
```
