---
id: codebase-structure-18a6
anchors:
  - .
---

# Codebase Structure

## Directory Organization

| Directory | Purpose |
|-----------|---------|
| `.kit/` | Data storage for all three systems |
| `.kit/specs/` | Specification markdown files |
| `.kit/tasks/` | Task JSON files (one per spec) |
| `.kit/logs/` | Engineering log entries with INDEX.md |
| `.claude/` | Claude Code integration files |
| `.claude/skills/` | Auto-triggering skill definitions |
| `.claude/commands/` | Slash command workflows |
| `.claude/agents/` | Custom agent configurations |
| `docs/` | Additional documentation |

## Architecture Layers

1. **Skills** — Background context that auto-triggers based on conversation
2. **Commands** — Explicit user-invoked workflows via `/command`
3. **CLI** — Read-only shell commands for querying data

## Key Files

- `README.md` — Project overview and usage documentation
- `.kit/config.yaml` — Shared configuration
- `.claude/skills/spec/SKILL.md` — Spec system skill
- `.claude/skills/task/SKILL.md` — Task system skill
- `.claude/skills/log/SKILL.md` — Log system skill (engineering-log)
- `.claude/commands/spec.md` — `/spec` command workflow
- `.claude/commands/task.md` — `/task` command workflow
- `.claude/commands/log.md` — `/log` command workflow
