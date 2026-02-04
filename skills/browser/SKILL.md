---
name: browser
description: Browser automation with persistent page state for navigation, screenshots, forms, data extraction, and testing. Use when inspecting UI, taking screenshots, filling forms, extracting page data, verifying frontend behavior, or automating browser workflows.
argument-hint: [url | explore | verify | extract]
model: opus
allowed-tools: Read, Bash(node *), Bash(mkdir *)
---

**Argument:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `{url}` | Navigate to URL, capture screenshot and ARIA snapshot |
| `explore` | Interactive exploration - navigate, inspect, understand UI |
| `verify {description}` | Verify specific UI behavior or state |
| `extract {description}` | Extract specific data from the frontend |

---

## Choosing Your Approach

- **Local/source-available sites**: Read source code first to write selectors directly
- **Unknown layouts**: Use `getAISnapshot()` for element discovery and `selectSnapshotRef()` for interactions
- **Visual feedback**: Take screenshots to observe results

---

## Setup

Start the browser server before running scripts:

```bash
node skills/otto/lib/browser/server.js &
```

Wait for "Ready" message, then connect:

```javascript
import { connect, waitForPageLoad } from 'skills/otto/lib/browser/client.js'

const client = await connect({ headless: true })
```

---

## Writing Scripts

Run scripts using `npx tsx` with heredocs for inline execution.

**Key Principles:**
1. Small scripts doing one action each
2. Evaluate state at completion
3. Use descriptive page names
4. Call `await client.disconnect()` to exit (pages persist)
5. Use plain JavaScript in `page.evaluate()` (no TypeScript syntax)

---

## Workflow Loop

1. Write script performing one action
2. Run and observe output
3. Evaluate results and current state
4. Decide: complete or need another script?
5. Repeat until task complete

---

## Navigate & Capture

Determine the dev server URL from package.json scripts, running processes, or project config.

```javascript
const page = await client.page('main')
await page.goto(url)  // e.g., http://localhost:5173
await waitForPageLoad(page)

// Screenshot
await page.screenshot({ path: '.otto/screenshots/page.png' })

// ARIA snapshot
const snapshot = await client.getAISnapshot('main')
console.log(snapshot)
```

---

## Interact

```javascript
// Click by ref
const btn = await client.selectSnapshotRef('main', 'e3')
await btn.click()

// Fill input by ref
const input = await client.selectSnapshotRef('main', 'e5')
await input.fill('user@example.com')

// Re-capture after interaction
await waitForPageLoad(page)
const newSnapshot = await client.getAISnapshot('main')
```

---

## Waiting

```javascript
await waitForPageLoad(page)
await page.waitForSelector('.results')
await page.waitForURL('**/success')
```

---

## No TypeScript in Browser Context

Code in `page.evaluate()` runs in browser context without TypeScript support. Use plain JavaScript only—type annotations break at runtime.

```javascript
// ✓ Correct
await page.evaluate(() => {
  const items = document.querySelectorAll('.item')
  return items.length
})

// ✗ Wrong - TypeScript syntax fails
await page.evaluate(() => {
  const items: NodeListOf<Element> = document.querySelectorAll('.item')
  return items.length
})
```

---

## Cleanup

```javascript
await client.disconnect()
```

After completing the workflow, remove screenshots:

```bash
rm -rf .otto/screenshots
```

---

## ARIA Snapshot Format

```yaml
- banner:
  - link "Home" [ref=e1]
- main:
  - heading "Welcome" [ref=e2]
  - form:
    - textbox "Email" [ref=e3]
    - button "Submit" [disabled] [ref=e4]
```

Use `[ref=eN]` values with `selectSnapshotRef()` to interact.

---

## Error Recovery

Page state persists after failures. Debug using screenshots and state inspection to evaluate current conditions before next action.

```javascript
// After an error, reconnect and inspect
const client = await connect({ headless: true })
const snapshot = await client.getAISnapshot('main')
await client.page('main').then(p => p.screenshot({ path: '.otto/screenshots/debug.png' }))
```

---

## Scraping Data

For large datasets, intercept and replay network requests rather than scrolling the DOM. See [references/scraping.md](references/scraping.md) for the complete guide covering request capture, schema discovery, and paginated API replay.
