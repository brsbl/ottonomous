# Mock Mode

Generate terminal wireframes from a product spec for approval before implementing.

**Spec ID:** $ARGUMENTS

---

## 1. Load Spec

Read the spec file from `.otto/specs/{spec-id}.md` and extract:

| Extract | Look For |
|---------|----------|
| Pages/views | Headings like "Pages", "Views", "Screens", or user flows |
| Components | UI elements mentioned (forms, tables, navigation) |
| User flows | Step-by-step interactions described |
| Layout preferences | Any mentions of sidebar, header, grid, etc. |

If the spec file doesn't exist, inform the user and exit.

---

## 2. Create Output Directory

```bash
mkdir -p .otto/design/mocks/{spec-id}/
```

---

## 3. Identify Views

Build a list of all pages/views that need wireframes:

| View Name | Description | Status |
|-----------|-------------|--------|
| login | User authentication | pending |
| dashboard | Main overview | pending |
| settings | User preferences | pending |

---

## 4. Wireframe Format

Use Unicode box-drawing characters for clean, readable mockups.

### Semantic Annotations

| Symbol | Meaning | Example |
|--------|---------|---------|
| `[===TEXT===]` | Primary button | `[=== Sign In ===]` |
| `[ TEXT ]` | Secondary button | `[ Cancel ]` |
| `[PLACEHOLDER]` | Image/logo placeholder | `[LOGO]` |
| `┌────┐` | Input field | See below |
| `───` | Divider | `──── or ────` |
| `( * ) ( )` | Radio buttons | `( * ) Option A  ( ) Option B` |
| `[x] [ ]` | Checkboxes | `[x] Remember me  [ ] Newsletter` |

### Input Field Format

```
┌────────────────────────────┐
│ Placeholder text           │
└────────────────────────────┘
```

### Complete Example

```
┌──────────────────────────────────────┐
│              [LOGO]                  │
├──────────────────────────────────────┤
│                                      │
│   ┌────────────────────────────┐     │
│   │ Email                      │     │
│   └────────────────────────────┘     │
│   ┌────────────────────────────┐     │
│   │ Password                   │     │
│   └────────────────────────────┘     │
│                                      │
│   [x] Remember me                    │
│                                      │
│   [======== Sign In ========]        │
│                                      │
│   ─────────── or ───────────         │
│                                      │
│   [ G  Google ]  [ F  Facebook ]     │
│                                      │
│   Forgot password?                   │
│                                      │
└──────────────────────────────────────┘
```

---

## 5. Generate Wireframe

For each pending view:

### 5.1 Analyze Requirements

Read the spec section for this view and identify:
- Layout structure (header, sidebar, main content, footer)
- Components needed (forms, tables, cards, lists)
- Interactive elements (buttons, links, inputs)
- Data to display (text, images, placeholders)

### 5.2 Draw Wireframe

Create the wireframe using the semantic annotations above.

**Guidelines:**
- Use consistent widths (40-60 characters typical)
- Align elements logically
- Show realistic placeholder content
- Include all interactive elements from spec
- Mark required fields with `*`
- Show error states if relevant

### 5.3 Display for Review

Output the wireframe with a header:

```
=== View: {view-name} ===

{wireframe}

---
Feedback? ("looks good" to approve, or describe changes)
```

---

## 6. Approval Loop

Handle user feedback for each wireframe:

| User Response | Action |
|---------------|--------|
| "looks good" / "approve" / "lgtm" | Mark approved, save, next view |
| "make X wider/narrower" | Adjust layout, regenerate |
| "add X above/below Y" | Add element, regenerate |
| "remove X" | Remove element, regenerate |
| "move X to Y" | Reposition, regenerate |
| Other feedback | Interpret and apply changes |

### 6.1 On Approval

1. Save wireframe to `.otto/design/mocks/{spec-id}/{view-name}.txt`
2. Update status to `approved`
3. Move to next pending view

### 6.2 On Feedback

1. Parse the feedback for requested changes
2. Regenerate the wireframe with changes applied
3. Display updated wireframe
4. Ask for feedback again

---

## 7. Save Wireframe

Write approved wireframe to file:

```
.otto/design/mocks/{spec-id}/{view-name}.txt
```

Include metadata header:

```
# Wireframe: {view-name}
# Spec: {spec-id}
# Approved: {timestamp}
# ---

{wireframe content}
```

---

## 8. Track Progress

Maintain approval status for all views:

```
=== Mock Progress: {spec-id} ===

[x] login - approved
[x] dashboard - approved
[ ] settings - pending
[ ] profile - pending

2/4 views approved
```

---

## 9. Complete

When all views are approved:

1. Display summary:
   ```
   === All Wireframes Approved ===

   Saved to: .otto/design/mocks/{spec-id}/

   Files:
   - login.txt
   - dashboard.txt
   - settings.txt
   - profile.txt

   Ready for implementation with `/design implement {spec-id}`
   ```

2. Return to caller (full flow continues to implement phase)

---

## Wireframe Patterns

### Navigation Header

```
┌──────────────────────────────────────────────────┐
│ [LOGO]   Home   Products   About   [ Sign In ]   │
└──────────────────────────────────────────────────┘
```

### Sidebar Layout

```
┌────────────┬─────────────────────────────────────┐
│            │                                     │
│  Dashboard │   Main Content Area                 │
│  Users     │                                     │
│  Settings  │   ┌─────────────────────────────┐   │
│  Reports   │   │ Content card                │   │
│            │   └─────────────────────────────┘   │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### Data Table

```
┌──────────────────────────────────────────────────┐
│ Name           │ Email              │ Actions    │
├──────────────────────────────────────────────────┤
│ John Doe       │ john@example.com   │ [Edit] [x] │
│ Jane Smith     │ jane@example.com   │ [Edit] [x] │
│ Bob Wilson     │ bob@example.com    │ [Edit] [x] │
└──────────────────────────────────────────────────┘
```

### Form with Validation

```
┌────────────────────────────────────┐
│ Email *                            │
└────────────────────────────────────┘
  ! Please enter a valid email

┌────────────────────────────────────┐
│ Password *                         │
└────────────────────────────────────┘
  Min 8 characters

[======== Submit ========]  [ Cancel ]
```

### Card Grid

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ [IMAGE]     │  │ [IMAGE]     │  │ [IMAGE]     │
│             │  │             │  │             │
│ Card Title  │  │ Card Title  │  │ Card Title  │
│ Description │  │ Description │  │ Description │
│ [ Action ]  │  │ [ Action ]  │  │ [ Action ]  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Modal Dialog

```
          ┌────────────────────────────┐
          │  Confirm Delete            │
          ├────────────────────────────┤
          │                            │
          │  Are you sure you want     │
          │  to delete this item?      │
          │                            │
          │  [ Cancel ]  [=== Delete ===]
          │                            │
          └────────────────────────────┘
```

### Tab Navigation

```
┌─────────┬─────────┬─────────┐
│ General │ Privacy │ Billing │ (active: General)
└─────────┴─────────┴─────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│   Tab content here                              │
│                                                 │
└─────────────────────────────────────────────────┘
```
