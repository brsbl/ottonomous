---
name: engineering-log
description: Code-anchored engineering log. Use when planning implementation, investigating code behavior, exploring the codebase, debugging issues, or answering questions about how code works. ALWAYS search this log before reading source files.
---

# Engineering Log

Institutional memory for the codebase. Contains discoveries from previous sessions anchored to source files.

## Prime Directive

**Search the log before investigating code.**

Every planning, investigation, or exploration task must start with:

```bash
kit log search "<topic>"
kit log search "<related term>"
```

This prevents re-discovering what previous sessions already learned.

## Interpret Search Results

| Status | Action |
|--------|--------|
| `valid` | Use directly — knowledge is current |
| `stale` | Anchor files changed — verify before trusting |
| `orphaned` | Anchor files deleted — flag for cleanup |
| No results | Proceed with investigation, then capture findings |

## Capture Discoveries

After learning something useful about the codebase, run the `/log` command to capture it.

The `/log` command will:
1. Help identify appropriate anchor files
2. Generate a unique ID
3. Write the entry to `.kit/logs/`

## Staleness

Check for stale entries:

```bash
kit log stale
```

When you read a file that's an anchor for a stale entry, verify if the knowledge is still accurate and update if needed.

## CLI Reference (read-only operations)

```bash
kit log search <term>     # Search entries (do this FIRST)
kit log list              # List all entries
kit log stale             # Find stale/orphaned entries
```
