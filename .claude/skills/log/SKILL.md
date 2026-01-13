---
name: engineering-log
description: Searches and retrieves engineering knowledge anchored to source files. Activates when exploring code, investigating bugs, planning implementation, or answering questions about code functionality.
---

# Engineering Log

Institutional memory for the codebase. Search before investigating.

## INDEX.md Structure

`.kit/logs/INDEX.md` organizes entries by anchor location for fast file-based lookup:

```markdown
### `path/to/directory/` (Section Name)

- **entry-id-x1y2** - Brief summary with searchable keywords
- **another-entry-z3w4** - Another discovery summary
```

Each entry line contains:
- **ID** (bolded): Unique entry identifier matching `.kit/logs/{id}.md`
- **Summary**: One-line description written for search discoverability
- **Keywords**: Terms someone would search for when looking for this topic

## Finding Relevant Logs

**Strategy 1: File-based lookup** (when exploring specific files)

Search INDEX.md for the file path to find entries anchored to that file:

```bash
grep -n "systems/log/" .kit/logs/INDEX.md
```

This shows all entries organized under that path, with their IDs and summaries.

**Strategy 2: Topic-based search** (when investigating a concept)

Search INDEX.md for keywords in summaries:

```bash
grep -i "timestamp" .kit/logs/INDEX.md
```

For deeper content search, grep all log entries:

```bash
grep -ri "staleness detection" .kit/logs/
```

**Strategy 3: Read matching entries**

Once you find relevant entry IDs, read the full content:

```bash
cat .kit/logs/git-timestamp-utilities-k3m9.md
```

## Check Staleness

Before trusting an entry, verify its anchors haven't changed since it was written:

```bash
# Get entry timestamp (last commit to the entry file, fallback to mtime for uncommitted)
entry_time=$(git log -1 --format="%ct" -- .kit/logs/{entry-id}.md 2>/dev/null)
if [ -z "$entry_time" ]; then
  # Fallback to file modification time for uncommitted files
  entry_time=$(stat -c %Y .kit/logs/{entry-id}.md 2>/dev/null || stat -f %m .kit/logs/{entry-id}.md)
fi

# Check each anchor file from frontmatter (same fallback logic)
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

## Verify Stale Entry

If entry content is still accurate after reviewing anchor changes:

1. Touch the entry file to update its git timestamp:
   ```bash
   touch .kit/logs/{entry-id}.md
   git add .kit/logs/{entry-id}.md
   git commit -m "verify: {entry-id}"
   ```

2. Inform the user: "Verified {entry-id} is still accurate. Entry timestamp updated."

Note: Verification requires a commit because staleness detection uses git timestamps, not file system timestamps.

## Update Existing Entry

When entry content needs changes or anchors have been updated:

1. **Edit the entry file directly**:
   - Update content in `.kit/logs/{entry-id}.md`
   - Update `anchors` in frontmatter if anchor files changed

2. **Update INDEX.md if needed**:
   - If summary needs updating: edit the entry line in INDEX.md to improve searchability
   - If anchors changed: move entry to new section header matching new anchor location
   - If entry should be removed: delete entry line from INDEX.md

3. **Stage changes**:
   ```bash
   git add .kit/logs/{entry-id}.md .kit/logs/INDEX.md
   ```

4. **Inform the user**: "Updated {entry-id}. Files staged."

Do not commit. Let the user decide when to commit.

## Remove Orphaned Anchors

When an anchor file has been deleted:

1. Edit entry frontmatter to remove the deleted anchor path
2. If no valid anchors remain:
   - Delete `.kit/logs/{entry-id}.md`
   - Remove entry line from INDEX.md
3. If some anchors still valid:
   - Keep entry with remaining anchors
   - Move in INDEX.md if primary anchor changed
4. Stage changes

## Capture New Discovery

When you learn something worth documenting during your work, suggest to the user:

"This discovery could be logged. Use `/log` to capture it."

The `/log` command will create a new entry and update INDEX.md. See `.claude/commands/log.md` for the full workflow.

## Auto-Finding Logs

When you start exploring a file or investigating a topic:

1. **Check for file-based entries first**: `grep "{filename}" .kit/logs/INDEX.md`
2. **If found**: Read those entries before investigating the code
3. **Check staleness**: Verify entries are fresh
4. **Use the knowledge**: Apply what previous work discovered
5. **Update if needed**: If you find the entry is outdated, update it directly

This workflow helps you work efficiently by leveraging institutional memory rather than re-discovering existing knowledge.
