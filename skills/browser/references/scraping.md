# Data Scraping Guide

Intercept and replay network requests rather than scrolling the DOM. APIs return structured data with pagination built in—faster and more reliable than browser automation.

## Why Avoid Scrolling

Scrolling is slow, unreliable, and wastes time. For large datasets (followers, posts, search results), API replay is always preferable.

---

## Workflow

### 1. Capture Request Details

Monitor outgoing requests to identify API endpoints:

```javascript
const captured = []

page.on('request', req => {
  const url = req.url()
  if (url.includes('/api/') || url.includes('/graphql/')) {
    captured.push({
      url,
      method: req.method(),
      headers: req.headers(),
      postData: req.postData()
    })
    console.log('Captured:', url)
  }
})

// Trigger the action that loads data
await page.click('[data-testid="load-more"]')
```

### 2. Inspect Response Schema

Capture raw API responses to understand structure:

```javascript
page.on('response', async res => {
  const url = res.url()
  if (url.includes('/api/users')) {
    const data = await res.json()
    console.log('Schema:', JSON.stringify(data, null, 2))
  }
})
```

Identify:
- Location of data arrays (e.g., `data.users`, `response.items`)
- Pagination cursor fields (e.g., `nextCursor`, `page_info.end_cursor`)
- Required fields for extraction

### 3. Implement Pagination Loop

Replay requests using `page.evaluate(fetch)` to inherit browser auth:

```javascript
const allResults = new Map() // Dedupe by ID
let cursor = null

while (true) {
  const response = await page.evaluate(async (cursor) => {
    const url = new URL('https://api.example.com/users')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })
    return res.json()
  }, cursor)

  // Extract items
  for (const item of response.data) {
    allResults.set(item.id, item)
  }

  // Check for more pages
  cursor = response.nextCursor
  if (!cursor || response.data.length === 0) break

  // Rate limit
  await new Promise(r => setTimeout(r, 500))
}

console.log(`Collected ${allResults.size} items`)
```

---

## Essential Patterns

| Pattern | Purpose |
|---------|---------|
| `page.on('request')` | Intercept outgoing requests |
| `page.on('response')` | Capture response data |
| `page.evaluate(fetch)` | Execute requests with browser auth |
| Map-based deduplication | Handle overlapping data across pages |
| Cursor-based iteration | Manage pagination tokens |

---

## Tips

### Authentication

Extract headers from intercepted requests rather than accessing cookies directly:

```javascript
let authHeaders = {}

page.on('request', req => {
  if (req.url().includes('/api/')) {
    authHeaders = req.headers()
  }
})
```

### Rate Limiting

Implement 500ms+ delays between requests to avoid detection/blocking:

```javascript
await new Promise(r => setTimeout(r, 500))
```

### Stopping Conditions

Check for:
- Empty results array
- Missing/null cursor
- Timestamp thresholds (for time-based data)
- Maximum item count reached

### GraphQL APIs

Capture and reuse `variables` and `features` JSON from requests:

```javascript
page.on('request', req => {
  if (req.url().includes('/graphql/')) {
    const body = JSON.parse(req.postData())
    console.log('Query:', body.queryId)
    console.log('Variables:', body.variables)
    console.log('Features:', body.features)
  }
})
```

---

## Remember

Validate each step before scaling. Get one page working, then add pagination. Incremental development catches issues early.
