---
name: log
description: Searches and retrieves engineering knowledge anchored to source files. Activates when exploring code, investigating bugs, planning implementation, or answering questions about code functionality.
---

# Engineering Log

Institutional memory for the codebase. Capture discoveries anchored to source files.

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

---

## Finding Relevant Logs

### Strategy 1: File-based lookup (when exploring specific files)

Search INDEX.md for the file path to find entries anchored to that file:

```bash
grep -n "systems/log/" .kit/logs/INDEX.md
```

### Strategy 2: Topic-based search (when investigating a concept)

Search INDEX.md for keywords in summaries:

```bash
grep -i "timestamp" .kit/logs/INDEX.md
```

For deeper content search, grep all log entries:

```bash
grep -ri "staleness detection" .kit/logs/
```

### Strategy 3: Read matching entries

Once you find relevant entry IDs, read the full content:

```bash
cat .kit/logs/git-timestamp-utilities-k3m9.md
```

---

## Check Staleness

Before trusting an entry, verify its anchors haven't changed since it was written:

```bash
# Get entry timestamp (last commit to the entry file, fallback to mtime for uncommitted)
entry_time=$(git log -1 --format="%ct" -- .kit/logs/{entry-id}.md 2>/dev/null)
if [ -z "$entry_time" ]; then
  entry_time=$(stat -c %Y .kit/logs/{entry-id}.md 2>/dev/null || stat -f %m .kit/logs/{entry-id}.md)
fi

# Check each anchor file (same fallback logic)
anchor_time=$(git log -1 --format="%ct" -- {anchor_file} 2>/dev/null)
if [ -z "$anchor_time" ]; then
  anchor_time=$(stat -c %Y {anchor_file} 2>/dev/null || stat -f %m {anchor_file})
fi

# If anchor_time > entry_time, the anchor changed after entry was written
```

| State | Condition | Action |
|-------|-----------|--------|
| Fresh | All anchors unchanged since entry | Trust fully |
| Stale | Any anchor modified after entry | Review anchor changes, verify if entry still accurate |
| Orphaned | Any anchor file deleted | Update anchors or delete entry |

---

## Initializing the Log: `/log init`

First-time setup that documents the codebase and creates baseline entries.

### Init Workflow

**Step 1: Create directory structure**

```bash
mkdir -p .kit/logs
```

**Step 2: Read project documentation**

Gather context from existing docs:

```bash
[ -f README.md ] && echo "Found README.md"
[ -f ARCHITECTURE.md ] && echo "Found ARCHITECTURE.md"
[ -f package.json ] && echo "Found package.json"
```

Read each file that exists to understand the project.

**Step 3: Analyze codebase structure**

```bash
ls -d */ 2>/dev/null | head -15
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
{Extract from README first paragraph}

## Key Technologies
- Language: {primary language}
- Framework: {if applicable}
- Key dependencies: {top 3-5}

## Entry Points
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

| Directory | Purpose |
|-----------|---------|
| `src/` | {description} |
| `tests/` | {description} |

## Architecture Layers

1. **{Layer 1}**: {description}
2. **{Layer 2}**: {description}
```

**Step 6: Generate INDEX.md**

Write `.kit/logs/INDEX.md`:

```markdown
# Engineering Log Index

Quick reference for navigating the knowledge base.

## By Anchor Location

### `.` (Project Root)

- **codebase-structure-{id}** - Directory organization, architecture layers

### `README.md` (Documentation)

- **project-overview-{id}** - Project purpose, technologies, entry points
```

**Step 7: Stage and report**

```bash
git add .kit/logs/
```

Report: "Initialized engineering log with baseline entries."

---

## Creating a New Entry: `/log`

### 1. Auto-Initialize (if needed)

Check if `.kit/logs/INDEX.md` exists:

```bash
if [ ! -f .kit/logs/INDEX.md ]; then
  mkdir -p .kit/logs
  echo "# Engineering Log Index" > .kit/logs/INDEX.md
  git add .kit/logs/INDEX.md
fi
```

### 2. Identify Discovery

Ask yourself: What did I just learn that would help someone understand this code?

Keep it focused: One log entry = one discovery.

### 3. Determine Anchors

Select the source files that IMPLEMENT the behavior you're documenting:

- Anchor to implementation files, not callers or tests
- Minimum 1 anchor, typically 1-3 files
- Use relative paths from repository root

### 4. Generate Entry ID

```bash
slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-30)
hash=$(echo "$topic$$$(date +%s%N)" | { sha1sum 2>/dev/null || shasum; } | cut -c1-4)
id="${slug}-${hash}"
```

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

{Explain the discovery:}
- What the code does
- Why it matters
- How it works (if non-obvious)
- Any gotchas or edge cases
```

### 6. Update INDEX.md

Add the new entry to `.kit/logs/INDEX.md`:

1. Determine section from primary anchor location
2. Format section header: `### \`path/to/directory/\` (Descriptive Name)`
3. Add entry line: `- **{id}** - {brief summary}`

### 7. Stage Files

```bash
git add .kit/logs/{id}.md .kit/logs/INDEX.md
```

### 8. Confirm to User

"Logged discovery about {topic} anchored to {file list}."

---

## Rebuilding INDEX: `/log rebuild`

Regenerate `.kit/logs/INDEX.md` from all entry files. Also detects and removes orphaned entries.

### Rebuild Workflow

**Step 1: Collect all entries**

Glob `.kit/logs/*.md` and read each one (skip INDEX.md).

**Step 2: Check anchors**

For each entry, check if ALL anchor files exist. Classify as:
- **Valid**: All anchors exist
- **Partial**: Some anchors missing
- **Orphaned**: All anchors missing

**Step 3: Handle missing anchors**

- If ALL anchors missing → Delete entry
- If SOME anchors valid → Update entry to remove invalid anchors

**Step 4: Generate INDEX.md**

From valid entries only:
1. Group by primary anchor directory
2. Create section headers
3. Add entry lines with summaries

**Step 5: Re-seed if empty**

If no valid entries remain, run the init workflow to re-seed baseline docs.

**Step 6: Report**

```
Rebuilt INDEX.md:
- Valid entries: {count}
- Partial entries updated: {count}
- Orphaned entries deleted: {count}
```

---

## Verify Stale Entry

If entry content is still accurate after reviewing anchor changes:

```bash
touch .kit/logs/{entry-id}.md
git add .kit/logs/{entry-id}.md
git commit -m "verify: {entry-id}"
```

## Update Existing Entry

1. Edit the entry file directly
2. Update INDEX.md if needed
3. Stage changes: `git add .kit/logs/{entry-id}.md .kit/logs/INDEX.md`

## Auto-Finding Logs

When exploring a file or investigating a topic:

1. Check for file-based entries first: `grep "{filename}" .kit/logs/INDEX.md`
2. If found: Read those entries before investigating
3. Check staleness: Verify entries are fresh
4. Use the knowledge: Apply what previous work discovered
