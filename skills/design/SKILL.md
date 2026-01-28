---
name: design
description: Interactive design tools for UI development. Live feedback loop for annotating elements and editing code.
argument-hint: <feedback> [URL]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `feedback` | Live annotation loop (default: http://localhost:5173) |
| `feedback <url>` | Live annotation loop with custom URL |

---

# Feedback Mode

Use `feedback` mode for live, interactive code editing based on user annotations.

## Two Interaction Models

The feedback overlay supports two ways to send annotations to Claude:

### 1. Submit (Immediate)
Click **Submit** to send a single annotation immediately. Claude processes it right away.

Best for: Quick fixes, one-off changes, iterative refinement.

### 2. Save + Send All (Batch)
Click **Save** to store annotations locally. When ready, click **Send All** in the toolbar to batch submit all saved annotations.

Best for: Collecting multiple related changes, reviewing before submitting, complex multi-element updates.

## F1. Launch Browser

Launch a non-headless browser and navigate to the dev server:

```javascript
import { connect, waitForPageLoad } from 'skills/otto/lib/browser/client.js'

const client = await connect({ headless: false })
const page = await client.page('feedback')
await page.goto(url) // Default: http://localhost:5173
await waitForPageLoad(page)
```

## F2. Inject Feedback Overlay

Inject the design feedback overlay for element selection:

```javascript
await client.injectDesignFeedback('feedback')
await client.activateDesignFeedbackMode('feedback')
```

The overlay provides:
- **Annotate** button - Toggle annotation mode (click elements to select)
- **N saved** - Count of saved (not yet submitted) annotations
- **Send All** - Batch submit all saved annotations
- **Close** - Exit feedback mode

When clicking an element, the popup shows:
- **Cancel** - Dismiss without saving
- **Save** - Store locally for batch submission later
- **Submit** - Send immediately to Claude

## F3. Wait for Feedback

Wait for the user to submit feedback (either via Submit or Send All):

```javascript
// Wait indefinitely for user to submit
const feedback = await client.waitForFeedbackSubmission('feedback')

// Or with timeout
const feedback = await client.waitForFeedbackSubmission('feedback', { timeout: 60000 })
```

Feedback structure:
```javascript
{
  id: "fb_1706123456789_1",
  selector: ".sidebar > button.primary",
  boundingBox: { x: 100, y: 200, width: 80, height: 32 },
  text: "Submit",
  note: "Make this button blue and larger",
  timestamp: 1706123456789,
  ariaRole: "button",
  elementPath: "div.sidebar > button.btn.primary",
  element: "button.btn.primary"
}
```

## F4. Process Feedback

For each feedback item received:

### F4.1 Get Page Context

Get ARIA snapshot for additional context:

```javascript
const ariaSnapshot = await client.getAISnapshot('feedback')
```

### F4.2 Find Source Files

Use multiple strategies to locate the source file:

1. **Grep for selector classes/IDs:**
   ```bash
   grep -r "primary" --include="*.tsx" --include="*.jsx" --include="*.css"
   ```

2. **Search for element text content:**
   ```bash
   grep -r "Submit" --include="*.tsx" --include="*.jsx"
   ```

3. **Component name heuristic:** Look for React components matching the element structure

4. **User hint:** If the note contains "in file X" or "@filename", prioritize that file

### F4.3 Edit Code

Based on the feedback note and context:

1. Read the identified source file(s)
2. Locate the specific element using selector/text context
3. Make the requested change
4. Write the updated file

**Common feedback patterns:**

| Note pattern | Action |
|--------------|--------|
| "Make this blue" | Change color/background-color CSS |
| "Make this larger" | Increase font-size/padding/dimensions |
| "Add a border" | Add border CSS property |
| "Change text to X" | Update text content |
| "Remove this" | Delete the element |
| "Move this above Y" | Reorder elements in markup |

### F4.4 Wait for Hot Reload

After editing, wait for HMR to update the page:

```javascript
await waitForPageLoad(page, { idleTime: 1000 })
```

### F4.5 Verify Change

1. Take screenshot for comparison
2. Get fresh ARIA snapshot
3. Confirm the change was applied

## F5. Main Loop

```javascript
while (true) {
  // Wait for user to submit feedback
  const feedbackItems = await client.waitForFeedbackSubmission('feedback')

  for (const feedback of feedbackItems) {
    // Get context
    const snapshot = await client.getAISnapshot('feedback')

    // Find source and edit
    await processFeedback(feedback, snapshot)

    // Wait for hot reload
    await waitForPageLoad(page, { idleTime: 1000 })
  }
}
```

## F6. Handle Edge Cases

**Element has no clear source file:**
- Ask user which file contains this element
- Use broader grep patterns

**Feedback is ambiguous:**
- Ask clarifying question before editing
- Example: "Make this bigger" - bigger how? font, padding, or overall size?

**Hot reload fails:**
- Detect page errors or blank screen
- Undo the change if possible
- Notify user and wait for next instruction

**Multiple matching elements:**
- Use ARIA snapshot context to disambiguate
- Use bounding box to identify the specific instance

## F7. Exit Feedback Mode

User can exit feedback loop by:
- Clicking "Close" button on the overlay
- Pressing Escape key
- Closing the browser window

When exiting, disconnect the browser client:

```javascript
await client.disconnect()
```

## F8. Example Session

```
$ /design feedback http://localhost:5173

Opening browser at http://localhost:5173...
Feedback overlay injected. Click elements to annotate.

[User clicks a button, types "Make this green", clicks Submit]

Received feedback:
  Element: button.submit-btn
  Note: "Make this green"

Finding source file...
  Found: src/components/Form.tsx:45

Editing Form.tsx...
  Changed: className="submit-btn" → className="submit-btn bg-green-500"

Waiting for hot reload...
Change applied successfully.

[User clicks header, types "Center this", clicks Save]
[User clicks subheader, types "Make italic", clicks Save]
[User clicks "Send All"]

Received 2 feedback items:
  1. h1.page-title: "Center this"
  2. p.subtitle: "Make italic"

Processing batch...
  Editing Home.tsx (2 changes)...

Waiting for hot reload...
All changes applied successfully.

[User clicks Close]

Feedback session ended.
  Total feedback processed: 3
  Files modified: 2
```
