---
id: spec-system-refactor-kafk
name: Spec System Refactor
status: implemented
created: 2026-01-12
updated: 2026-01-12
---

# Spec System Refactor

Target state for the spec system after removing the CLI layer.

## Overview

The spec system helps teams define features before implementation through collaborative AI-human interview. Specs combine product requirements (PRD) with technical design (eng spec) in a single document.

This spec defines the **target state** after eliminating the CLI - a pure skills + commands architecture where agents use native file operations.

## Goals

- Ultra-thin skill that links to `/spec` command file
- `/spec` command uses native file operations (Glob, Read, Write) instead of CLI
- Improved interview: ask for reference projects, present structured options with recommendations
- Specs capture both PRD and technical design
- No CLI infrastructure (no `kit` command, no shell scripts in bin/ or lib/)
- Inline bash one-liners for system operations are allowed (ID generation, git staging)

## Non-Goals

- Migration path from current state (separate task)
- Backward compatibility with CLI commands
- Changes to data format (`.kit/specs/*.md` unchanged)

---

## Architecture

### Component Relationships

```
User Context
     │
     ▼
┌─────────────────────────────────────┐
│  Skill: .claude/skills/spec/SKILL.md │
│  (Discovery + Route)                  │
│  - Triggers on planning context       │
│  - Links to command file              │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Command: .claude/commands/spec.md   │
│  (Full Workflow)                      │
│  - Research (glob, read, web search)  │
│  - Interview (structured options)     │
│  - Draft (PRD + tech spec)           │
│  - Save (write file, git stage)      │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Data: .kit/specs/*.md               │
│  - YAML frontmatter (id, status)     │
│  - Markdown body (spec content)      │
└─────────────────────────────────────┘
```

### Data Flow

1. **Trigger**: User mentions new feature/project or runs `/spec`
2. **Skill**: Detects context, routes to command
3. **Command**: Executes 7-step workflow using native agent tools
4. **Output**: Spec file written to `.kit/specs/{id}.md`

---

## Detailed Design

### Skill: `.claude/skills/spec/SKILL.md`

```markdown
---
name: spec-writing
description: Writes feature specifications through collaborative interview. Activates when user mentions new features, projects, planning implementation, or needs a spec/PRD.
---

# Spec Writing

## Quick start

**Before writing a spec**, check for existing related specs:

```bash
ls .kit/specs/*.md
```

See [spec command](.claude/commands/spec.md) for the full workflow.
```

**Design decisions:**
- Links to command file instead of "Run /spec" instruction
- No custom confirmation (Claude Code handles this)
- Skill's only job: trigger detection and routing

**Triggers on:**
- "new feature", "new project"
- "planning implementation"
- "write a spec", "need a PRD"
- "starting something new"

### Command: `.claude/commands/spec.md`

```markdown
# Spec Command

Create specifications through collaborative AI-human interview.

## Workflow

### 1. Gather Context

**Reference projects:**
Use `AskUserQuestion` to ask:
> "Are there any reference projects or examples I should look at for inspiration?"

If provided:
- Explore the reference project(s) to understand their approach
- Note patterns and design decisions to reference during interview

**Existing specs:**
- Glob `.kit/specs/*.md` to find related specs
- Read relevant specs to understand context

**Codebase analysis:**
- Use Glob to find relevant files and Read to understand current architecture
- Use Grep to search for related patterns and implementations

### 2. Research Best Practices

Use `WebSearch` to find:
- Industry best practices for the feature type
- Common pitfalls and recommendations
- How popular projects solve similar problems

### 3. Interview

Use `AskUserQuestion` to gather requirements. For each decision point:

**Format each question with options:**
- Present 2-3 options (use `options` parameter)
- Mark one as "(Recommended)" based on research
- Include description with:
  - Pros/cons of each option
  - What reference project(s) do (if applicable)
  - What best practices suggest

**Example:**
```
Question: "How should authentication be handled?"
Options:
- "JWT tokens (Recommended)" - "Stateless, scalable. Reference project uses this. Industry standard for APIs."
- "Session cookies" - "Simpler setup, but requires session storage. Better for traditional web apps."
- "OAuth only" - "Delegate to providers. Less code but depends on external services."
```

**Topics to cover:**
- Core requirements and constraints
- Key architectural decisions
- Scope boundaries
- Edge cases

Stop when sufficient context (typically 3-5 questions).

### 4. Draft

Write a spec covering:

**Product Requirements:**
- **Overview** - What and why, problem being solved
- **Goals / Non-Goals** - Explicit scope boundaries
- **User Stories** - User-facing behavior (if applicable)

**Technical Design:**
- **Architecture** - System design, component relationships, data flow
- **Detailed Design** - Implementation approach, key algorithms, data structures
- **API / Interface** - Public interfaces, commands, contracts
- **Data Model** - Schema, storage, state management

**Planning:**
- **Future Considerations** - Deferred features, extensibility points
- **Open Questions** - Unresolved decisions marked as `[TBD: reason]`

Reference the research and decisions made during interview.

### 5. Approval

Present draft to user. Use `AskUserQuestion` to:
- Confirm approval, or
- Collect specific change requests

Revise until approved.

### 6. Save

Generate unique ID:
```bash
slug=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-30)
hash=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 4)
id="${slug}-${hash}"
```

Write to `.kit/specs/{id}.md`:
```yaml
---
id: {id}
name: {Name}
status: approved
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---

{spec content}
```

Stage: `git add .kit/specs/{id}.md`

Confirm to user: "Saved spec to .kit/specs/{id}.md"

### 7. Next Steps

Offer task generation:
> "Would you like me to generate implementation tasks from this spec?"

If yes, see [task command](.claude/commands/task.md).
```

### Data Model

**Location:** `.kit/specs/*.md`

**Frontmatter schema:**
```yaml
---
id: feature-name-a1b2        # Unique identifier (slug-hash)
name: Feature Name           # Human-readable name
status: approved             # draft | approved | implemented
created: YYYY-MM-DD          # Creation date
updated: YYYY-MM-DD          # Last update date
---
```

**ID format:** `{slug}-{4-char-hash}`
- Slug: kebab-case name, max 30 chars
- Hash: 4 random alphanumeric characters
- Example: `user-authentication-a7x3`

### Status Update Workflow

Agents update spec status via direct frontmatter editing:

**Status transitions:**
- `draft` → `approved` - After user approves the spec
- `approved` → `implemented` - After all tasks complete

**To update status:**
1. Read spec file at `.kit/specs/{id}.md`
2. Edit frontmatter `status` field
3. Update `updated` date to current date
4. Stage: `git add .kit/specs/{id}.md`

---

## Error Handling

| Error | Detection | Response |
|-------|-----------|----------|
| Directory not found | `.kit/specs/` doesn't exist | Create directory: `mkdir -p .kit/specs` |
| Duplicate ID | Generated ID already exists | Regenerate with new hash |
| Malformed frontmatter | YAML parse fails | Report error, offer to fix |
| Spec not found | Referenced file doesn't exist | List available specs |

---

## What Gets Deleted

```
bin/kit                           # Main CLI router
systems/spec/                     # Entire spec CLI subsystem
  bin/spec
  lib/commands/init.sh
  lib/commands/list.sh
  lib/config.sh
  lib/utils/core.sh
  lib/utils/frontmatter.sh
  lib/utils/git.sh
  lib/utils/id.sh
  lib/utils/spec.sh
  lib/utils/specs.sh
  lib/utils/validate.sh
  templates/
```

---

## Verification

1. **Workflow test**: Run `/spec`, complete full workflow without any `kit` commands
2. **File creation**: Spec file created in `.kit/specs/` with correct frontmatter
3. **Skill trigger**: Verify skill activates on "I want to build a new feature"
4. **Interview quality**: Questions present structured options with recommendations
5. **No CLI**: Confirm no bash scripts called during workflow

---

## Future Considerations

- **Spec templates**: Pre-defined structures for common spec types (API, UI, refactor)
- **Spec linking**: Reference other specs in the system
- **Version history**: Track spec revisions over time
- **Collaboration**: Multiple reviewers, approval workflows
