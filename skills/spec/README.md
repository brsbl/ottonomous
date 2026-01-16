# Spec

Write specifications through collaborative AI-human interview.

## Usage

```bash
/spec
```

## What It Does

- Gathers context from your codebase and existing specs
- Researches best practices via web search
- Asks 3-5 questions to understand requirements
- Generates comprehensive specification document

## Configuration

```yaml
auto_pick: false  # Requires approval after draft
```

## Output

Specification saved to `.otto/specs/{spec-id}.md`

## Example

```bash
/spec

# Interactive interview:
# - What features are needed?
# - What are the constraints?
# - Any reference projects?

# Output: .otto/specs/user-auth-a4f2.md
```

Status: `draft` → `approved` (use `/task` on approved specs)
