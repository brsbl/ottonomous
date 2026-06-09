# Ottonomous - Provider-Agnostic Skills for Product Development

## Project Overview

Ottonomous is a **provider-agnostic** plugin for structured product development. The same skills install into **both Claude Code and OpenAI Codex**. It operates in two modes:

1. **Independent Skills** - Use individual skills (`spec`, `task`, `review`, etc.) for specific tasks
2. **Autonomous Workflow** - Use `otto` to run the full development loop automatically

> Invocation differs per provider: Claude Code uses `/spec`, Codex uses `$spec`. Skills are referred to by bare name below.

### Core Skills
- `spec` - Create product specifications
- `task` - Generate implementation tasks from specs
- `next` - Pick up and implement the next pending task
- `test` - Run and verify tests (lint, type check, tests, visual `browser` mode)
- `review` - Code review with prioritized findings
- `summary` - Create a user-facing change summary
- `reset` - Clear workflow artifacts
- `otto` - Autopilot that chains the full loop end-to-end

## Core Philosophy

### Subagents for Context Isolation

Use subagents to isolate concerns and prevent context pollution:

- **Context isolation**: Each subagent gets only what it needs, nothing more. Orchestrator agent delegates to and manages subagent
- **Specialization**: Different expertise per agent (frontend-developer vs backend-architect, senior-code-reviewer vs architect-reviewer, test-writer, etc)

### Skill/Subagent Separation

Skills and subagents have distinct responsibilities:

- **Skills** define *what* to hand off (file list, diff command, scope, context) and are instructions for the Orchestrator agent
- **Subagents** define *how* to process what's handed off (criteria, detection rules, output format)

This keeps subagents self-contained and reusable while skills orchestrate the workflow. Delegation is described in tool-neutral prose so the same source runs on either provider — the runtime decides the model and delegation mechanics.

### Swarm Orchestration

Skills coordinate multiple subagents working in parallel using **background subagents** — spawning concurrent work and waiting on the results:

**Coordination patterns:**
- **Fan-out/Fan-in** — Spawn N agents, wait for all, synthesize results. Used by `review`.
- **Batches** — Complete batch N before starting N+1 (for dependent work). Used by `review fix`.
- **Pipeline** — Sequential handoff between specialists. Used by `otto`.

**Scaling:** 1-4 items = 1 agent, 5-10 = 2-3 agents, 11+ = 3-5 agents. Group by directory or component type.

### Iterative Review for Verification

Every phase has explicit verification:

- **Planning**: spec → spec review → user approval
- **Implementation**: code → code review → fix → commit
- **Verification criteria**: Each step defines "Done when..."
- **Prioritized findings**: P0-P2 across all skills (P0 = critical, P1 = important, P2 = minor)

## Provider-agnostic structure & build

`skills/` is the **neutral single source of truth**. Each `SKILL.md` carries only `name` / `description` / `argument-hint` frontmatter (no `model:`, no `allowed-tools:`), and agent personas carry only `name` / `description` (no `model`, no `color`). Subagent delegation is written in tool-neutral prose. The agent/runtime decides the model and delegation mechanics at run time.

- **Claude Code** reads `skills/` directly via `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`, ignoring the generated `openai.yaml` files.
- **Codex** reads the generated package at `plugins/ottonomous/` via `.codex-plugin/plugin.json` (root compat manifest) and `.agents/plugins/marketplace.json` (which points to `./plugins/ottonomous`).

**Build:** `npm run build` (`scripts/build-codex-plugin.mjs`) regenerates the Codex package under `plugins/ottonomous/` from `skills/` — copying the skills and emitting a per-skill `agents/openai.yaml` Codex interface file.

**Never hand-edit `plugins/ottonomous/`** — it is generated. Edit `skills/`, then rebuild. This one-source-regenerate-the-mirror flow is the anti-drift mechanism, mirroring the moss-skills approach.

## Claude Code Plugin Development

Essential documentation for plugin development:

- **Skills**: https://code.claude.com/docs/en/skills
- **Subagents**: https://code.claude.com/docs/en/sub-agents
- **Plugins**: https://code.claude.com/docs/en/plugins
- **Plugin Reference**: https://code.claude.com/docs/en/plugins-reference
- **Hooks**: https://code.claude.com/docs/en/hooks
- **Memory**: https://code.claude.com/docs/en/memory

## Skill Structure Conventions

### SKILL.md Frontmatter

```yaml
---
name: skill-name           # lowercase with hyphens
description: ...           # when to use, what it does
argument-hint: [arg]       # autocomplete hint
---
```

Keep frontmatter neutral: no `model:` and no `allowed-tools:`. The runtime selects the model.

### Skill Content Pattern

1. **Argument capture**: `**Argument:** $ARGUMENTS`
2. **Command table**: if skill has multiple modes (list vs create)
3. **Workflow sections**: numbered steps with clear conditions
4. **Verification**: how to check each step succeeded
5. **Next steps**: what skill to run next

### Variable Substitutions

- `$ARGUMENTS` - all arguments passed
- `$0`, `$1` - positional arguments
- `${CLAUDE_SESSION_ID}` - current session ID

## Subagent Conventions

### Location

`skills/{skill-name}/agents/{agent-name}.md`

### Frontmatter

```yaml
---
name: agent-name
description: When to use this agent (include "PROACTIVELY" for auto-use)
---
```

Keep persona frontmatter neutral: no `model` and no `color`. Describe delegation in tool-neutral prose so the source works on both providers.

### Content Pattern

1. Role description paragraph
2. Core Responsibilities (numbered list)
3. Focus Areas (bullets)
4. Process/Approach (numbered steps)
5. Output Format specification

### When to Use Subagents

- **Context isolation**: Prevent one task's details from polluting another
- **Parallelization**: Multiple independent reviews/implementations
- **Specialization**: Different expertise (frontend vs backend, architect vs implementer)

## Project Structure

```
skills/                    # Neutral source of truth (edit here)
├── {skill}/
│   ├── SKILL.md          # Main skill file (required)
│   ├── agents/           # Subagent personas (optional)
│   │   └── *.md
│   ├── scripts/          # Support scripts (optional)
│   └── lib/              # Libraries (optional)
plugins/ottonomous/        # GENERATED Codex package (do not hand-edit)
scripts/                   # build-codex-plugin.mjs (npm run build)
.claude-plugin/            # Claude Code manifests (plugin.json, marketplace.json)
.codex-plugin/             # Codex root compat manifest
.agents/plugins/           # Codex marketplace.json → ./plugins/ottonomous
.otto/                     # Workflow artifacts (git-ignored)
├── specs/                 # Product specifications
├── tasks/                 # Sessions and tasks
├── reviews/               # Review fix plans
├── summaries/             # Generated HTML summaries
└── otto/
    └── sessions/          # Otto session state
```

## Development Commands

```bash
npm run build      # Regenerate Codex package (plugins/ottonomous/) from skills/
npm test           # Run tests
npm run lint       # Check linting
npm run lint:fix   # Fix linting issues
```
