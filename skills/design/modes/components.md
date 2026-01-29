# Components Mode

Generate base UI components using Radix Primitives, styled with the design system.

---

## Prerequisites

Check for design tokens before proceeding:

| Check | Path | Action if Missing |
|-------|------|-------------------|
| Design tokens | `src/lib/design-tokens.ts` | Prompt user to run `/design system` first |

If tokens don't exist:
```
Design tokens not found at src/lib/design-tokens.ts

Run `/design system` first to create your design system, then run `/design components`.
```

---

## 1. Detect Package Manager

| File | Manager | Install Command |
|------|---------|-----------------|
| `pnpm-lock.yaml` | pnpm | `pnpm add` |
| `yarn.lock` | yarn | `yarn add` |
| `package-lock.json` | npm | `npm install` |
| `bun.lockb` | bun | `bun add` |

Default to `npm` if no lockfile found.

---

## 2. Install Radix Dependencies

Install all required Radix primitives:

```bash
<manager> @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-tabs lucide-react
```

---

## 3. Generate Components

Create each component in `src/components/ui/`:

| Component | File | Radix Primitive | Variants |
|-----------|------|-----------------|----------|
| Button | `button.tsx` | - | primary, secondary, ghost, destructive; sm, md, lg |
| Input | `input.tsx` | - | default, error; with label, description, error message |
| Select | `select.tsx` | `@radix-ui/react-select` | single select with search |
| Checkbox | `checkbox.tsx` | `@radix-ui/react-checkbox` | with label |
| Radio | `radio.tsx` | `@radix-ui/react-radio-group` | group with options |
| Dialog | `dialog.tsx` | `@radix-ui/react-dialog` | modal with title, description, actions |
| Dropdown | `dropdown.tsx` | `@radix-ui/react-dropdown-menu` | menu with items, separators |
| Tooltip | `tooltip.tsx` | `@radix-ui/react-tooltip` | hover tooltip |
| Tabs | `tabs.tsx` | `@radix-ui/react-tabs` | horizontal tabs |
| Index | `index.ts` | - | barrel export for all components |

---

## 4. Component Requirements

Each component MUST follow these requirements:

### 4.1 Styling

- Use Tailwind classes referencing design tokens from `src/lib/design-tokens.ts`
- Import tokens and use them for colors, spacing, typography
- Example: `bg-primary`, `text-foreground`, `rounded-md`, `gap-sm`

### 4.2 Accessibility

- Full ARIA support from Radix primitives (automatic)
- Visible focus rings using design token colors:
  ```tsx
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  ```
- Proper color contrast (minimum 4.5:1 for text, 3:1 for UI elements)
- Full keyboard navigation support

### 4.3 TypeScript

- Fully typed props interface extending HTML element attributes
- JSDoc comments for all public props
- Use `React.forwardRef` for DOM element access
- Example structure:

```tsx
import * as React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
```

### 4.4 Utility Function

Create `src/lib/utils.ts` if it doesn't exist:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install dependencies if needed: `clsx` and `tailwind-merge`

---

## 5. Generate Ladle Stories

Create stories in `src/components/ui.stories/` for each component:

| Component | Story File |
|-----------|------------|
| Button | `button.stories.tsx` |
| Input | `input.stories.tsx` |
| Select | `select.stories.tsx` |
| Checkbox | `checkbox.stories.tsx` |
| Radio | `radio.stories.tsx` |
| Dialog | `dialog.stories.tsx` |
| Dropdown | `dropdown.stories.tsx` |
| Tooltip | `tooltip.stories.tsx` |
| Tabs | `tabs.stories.tsx` |

### Story Format

Each story file must show all variants:

```tsx
import { Button } from '../ui/button'

export default {
  title: 'UI/Button',
}

export const Primary = () => <Button variant="primary">Primary</Button>

export const Secondary = () => <Button variant="secondary">Secondary</Button>

export const Ghost = () => <Button variant="ghost">Ghost</Button>

export const Destructive = () => <Button variant="destructive">Delete</Button>

export const Sizes = () => (
  <div className="flex items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
)

export const Disabled = () => (
  <Button disabled>Disabled</Button>
)
```

---

## 6. Create Barrel Export

Create `src/components/ui/index.ts`:

```typescript
export { Button, type ButtonProps } from './button'
export { Input, type InputProps } from './input'
export { Select, type SelectProps } from './select'
export { Checkbox, type CheckboxProps } from './checkbox'
export { Radio, RadioGroup, type RadioProps } from './radio'
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog'
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './dropdown'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
```

---

## 7. Update Style Guide

After generating components, update `.otto/design/style-guide.md` with component documentation:

### Components Section

Add to the "Components" section:

```markdown
## Components

### Button
Variants: primary, secondary, ghost, destructive
Sizes: sm, md, lg
Usage: `<Button variant="primary" size="md">Click me</Button>`

### Input
Variants: default, error
Features: label, description, error message support
Usage: `<Input label="Email" placeholder="Enter email" />`

[... document each component ...]
```

---

## 8. Verify Installation

Run checks to ensure components work:

1. **TypeScript check**: `npx tsc --noEmit`
2. **Lint check**: Run project linter
3. **Ladle build**: `npx ladle build` (if Ladle is configured)

Fix any errors before completing.

---

## Output Summary

After completion, report:

- Components created: list of files in `src/components/ui/`
- Stories created: list of files in `src/components/ui.stories/`
- Dependencies installed: list of Radix packages
- Style guide updated: `.otto/design/style-guide.md`

```
Components generated successfully!

Created:
  src/components/ui/
    button.tsx
    input.tsx
    select.tsx
    checkbox.tsx
    radio.tsx
    dialog.tsx
    dropdown.tsx
    tooltip.tsx
    tabs.tsx
    index.ts

  src/components/ui.stories/
    button.stories.tsx
    input.stories.tsx
    select.stories.tsx
    checkbox.stories.tsx
    radio.stories.tsx
    dialog.stories.tsx
    dropdown.stories.tsx
    tooltip.stories.tsx
    tabs.stories.tsx

Run `npx ladle serve` to preview components in the browser.
```
