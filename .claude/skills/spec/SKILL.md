---
name: spec
description: Writes specifications through collaborative interview. Activates when user mentions planning, new features, projects, or needs a spec/PRD.
---

# Spec Writing

Create specifications through collaborative AI-human interview.

## Quick Start

**Before writing a spec**, check for existing related specs:

```bash
ls .kit/specs/*.md 2>/dev/null
```

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
hash=$(echo "$name$$$(date +%s%N)" | { sha1sum 2>/dev/null || shasum; } | cut -c1-4)
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
> "Would you like me to generate implementation tasks from this spec? Run `/task {id}` to create tasks."
