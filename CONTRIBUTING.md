# Contributing to Ottonomous

Thank you for your interest in contributing! This document outlines the contribution process.

## Issue-First Workflow

**All contributions require an approved issue before submitting a PR.**

1. **Check existing issues** - Search [open issues](https://github.com/brsbl/ottonomous/issues)
2. **Open an issue** - Create a new issue using the appropriate template
3. **Wait for approval** - A maintainer will add the `approved` label
4. **Start work** - Only begin implementation after approval

## Development Setup

```bash
git clone https://github.com/brsbl/ottonomous.git
cd ottonomous
npm install
npm test
```

**Requirements:** Node.js 20+, npm, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## Coding Standards

- Use ES modules (`import`/`export`)
- Follow existing patterns in the codebase
- Keep changes focused and minimal

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(otto): add parallel task execution
fix(spec): handle empty interview responses
docs: update installation instructions
```

## Pull Request Process

1. Ensure your issue has the `approved` label
2. Create a feature branch from `main`
3. Make changes and run `npm test`
4. Push and open a PR against `main`
5. Reference the issue with `Closes #<issue-number>`
6. Wait for CI and review

PRs require 1 approval before merging.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
