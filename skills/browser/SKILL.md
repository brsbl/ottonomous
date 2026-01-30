---
name: browser
description: Ad-hoc browser automation for data extraction, verification, and UI exploration. Use when inspecting frontend state, verifying UI works, extracting page data, or planning UI changes.
argument-hint: [url | explore | verify | extract]
model: sonnet
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

## Browser Client

**CRITICAL: Create exactly ONE browser client. Do NOT call `connect()` more than once.**

```javascript
import { connect, waitForPageLoad } from 'skills/otto/lib/browser/client.js'

// Call connect() ONCE - headless so no visible window
const client = await connect({ headless: true })
```

**Rules:**
- Call `connect()` exactly ONCE per session
- Reuse `client` for ALL pages and ALL operations
- Only call `client.disconnect()` at the very end
- NEVER create multiple browser instances

**Core operations:**
```javascript
// Get or create named page
const page = await client.page('main')

// Navigate
await page.goto('http://localhost:3000')
await waitForPageLoad(page)

// Screenshot
await page.screenshot({ path: '.otto/screenshots/page.png' })

// ARIA snapshot (accessibility tree with refs)
const snapshot = await client.getAISnapshot('main')

// Interact by ref
const button = await client.selectSnapshotRef('main', 'e3')
await button.click()

// Cleanup when done
await client.disconnect()
```

---

## 1. Navigate to URL

If `$ARGUMENTS` is a URL or starts with `http`:

1. Initialize browser client
2. Navigate to URL
3. Wait for page load
4. Capture screenshot to `.otto/screenshots/`
5. Get ARIA snapshot
6. Present both to understand current state
7. Ask what the user wants to do next

---

## 2. Explore Mode

Interactive UI exploration for understanding structure before making changes.

### Steps

1. Initialize browser client
2. Ask: "What URL should I explore?"
3. Navigate and capture initial state
4. Present screenshot + ARIA snapshot
5. Loop:
   - Ask: "What would you like to explore?" with options:
     - "Click element" → prompt for ref, click, re-capture
     - "Fill input" → prompt for ref and value, fill, re-capture
     - "Navigate to" → prompt for URL, navigate, re-capture
     - "Done exploring" → summarize findings, disconnect

### Output

Summarize findings:
- Page structure and key elements
- Navigation paths discovered
- Interactive elements and their states
- Recommendations for UI changes

---

## 3. Verify Mode

Verify specific UI behavior or state.

**Usage:** `/browser verify {description}`

### Steps

1. Parse what to verify from description
2. Ask: "What URL should I check?" (if not obvious)
3. Initialize browser client
4. Navigate to target page
5. Capture screenshot + ARIA snapshot
6. Check for expected state:
   - Element presence/absence
   - Text content
   - Enabled/disabled states
   - Visual layout
7. If interactions needed:
   - Perform action (click, fill, submit)
   - Re-capture state
   - Verify result
8. Report: PASS or FAIL with evidence

### Example Verifications

- "verify the login form submits correctly"
- "verify the nav shows 5 menu items"
- "verify the button is disabled when form is empty"
- "verify the error message appears for invalid email"

---

## 4. Extract Mode

Extract specific data from the frontend.

**Usage:** `/browser extract {description}`

### Steps

1. Parse what to extract from description
2. Ask: "What URL has this data?" (if not obvious)
3. Initialize browser client
4. Navigate to target page
5. Get ARIA snapshot for structured data
6. Extract requested information:
   - Text content from elements
   - List items
   - Table data
   - Form values
   - Element states
7. Format and return extracted data

### Example Extractions

- "extract all product names from the catalog"
- "extract the current user's profile data"
- "extract error messages from the form"
- "extract nav menu items"

---

## ARIA Snapshot Format

The snapshot provides a structured view of the page:

```yaml
- banner:
  - link "Home" [ref=e1]
  - navigation:
    - link "Products" [ref=e2]
    - link "About" [ref=e3]
- main:
  - heading "Welcome" [ref=e4]:
    - /level: 1
  - form:
    - textbox "Email" [ref=e5]
    - textbox "Password" [ref=e6]
    - button "Submit" [disabled] [ref=e7]
- contentinfo:
  - text "© 2026 Company"
```

**Use refs to interact:**
```javascript
const emailInput = await client.selectSnapshotRef('main', 'e5')
await emailInput.fill('user@example.com')
```

---

## Tips

- **ONE client only**: Call `connect({ headless: true })` exactly once, reuse for everything
- **Named pages**: `client.page('main')` returns same page if called again - no new windows
- **Wait for load**: Always call `waitForPageLoad(page)` after navigation
- **Screenshots**: Save to `.otto/screenshots/` for review
- **Refs change**: After any DOM change, get a fresh ARIA snapshot
- **Cleanup**: Call `client.disconnect()` only when completely done
