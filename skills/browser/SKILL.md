---
name: browser
description: Ad-hoc browser automation for data extraction, verification, and UI exploration. Use when inspecting frontend state, verifying UI works, extracting page data, or planning UI changes.
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

## Setup

```javascript
import { connect, waitForPageLoad } from 'skills/otto/lib/browser/client.js'

const client = await connect({ headless: true })
```

---

## Navigate & Capture

```javascript
const page = await client.page('main')
await page.goto('http://localhost:3000')
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

## Cleanup

```javascript
await client.disconnect()
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
