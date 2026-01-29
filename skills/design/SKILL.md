---
name: design
description: Spec-driven design and UI implementation. Interactive HTML studio for design tokens with philosophy picker, color theory, dark mode, and one-click export. Generate components, preview layouts, implement pages, iterate with browser annotations.
argument-hint: [spec-id] | <system | components | mock | implement | feedback> [args]
model: opus
model-invokable: false
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/design` | Full flow with most recent spec |
| `/design <spec-id>` | Full flow with specified spec |
| `system [context]` | Interactive HTML studio for design tokens |
| `components` | Generate base component set |
| `mock <spec-id>` | Terminal wireframes for spec |
| `implement <spec-id>` | Generate code from approved mocks |
| `feedback [url]` | Live browser annotation loop |

### Design System Studio Features

The `system` mode launches an interactive HTML studio in the browser:

- **Philosophy Picker** - Choose from Minimal, Playful, Corporate, Bold, Organic, or Custom with live component previews
- **Color System** - Color pickers with auto-generated shade scales (50-950), harmony suggestions (complementary, analogous, triadic), WCAG contrast badges
- **Typography** - Font selection, base size, type scale ratio with live preview
- **Spacing & Effects** - Spacing scale, border radii, shadow presets with visual previews
- **Dark Mode** - Toggle between light/dark with auto-generated dark variants
- **Context-Aware Preview** - Pass a spec-id or product idea for relevant preview content
- **One-Click Export** - Export design-tokens.ts and tailwind.config.ts directly

---

## Routing

Parse the first argument to determine the mode:

| First Arg | Mode File |
|-----------|-----------|
| `system` | [modes/system.md](modes/system.md) |
| `components` | [modes/components.md](modes/components.md) |
| `mock` | [modes/mock.md](modes/mock.md) |
| `implement` | [modes/implement.md](modes/implement.md) |
| `feedback` | [modes/feedback.md](modes/feedback.md) |
| `<spec-id>` or none | Full flow (see below) |

---

## Full Flow

When no mode is specified or a spec-id is provided, run the full design flow.

### 1. Resolve Spec

If argument provided:
- Look up `.otto/specs/{spec-id}.md`
- Error if not found

If no argument:
- Find most recent spec in `.otto/specs/` by modification time
- Error if no specs exist

### 2. Auto-Skip Detection

Check what already exists to skip completed phases:

```bash
# Check for design tokens
if [ -f "src/lib/design-tokens.ts" ]; then
  SKIP_SYSTEM=true
fi

# Check for base components
if [ -d "src/components/ui" ] && [ "$(ls -A src/components/ui 2>/dev/null)" ]; then
  SKIP_COMPONENTS=true
fi
```

### 3. Execute Phases

Run phases in sequence, skipping as appropriate:

```
Phase 1: System      (skip if design-tokens.ts exists)
Phase 2: Components  (skip if components/ui/ has files)
Phase 3: Mock        (always run)
Phase 4: Implement   (always run)
Phase 5: Feedback    (always run)
```

Report skipped phases at the start:
```
Design flow for spec: my-app-a1b2

Skipping: System (design-tokens.ts exists)
Skipping: Components (ui/ has 9 components)

Starting at: Mock
```

### 4. Phase Transitions

After each phase completes successfully:
1. Summarize what was created
2. Confirm before proceeding to next phase
3. Allow user to stop or jump to specific phase

---

## Output Directory

All design artifacts go to `.otto/design/`:

| Output | Path |
|--------|------|
| Style guide source | `.otto/design/style-guide.md` |
| Style guide HTML | `.otto/design/style-guide.html` |
| Wireframe mocks | `.otto/design/mocks/{spec-id}/` |

Project outputs go to source:

| Output | Path |
|--------|------|
| Design tokens | `src/lib/design-tokens.ts` |
| Tailwind config | `tailwind.config.ts` |
| Base components | `src/components/ui/` |
| Component stories | `src/components/ui.stories/` |
| Feature pages | `src/pages/` or `src/app/` |

---

## Accessibility Requirements

All generated code must meet WCAG 2.1 AA:

- 4.5:1 contrast ratio for text
- 3:1 contrast ratio for UI elements
- Visible focus indicators
- Full keyboard navigation
- Proper ARIA labels
