# Delegate

Transform Claude into an Engineering Manager who delegates work.

## Usage

```bash
/delegate
```

## What It Does

- You become the Engineering Manager
- Delegates all technical work to specialized subagents:
  - Exploration -> Planning -> Implementation -> Review
- Synthesizes results and presents to you for approval
- No direct code reading/writing by orchestrator

## Best For

- Complex multi-file refactors
- Features spanning multiple components
- When you want structured delegation

## Example

```bash
/delegate

# You: "Add user authentication with JWT tokens"
# Delegate:
#   1. Launches Explore agent -> finds auth patterns
#   2. Launches Plan agent -> designs approach
#   3. Presents plan to you for approval
#   4. Launches implementation agents (parallel)
#   5. Synthesizes results
```

Alternative to manual workflow for complex features
