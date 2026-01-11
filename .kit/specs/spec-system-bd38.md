---
id: spec-system-bd38
name: Spec System
status: approved
created: 2026-01-10
updated: 2026-01-11
---

# Spec System

## Overview

The spec system enables collaborative pre-implementation planning between humans and AI agents. AI interviews the user, researches the codebase and web, then drafts specifications that the user approves and edits.

### Architecture Separation

- **Agent command (`/spec`)**: Handles all intelligence and write operations - interview, research, drafting, writing files with unique IDs, status updates, removal
- **CLI (`kit spec`)**: Read-only - listing specs
- **Direct file access**: Agents and users read spec files directly (no `show` command needed)

## Goals

- Enable collaborative spec authoring (AI interviews, drafts; human approves)
- Support configurable detail levels (overview to full technical spec)
- Integrate with task system via prompted generation
- Auto-trigger on new feature mentions and planning discussions

## Non-Goals

- Fully autonomous spec writing without human input
- Real-time multi-user collaboration
- Spec versioning (relies on git)

## User Stories

- As a developer, I want to describe what I want to build so that AI can help me create a structured spec
- As a developer, I want AI to research best practices so that my spec includes industry knowledge
- As a developer, I want AI to analyze my codebase so that the spec fits my existing architecture
- As a developer, I want to approve specs before they drive implementation

## Detailed Design

### Spec Creation Flow (via `/spec` Agent Command)

The `/spec` command (Claude slash command) handles the entire creation process:

1. **Trigger**: User mentions new feature, planning, or runs `/spec` command
2. **Agent asks**: "Would you like me to help create a spec for this?"
3. **If yes, agent runs interview**:
   - Asks for references and inspirations
   - Analyzes codebase for patterns and architecture
   - Searches web for best practices
   - Asks clarifying questions ONE at a time
4. **Agent drafts spec** filling in what it learned, marking gaps as [TBD]
5. **Agent generates unique ID** and writes spec file to `.kit/specs/`
6. **User reviews and edits** the file directly
7. **Explicit approval**: Agent asks user to approve; on approval, updates status to `approved`
8. **Agent offers to generate tasks** from approved spec

### Detail Levels

| Level | Content | Length |
|-------|---------|--------|
| Overview | Goals, scope, rough approach | 1 page |
| Standard | User stories, acceptance criteria | 2-3 pages |
| Detailed | Architecture, data models, edge cases | 5+ pages |

### Status Workflow

```
draft → approved → implemented
```

| Transition | Trigger | Actor |
|------------|---------|-------|
| → draft | Spec created | Agent (writes file) |
| draft → approved | User confirms at end of interview | Agent (updates file) |
| approved → implemented | Agent marks complete after implementation | Agent (`/spec` command) |

Status is stored in the spec file frontmatter and managed by the `/spec` agent command.

### Data Format

Specs stored as markdown in `.kit/specs/` with YAML frontmatter:

```yaml
---
id: feature-name-xxxx
name: Feature Name
status: draft
detail_level: standard
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Specs are plain markdown files. Agents and users can read them directly without a CLI command.

### Skill Auto-Trigger

Trigger when user mentions:
- "build", "implement", "create", "add" + feature
- "plan", "design", "spec", "requirements"
- Starting a new project or milestone

Always ask before proceeding.

## Commands

### CLI Commands (Read-Only)

| Command | Description |
|---------|-------------|
| `kit spec list` | List all specs with status |
| `kit status` | Overview of all specs, tasks, and logs |
| `kit init` | Set up `.kit/` directories |

The CLI is strictly read-only for specs. It provides fast, scriptable access to view spec information.

### Agent Command (`/spec`)

| Action | Description |
|--------|-------------|
| Create | Start spec interview, draft, and write file with unique ID |
| Edit | Modify existing spec content |
| Update status | Change spec status (draft, approved, implemented) |
| Remove | Delete spec file |

The `/spec` command handles all intelligence and write operations: interviewing, researching, drafting, file creation, status updates, and removal. Users invoke `/spec` within the agent conversation to perform any spec modifications.

## References

- [GitHub Spec-Driven Development](https://github.com/github/spec-kit)
- [Architecture Decision Records](https://adr.github.io/)
