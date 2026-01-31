---
name: spec
description: Writes product specifications through collaborative interview with web research. Use when planning, gathering requirements, designing new features, or creating a spec/PRD.
argument-hint: list | [product idea]
model: opus
---

**Argument:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/spec list` | List all specs with id, name, status, created date |
| `/spec {idea}` | Create new spec through collaborative interview |

---

### List Mode

If `$ARGUMENTS` is `list`:

1. List `.otto/specs/*.md`
2. For each spec, read frontmatter (id, name, status, created)
3. Display as table:
   ```
   | ID | Name | Status | Created |
   |----|------|--------|---------|
   | design-skill-a1b2 | Design Skill | approved | 2026-01-28 |
   ```
4. If no specs found: "No specs found. Run `/spec {idea}` to create one."
5. Stop here — do not continue to interview workflow.

---

### Create Mode

**Product Idea:** $ARGUMENTS

If no argument provided, ask: "What would you like to build?"

### 1. Gather Context

**Check for existing specs:**
```bash
ls .otto/specs/*.md 2>/dev/null
```

**Ask about reference projects:**
> "Are there any reference projects or examples I should look at for inspiration?"

If provided, explore the reference project(s) to understand their approach.

**Analyze codebase:**
- Use Glob to find relevant files
- Use Read to understand current architecture
- Use Grep to search for related patterns
- Note patterns and design decisions to reference during interview

### 2. Research Best Practices

Use `WebSearch` to find and `WebFetch` to read:
- Industry best practices for the product type
- Common pitfalls and recommendations
- How popular projects solve similar problems
- Documentation and API references

**For visual research** (competitor products, reference implementations):
- Use browser automation (`skills/otto/lib/browser`) to navigate sites and capture screenshots
- Save screenshots to `.otto/research/`

### 3. Interview

Use `AskUserQuestion` to gather requirements. For each decision point:

- Present 2-3 options
- Mark one as "(Recommended)" based on research
- Include pros/cons and what research suggests

**Topics to cover:**
- Core requirements and constraints
- Key architectural decisions
- Scope boundaries (what's in, what's out)
- Edge cases

### 4. Draft Spec

Write a spec covering:

**Product Requirements:**
- **Overview** - What and why, problem being solved
- **Goals / Non-Goals** - Explicit scope boundaries
- **User Stories** - User-facing behavior

**Technical Design:**
- **Architecture** - System design, component relationships
- **Detailed Design** - Implementation approach, key algorithms
- **API / Interface** - Public interfaces, contracts
- **Data Model** - Schema, storage, state

**Planning:**
- **Future Considerations** - Deferred features, extensibility
- **Open Questions** - Unresolved decisions marked as `[TBD: reason]`

### 5. Save Draft

Generate unique ID from product idea:
```bash
slug="${ARGUMENTS,,}"          # Convert to lowercase
slug="${slug// /-}"            # Replace spaces with hyphens
slug="${slug:0:30}"            # Truncate to 30 characters

hash=$(sha1sum <<< "$ARGUMENTS$(date +%s%N)" 2>/dev/null || shasum <<< "$ARGUMENTS$(date +%s%N)")
hash="${hash:0:4}"

id="${slug}-${hash}"

mkdir -p .otto/specs
```

Write to `.otto/specs/{id}.md`:
```yaml
---
id: {id}
name: {Product Idea}
status: draft
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---

{spec content}
```

### 6. Approval

**Output the full spec** as rendered markdown so the user can review it inline.

**Use `AskUserQuestion`** with options:
- "Approve"
- "Request changes"
- "Open in editor" — open `.otto/specs/{id}.md`, then ask again

**After each revision:** Output the full updated spec as rendered markdown before asking for approval again. Revise until approved.

On approval, update `status: draft` to `status: approved` in the file.

Report: "Spec approved and saved to `.otto/specs/{id}.md`"

### 7. Next Steps

Offer task generation:
> "Run `/task {id}` to generate implementation tasks."
