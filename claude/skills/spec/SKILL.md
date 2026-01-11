---
name: spec-writing
description: Create specifications for features, projects, or milestones. Use when user mentions building something new, starting a project, planning implementation, or needs a spec/PRD/design doc.
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion
---

# Spec Writing

Create structured specifications before implementation begins.

## Prime Directive

**Confirm intent before creating a spec.**

When triggered, ask the user:

> "It sounds like you're starting something new. Would you like me to help write a spec? I'll analyze the codebase, research best practices, and interview you to fill gaps."

If declined, continue normally without the spec workflow.

## Create a Spec

If the user agrees:

1. **Analyze** the existing codebase for relevant patterns
2. **Research** best practices for the domain
3. **Interview** the user to clarify requirements
4. **Generate** a structured specification

Save the result:

```bash
kit spec create --name "<spec-name>" --content "<generated-content>"
```

## After Creation

Offer task generation:

> "Your spec is saved. Would you like me to generate a task list from it?"

If yes:

```bash
kit task init .kit/specs/<spec-file>.md
```

## Spec Lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Being written |
| `in-review` | Ready for feedback |
| `approved` | Ready for implementation |
| `implemented` | Work completed |
| `deprecated` | No longer relevant |

## CLI Reference

```bash
kit spec init                                # Initialize specs directory
kit spec create --name "Name" --content "..."  # Create new spec
kit spec list [--status <status>]            # List specs
kit spec show <id>                           # Display spec
kit spec update <id> --status approved       # Update metadata
kit spec edit <id>                           # Edit content
kit spec remove <id>                         # Remove spec
kit spec search "term"                       # Search specs
```
