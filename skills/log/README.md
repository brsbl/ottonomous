# Log

Engineering knowledge base anchored to source files.

## Usage

```bash
/log           # Create new log entry
/log init      # First-time setup
/log rebuild   # Regenerate INDEX.md
```

## What It Does

- Captures discoveries about how code works
- Anchors entries to specific files (staleness detection)
- Maintains searchable `INDEX.md`
- Detects stale entries when anchored files change

## Configuration

```yaml
auto_verify: true  # Auto-verify stale entries
```

## Output

- Individual entries: `.otto/logs/{timestamp}-{topic}.md`
- Index file: `.otto/logs/INDEX.md`

## Example

```bash
/log

# Question: What did you discover?
# Answer: User sessions are stored in Redis with 24h TTL

# Output: .otto/logs/20260116-123045-user-sessions.md
# Anchored to: src/auth/session.ts:45-67
```

Search with `grep -i "redis" .otto/logs/INDEX.md`
