---
description: Capture and search code-anchored engineering log entries
---

# /log

You are a log curator. Your job is to search existing log entries before investigation, and capture new discoveries anchored to specific code.

---

## Phase 1: Search Before Investigating

Before diving into code investigation, ALWAYS search first:

```bash
kit log search "<topic>"
```

**If results found:**
- Check staleness: valid, stale, or orphaned
- If valid: Use the log entries, skip re-investigation
- If stale: Verify with user before trusting

**If no results:** Proceed with investigation, then capture learnings.

---

## Phase 2: Capture Discoveries

After learning something about the codebase, capture it:

**Step 1: Identify Anchors**

Determine which source files implement the behavior you discovered. These become anchors.

**Step 2: Create Entry**

```bash
kit log add .kit/logs/<category>/<topic>.md \
  --anchor <file1> \
  --anchor <file2> \
  --content "<what you learned>"
```

**Guidelines:**
- One discovery per entry (keep focused)
- Always anchor to implementation files
- Use descriptive paths (e.g., `.kit/logs/auth/session-handling.md`)
- Capture the "why" not just the "what"

---

## Phase 3: Maintain Knowledge

### Verify Stale Entries

When log entries is stale but still accurate:
```bash
kit log verify <file>
```

### Update Outdated Knowledge

When anchor code changed and log entries is wrong:
```bash
kit log edit <file> --content "<updated log entries>"
```

### Cleanup Routine

Periodically check for entries needing attention:
```bash
kit log stale
```

---

## Knowledge Categories

Organize entries by topic:

```
.kit/logs/
├── auth/
│   ├── session-handling.md
│   └── jwt-tokens.md
├── api/
│   ├── rate-limiting.md
│   └── error-codes.md
├── data/
│   ├── user-model.md
│   └── migrations.md
└── patterns/
    ├── error-handling.md
    └── logging.md
```

---

## Entry Format

```markdown
---
anchors:
  - src/auth/session.rb
  - src/middleware/auth.rb
---

Sessions are stored in Redis with a 24-hour TTL.
The session middleware checks for valid JWT in the Authorization header.
Refresh tokens are rotated on each use to prevent replay attacks.
```

---

## Staleness States

| State | Meaning | Action |
|-------|---------|--------|
| valid | Entry is current | Use as-is |
| stale | Anchor changed after entry | Verify or update |
| orphaned | Anchor file deleted | Re-anchor or remove |

---

## Best Practices

1. **Search before investigating** - Don't duplicate work
2. **Anchor to implementation** - Not to callers or tests
3. **Keep entries focused** - One concept per file
4. **Capture the "why"** - Not just what the code does
5. **Verify stale entries** - Don't let log entries rot
