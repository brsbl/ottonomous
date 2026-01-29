# Design System Mode

Define the design system through an interview wizard, generating tokens, config, and documentation.

---

## 1. Check Prerequisites

Before starting, verify project setup:

| Check | Action if missing |
|-------|-------------------|
| `package.json` exists | Create with `npm init -y` |
| `tailwind.config.ts` exists | Will be created by this wizard |
| `src/lib/` directory exists | Create with `mkdir -p src/lib` |

## 2. Interview Wizard

Walk the user through each topic. Ask questions, provide examples, and capture their preferences.

### 2.1 Project Context

Ask about:
- **Project name**: What is the project called?
- **Design philosophy**: What feeling should the design convey?

Offer philosophy examples:
| Philosophy | Characteristics |
|------------|-----------------|
| Minimal | Clean lines, ample whitespace, muted colors |
| Playful | Rounded corners, vibrant colors, friendly typography |
| Corporate | Professional, structured, brand-focused |
| Bold | High contrast, strong typography, dramatic spacing |
| Organic | Natural colors, soft shapes, warm tones |

### 2.2 Color Palette

Ask about each color category:

| Category | Purpose | Example |
|----------|---------|---------|
| **Primary** | Brand color, main CTAs | `#3B82F6` (blue) |
| **Secondary** | Supporting actions, accents | `#6366F1` (indigo) |
| **Accent** | Highlights, special elements | `#F59E0B` (amber) |
| **Success** | Positive states, confirmations | `#10B981` (emerald) |
| **Warning** | Cautions, alerts | `#F59E0B` (amber) |
| **Error** | Errors, destructive actions | `#EF4444` (red) |
| **Info** | Informational states | `#3B82F6` (blue) |
| **Neutrals** | Backgrounds, borders, text | Gray scale |

For neutrals, ask about:
- Background color (light mode)
- Surface color (cards, panels)
- Border color
- Text primary color
- Text secondary color
- Text muted color

Offer to generate a cohesive palette from their primary color if they want suggestions.

### 2.3 Typography

Ask about font preferences:

| Property | Options | Default |
|----------|---------|---------|
| **Sans-serif stack** | System fonts, Inter, custom | `Inter, system-ui, sans-serif` |
| **Monospace stack** | System mono, Fira Code, custom | `ui-monospace, SFMono-Regular, monospace` |
| **Base size** | 14px, 16px, 18px | 16px |
| **Scale ratio** | 1.125, 1.2, 1.25, 1.333 | 1.25 (major third) |

Generate font size scale based on base and ratio:

| Token | Scale | Example (16px base, 1.25 ratio) |
|-------|-------|--------------------------------|
| `micro` | base / ratio^2 | 10.24px |
| `xs` | base / ratio | 12.8px |
| `sm` | base * 0.875 | 14px |
| `base` | base | 16px |
| `lg` | base * ratio | 20px |
| `xl` | base * ratio^2 | 25px |
| `2xl` | base * ratio^3 | 31.25px |
| `3xl` | base * ratio^4 | 39px |
| `4xl` | base * ratio^5 | 48.8px |

Ask about line heights:
| Usage | Recommended |
|-------|-------------|
| Headings | 1.1 - 1.2 |
| Body | 1.5 - 1.6 |
| Tight (labels) | 1.25 |

### 2.4 Spacing

Ask about spacing preferences:

| Property | Options | Default |
|----------|---------|---------|
| **Base unit** | 4px, 8px | 4px |
| **Scale** | Linear, geometric | Linear (multipliers) |

Generate spacing scale:

| Token | Multiplier | Example (4px base) |
|-------|------------|-------------------|
| `px` | 1px | 1px |
| `0.5` | 0.5x | 2px |
| `1` | 1x | 4px |
| `2` | 2x | 8px |
| `3` | 3x | 12px |
| `4` | 4x | 16px |
| `5` | 5x | 20px |
| `6` | 6x | 24px |
| `8` | 8x | 32px |
| `10` | 10x | 40px |
| `12` | 12x | 48px |
| `16` | 16x | 64px |
| `20` | 20x | 80px |
| `24` | 24x | 96px |

### 2.5 Other Tokens

Ask about additional design tokens:

**Border Radii:**
| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Sharp corners |
| `sm` | 2px | Subtle rounding |
| `md` | 4px | Default buttons/inputs |
| `lg` | 8px | Cards, modals |
| `xl` | 12px | Large containers |
| `2xl` | 16px | Prominent elements |
| `full` | 9999px | Pills, avatars |

**Shadows:**
| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `xl` | `0 20px 25px rgba(0,0,0,0.15)` | Floating elements |

**Transitions:**
| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 100ms | Micro-interactions |
| `normal` | 200ms | Standard transitions |
| `slow` | 300ms | Complex animations |

### 2.6 Accessibility Requirements

Ask about accessibility preferences:

| Setting | Options | Default |
|---------|---------|---------|
| **Contrast ratio** | WCAG AA (4.5:1), WCAG AAA (7:1) | AA (4.5:1) |
| **Focus ring style** | Ring, outline, combined | Ring |
| **Focus ring color** | Match primary, custom | Primary color |
| **Focus ring width** | 2px, 3px | 2px |
| **Focus ring offset** | 0, 2px | 2px |

---

## 3. Generate Design Tokens

Create `src/lib/design-tokens.ts` with all collected values:

```typescript
// Design Tokens - Generated by /design system
// Project: {projectName}
// Philosophy: {philosophy}

export const colors = {
  primary: {
    50: '{primary-50}',
    100: '{primary-100}',
    // ... full scale
    500: '{primary}',
    // ... full scale
    900: '{primary-900}',
  },
  secondary: { /* ... */ },
  accent: { /* ... */ },
  success: { /* ... */ },
  warning: { /* ... */ },
  error: { /* ... */ },
  info: { /* ... */ },
  neutral: {
    50: '{neutral-50}',
    // ... full scale
    950: '{neutral-950}',
  },
} as const

export const typography = {
  fonts: {
    sans: '{sans-stack}',
    mono: '{mono-stack}',
  },
  sizes: {
    micro: '{micro}',
    xs: '{xs}',
    sm: '{sm}',
    base: '{base}',
    lg: '{lg}',
    xl: '{xl}',
    '2xl': '{2xl}',
    '3xl': '{3xl}',
    '4xl': '{4xl}',
  },
  lineHeights: {
    tight: '{tight}',
    normal: '{normal}',
    relaxed: '{relaxed}',
  },
} as const

export const spacing = {
  px: '1px',
  0.5: '{0.5}',
  1: '{1}',
  // ... full scale
} as const

export const radii = {
  none: '0',
  sm: '{sm}',
  md: '{md}',
  lg: '{lg}',
  xl: '{xl}',
  '2xl': '{2xl}',
  full: '9999px',
} as const

export const shadows = {
  sm: '{sm}',
  md: '{md}',
  lg: '{lg}',
  xl: '{xl}',
} as const

export const transitions = {
  fast: '{fast}',
  normal: '{normal}',
  slow: '{slow}',
} as const

export const accessibility = {
  focusRing: {
    width: '{width}',
    color: '{color}',
    offset: '{offset}',
    style: '{style}',
  },
  contrastRatio: '{ratio}',
} as const

export type Colors = typeof colors
export type Typography = typeof typography
export type Spacing = typeof spacing
export type Radii = typeof radii
export type Shadows = typeof shadows
export type Transitions = typeof transitions
```

## 4. Generate Tailwind Config

Create or update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import { colors, typography, spacing, radii, shadows, transitions } from './src/lib/design-tokens'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        neutral: colors.neutral,
      },
      fontFamily: {
        sans: [typography.fonts.sans],
        mono: [typography.fonts.mono],
      },
      fontSize: typography.sizes,
      lineHeight: typography.lineHeights,
      spacing: spacing,
      borderRadius: radii,
      boxShadow: shadows,
      transitionDuration: {
        fast: transitions.fast,
        normal: transitions.normal,
        slow: transitions.slow,
      },
    },
  },
  plugins: [],
} satisfies Config
```

## 5. Generate Style Guide

Create two files in `.otto/design/`:

### 5.1 Style Guide Source (style-guide.md)

```markdown
# {Project} Style Guide

## Design Principles

{3-5 guiding principles based on philosophy}

## Color System

| Token | Hex | Usage |
|-------|-----|-------|
| primary-500 | {hex} | Main brand color, primary buttons |
| secondary-500 | {hex} | Secondary actions |
| ... | ... | ... |

## Typography

### Font Stacks
- **Sans**: {sans-stack}
- **Mono**: {mono-stack}

### Size Scale
| Token | Size | Usage |
|-------|------|-------|
| micro | {size} | Fine print, labels |
| xs | {size} | Captions |
| ... | ... | ... |

## Spacing System

Base unit: {base}px

| Token | Value | Usage |
|-------|-------|-------|
| 1 | {value} | Tight spacing |
| 2 | {value} | Default gap |
| ... | ... | ... |

## Components

{Reserved section - populated by Components phase}

## Accessibility

- **Contrast Ratio**: {ratio}
- **Focus Ring**: {width}px {color} with {offset}px offset
- **Keyboard Navigation**: All interactive elements focusable
```

### 5.2 Style Guide HTML (style-guide.html)

Generate an interactive HTML file with:
- Color swatches rendered as visual blocks
- Typography samples at each scale
- Spacing visualization
- Copy-to-clipboard for token values
- Dark/light mode toggle (if applicable)

The HTML should be self-contained with inline styles and include:
- Project name and philosophy header
- Color palette grid with swatches
- Typography specimen section
- Spacing scale visualization
- Border radius examples
- Shadow examples
- Focus ring preview

---

## 6. Create Output Directories

Ensure directories exist:

```bash
mkdir -p src/lib
mkdir -p .otto/design
```

## 7. Write Files

Write all generated files:

| File | Path |
|------|------|
| Design tokens | `src/lib/design-tokens.ts` |
| Tailwind config | `tailwind.config.ts` |
| Style guide (MD) | `.otto/design/style-guide.md` |
| Style guide (HTML) | `.otto/design/style-guide.html` |

## 8. Verify & Report

After generating files:

1. **Type check**: Run `npx tsc --noEmit` to verify tokens file
2. **Open style guide**: Offer to open `.otto/design/style-guide.html` in browser

Report summary:
- Files created with paths
- Design philosophy summary
- Primary color and accent colors
- Font families
- Base spacing unit
- Accessibility settings
- Next steps (suggest running `/design components`)
