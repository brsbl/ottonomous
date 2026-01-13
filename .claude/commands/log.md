---
description: Capture a code discovery anchored to source files
---

# Log Command

Create a new engineering log entry documenting something you just learned about the codebase.

## Usage

- `/log` - Create new log entry (guided workflow)
- `/log init` - First-time setup: document codebase and create baseline entries
- `/log rebuild` - Regenerate INDEX.md, clean orphans, re-seed if empty

## When to Use

Capture discoveries like:
- How a feature works
- Why code is structured a certain way
- Non-obvious patterns or conventions
- Gotchas or edge cases
- Implementation details that aren't obvious from reading the code

## Initializing the Log: `/log init`

First-time setup that documents the codebase and creates baseline entries. Run this when setting up a new project or when the log is empty.

### Init Workflow

**Step 1: Create directory structure**

```bash
mkdir -p .kit/logs
```

**Step 2: Read project documentation**

Gather context from existing docs:

```bash
# Check what exists
[ -f README.md ] && echo "Found README.md"
[ -f ARCHITECTURE.md ] && echo "Found ARCHITECTURE.md"
[ -f docs/ARCHITECTURE.md ] && echo "Found docs/ARCHITECTURE.md"
[ -f package.json ] && echo "Found package.json"
[ -f pyproject.toml ] && echo "Found pyproject.toml"
[ -f Cargo.toml ] && echo "Found Cargo.toml"
[ -f go.mod ] && echo "Found go.mod"
```

Read each file that exists to understand the project.

**Step 3: Analyze codebase structure**

```bash
# List top-level directories
ls -d */ 2>/dev/null | head -15

# Find main entry points
ls *.py *.js *.ts *.go *.rs 2>/dev/null | head -10
```

**Step 4: Create project-overview entry**

Generate ID: `project-overview-{4-char-hash}`

Write `.kit/logs/project-overview-{id}.md`:

```yaml
---
id: project-overview-{id}
anchors:
  - README.md
---

# Project Overview

## What This Project Does

{Extract from README first paragraph - the project's purpose}

## Key Technologies

{From README, package.json, or other config files}
- Language: {primary language}
- Framework: {if applicable}
- Key dependencies: {top 3-5}

## Entry Points

{Identify main scripts, CLI commands, or server entry points}
- Main: {path}
- CLI: {path if exists}
- Tests: {test directory}
```

**Step 5: Create codebase-structure entry**

Generate ID: `codebase-structure-{4-char-hash}`

Write `.kit/logs/codebase-structure-{id}.md`:

```yaml
---
id: codebase-structure-{id}
anchors:
  - .
---

# Codebase Structure

## Directory Organization

{For each top-level directory, one line describing its purpose}

| Directory | Purpose |
|-----------|---------|
| `src/` | {description} |
| `tests/` | {description} |
| ... | ... |

## Architecture Layers

{If discernible from structure or docs, describe the main layers}

1. **{Layer 1}**: {description}
2. **{Layer 2}**: {description}
3. **{Layer 3}**: {description}

## Key Files

{Important configuration and entry point files}
- `{file}` - {purpose}
```

**Step 6: Generate INDEX.md**

Write `.kit/logs/INDEX.md`:

```markdown
# Engineering Log Index

Quick reference for navigating the knowledge base. Search by file path or keyword.

## By Anchor Location

### `.` (Project Root)

- **codebase-structure-{id}** - Directory organization, architecture layers, key files

### `README.md` (Documentation)

- **project-overview-{id}** - Project purpose, technologies, entry points
```

**Step 7: Stage and report**

```bash
git add .kit/logs/
```

Report:
```
Initialized engineering log:
- project-overview-{id} (from README.md)
- codebase-structure-{id} (from filesystem analysis)
- INDEX.md created
Files staged. The log will grow as you work - discoveries are captured with /log.
```

## Creating a New Entry: `/log`

### 1. Auto-Initialize (if needed)

Before creating an entry, check if `.kit/logs/INDEX.md` exists:

```bash
if [ ! -f .kit/logs/INDEX.md ]; then
  # Create initial INDEX.md
  cat > .kit/logs/INDEX.md << 'EOF'
# Engineering Log Index

Quick reference for navigating the knowledge base.

## By Anchor Location

EOF
  git add .kit/logs/INDEX.md
  echo "Initialized .kit/logs/INDEX.md"
fi
```

### 2. Identify Discovery

Ask yourself: What did I just learn that would help someone (including future me) understand this code?

Keep it focused: One log entry = one discovery. If you learned multiple things, create multiple entries.

### 3. Determine Anchors

Select the source files that IMPLEMENT the behavior you're documenting:

- Anchor to implementation files, not callers or tests
- Minimum 1 anchor, typically 1-3 files
- Use relative paths from repository root
- Choose the files someone would need to read to verify your discovery

**Example**:
- Good: `systems/log/lib/commands/search.sh` (implements search)
- Avoid: `systems/log/bin/log` (just routes to search command)

### 4. Generate Entry ID

```bash
# Create slug from topic (lowercase, hyphens, max 30 chars)
slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | head -c 30)

# Add random 4-character suffix for uniqueness
hash=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 4)

# Combine
id="${slug}-${hash}"
```

**Example**: "Git timestamp utilities" → `git-timestamp-utilities-k3m9`

### 5. Write Entry File

Create `.kit/logs/{id}.md`:

```yaml
---
id: {id}
anchors:
  - {path/to/implementation/file1}
  - {path/to/implementation/file2}
---

{What you learned - concise but complete}

{Explain the discovery in enough detail that someone can understand:}
- What the code does
- Why it matters
- How it works (if non-obvious)
- Any gotchas or edge cases

{Use code examples if helpful}
```

### 6. Update INDEX.md

Add the new entry to `.kit/logs/INDEX.md`:

1. **Determine section**: Use primary anchor location (first anchor in list)
   - Extract directory path: `systems/log/lib/` → `systems/log/`
   - Find or create matching section header

2. **Format section header**:
   ```markdown
   ### `path/to/directory/` (Descriptive Name)
   ```

3. **Add entry line**:
   ```markdown
   - **{id}** - {brief summary with searchable keywords}
   ```

4. **Write summary for searchability**:
   - Include terms someone would search for
   - Mention key concepts, tools, or patterns
   - Keep it one line, concise but descriptive

5. **Maintain organization**:
   - Keep entries grouped by section
   - Maintain alphabetical or logical ordering within sections
   - Add blank line between sections

**Example**:
```markdown
### `systems/log/lib/` (Log Utilities)

- **git-timestamp-utilities-k3m9** - Git log timestamp extraction for staleness
- **log-search-implementation-fmbe** - Case-insensitive grep with staleness checks
```

### 7. Stage Files

```bash
git add .kit/logs/{id}.md .kit/logs/INDEX.md
```

Do not commit yet. Let the user decide when to commit (usually with related code changes).

### 8. Confirm to User

"Logged discovery about {topic} anchored to {file list}. Files staged: `.kit/logs/{id}.md` and `.kit/logs/INDEX.md`."

## Rebuilding INDEX: `/log rebuild`

Regenerate `.kit/logs/INDEX.md` from all entry files. Also detects and removes orphaned entries.

Use when:
- INDEX.md is corrupted or out of sync
- Entries have been added/removed manually
- Cleaning up after refactoring (removes orphans)

### Rebuild Workflow

**Step 1: Collect all entries**

Use Glob to find all entry files, then Read each one:

```
Glob: .kit/logs/*.md
```

For EACH file (skip INDEX.md):
- Read the full file content
- Extract `id` from frontmatter
- Extract `anchors` list from frontmatter
- Extract first paragraph after frontmatter as summary source

**IMPORTANT**: Read every single file. Do not reference the existing INDEX.md.

**Step 2: Check anchors for each entry**

For each entry, check if ALL anchor files exist:

```bash
[ -f "anchor/path/here" ] && echo "exists" || echo "missing"
```

Classify each entry:
- **Valid**: All anchors exist
- **Partial**: Some anchors exist, some missing
- **Orphaned**: All anchors missing

**Step 3: Handle entries with missing anchors**

For each entry with missing anchors:

1. **If ALL anchors missing** → Delete the entry:
   ```bash
   rm .kit/logs/{id}.md
   ```
   Report: "Deleted orphaned entry: {id} (all anchors missing)"

2. **If SOME anchors valid** → Update the entry to remove invalid anchors:
   - Edit the frontmatter to keep only valid anchors
   - Report: "Updated {id}: removed invalid anchor {path}"

**Step 4: Generate INDEX.md**

From valid entries only:

1. Group by primary anchor directory (first anchor's parent path)
2. Create section headers: `### \`directory/\` (Descriptive Name)`
3. Add entry lines: `- **{id}** - {summary}`

Summary guidelines:
- One line, ~80 chars max
- Include searchable keywords
- Extract from first content paragraph

**Step 5: Write and stage**

```bash
# Write INDEX.md with header + sections
git add .kit/logs/INDEX.md
```

**Step 6: Re-seed if empty**

If no valid entries remain after cleaning orphans, run the init workflow to re-seed baseline documentation:

```
No valid entries remaining. Re-seeding from project documentation...
```

Then execute Steps 2-6 from `/log init`.

**Step 7: Report results**

```
Rebuilt INDEX.md:
- Valid entries: {count}
- Partial entries updated: {count}
- Orphaned entries deleted: {count} ({list of ids})
- Re-seeded: {yes/no}
```

## Notes

- The `engineering-log` skill will help find entries later when exploring related code
- Entry files use git timestamps for staleness detection, so commits matter
- To update existing entries, edit them directly (don't use `/log`)
- INDEX.md should always be kept in sync with entry files
