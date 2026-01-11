---
id: log-system-0w69
name: Log System
status: approved
created: 2026-01-11
updated: 2026-01-11
---

# Log System

## Overview

The Log System provides agent-first knowledge capture anchored to source files. It enables AI agents to record discoveries made during code investigation and preserves institutional memory across sessions. Each log entry is linked to one or more source files (anchors), allowing the system to detect when knowledge may be outdated based on file changes.

## Goals

- Enable agents to capture discoveries during code exploration and investigation
- Anchor knowledge to specific source files for context and staleness tracking
- Detect stale entries when anchored files change after entry creation
- Provide searchable institutional memory to prevent redundant investigation
- Support a "search first" workflow where agents check existing knowledge before reading code

## Non-Goals

- Real-time synchronization of knowledge across multiple agents
- Automatic knowledge extraction without agent involvement (Phase 3 future work)
- Version control of individual entries (relies on git)
- Complex categorization taxonomies (simple directory-based organization only)
- CLI-based entry creation (creation flows through `/log` agent command)

## User Stories

From the agent's perspective:

- As an agent, I want to search the log before investigating code so that I can leverage previous discoveries
- As an agent, I want to capture what I learned during investigation so that future sessions benefit from my work
- As an agent, I want to anchor entries to relevant source files so that staleness can be detected automatically
- As an agent, I want to see which entries are stale so that I can verify or update outdated knowledge
- As an agent, I want to be prompted when reading a file that anchors a stale entry so that I can address it

## Detailed Design

### Staleness Detection Algorithm

The system determines entry freshness by comparing git commit timestamps (or file modification times for untracked files):

```
entry_timestamp = last commit time of .kit/logs/<entry>.md
anchor_timestamp = last commit time of anchored source file

if anchor does not exist:
    state = "orphaned"
elif any anchor_timestamp > entry_timestamp:
    state = "stale"
else:
    state = "valid"
```

**Implementation notes:**
- Uses `git log -1 --format="%ct"` to get Unix epoch timestamp of last commit
- Falls back to `stat` for untracked files (macOS: `stat -f %m`, Linux: `stat -c %Y`)
- A single stale anchor makes the entire entry stale
- A single missing anchor makes the entire entry orphaned (even if other anchors exist)

### Entry States

| State | Condition | Agent Action |
|-------|-----------|--------------|
| `valid` | All anchors exist and unchanged since entry creation | Use knowledge directly |
| `stale` | At least one anchor modified after entry was last updated | Verify accuracy before trusting |
| `orphaned` | At least one anchor file no longer exists | Flag for cleanup or update anchors |

### Anchor Management

**Requirements:**
- Minimum 1 anchor per entry (enforced at creation)
- Anchors should reference files that IMPLEMENT the documented behavior
- Avoid anchoring to test files or callers unless specifically documenting those

**Anchor operations:**
- Add anchor: Appends to `anchors` array in frontmatter
- Remove anchor: Removes from array (blocked if would leave 0 anchors)
- Validation: Warns if anchor file does not exist at creation time

### Data Format

Log entries are stored as markdown files in `.kit/logs/` with YAML frontmatter:

```yaml
---
id: <name-slug>-<4-char-id>
anchors:
  - path/to/source/file.js
  - path/to/related/file.js
---

<markdown body with discovered knowledge>
```

**Field descriptions:**
- `id`: Unique identifier combining slugified name and random suffix (e.g., `auth-flow-a1b2`)
- `anchors`: Array of relative paths to source files (minimum 1 required)

**File naming:** `<id>.md` stored in `.kit/logs/` directory

**Optional organization:** Entries can be placed in subdirectories for categorization:
- `.kit/logs/auth/` - authentication-related discoveries
- `.kit/logs/api/` - API and routing knowledge
- `.kit/logs/data/` - data model and database insights

## Commands

### CLI Commands (Read-Only)

| Command | Description | Output |
|---------|-------------|--------|
| `kit log list` | List all log entries with status | Table: path, status, anchors |
| `kit log search <term>` | Search across all entries | Matching entries |
| `kit status` | Overview of all specs, tasks, and logs | Project summary |
| `kit init` | Set up `.kit/` directories | Directory creation |

The CLI is strictly read-only for logs. It provides fast, scriptable access to view and search log entries.

**Staleness computed on read:** Entry staleness (valid/stale/orphaned) is calculated dynamically when `kit log list` is called or when the agent reads an entry. This eliminates the need for a separate `kit log stale` command - staleness information is always current and included in list output.

### Agent Command (`/log`)

| Action | Description |
|--------|-------------|
| Create | Capture discovery with anchors |
| Verify | Mark stale entry as verified/current |
| Update | Modify entry content or anchors |

The `/log` slash command handles all write operations through the agent interface. Staleness is computed automatically when reading entries, prompting the agent to verify or update outdated knowledge.

Creation prompts the agent to provide:
- Entry name (becomes slug in ID)
- One or more anchor file paths
- Knowledge content (markdown body)

**Rationale for agent-only write operations:** Entries should capture agent discoveries in context. CLI creation would bypass the investigation context that makes entries valuable. Status updates (verify/update) require agent judgment about whether knowledge is still accurate.

## File Structure

```
.kit/
  logs/
    config.yaml              # System configuration
    <entry-id>.md           # Log entries
    auth/                   # Optional category subdirectory
      <entry-id>.md
    api/
      <entry-id>.md
```

## Future Phases

### Phase 2: Staleness Prompt on Anchor Read

When an agent reads a source file that is an anchor for a stale entry:

1. System detects the file is referenced in stale entry
2. Agent is prompted: "This file anchors a stale log entry: `<entry-id>`. Would you like to review and update it?"
3. Agent can: verify (mark current), update content, or dismiss

**Implementation approach:**
- Post-tool-use hook on `Read` tool
- Query log entries for matching anchors
- Check staleness state before prompting

### Phase 3: Auto-Capture Hook

Automatic discovery capture after Explore agent sessions:

1. Explore agent completes investigation
2. Hook analyzes files read and changes understood
3. System proposes log entry with suggested anchors
4. Agent confirms or modifies before saving

**Implementation approach:**
- Hook into Explore agent completion
- Analyze tool use history for patterns
- Generate entry draft from conversation context

## References

- Existing implementation: `systems/log/` directory
- Staleness utilities: `systems/log/lib/utils/staleness.sh`
- Frontmatter parsing: `systems/log/lib/utils/frontmatter.sh`
