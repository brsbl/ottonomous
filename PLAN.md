# Plan: Refactor to Skills + Commands Only

## Goal
Eliminate the CLI layer entirely. The new mental model:
- **Slash commands** = codified workflows users invoke (`/spec`, `/task`, `/log`)
- **Skills** = thin discovery wrappers that help agents find and run the right slash command

## Research Summary

### Best Practices (from web search)

**Skills ([docs](https://code.claude.com/docs/en/skills)):**
- Auto-trigger based on `description` field matching conversation context
- Use **progressive disclosure** - keep SKILL.md lean, details in reference files
- `name` and `description` are critical for triggering
- Skills are "auto-invoked context providers"

**Commands ([docs](https://code.claude.com/docs/en/slash-commands)):**
- User-invoked via `/command-name`
- Support YAML frontmatter, `$ARGUMENTS`, `!command` injection
- Explicit entry points for workflows

**Key insight:** Skills = discovery/auto-trigger, Commands = explicit workflows. This matches the target architecture perfectly.

### Current State Analysis

| System | CLI Commands | Used By Agent | Could Be Native |
|--------|-------------|---------------|-----------------|
| **Spec** | `list` | Research phase | Yes - glob + read |
| **Task** | `list`, `next` | Task selection | Yes - read JSON |
| **Log** | `search`, `list`, `stale` | Prime directive | Yes - grep + git |

**All CLI commands are read-only queries.** The agent already writes files directly.

### What Gets Deleted
```
bin/kit                         # Main router
systems/spec/                   # Entire spec CLI
systems/tasks/                  # Entire task CLI
systems/log/                    # Entire log CLI
shared/lib/                     # Shared utilities
```

### What Gets Refactored
```
.claude/skills/spec/SKILL.md   # Remove CLI references
.claude/skills/task/SKILL.md   # Remove CLI references
.claude/skills/log/SKILL.md    # Remove CLI references
.claude/commands/spec.md       # Use native file operations
.claude/commands/task.md       # Use native file operations
.claude/commands/log.md        # Use native file operations
README.md                      # Update architecture docs
```

---

## Dogfooding Approach

We'll use the system itself to refactor the system:

### Phase 1: Write Specs (using `/spec`)

For each system, run `/spec` to collaboratively write a new spec:

1. **Spec System Spec** → `.kit/specs/spec-system-refactor-{id}.md`
   - Document feedback in `FEEDBACK.md` (repo root)

2. **Task System Spec** → `.kit/specs/task-system-refactor-{id}.md`
   - Continue feedback in `FEEDBACK.md`

3. **Log System Spec** → `.kit/specs/log-system-refactor-{id}.md`
   - Continue feedback in `FEEDBACK.md`

Each spec will define:
- New SKILL.md content
- New command.md content (full workflow with native file ops)
- Data format (unchanged - `.kit/specs/`, `.kit/tasks/`, `.kit/logs/`)

**Important distinction:**
- **Spec & Task** = transactional (one-time planning operations)
  - Skill: Ultra-thin, just redirect to command
  - Command: Full workflow for creating artifacts

- **Log** = evergreen (continuous knowledge base)
  - Skill: Contains search/staleness workflow (agents use this constantly)
  - Command: Just the "add discovery" workflow

### Phase 2: Generate Tasks (using `/task`)

Run `/task` on each spec to generate implementation tasks:
- Tasks for spec system refactor
- Tasks for task system refactor
- Tasks for log system refactor

### Phase 3: Execute Tasks (using subagents)

Launch subagents to:
1. Work through tasks in priority order
2. Log discoveries to `.kit/logs/` as they work
3. Mark tasks complete as they finish

### Phase 4: Cleanup

- Delete CLI code (`bin/`, `systems/`, `shared/`)
- Update README.md
- Final review

---

## Execution Order

```
1. /spec for spec-system-refactor     ← We start here
   └── Document feedback in FEEDBACK.md

2. /spec for task-system-refactor
   └── Continue feedback in FEEDBACK.md

3. /spec for log-system-refactor
   └── Continue feedback in FEEDBACK.md

4. /task for spec-system-refactor
5. /task for task-system-refactor
6. /task for log-system-refactor

7. Subagents execute tasks + log discoveries

8. Cleanup and final review
```

---

## New Architecture (Target State)

### Skills (Two Patterns)

**Pattern A: Transactional (spec, task)**

Ultra-thin - just triggers and redirects to command:

```markdown
---
name: spec-writing
description: Help write feature specs. Triggers on: new feature, project planning, spec/PRD.
---

Run `/spec` to collaboratively write a specification.
```

One-time planning operations. Create artifact → done.

**Pattern B: Evergreen (log)**

The log skill is different - it's a living knowledge base with full lifecycle management:

```markdown
---
name: engineering-log
description: Captures engineering knowledge anchored to source files. Use when exploring code, investigating bugs, planning implementation.
---

# Prime Directive
**Search the log before investigating code.**

## Search
- Glob `.kit/logs/*.md` to find entries
- Grep for topic keywords
- Read matching entries, check staleness

## Staleness States
- `valid` = anchors unchanged since entry written → use directly
- `stale` = anchor modified → verify before trusting
- `orphaned` = anchor deleted → cleanup or update anchors

## Lifecycle Operations

**Verify stale entry** (still accurate):
- Touch file to update mtime: `touch .kit/logs/{entry}.md`
- Stage: `git add .kit/logs/{entry}.md`

**Update entry** (needs changes):
- Edit content, preserve/update anchors in frontmatter
- Stage changes

**Remove orphaned anchors**:
- Edit frontmatter to remove deleted file paths
- Or delete entry if no valid anchors remain

**Add new discovery**:
- Run `/log` to capture what you learned
```

The log skill contains the full workflow because agents need to **continuously interact** with the knowledge base as they work - searching, verifying, updating, and adding.

### Commands (Full Workflows)

**Transactional commands (/spec, /task)** - complete workflows:

```markdown
# Spec Command

## Research
- Glob `.kit/specs/*.md` to find existing specs
- Read files directly to check for related specs

## Interview
- Use AskUserQuestion for clarifying questions

## Draft & Save
- Write to `.kit/specs/{id}.md` with frontmatter
- Stage with git
```

**Evergreen command (/log)** - focused on adding new discoveries:

```markdown
# Log Command

Capture a code discovery anchored to source files.

## Workflow
1. Identify what you learned
2. Determine anchor files (implementation, not callers/tests)
3. Generate ID: `{topic-slug}-{4-random-chars}`
4. Write to `.kit/logs/{id}.md` with frontmatter
5. Stage: `git add .kit/logs/{id}.md`
6. Confirm to user
```

Note: Search, verify, update operations are in the **skill**, not the command. The command is specifically for adding new entries.

### Data Layer (Unchanged)

```
.kit/
├── specs/*.md      # Markdown + YAML frontmatter
├── tasks/*.json    # JSON task lists
└── logs/*.md       # Markdown + YAML anchors
```

---

## Verification

After refactoring:

1. **Test /spec** - Create a test spec, verify it writes correctly
2. **Test /task** - Generate tasks from spec, verify JSON output
3. **Test /log** - Create log entry, verify staleness detection works
4. **Test auto-trigger** - Verify skills trigger on relevant context
5. **Verify CLI deleted** - Confirm `kit` command no longer exists

---

## Files to Track

- `FEEDBACK.md` - Feedback captured during dogfooding (repo root)
- `.kit/specs/*-refactor-*.md` - Specs for each system
- `.kit/tasks/*-refactor-*.json` - Tasks for each system
- `.kit/logs/*.md` - Discoveries made during refactoring

---

## Sources

- [Agent Skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Slash Commands - Claude Code Docs](https://code.claude.com/docs/en/slash-commands)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Skill authoring best practices - Claude Docs](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
