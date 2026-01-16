---
name: semantic-review
description: Generate a semantic walkthrough of branch changes for different audiences. Creates business-focused summaries explaining what changed and why it matters. Invoke with /semantic-review.
---

# Semantic Review

Generate a comprehensive, audience-aware review of code changes that focuses on the "why" and "what it means" rather than just "what changed".

## Workflow

### 1. Determine Scope

First, identify what to review:

```bash
# Check current branch
git branch --show-current

# Find the base branch (usually main or master)
git rev-parse --verify main 2>/dev/null || git rev-parse --verify master
```

If on main/master, ask the user what to review:
- Recent commits (how many?)
- Staged changes
- Uncommitted changes

### 2. Gather Change Information

```bash
# Get list of changed files
git diff main...HEAD --name-status

# Get full diff for analysis
git diff main...HEAD

# Get commit messages for context
git log main...HEAD --oneline
```

### 3. Generate Semantic Review

Create a structured review with the following format:

---

## High-Level Summary

Provide a high-level summary of what this branch accomplishes from a business/feature perspective (2-3 sentences).

## Summary for Different Audiences (2-3 sentences each)

- **For developers:** Technical implementation details and integration points

- **For reviewers:** Key areas requiring careful review

- **For product/non-technical stakeholders:** What functionality changes and why it matters

## Semantic Changes by Component (2-3 sentences each)

For each modified file or logical component:

### [Component/File Name](link-to-code)

- **Purpose of changes:** What problem does this solve or what feature does it add?

- **Behavioral changes:** How does the behavior differ from before?

- **Data flow impact:** How do these changes affect data flow through the system?

- **Dependencies affected:** What other parts of the codebase might be impacted?

---

### 4. Guidelines for Writing

- **Focus on semantics**: Explain the meaning and implications of changes, not syntax
- **Be specific about impact**: "This adds retry logic to API calls" not "Modified fetch function"
- **Identify risks**: Call out areas that might have unexpected side effects
- **Note testing implications**: What scenarios should be tested?
- **Link to context**: Reference related files, PRs, or issues when relevant

### 5. Save the Review

Generate filename and save to `.otto/reviews/`:

```bash
# Get branch name for filename
branch=$(git branch --show-current)
date=$(date +%Y-%m-%d)
slug=$(echo "$branch" | tr '[:upper:]' '[:lower:]' | tr '/' '-' | tr ' ' '-')
filename="${slug}-${date}"

# Ensure directory exists
mkdir -p .otto/reviews
```

Write the review with YAML frontmatter to `.otto/reviews/{filename}.md`:

```yaml
---
branch: {branch-name}
base: main
date: {YYYY-MM-DD}
files_changed: {count}
---

{review content}
```

Stage the file: `git add .otto/reviews/{filename}.md`

### 6. Convert to HTML and Open Browser

Use the bundled conversion script to transform markdown to styled HTML with syntax highlighting and dark mode support.

**First-time setup** (if dependencies not installed):

```bash
cd skills/semantic-review && npm install
```

**Convert to HTML:**

```bash
# Get the skill directory (where the converter lives)
SKILL_DIR="skills/semantic-review"

# Run the converter
node "$SKILL_DIR/scripts/md-to-html.js" ".otto/reviews/{filename}.md" ".otto/reviews/{filename}.html"
```

**Open in browser:**

```bash
# macOS
open .otto/reviews/{filename}.html

# Linux
xdg-open .otto/reviews/{filename}.html

# Windows (WSL)
wslview .otto/reviews/{filename}.html
```

The HTML output includes:
- GitHub-style typography and layout
- Syntax highlighting for code blocks (via highlight.js)
- Automatic dark mode support (via `prefers-color-scheme`)
- Responsive design for mobile viewing

### 6b. Capture Visual Changes (Optional)

If the changes include UI modifications:

> "Would you like me to capture screenshots of the UI changes using `/dev-browser`?"

If yes, use dev-browser to:
- Navigate to affected pages
- Capture before/after screenshots
- Save to `.otto/reviews/{filename}-screenshots/`
- Include screenshot references in the review documentation

### 7. Report to User

Confirm:
> "Semantic review complete!
> - Markdown: `.otto/reviews/{filename}.md`
> - HTML: `.otto/reviews/{filename}.html`
>
> Opened in browser."

Offer next steps:
- "Would you like me to create a PR with this summary?"
- "Should I stage the review files for commit?"

---

## Example Output

```markdown
---
branch: feature/add-user-preferences
base: main
date: 2025-01-13
files_changed: 5
---

## High-Level Summary

This branch adds user preference management, allowing users to customize their dashboard layout and notification settings. These preferences persist across sessions and sync across devices.

## Summary for Different Audiences

- **For developers:** New `PreferencesService` handles CRUD operations with localStorage fallback. React context provides preference access throughout the app. Migration handles existing users.

- **For reviewers:** Focus on the preference merge logic in `PreferencesService.sync()` - conflict resolution between local and remote preferences needs careful review.

- **For product/non-technical stakeholders:** Users can now customize their experience with saved preferences. Settings persist across browser sessions and sync when logged into multiple devices.

## Semantic Changes by Component

### [PreferencesService](src/services/preferences.ts)

- **Purpose of changes:** Centralizes preference management with local and remote storage
- **Behavioral changes:** Preferences now sync on login and save immediately on change
- **Data flow impact:** Components read preferences via context instead of direct localStorage
- **Dependencies affected:** Dashboard, NotificationPanel, and UserSettings now depend on this service

### [PreferencesContext](src/contexts/preferences.tsx)

- **Purpose of changes:** Provides React context for accessing preferences throughout the app
- **Behavioral changes:** Preference changes trigger re-renders only in consuming components
- **Data flow impact:** Preferences flow down from root provider, updates bubble up via context methods
- **Dependencies affected:** Any component using usePreferences() hook
```
