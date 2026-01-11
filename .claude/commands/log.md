# Log Command

Capture code discoveries anchored to source files.

## When to Use

After exploring or investigating code, capture what you learned so future sessions don't re-discover it.

## Workflow

### 1. Identify Discovery

You just learned something about the codebase:
- How a feature works
- Why code is structured a certain way
- A non-obvious pattern or convention
- A gotcha or edge case

### 2. Determine Anchors

Identify which source files IMPLEMENT the behavior you learned about:
- Anchor to implementation files, not callers or tests
- Minimum 1 anchor, typically 1-3 files
- Use relative paths from repo root

### 3. Write Entry

Generate a unique ID: `{topic-slug}-{4-random-chars}`

Write to `.kit/logs/{id}.md`:

```markdown
---
id: {id}
anchors:
  - {path/to/file1}
  - {path/to/file2}
---

{What you learned - be concise but complete}
```

### 4. Confirm

Tell the user what was captured:
> "Logged discovery about {topic} anchored to {files}."

## Before Investigating Code

**Always search first:**

```bash
kit log search "<topic>"
```

Use existing entries if status is `valid`. Verify `stale` entries before trusting.

## CLI Reference

```
kit log list [--status <s>]     List entries
kit log stale                   Find stale/orphaned entries
kit log search <term>           Search content
```
