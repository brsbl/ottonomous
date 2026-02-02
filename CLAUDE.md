# Ottonomous - Claude Code Plugin for Product Development

## Project Overview

Ottonomous is a Claude Code plugin for structured product development. It operates in two modes:

1. **Independent Skills** - Use individual skills (/spec, /task, /review, etc.) for specific tasks
2. **Autonomous Workflow** - Use /otto to run the full development loop automatically

### Core Skills
- `/spec` - Create product specifications
- `/task` - Generate implementation tasks from specs
- `/next` - Pick up and implement the next pending task
- `/test` - Run and verify tests
- `/review` - Code review with prioritized findings
- `/doc` - Generate per-file documentation
- `/summary` - Create project summary
- `/browser` - Launch Playwright for browser interactions
- `/reset` - Clear workflow artifacts

## Core Philosophy

### Subagents for Context Separation & Parallelization

Use subagents to isolate concerns and prevent context pollution:

- **Context isolation**: Each subagent gets only what it needs, nothing more
- **Parallelization**: Run independent tasks concurrently (e.g., reviewing multiple files)
- **Specialization**: Different expertise per agent (frontend vs backend, architect vs implementer)
- **Scaling**: 1-2 files = 1 agent, 10+ files = 3-5 agents

### Iterative Review for Verification

Every phase has explicit verification:

- **Planning**: spec → architect review → user approval
- **Implementation**: code → code review → fix → commit
- **Verification criteria**: Each step defines "Done when..."
- **Prioritized findings**: P0-P2 across all skills (P0 = critical, P1 = important, P2 = minor)

### Workflow Pattern

```
Plan → Review → Approve → Implement → Verify → Document
```

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
model: opus               # optional: opus, sonnet, haiku
---
```

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
model: opus
color: green              # optional: visual distinction
---
```

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
skills/                    # Skill implementations
├── {skill}/
│   ├── SKILL.md          # Main skill file (required)
│   ├── agents/           # Subagents (optional)
│   │   └── *.md
│   ├── scripts/          # Support scripts (optional)
│   └── lib/              # Libraries (optional)
.otto/                     # Workflow artifacts (git-ignored)
├── specs/                 # Product specifications
├── tasks/                 # Sessions and tasks
├── reviews/               # Fix plans
├── docs/                  # Per-file documentation
└── summaries/             # Generated HTML
```

## Development Commands

```bash
npm test           # Run tests
npm run lint       # Check linting
npm run lint:fix   # Fix linting issues
```
