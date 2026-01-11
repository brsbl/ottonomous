---
name: engineering-log
description: Code-anchored engineering log. Use when planning implementation, investigating code behavior, exploring the codebase, debugging issues, or answering questions about how code works. ALWAYS search this log before reading source files.
allowed-tools: Read, Bash, Glob, Grep
---

# Engineering Log

Institutional memory for the codebase. Contains discoveries from previous sessions anchored to source files.

## Prime Directive

**Search the log before investigating code.**

Every planning, investigation, or exploration task must start with:

```bash
kit log search "<topic>"
kit log search "<related term>"
kit log search "<filename>"
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

After learning something useful about the codebase:

```bash
kit log create --name "<topic>" \
  --anchors <file1> [file2...] \
  --prompt "<what you learned>"
```

**Examples:**
```bash
# Single anchor
kit log create --name "Auth Flow" --anchors src/auth.js --prompt "JWT tokens validated via middleware"

# Multiple anchors
kit log create --name "Session Management" --anchors src/session.js src/cookies.js --prompt "Sessions use httpOnly cookies"

# With category and custom fields
kit log create --name "Token Refresh" --category auth --anchors src/refresh.js --prompt "Tokens rotate on use" --field type=discovery
```

Anchor to files that IMPLEMENT the behavior, not callers or tests.

## Maintain Accuracy

```bash
kit log verify <file>    # Mark stale entry as still-accurate
kit log edit <file> --content "..."  # Update outdated knowledge
kit log stale            # List entries needing attention
```

## Entry Format

```markdown
---
id: auth-flow-a1b2
anchors:
  - src/auth/session.js
  - src/middleware/auth.js
type: discovery
---

Sessions use JWT stored in httpOnly cookies.
Refresh tokens rotate on each use to prevent replay.
```

## Categories

Organize by domain:
- `auth/` — authentication, sessions, tokens
- `api/` — routes, middleware, request handling
- `data/` — models, database, queries
- `infra/` — config, deployment, external services
- `patterns/` — conventions, recurring approaches

## CLI Reference

```bash
kit log search <term>     # Search entries (do this FIRST)
kit log create --name "<name>" --anchors <paths...> --prompt "<content>"
kit log create ... --category <cat> --field key=value
kit log edit <file> --content "..."
kit log verify <file>
kit log list [--status <valid|stale|orphaned>]
kit log stale
kit log remove <file>
```
