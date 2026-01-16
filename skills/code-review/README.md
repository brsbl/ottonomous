# Code Review

Review code changes for bugs with prioritized feedback.

## Usage

```bash
/code-review
```

## What It Does

- Reviews staged changes or branch diff
- Finds bugs across security, logic, performance, style
- Prioritizes issues: P0 (blocking) → P3 (low)
- Generates fix plan and optionally implements fixes

## Configuration

```yaml
auto_pick: true  # Auto-approve P0/P1 fixes
```

## Output

Review report saved to `.otto/reviews/{branch-or-commit}.md`

## Example

```bash
/code-review

# Reviews: git diff main...HEAD
# Found 5 issues:
#   - P0: SQL injection in login endpoint
#   - P1: Missing null check in user service
#   - P2: Inefficient database query (3 issues)

# Auto-fixes P0/P1, logs P2/P3
```

Run before merging branches
