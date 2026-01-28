# Agentation

Monorepo containing:
1. **npm package** (`_package-export/`) - See `_package-export/CLAUDE.md`
2. **Website/docs** (`_package-export/example/`) - See `_package-export/example/CLAUDE.md`

## What is Agentation?

A floating toolbar for annotating web pages and collecting structured feedback for AI coding agents.

## Development

```bash
pnpm install    # Install all workspace dependencies
pnpm dev        # Run both package watch + website dev server
pnpm build      # Build package only
```

## Important

The npm package is public. Changes to `_package-export/src/` affect all users.
Website changes (`_package-export/example/`) only affect agentation.dev.

## PR/Issue Approach

- Package size is critical - avoid bloat
- UI changes need extra scrutiny
- Plugins/extensions → encourage separate repos
- External binary files → never accept
