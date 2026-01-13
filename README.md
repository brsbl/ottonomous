# AI Developer Kit

A unified CLI toolkit for AI-assisted software development. Provides structured workflows for creating and manaing feature specifications, engineering tasks, and knowledge base.

## Overview

AI Developer Kit (`kit`) helps you and AI agents collaborate more effectively by providing:

- **Specs** — Define what to build before implementation
- **Tasks** — Break specs into prioritized, dependency-aware work items
- **Logs** — Capture code discoveries anchored to source files

All data lives in `.kit/` within your project, using markdown and JSON formats that are easy for both humans and AI to read and modify.

## Architecture

Each system (spec, task, log) follows a three-layer architecture:

```
Skill → Command → CLI
```

| Layer | Location | Purpose |
|-------|----------|---------|
| **Skill** | `.claude/skills/*/SKILL.md` | Auto-triggers on context, provides workflow instructions |
| **Command** | `.claude/commands/*.md` | Slash command (`/log`) user entry point for explicit actions |
| **CLI** | `kit <system> <action>` | Read-only shell operations (list, search, status) |

### Critical Design Point

**The CLI is read-only. Manipulation happens via Claude Code.**

- **CLI commands**: `init`, `list`, `search`, `stale` — query and display data
- **Skill/Command**: `create`, `edit`, `verify`, `remove` — Claude writes files directly

This design keeps shell scripts simple while leveraging Claude's intelligence for content generation. Claude Code reads/writes markdown files directly using the skill workflows, then stages them with git.

**Example flow:**
1. Skill auto-triggers when exploring code, reminds to search log first
2. User runs `/log` command after discovering something
3. Command provides workflow: identify anchors, generate ID, write entry
4. Claude writes the markdown file directly, stages with git

## Installation

```bash
# Clone the repository
git clone https://github.com/example/aidevkit.git

# Add to PATH
export PATH="$PATH:/path/to/aidevkit/bin"

# Initialize in your project
cd your-project
kit init
```

## Quick Start

```bash
# Initialize the toolkit in your project
kit init

# Create a specification
kit spec create --name "User Authentication" --content "Implement OAuth2 login..."

# Generate tasks from the spec
kit task init .kit/specs/user-authentication-a7x3.md

# See what to work on next
kit task next

# After discovering something about the code, log it
kit log add .kit/logs/auth/session-flow.md \
  --anchor src/auth/session.js \
  --content "Sessions use JWT tokens stored in httpOnly cookies..."

# Search your engineering logs
kit log search "authentication"
```

## Commands

### Global Commands

```bash
kit init          # Initialize all systems in current directory
kit status        # Show project state across all systems
kit --help        # Show help
kit --version     # Show version
```

### Spec System

Manage specifications for features, projects, and milestones.

```bash
kit spec init                              # Initialize specs directory
kit spec create --name "Name" [--content "..."]  # Create new spec
kit spec list [--status <status>]          # List all specs
kit spec show <id>                         # Display a specification
kit spec update <id> --status <status>     # Update spec status
kit spec edit <id>                         # Edit spec content
kit spec remove <id>                       # Remove a specification
kit spec search "term"                     # Search specifications
```

**Spec Statuses:** `draft` → `in-review` → `approved` → `implemented` → `deprecated`

**Output:** Specs are saved as markdown files in `.kit/specs/` with YAML frontmatter:

```markdown
---
id: user-authentication-a7x3
name: User Authentication
status: draft
created: 2024-01-15
---

## Overview
Implement OAuth2 login with Google and GitHub providers...
```

### Task System

Break specifications into actionable, dependency-aware tasks.

```bash
kit task init <spec-path>                  # Generate task list from spec
kit task list [--spec <id>] [--status <s>] # List tasks
kit task next [--spec <id>]                # Get highest-priority unblocked task
kit task create --spec <id> "Title" [-p <0-4>] [--depends <id,id>]
kit task update <id> --status <status>     # Update status
kit task update <id> --priority <0-4>      # Update priority
kit task close <id>                        # Mark task as done
kit task remove <id>                       # Delete task
kit task dep add <child> <parent>          # Add dependency
kit task dep remove <child> <parent>       # Remove dependency
```

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

### Log System

Capture code discoveries anchored to source files. When anchor files change, log entries are marked stale.

**CLI (read-only):**
```bash
kit log init                               # Initialize log system
kit log list [--status <status>]           # List all entries
kit log search <term>                      # Search log entries
kit log stale                              # List stale/orphaned entries
```

**Manipulation (via `/log` command):**
- Create entries: Claude writes markdown directly
- Edit entries: Claude updates content, preserves anchors
- Verify entries: Touch file to update mtime
- Remove entries: Delete file, stage deletion

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

After running `kit init`, your project will have:

```
your-project/
├── .kit/
│   ├── specs/              # Specification files
│   │   └── *.md
│   ├── tasks/              # Task JSON files
│   │   └── *.json
│   ├── logs/               # Engineering log entries
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

## Claude Code Integration

AI Developer Kit includes skills and commands for Claude Code that enable AI-assisted workflows.

### Skills (Auto-Trigger)

Skills activate automatically based on context:

- **Spec Skill** — Triggers when discussing new features, projects, or milestones
- **Task Skill** — Triggers when a spec exists and you mention tasks or implementation
- **Log Skill** — Triggers when investigating code or making discoveries

### Slash Commands

Invoke explicit workflows:

- `/spec` — Interactive interview to create a specification
- `/task` — Task management and prioritization
- `/log` — Search and capture code knowledge

### Example AI Workflow

1. **You:** "I want to add user authentication to the app"
2. **Claude:** Recognizes new feature, offers to create a spec
3. **You:** Approve, answer interview questions
4. **Claude:** Creates spec, offers to generate tasks
5. **You:** Approve task generation
6. **Claude:** Creates prioritized task list with dependencies
7. **You:** "What should I work on first?"
8. **Claude:** Runs `kit task next`, proposes highest-priority unblocked task
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

## Workflows

### Creating a New Feature

```bash
# 1. Create the specification
kit spec create --name "Payment Processing" --content "..."

# 2. Generate tasks
kit task init .kit/specs/payment-processing-b2c4.md

# 3. Add tasks manually if needed
kit task create --spec payment-processing-b2c4 "Integrate Stripe" -p 1
kit task create --spec payment-processing-b2c4 "Add webhook handler" -p 2 --depends 1

# 4. Start working
kit task next --spec payment-processing-b2c4
kit task update 1 --status in_progress

# 5. Complete tasks
kit task close 1
kit task next  # Shows task 2 is now unblocked
```

### Capturing Code Knowledge

```bash
# Before investigating, search existing knowledge
kit log search "payment"

# When anchor files change, entries become stale
kit log stale
```

To capture discoveries, use `/log` command which guides Claude through:
1. Identifying anchor files
2. Generating a unique ID
3. Writing the entry to `.kit/logs/`
4. Staging with git

### Cross-System Workflow

```bash
# Check overall project status
kit status

# Output:
# AI Developer Kit Status
# =======================
#
# Specs: 3 specification(s) in .kit/specs/
#   - draft: 1
#   - approved: 2
#
# Tasks: 2 task file(s) in .kit/tasks/
#   - pending: 5
#   - in_progress: 1
#   - done: 8
#
# Logs: 12 entry(ies) in .kit/logs/
#   - stale: 2
```

## Dependencies

- Bash 3.2+
- jq (for JSON processing)
- Git (optional, for staleness tracking)

## Design Principles

1. **Human-readable formats** — Markdown and JSON that you can edit directly
2. **AI-friendly** — Structured data that AI agents can parse and generate
3. **Git-native** — All files are plain text, diffs are meaningful
4. **Non-destructive** — Operations are idempotent, confirmations required for deletions
5. **Composable** — Each system works independently or together

## License

MIT
