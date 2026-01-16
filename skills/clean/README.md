# Clean

Clean ottonomous workflow artifacts from the .otto directory.

## Usage

```bash
/clean              # Interactive mode: choose what to clean
/clean --all        # Full reset including config.yaml
/clean --sessions   # Clean only otto sessions
/clean --keep-config # Clean all except config.yaml (default)
```

## What It Does

- Removes workflow artifacts (specs, tasks, reviews, sessions)
- Preserves directory structure with .gitkeep files
- Checks for active otto sessions before cleaning
- Warns before destructive operations

## Example

```bash
/clean --sessions

# Cleaned 3 otto session(s).
# Session artifacts removed, ready for new session.
```

Use to reset your project's otto state without affecting the plugin
