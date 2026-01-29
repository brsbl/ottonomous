# Implement Mode

Generate actual pages and components from approved wireframes.

**Command:** `/design implement <spec-id>`

---

## Prerequisites

Before running implement mode, verify these exist:

| Requirement | Location | Check |
|-------------|----------|-------|
| Approved wireframes | `.otto/design/mocks/{spec-id}/` | At least one `.txt` file |
| Design tokens | `src/lib/design-tokens.ts` | Token definitions |
| Base components | `src/components/ui/` | Button, Input, etc. |

If prerequisites are missing:
- No wireframes: Run `/design mock <spec-id>` first
- No tokens: Run `/design system` first
- No components: Run `/design components` first

---

## 1. Load Approved Wireframes

Read all wireframe files from `.otto/design/mocks/{spec-id}/`:

```bash
ls .otto/design/mocks/{spec-id}/*.txt
```

For each wireframe file, extract:
- Page/view name from filename
- Layout structure from ASCII art
- Component annotations (buttons, inputs, etc.)
- Semantic markers (primary actions, navigation, etc.)

---

## 2. Analyze Structure

For each wireframe, map the ASCII layout to a component tree:

| Wireframe Symbol | Component |
|------------------|-----------|
| `[===TEXT===]` | `<Button variant="primary">` |
| `[ TEXT ]` | `<Button variant="secondary">` |
| `┌────┐` (input box) | `<Input>` |
| `( * ) ( )` | `<RadioGroup>` |
| `[x] [ ]` | `<Checkbox>` |
| `[PLACEHOLDER]` | `<img>` or placeholder div |
| `───` (divider) | `<hr>` or separator |

Create a mental component tree:
```
Page
├── Header
│   └── Logo, Navigation
├── Main
│   ├── Form
│   │   ├── Input (email)
│   │   ├── Input (password)
│   │   └── Button (submit)
│   └── Social Login
│       └── Button (google), Button (facebook)
└── Footer
    └── Links
```

---

## 3. Generate Page Components

Create React components for each page in `src/pages/` or `src/app/` (depending on project structure).

### Detect Project Structure

| Pattern | Page Location | Route Style |
|---------|---------------|-------------|
| `src/app/` exists | `src/app/{page}/page.tsx` | Next.js App Router |
| `src/pages/` exists | `src/pages/{page}.tsx` | Next.js Pages / Vite |
| Neither exists | Create `src/pages/{page}.tsx` | Default to pages |

### Page Template

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// ... other imports from ui/

export default function PageName() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page content using base components */}
    </div>
  )
}
```

---

## 4. Generate Feature Components

For complex sections, extract into feature components in `src/components/`:

| Complexity | Action |
|------------|--------|
| Simple (1-3 elements) | Inline in page |
| Medium (4-10 elements) | Extract to feature component |
| Complex (reusable) | Extract to shared component |

### Feature Component Location

```
src/components/
├── ui/              # Base components (already exist)
├── {feature}/       # Feature-specific components
│   ├── login-form.tsx
│   ├── social-buttons.tsx
│   └── index.ts
```

---

## 5. Apply Design Tokens

Use Tailwind classes that reference the design tokens:

### Token Mapping

| Token Category | Tailwind Class Pattern |
|----------------|------------------------|
| Colors | `bg-primary`, `text-foreground`, `border-border` |
| Spacing | `p-sm`, `gap-md`, `mt-lg` |
| Typography | `text-lg`, `font-heading` |
| Radius | `rounded-md`, `rounded-lg` |
| Shadows | `shadow-sm`, `shadow-md` |

### Example Usage

```tsx
<div className="flex flex-col gap-md p-lg bg-surface rounded-lg shadow-md">
  <h1 className="text-2xl font-heading text-foreground">
    Welcome
  </h1>
  <Input
    placeholder="Email"
    className="border-border focus:ring-primary"
  />
  <Button variant="primary" className="mt-md">
    Sign In
  </Button>
</div>
```

---

## 6. Create Routes

If the project uses a router, update route configuration:

### Next.js App Router

Routes are file-based. Creating `src/app/{page}/page.tsx` automatically registers the route.

### Next.js Pages Router / React Router

Update route configuration as needed:

```tsx
// Example: React Router
<Route path="/login" element={<LoginPage />} />
<Route path="/dashboard" element={<DashboardPage />} />
```

---

## 7. Verify Implementation

Start the dev server and verify each page:

### Start Dev Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Verification Checklist

For each implemented page:

- [ ] Page loads without errors
- [ ] Layout matches wireframe structure
- [ ] All components render correctly
- [ ] Design tokens are applied (colors, spacing, typography)
- [ ] Interactive elements work (buttons, inputs, links)
- [ ] Responsive behavior is reasonable

---

## 8. Output Summary

Report what was created:

| Output Type | Location |
|-------------|----------|
| Page components | `src/pages/` or `src/app/` |
| Feature components | `src/components/{feature}/` |
| Route updates | Router config (if applicable) |

Example summary:
```
Created pages:
  - src/pages/login.tsx
  - src/pages/dashboard.tsx
  - src/pages/settings.tsx

Created components:
  - src/components/auth/login-form.tsx
  - src/components/auth/social-buttons.tsx
  - src/components/dashboard/stats-card.tsx
```

---

## 9. Transition to Feedback

After implementation is complete:

1. **Ensure dev server is running** - Start if not already running
2. **Navigate to implemented pages** - Open in browser
3. **Enter feedback mode** - Run `/design feedback` for visual iteration

The feedback loop allows clicking elements in the browser and requesting changes, enabling rapid visual refinement without context switching.
