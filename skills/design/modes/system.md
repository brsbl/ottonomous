# Design System Mode

Launch the interactive Design Studio in the browser. Design tokens are defined visually with live preview, then exported to TypeScript files.

**Command:** `/design system [spec-id | "product idea"]`

---

## Overview

The Design Studio is an HTML-first experience. All design decisions happen in the browser with:
- Philosophy picker showing rendered component previews
- Color pickers with shade scales, harmony suggestions, WCAG contrast badges
- Typography, spacing, radii, shadows controls with live preview
- Dark mode toggle with auto-generated variants
- One-click export to `design-tokens.ts` and `tailwind.config.ts`

---

## 1. Parse Arguments

Check for context argument (optional):

| Argument Type | Detection | Action |
|---------------|-----------|--------|
| Spec ID | Matches `.otto/specs/{id}.md` | Load spec, extract app context |
| Product idea | Quoted string or unquoted text | Use as preview context |
| None | No argument | Generic preview content |

If spec-id provided:
```bash
if [ -f ".otto/specs/${arg}.md" ]; then
  # Extract context from spec frontmatter/content
  context_type="spec"
fi
```

---

## 2. Scan for Existing Design Tokens

Before generating studio, scan project for existing design values:

| File | What to Extract |
|------|-----------------|
| `tailwind.config.ts` | Colors, fonts, spacing from theme.extend |
| `tailwind.config.js` | Same as above (JS format) |
| `src/lib/design-tokens.ts` | Full token definitions |
| `src/app/globals.css` | CSS variables (--color-*, --font-*) |

### Scan Algorithm

```javascript
// Check files in order of priority
const files = [
  'src/lib/design-tokens.ts',
  'tailwind.config.ts',
  'tailwind.config.js',
  'src/app/globals.css',
  'src/styles/globals.css'
];

let seedValues = {};

// Extract colors
// Look for: colors: { primary: '#xxx' } or --color-primary: #xxx
// Extract typography
// Look for: fontFamily: { sans: 'Inter' } or --font-sans: Inter
// Extract spacing
// Look for: spacing: { unit: 4 } or --spacing-unit: 4px
```

Report scan results:
```
Scanned project for existing tokens:
  - tailwind.config.ts: Found colors (primary, secondary), fonts (Inter)
  - globals.css: Found CSS variables (--radius-md, --shadow-sm)

These values will seed the Design Studio.
```

---

## 3. Generate Studio HTML

Copy the studio template and inject context/seed values:

```bash
# Create output directory
mkdir -p .otto/design

# Copy template
cp skills/design/lib/studio/template.html .otto/design/studio.html
```

If seed values or context exist, pass them via URL parameters when opening the studio:

```bash
# Simple context type
open ".otto/design/studio.html?context=task"

# Full context with seed values as JSON
context=$(cat <<'EOF'
{
  "type": "task",
  "name": "Task Management App",
  "seed": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#6366F1"
    },
    "typography": {
      "fonts": { "heading": "Inter, system-ui, sans-serif" }
    }
  }
}
EOF
)
open ".otto/design/studio.html?context=$(echo "$context" | jq -sRr @uri)"
```

The studio template reads context from the URL `context` parameter or from a `data-context` attribute on the root element.

### Context Type Detection

| Spec/Idea Keywords | Context Type | Preview Content |
|--------------------|--------------|-----------------|
| task, todo, project, kanban | `task` | Task cards with status badges |
| shop, store, ecommerce, product | `ecommerce` | Product cards with prices |
| dashboard, analytics, admin | `dashboard` | Metrics and charts labels |
| blog, content, cms, article | `blog` | Article previews |
| social, community, forum | `social` | User posts and profiles |

---

## 4. Open in Browser

Launch the studio in the default browser:

```bash
# macOS
open .otto/design/studio.html

# Linux
xdg-open .otto/design/studio.html

# Windows
start .otto/design/studio.html
```

Display instructions:
```
Design Studio opened in browser.

Instructions:
1. Choose a design philosophy or start from Custom
2. Adjust colors, typography, spacing, and other tokens
3. Toggle Light/Dark mode to preview both themes
4. Click "Export" when ready

Press Enter when export is complete to continue...
```

---

## 5. Wait for User Completion

Block and wait for user to confirm export is complete:

```bash
read -p "Press Enter when export is complete..."
```

After user confirms, check for exported files:

```bash
# Check if files were downloaded to Downloads
if [ -f ~/Downloads/design-tokens.ts ]; then
  mkdir -p src/lib
  mv ~/Downloads/design-tokens.ts src/lib/
fi

if [ -f ~/Downloads/tailwind.config.ts ]; then
  [ -f tailwind.config.ts ] && mv tailwind.config.ts tailwind.config.ts.bak
  mv ~/Downloads/tailwind.config.ts ./
fi
```

---

## 6. Post-Export Actions

After files are in place:

### Move exported files to correct locations
```bash
# Ensure directories exist
mkdir -p src/lib

# If files were downloaded to ~/Downloads or current directory
# Move them to proper locations
```

### Type check (optional)
```bash
npx tsc --noEmit src/lib/design-tokens.ts
```

### Report success
```
Design System exported successfully!

Files created:
  src/lib/design-tokens.ts - Design tokens with light/dark themes
  tailwind.config.ts - Tailwind configuration

Next steps:
  - Run `/design components` to generate UI components
  - Import tokens in your components: import { colors } from '@/lib/design-tokens'
```

---

## File Structure

After running `/design system`:

```
project/
├── src/
│   └── lib/
│       └── design-tokens.ts    # Exported tokens
├── tailwind.config.ts          # Tailwind config
└── .otto/
    └── design/
        └── studio.html         # Interactive studio (can be re-opened)
```

---

## Reusing the Studio

The studio remains at `.otto/design/studio.html` and can be reopened anytime:

```bash
open .otto/design/studio.html
```

To re-run with fresh context:
```bash
/design system "new product idea"
```
