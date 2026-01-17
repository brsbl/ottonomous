<img width="3072" height="1428" alt="image" src="https://github.com/user-attachments/assets/5df66efc-5ca3-4624-b0d2-741f0308d89a" />

# Ottonomous

A Claude Code plugin for autonomous product development.

## Installation

```bash
/install brsbl/ottonomous
```

## Quick Start

**Autonomous** — one command, full automation:
```bash
/otto Build a CLI todo app with local JSON storage
```

**Manual** — step-by-step control:
```bash
/spec              # Write specification
/task my-spec      # Break into tasks
/next              # Execute next task
/review            # Review for bugs
```

## Commands

| Command | Description |
|---------|-------------|
| `/otto` | Autonomous product development from idea to code |
| `/spec` | Interactive specification writing |
| `/task` | Break specs into prioritized tasks |
| `/next` | Execute highest priority unblocked task |
| `/test` | Run tests + visual verification |
| `/review` | Find bugs (P0-P3 priority) |
| `/summary` | Generate change documentation |
| `/delegate` | Delegate work to specialized subagents |
| `/doc` | Document discoveries anchored to files |
| `/dev-browser` | Browser automation with Playwright |
| `/clean` | Clean workflow artifacts |

## Configuration

`.otto/config.yaml`:

```yaml
auto_verify: true    # Auto-verify stale doc entries
auto_pick: true      # Skip confirmation prompts

otto:
  mode: autonomous   # autonomous | supervised
  max_tasks: 50      # Safety limit
  checkpoint_interval: 5
```

## Data

All artifacts stored in `.otto/`:
- `specs/` — Specifications
- `tasks/` — Task files
- `docs/` — Engineering knowledge
- `otto/sessions/` — Session state and reports

## License

MIT
