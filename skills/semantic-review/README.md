# Semantic Review

Generate audience-specific walkthrough of code changes.

## Usage

```bash
/semantic-review
```

## What It Does

- Analyzes branch changes (commit messages + diffs)
- Explains **why** and **what it means** (not just what changed)
- Creates HTML report with per-component analysis
- Opens in browser automatically

## Output

- Markdown: `.otto/reviews/{branch}.md`
- HTML: `.otto/reviews/{branch}.html` (opened in browser)

## Example

```bash
/semantic-review

# Analyzes: git diff main...HEAD
# Generates walkthrough:
#   - High-level summary
#   - Per-component changes with business impact
#   - Testing recommendations

# Opens: .otto/reviews/feat-user-auth.html
```

Use for PR descriptions and documentation
