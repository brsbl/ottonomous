---
id: log-system-refactor-eb71
name: Log System Refactor
status: implemented
created: 2026-01-12
updated: 2026-01-12
---

# Log System Refactor

Target state for the log system after removing the CLI layer.

## Overview

The log system is an **evergreen knowledge base** that captures engineering discoveries anchored to source files. Unlike spec/task (transactional), log entries persist and are continuously validated via automatic staleness detection.

**Key distinction:** Spec and task are transactional (create → complete → archive). Log is evergreen (create → validate continuously → update as code changes).

**Reference:** [beads](https://github.com/steveyegge/beads) - git-backed issue tracker with similar patterns

## Goals

- **Skill contains full lifecycle**: search, check staleness, verify, update entries
- **Command /log focuses on one thing**: adding new discoveries
- **Progressive disclosure**: INDEX.md enables fast retrieval, format agent-determined
- **Staleness via git timestamps**: agent runs git commands directly
- **Auto-updating index**: INDEX.md regenerated when entries added
- **Simple init**: creates .kit/logs/ + INDEX.md

## Non-Goals

- Migration from current CLI
- Prescriptive index schema (agent determines format based on project)

---

## Architecture

```
User Context (exploring code, investigating)
     │
     ▼
┌─────────────────────────────────────────────┐
│  Skill: .claude/skills/log/SKILL.md          │
│  (Full Lifecycle - Evergreen)                │
│  - Search log before investigating code      │
│  - Consult INDEX.md for fast retrieval       │
│  - Check staleness (git timestamps)          │
│  - Verify/update stale entries               │
│  - Links to /log for adding new entries      │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Command: /log (Add Discovery)               │
│  - Identify what was learned                 │
│  - Determine anchor files                    │
│  - Generate ID, write entry                  │
│  - Update INDEX.md                           │
│  - Stage with git                            │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Data: .kit/logs/                            │
│  ├── INDEX.md    (fast retrieval)            │
│  └── *.md        (entries with anchors)      │
└─────────────────────────────────────────────┘
```

---

## Detailed Design

### Skill: `.claude/skills/log/SKILL.md`

```markdown
---
name: engineering-log
description: Captures engineering knowledge anchored to source files. Activates when exploring code, investigating bugs, planning implementation, or answering questions about how code works. Always search this log before reading source files.
---

# Engineering Log

Institutional memory for the codebase.

## Quick start

**Search the log before investigating code:**

1. Consult [.kit/logs/INDEX.md] to find potentially relevant entries
2. Grep `.kit/logs/` for specific keywords if needed
3. Read matching entry files

## Check Staleness

For each entry, compare timestamps:
```bash
entry_time=$(git log -1 --format="%ct" -- .kit/logs/{entry}.md)
anchor_time=$(git log -1 --format="%ct" -- {anchor_file})
```

| State | Condition | Action |
|-------|-----------|--------|
| valid | All anchors unchanged | Use directly |
| stale | Any anchor modified after entry | Verify before trusting |
| orphaned | Any anchor file missing | Cleanup or update anchors |

## Verify Stale Entry

If entry is still accurate after reviewing anchor changes:
```bash
touch .kit/logs/{entry}.md
git add .kit/logs/{entry}.md
git commit -m "verify: {entry-id}"
```

Note: Verification requires a commit because staleness detection uses git commit timestamps.

## Update Entry

Edit content/anchors as needed, then stage.

## Remove Orphaned Anchors

Edit frontmatter to remove deleted file paths.
If no valid anchors remain, delete entry.

## Add New Discovery

See [/log command](.claude/commands/log.md)
```

### Command: `/log` (Add Discovery)

```markdown
# Log Command

Capture a code discovery anchored to source files.

## Workflow

### 1. Identify Discovery

Something you just learned:
- How a feature works
- Why code is structured a certain way
- A non-obvious pattern or convention
- A gotcha or edge case

### 2. Determine Anchors

Source files that IMPLEMENT the behavior:
- Anchor to implementation files, not callers or tests
- Minimum 1 anchor, typically 1-3 files
- Use relative paths from repo root

### 3. Write Entry

Generate ID:
```bash
slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-30)
hash=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 4)
id="${slug}-${hash}"
```

Write to `.kit/logs/{id}.md`:
```yaml
---
id: {id}
anchors:
  - {path/to/file1}
  - {path/to/file2}
---

{What you learned - concise but complete}
```

### 4. Update Index

Update `.kit/logs/INDEX.md` to include the new entry. Format is agent-determined based on project structure.

### 5. Stage

```bash
git add .kit/logs/{id}.md .kit/logs/INDEX.md
```

### 6. Confirm

Tell user: "Logged discovery about {topic} anchored to {files}."
```

### Index: `.kit/logs/INDEX.md`

An index for fast entry retrieval. Agent generates and maintains based on project structure.

**Requirements:**
- Enough context to decide relevance without reading full entries
- Updated when entries are added/modified

**Format:** Agent-determined. Could be organized by directory, by concept, flat list, or whatever suits the project.

---

## Data Model

### Entry format

**Location:** `.kit/logs/{id}.md`

```yaml
---
id: topic-slug-a1b2
anchors:
  - src/path/to/file.js
  - src/another/file.js
---

{Markdown content describing what was learned}
```

**Required fields:**
- `id`: Unique identifier (slug-hash format)
- `anchors`: Array of relative file paths (minimum 1)

### Index format

**Location:** `.kit/logs/INDEX.md`

Agent-determined markdown format. Must enable fast retrieval without reading all entry files.

### Staleness states

Computed dynamically via git timestamps:
- `valid` - all anchors unchanged since entry written
- `stale` - any anchor modified after entry was last updated
- `orphaned` - any anchor file no longer exists

---

## API / Interface

### /log command

**Input:** None (discovery identified from context)

**Output:**
- Entry file at `.kit/logs/{id}.md`
- Updated `.kit/logs/INDEX.md`

### Skill lifecycle operations

All performed by agent directly:
- **Search**: Consult INDEX.md + grep
- **Staleness**: Run git commands for timestamps
- **Verify**: Touch file + git add + git commit
- **Update**: Edit file + git add
- **Cleanup**: Edit/delete file + git add

---

## Init Workflow

`/log init` or first-time setup:
1. Create `.kit/logs/` directory
2. Create empty `.kit/logs/INDEX.md`:
   ```markdown
   # Engineering Log Index

   <!-- Agent will populate based on project structure -->
   ```

---

## What Gets Deleted

```
bin/kit (log routing)
systems/log/
  bin/log
  lib/commands/init.sh
  lib/commands/list.sh
  lib/commands/search.sh
  lib/commands/stale.sh
  lib/config.sh
  lib/utils/frontmatter.sh
  lib/utils/git.sh
  lib/utils/id.sh
  lib/utils/search.sh
  lib/utils/staleness.sh
  templates/
```

---

## Verification

1. **Skill triggers**: Activates when exploring/investigating code
2. **Index enables retrieval**: Agent finds relevant entries via INDEX.md
3. **Search works**: Finds entries via index + grep
4. **Staleness computed**: Git timestamps correctly identify stale entries
5. **/log adds entry**: Creates file and updates INDEX.md
6. **Verify workflow**: Touch + stage + commit marks entry as verified

---

## Future Considerations

- **Cross-references**: Link related log entries
- **Bulk staleness check**: Report all stale entries at session start
- **Archive old entries**: Move very old entries to archive
- **Search by keyword**: Full-text search across all entries
