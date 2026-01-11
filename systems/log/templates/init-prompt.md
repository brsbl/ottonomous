# Engineering Log Structure Setup

You are setting up a Engineering Log (log) for this codebase.

The log captures discovered facts about the code — behaviors, invariants, gotchas, edge cases — anchored to specific source files. When anchored files change, entries are marked stale for re-verification. You will use this log to avoid rediscovering the same things.

## Step 1: Explore the Codebase

Look at the directory structure and README (if present) to understand the project layout and its main domains.

## Step 2: Identify Major Boundaries

Based on the code structure, identify 3-7 major modules, domains, or logical boundaries. These will become top-level folders in your log structure.

## Step 3: Propose a Structure

Suggest folder names that reflect these domains, with a one-line explanation of what each folder contains.

### Example: Proposed Structure for an API Service

```
resources/    # Entities and data models (User, Order, Product)
operations/   # Business logic and workflows (auth flow, payment processing)
schemas/      # Data format specifications and validation rules
invariants/   # System constraints and guarantees
errors/       # Error codes and error handling patterns
```

This is just an example. Your structure should match your codebase's actual domains.

## Step 4: User Approval

Present your proposed structure to the user and ask them to:
- **Approve it** — continue with your proposal
- **Modify it** — ask for specific changes (rename folders, add/remove, etc.)
- **Use the default** — use the standard structure (resources/, operations/, schemas/, invariants/, errors/)

## Step 5: Create the Folders

Once approved, create the top-level log folders:

```bash
mkdir -p .kit/logs/resources
mkdir -p .kit/logs/operations
mkdir -p .kit/logs/schemas
mkdir -p .kit/logs/invariants
mkdir -p .kit/logs/errors
```

(Adjust folder names and count based on the agreed structure.)

## Next Steps

Once the log structure is set up:
- The skill will be installed to `.claude/skills/kb/SKILL.md`
- Future `logsearch <term>` commands will search across all log entries
- Start capturing discoveries about the code using `logadd`
- When anchor files change, use `logverify` or `logedit` to keep entries current
