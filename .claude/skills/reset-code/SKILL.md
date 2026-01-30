---
name: reset-code
description: Full project reset for ottonomous. Removes all generated code and workflow data, restoring to fresh plugin state. Preserves plugin files and git history. Destructive - requires confirmation.
model: opus
arguments:
  - name: targets
    description: "What to reset: diffs, otto, code, deps, or all (default: all)"
    required: false
---

Reset project to freshly installed plugin state. Can selectively reset parts or do a full reset.

## Available Targets

| Target | Removes | Description |
|--------|---------|-------------|
| `diffs` | `.claude/skill-diffs/` | Skill diff previews |
| `otto` | `.otto/` | All workflow data |
| `code` | `src/`, `dist/`, `public/`, configs | Generated app code |
| `deps` | `node_modules/`, lockfiles | Dependencies |
| `all` | Everything except allowlist | Full reset (default) |

## Usage Examples

- `/reset-code` - Full reset (prompts for confirmation)
- `/reset-code diffs` - Clear only skill diff previews
- `/reset-code otto` - Clear workflow data (same as `/reset`)
- `/reset-code code` - Clear generated code, keep deps
- `/reset-code deps` - Clear node_modules only

## Preserved Files (allowlist)

Only these survive a full reset:
- `.claude/` - Settings
- `.claude-plugin/` - Marketplace metadata
- `skills/` - Plugin skills
- `.git/` - Version control
- `README.md`, `LICENSE`, `.gitignore`, `.gitmodules`

## Removed Files (full reset)

Everything else, including:
- `.otto/` - Workflow data
- `src/`, `dist/`, `public/` - App code
- `node_modules/` - Dependencies
- `package.json`, lockfiles
- Framework dirs (`.next/`, `.nuxt/`, etc.)
- Build configs (`vite.config.*`, `tsconfig*.json`)

## Workflow

### 1. Parse Arguments

Map targets to paths:
```
diffs -> .claude/skill-diffs/
otto  -> .otto/
code  -> src/, dist/, public/, *.config.*, tsconfig*.json, package.json
deps  -> node_modules/, package-lock.json, yarn.lock, pnpm-lock.yaml
all   -> everything except allowlist
```

### 2. Kill Active Processes (if otto or all targeted)

```bash
for pid_file in .otto/sessions/*/browser.pid .otto/otto/sessions/*/browser.pid; do
  [ -f "$pid_file" ] && kill $(cat "$pid_file") 2>/dev/null || true
done
```

### 3. Preview Removal

**For selective targets**, show targeted paths:
```bash
du -sh <target_paths> 2>/dev/null
```

**For full reset (`all`)**, list everything to remove:
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

### 4. Confirm

Use `AskUserQuestion`:
> "This will delete [target description]. Continue?"
> Options: "Yes, reset" / "Cancel"

### 5. Remove

**For selective targets**:
```bash
rm -rf <target_paths>
```

**For full reset (`all`)**:
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

### 6. Report

```
Reset complete. Cleared: [targets]
Run /otto to start a new build.
```
