---
id: log-index-structure-e9jm
name: Log Index Structure
status: approved
created: 2026-01-12
updated: 2026-01-12
---

# Log Index Structure

## Overview

The log index (`INDEX.md`) enables fast retrieval of engineering log entries without reading all files. It serves as a table of contents that helps agents quickly identify relevant entries when exploring code.

**Problem:** Without an index, agents must glob and grep through all log entries to find relevant knowledge - slow and token-expensive.

**Solution:** A maintained index file that provides enough context to decide entry relevance at a glance.

## Goals

- **Fast retrieval**: Agent can identify relevant entries by reading index alone
- **Agent-determined format**: Structure adapts to project's needs
- **Auto-update**: Updated by `/log` command when entries are added

## Non-Goals

- Prescriptive schema (agent decides organization)
- Duplicate anchor information (anchors live in entry frontmatter)
- Full entry content (index is summary only)

---

## Architecture

```
Agent exploring code
     │
     ▼
┌─────────────────────────────────────┐
│  .kit/logs/INDEX.md                 │
│  - Fast scan for relevant entries   │
│  - Agent-determined organization    │
│  - Enough context to decide relevance│
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  .kit/logs/{entry}.md               │
│  - Full entry content               │
│  - YAML frontmatter with anchors    │
└─────────────────────────────────────┘
```

---

## Detailed Design

### Requirements

The index MUST enable **fast retrieval**:
- Agent can decide if an entry is relevant without reading the full entry
- Sufficient context per entry (title, brief description)
- Organization that supports scanning (not a wall of text)

### Format

**Agent-determined** based on project structure. Could be:
- Grouped by anchor directory (src/auth/, src/api/)
- Grouped by topic/domain
- Flat list with descriptions
- Nested hierarchy

The agent chooses and evolves the format as the knowledge base grows.

### Initial Template

When first created, INDEX.md contains:

```markdown
# Engineering Log Index

<!-- Agent will populate based on project structure -->
```

### Update Workflow

The `/log` command MUST update INDEX.md after creating new entries:
1. Read current INDEX.md
2. Add new entry in appropriate location (agent determines placement)
3. Write updated INDEX.md
4. Stage both entry file and INDEX.md

---

## Data Model

**Location:** `.kit/logs/INDEX.md`

**Content:** Markdown with agent-determined structure

**Entry format in index:** At minimum, entry ID and enough context to assess relevance

---

## API / Interface

### Read (by log skill)

```
1. Consult .kit/logs/INDEX.md to find potentially relevant entries
2. Read matching entry files
```

### Write (by /log command)

```
1. Generate new entry file
2. Update INDEX.md to include entry
3. Stage both files: git add .kit/logs/{id}.md .kit/logs/INDEX.md
```

---

## Future Considerations

- Bulk index regeneration command
- Index validation (entries exist, no orphans)
- Search within index

---

## Sources

- [beads](https://github.com/steveyegge/beads) - Git-backed issue tracker reference
- [Categorizing Markdown Files for a Scalable Knowledge Base](https://dev.to/hexshift/categorizing-markdown-files-for-a-scalable-knowledge-base-2g4m)
