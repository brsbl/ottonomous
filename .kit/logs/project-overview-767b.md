---
id: project-overview-767b
anchors:
  - README.md
---

# Project Overview

## What This Project Does

AI Developer Kit (`kit`) is a unified CLI toolkit for AI-assisted software development. It provides structured workflows for creating and managing feature specifications, engineering tasks, and a knowledge base.

## Key Technologies

- Language: Bash (shell scripts)
- Format: Markdown with YAML frontmatter, JSON for tasks
- Dependencies: jq (JSON processing), Git (staleness tracking)

## Three Systems

| System | Purpose | Storage |
|--------|---------|---------|
| **Specs** | Define what to build before implementation | `.kit/specs/*.md` |
| **Tasks** | Break specs into prioritized, dependency-aware work items | `.kit/tasks/*.json` |
| **Logs** | Capture code discoveries anchored to source files | `.kit/logs/*.md` |

## Architecture

Three-layer design: `Skill → Command → CLI`

- **Skill** (`.claude/skills/*/SKILL.md`) — Auto-triggers on context
- **Command** (`.claude/commands/*.md`) — Slash command entry points
- **CLI** (`kit <system> <action>`) — Read-only shell operations

**Critical**: The CLI is read-only. All manipulation happens via Claude Code writing files directly.

## Entry Points

- CLI: `bin/kit` (routes to system commands)
- Skills: `.claude/skills/{spec,task,log}/SKILL.md`
- Commands: `.claude/commands/{spec,task,log}.md`
