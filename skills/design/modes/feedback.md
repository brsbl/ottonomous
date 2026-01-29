# Feedback Mode

Live browser annotation for visual refinement. Click elements, describe changes, iterate rapidly.

**Command:** `/design feedback [url]`

---

## Setup

Start the browser server before running feedback mode:

```bash
cd skills/otto/lib/browser && npm i && node server.js &
```

Wait for `Server running` message before proceeding.

---

## Key Principles

1. **One change at a time**: Process each annotation before the next
2. **Verify changes**: Screenshot after each edit to confirm
3. **Use selectors**: Feedback includes CSS selectors for grep
4. **Disconnect to exit**: Always call `client.disconnect()` when done

---

## Workflow

| Step | Action |
|------|--------|
| 1 | Navigate to URL |
| 2 | Inject feedback overlay |
| 3 | Wait for annotation |
| 4 | Process change (grep → edit → save) |
| 5 | Verify with screenshot |
| 6 | Loop to step 3 until user closes overlay |

---

### 1. Initialize and Navigate

```javascript
import { connect, waitForPageLoad } from './lib/browser/client.js'

const client = await connect({ headless: false })
const page = await client.page('feedback')
const url = args.url || 'http://localhost:5173'

await page.goto(url)
await waitForPageLoad(page)
```

Use `headless: false` so user can interact with the overlay.

---

### 2. Inject Feedback Overlay

```javascript
await client.injectDesignFeedback('feedback')
await client.activateDesignFeedbackMode('feedback')
```

This adds:
- Floating toolbar (bottom of page)
- Element highlight on hover
- Annotation popup for feedback entry

---

### 3. Wait for Annotation

```javascript
const feedback = await client.waitForFeedbackSubmission('feedback')
```

Returns array of feedback objects when user clicks Submit/Send All.

### Feedback Object

| Field | Description |
|-------|-------------|
| `selector` | CSS selector for grep |
| `element` | Short identifier: `button.cta` |
| `note` | User's change request |
| `ariaRole` | Element type: button, link, textbox |
| `boundingBox` | `{ x, y, width, height }` |

```javascript
{
  selector: "main > div.hero > button.cta",
  element: "button.cta",
  note: "Make this button larger and blue",
  ariaRole: "button",
  boundingBox: { x: 450, y: 320, width: 180, height: 48 }
}
```

---

### 4. Process Change

For each feedback item:

1. **Find source file** using selector classes
   ```bash
   grep -r "hero" src/components/
   grep -r "cta" src/components/
   ```

2. **Read and edit** the source file

3. **Apply the change** described in `note`

---

### 5. Verify

Wait for HMR, then screenshot:

```javascript
await page.waitForTimeout(1000)
await page.screenshot({ path: '.otto/design/feedback-verify.png' })
```

Read screenshot to confirm change applied correctly.

---

### 6. Loop or Exit

```javascript
while (true) {
  const feedback = await client.waitForFeedbackSubmission('feedback')

  if (feedback.length === 0) break  // User closed overlay

  for (const item of feedback) {
    // Step 4: Process
    // Step 5: Verify
  }
}

await client.disconnect()
```

---

## Overlay Controls

| Button | Action |
|--------|--------|
| **Annotate** | Toggle element selection mode |
| **Save** | Queue annotation for batch |
| **Submit** | Send single annotation now |
| **Send All** | Submit all queued annotations |
| **Close** | Exit feedback mode |

**Keyboard:** `Escape` closes popup, `Enter` submits annotation

---

## Error Recovery

If something goes wrong, debug with:

```javascript
import { connect } from './lib/browser/client.js'

const client = await connect()
const page = await client.page('feedback')

await page.screenshot({ path: '.otto/design/debug.png' })
console.log({
  url: page.url(),
  title: await page.title()
})

await client.disconnect()
```

---

## Client API

| Method | Description |
|--------|-------------|
| `injectDesignFeedback(name)` | Add overlay to page |
| `activateDesignFeedbackMode(name)` | Enable click-to-annotate |
| `deactivateDesignFeedbackMode(name)` | Disable selection |
| `waitForFeedbackSubmission(name)` | Block until user submits |
| `clearSubmittedFeedback(name)` | Clear and return feedback |
| `getSavedFeedbackCount(name)` | Count queued annotations |
