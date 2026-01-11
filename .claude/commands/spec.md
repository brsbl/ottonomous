# Spec Command

Create specifications through collaborative AI-human interview.

## Workflow

### 1. Research

Before asking questions:
- Use Task tool with Explore agent to analyze relevant codebase patterns
- Run `kit spec list` to check for related specs
- Use WebSearch if external best practices would help

### 2. Interview

Use the `AskUserQuestion` tool to ask about anything non-obvious:
- Goals, constraints, preferences, decisions you can't infer
- Ask ONE question at a time
- Stop when you have enough context (typically 2-5 questions)

### 3. Draft

Write a spec covering:
- Overview (what and why)
- Goals / Non-Goals
- User Stories (if applicable)
- Detailed Design
- Commands (Agent command vs CLI, if applicable)
- Future Considerations (phased features)

Mark gaps as `[TBD: reason]`.

### 4. Approval

Present the draft, then use `AskUserQuestion` to confirm approval or get change requests. Revise until approved.

### 5. Save

Generate a unique ID: `{slug}-{4-random-chars}` (e.g., `user-auth-a7x3`)

Write the spec file to `.kit/specs/{id}.md` with frontmatter:
```yaml
---
id: {id}
name: {Name}
status: approved
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---
```

Offer to generate tasks via `/task` command.

## CLI Reference

```
kit spec list                    List all specs
kit spec update <id> --status    Update status
kit spec remove <id>             Delete spec
kit init                         Setup directories
kit status                       Project overview
```
