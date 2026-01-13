# AI Developer Kit

A toolkit for AI-assisted software development using Claude Code skills and commands. Provides structured workflows for creating and managing feature specifications, engineering tasks, and knowledge base.

## Overview

AI Developer Kit helps you and AI agents collaborate more effectively by providing:

- **Specs** — Define what to build before implementation
- **Tasks** — Break specs into prioritized, dependency-aware work items
- **Logs** — Capture code discoveries anchored to source files

All data lives in `.kit/` within your project, using markdown and JSON formats that are easy for both humans and AI to read and modify.

## Architecture

Each system (spec, task, log) follows a skill/command architecture:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Skill** | `.claude/skills/*/SKILL.md` | Auto-triggers on context, provides workflow instructions |
| **Command** | `.claude/commands/*.md` | Slash command (`/log`) user entry point for explicit actions |

### Design Philosophy

**All manipulation happens via Claude Code.** Claude reads/writes markdown files directly using skill workflows, then stages them with git.

**Example flow:**
1. Skill auto-triggers when exploring code, reminds to search log first
2. User runs `/log` command after discovering something
3. Command provides workflow: identify anchors, generate ID, write entry
4. Claude writes the markdown file directly, stages with git

## Installation

Clone the repository and copy the `.claude/` directory to your project:

```bash
# Clone the repository
git clone https://github.com/example/aidevkit.git

# Copy skills and commands to your project
cp -r aidevkit/.claude your-project/
```

## Quick Start

```bash
# Initialize the log system
/log init

# Create a specification (interactive interview)
/spec

# Generate tasks from a spec
/task
```

## Slash Commands

### `/spec` — Create Specifications

Interactive interview to create feature specifications:

1. Gathers context from codebase and reference projects
2. Researches best practices
3. Interviews you with recommended options
4. Drafts spec covering product requirements and technical design
5. Saves to `.kit/specs/{id}.md`

**Spec Statuses:** `draft` → `in-review` → `approved` → `implemented` → `deprecated`

**Output:** Specs are saved as markdown files in `.kit/specs/` with YAML frontmatter:

```markdown
---
id: user-authentication-a7x3
name: User Authentication
status: approved
created: 2024-01-15
---

## Overview
Implement OAuth2 login with Google and GitHub providers...
```

### `/task` — Manage Tasks

Break specifications into actionable, dependency-aware tasks:

- Generate task list from a spec
- Track task status and priorities
- Get next unblocked task by priority
- Manage dependencies between tasks

**Task Statuses:** `pending` → `in_progress` → `done`

**Priority:** 0 (highest) to 4 (lowest), default is 2

**Output:** Tasks are stored as JSON in `.kit/tasks/<spec-id>.json`:

```json
{
  "spec_id": "user-authentication-a7x3",
  "spec_path": ".kit/specs/user-authentication-a7x3.md",
  "tasks": [
    {
      "id": 1,
      "title": "Set up OAuth providers",
      "status": "pending",
      "priority": 1,
      "depends_on": []
    },
    {
      "id": 2,
      "title": "Implement login flow",
      "status": "pending",
      "priority": 2,
      "depends_on": [1]
    }
  ]
}
```

### `/log` — Engineering Log

Capture code discoveries anchored to source files. When anchor files change, log entries are marked stale.

- `/log` — Create new log entry (guided workflow)
- `/log init` — First-time setup: document codebase and create baseline entries
- `/log rebuild` — Regenerate INDEX.md, clean orphans, re-seed if empty

**Staleness States:**
- `valid` — All anchors exist and haven't changed since entry was created
- `stale` — One or more anchors modified after entry was created
- `orphaned` — Anchor file(s) no longer exist

**Output:** Log entries are markdown files in `.kit/logs/` with YAML frontmatter:

```markdown
---
anchors:
  - src/auth/session.js
  - src/middleware/auth.js
---

Sessions use JWT tokens stored in httpOnly cookies.
The session middleware validates tokens on each request.
Refresh tokens are rotated on use to prevent replay attacks.
```

## Directory Structure

After setup, your project will have:

```
your-project/
├── .kit/
│   ├── specs/              # Specification files
│   │   └── *.md
│   ├── tasks/              # Task JSON files
│   │   └── *.json
│   ├── logs/               # Engineering log entries
│   │   ├── INDEX.md        # Quick lookup index
│   │   └── **/*.md
│   └── config.yaml         # Shared configuration
├── .claude/
│   ├── skills/             # Auto-triggering AI skills
│   │   ├── spec/SKILL.md
│   │   ├── task/SKILL.md
│   │   └── log/SKILL.md
│   └── commands/           # Slash commands
│       ├── spec.md
│       ├── task.md
│       └── log.md
└── ...
```

## Skills (Auto-Trigger)

Skills activate automatically based on context:

- **Spec Skill** — Triggers when discussing new features, projects, or milestones
- **Task Skill** — Triggers when a spec exists and you mention tasks or implementation
- **Log Skill** — Triggers when investigating code or making discoveries

## Example AI Workflow

1. **You:** "I want to add user authentication to the app"
2. **Claude:** Recognizes new feature, offers to create a spec
3. **You:** Approve, answer interview questions
4. **Claude:** Creates spec, offers to generate tasks
5. **You:** Approve task generation
6. **Claude:** Creates prioritized task list with dependencies
7. **You:** "What should I work on first?"
8. **Claude:** Identifies highest-priority unblocked task
9. **You:** Work through tasks, Claude marks them complete
10. **Claude:** After discovering code patterns, adds to engineering log

## Configuration

`.kit/config.yaml`:

```yaml
# Automatically verify stale log entries without prompting
auto_verify: false

# Auto-pick next task without confirmation
auto_pick: false
```

## Dependencies

- Claude Code with skills/commands support
- Git (for staleness tracking)

## Design Principles

1. **Human-readable formats** — Markdown and JSON that you can edit directly
2. **AI-friendly** — Structured data that AI agents can parse and generate
3. **Git-native** — All files are plain text, diffs are meaningful
4. **Non-destructive** — Operations are idempotent, confirmations required for deletions
5. **Composable** — Each system works independently or together

## License

MIT
