---
name: test
description: Runs lint, type check, tests, and visual verification. Auto-detects tools (ESLint/Biome, TypeScript/mypy, vitest/jest/pytest/cargo) and sets up missing ones.
argument-hint: <run | write | browser | annotate | all> [staged | uncommitted | branch | URL]
model: opus
---

**Arguments:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `run` | Lint + type check + run tests (branch) |
| `run staged` | Lint + type check + run tests (staged) |
| `run uncommitted` | Lint + type check + run tests (uncommitted) |
| `run branch` | Lint + type check + run tests (branch) |
| `write` | Generate tests, then run full pipeline (branch) |
| `write staged` | Generate tests, then run full pipeline (staged) |
| `write uncommitted` | Generate tests, then run full pipeline (uncommitted) |
| `write branch` | Generate tests, then run full pipeline (branch) |
| `browser` | Visual verification + element interaction (branch) |
| `browser staged` | Visual verification + element interaction (staged) |
| `browser uncommitted` | Visual verification + element interaction (uncommitted) |
| `browser branch` | Visual verification + element interaction (branch) |
| `annotate` | Live annotation loop (default: http://localhost:5173) |
| `annotate <url>` | Live annotation loop with custom URL |
| `all` | run + browser combined (branch) |
| `all staged` | run + browser combined (staged) |
| `all uncommitted` | run + browser combined (uncommitted) |
| `all branch` | run + browser combined (branch) |

**Scope determines which files to analyze:**

| Scope | Git command |
|-------|-------------|
| `branch` (default) | `git diff main...HEAD --name-only` |
| `staged` | `git diff --cached --name-only` |
| `uncommitted` | `git diff --name-only` |

---

## 1. Detect Test Runner

| File | Runner | Command |
|------|--------|---------|
| `package.json` with vitest | Vitest | `npx vitest run` |
| `package.json` with jest | Jest | `npx jest` |
| `package.json` with `"test"` | npm | `npm test` |
| `pyproject.toml` or `pytest.ini` | pytest | `pytest` |
| `Cargo.toml` | cargo | `cargo test` |
| `go.mod` | go | `go test ./...` |

If no test runner found, set one up:

## 2. Setup Test Harness (if needed)

**JavaScript/TypeScript:**
```bash
npm install -D vitest
```

Create `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.{js,ts}'],
  },
})
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

**Python:** `pip install pytest`

**Rust/Go:** Built-in test runners, no setup needed.

---

## 3. Detect Linter

| File/Config | Linter | Command |
|-------------|--------|---------|
| `.eslintrc*` or `eslint.config.*` | ESLint | `npx eslint .` |
| `biome.json` | Biome | `npx biome check .` |
| `pyproject.toml` with `[tool.ruff]` | Ruff | `ruff check .` |
| `Cargo.toml` | Clippy | `cargo clippy -- -D warnings` |
| `go.mod` | go vet | `go vet ./...` |

If no linter found, set one up:

## 4. Setup Linter (if needed)

**JavaScript/TypeScript:**
```bash
npm install -D eslint @eslint/js
```

Create `eslint.config.js`:
```javascript
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
]
```

**Python:**
```bash
pip install ruff
```

Add to `pyproject.toml`:
```toml
[tool.ruff]
line-length = 100
select = ["E", "F", "W"]
```

**Rust:** Clippy is included with rustup, no setup needed.

**Go:** go vet is built-in, no setup needed.

---

## 5. Detect Type Checker

| File/Config | Checker | Command |
|-------------|---------|---------|
| `tsconfig.json` | TypeScript | `npx tsc --noEmit` |
| `pyproject.toml` with mypy | mypy | `mypy .` |
| `Cargo.toml` | (built into cargo) | (covered by `cargo clippy`) |
| `go.mod` | (built into go) | (covered by `go vet`) |

If no type checker found for TypeScript/Python projects, set one up:

## 6. Setup Type Checker (if needed)

**TypeScript (if .ts/.tsx files exist but no tsconfig.json):**
```bash
npm install -D typescript
npx tsc --init
```

The generated `tsconfig.json` provides sensible defaults. Adjust `strict` and `target` as needed.

**Python (if .py files exist but no mypy config):**
```bash
pip install mypy
```

Add to `pyproject.toml`:
```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_ignores = true
```

**Rust/Go:** Type checking is built into the compiler, no setup needed.

---

## 7. Run Lint

Run the detected linter command.

**If lint errors found:** Fix the issues before proceeding. Re-run until all lint checks pass.

## 8. Run Type Check

Run the detected type checker command.

**If type errors found:** Fix the issues before proceeding. Re-run until all type checks pass.

---

## 9. Generate Tests (write mode)

If `write` is specified, generate tests for code changes before running.

### Get Changed Files

Use the git command from the scope table above.

### Identify Testable Code

Look for **pure functions** - functions with no side effects that take inputs and return outputs.

**Good candidates:**
- Input validation/parsing (argument parsers, validators)
- String formatting/transformation (template generators, formatters)
- Data aggregation/calculation (reducers, calculators)
- Configuration parsing (frontmatter, YAML, JSON parsers)

**Signs of pure functions:**
- No `fs.readFile`, `fetch`, `console.log`, or other I/O
- No modification of external state
- Same inputs always produce same outputs

### Extract Pure Functions (if needed)

If testable logic is mixed with I/O, extract pure functions into separate modules that can be imported and tested independently.

### Write Tests

For each testable function, ensure coverage of:

**Test Categories Checklist:**
- [ ] **Happy path** - normal expected inputs
- [ ] **Edge cases** - empty, null, undefined, boundary values
- [ ] **Invalid inputs** - wrong types, malformed data
- [ ] **Boundary conditions** - min/max values, array limits
- [ ] **Error handling** - graceful failures, meaningful errors

---

## 10. Run Tests

Run the detected test command and save output to `.otto/test-results/output.log`.

**If tests fail:** Read the error output, fix the code, and re-run until all tests pass.

## 11. Report (run/write modes)

Summarize results:
- Lint: pass/fail (errors fixed if any)
- Type check: pass/fail (errors fixed if any)
- Unit test pass/fail counts
- Location of test logs

---

# Browser Mode

Use `browser` mode for visual verification and element interaction testing.

## B1. Get Changed Files

Use the scope to determine which files changed (see git commands in table above).

## B2. Identify Affected Pages/Routes

Map code changes to UI locations:
- Component files → pages that render them
- API routes → pages that call them
- Style files → pages that use them

## B3. Navigate to Page

Use browser client to load the page:
```javascript
import { createBrowserClient } from './lib/browser/client.js'
const client = await createBrowserClient()
await client.navigate('http://localhost:3000/affected-route')
```

## B4. Visual Inspection

1. Capture screenshot to `./test-screenshots/`
2. Read the screenshot and check for:
   - Layout issues (overlapping elements, broken alignment)
   - Missing or incorrect content
   - Styling problems (wrong colors, fonts, spacing)
   - Error states or blank screens

## B5. Get ARIA Snapshot

Use `getAISnapshot()` to get the accessibility tree with refs:
```javascript
const snapshot = await client.getAISnapshot('page-name')
```

**Snapshot format:**
```yaml
- banner:
  - link "Home" [ref=e1]
- main:
  - heading "Welcome" [ref=e2]:
    - /level: 1
  - button "Submit" [disabled] [ref=e3]
```

## B6. Interact with Elements

Use `selectSnapshotRef()` to get element handles:
```javascript
const button = await client.selectSnapshotRef('page-name', 'e3')
await button.click()
```

**Interaction types:**
- Click buttons, links, interactive elements
- Fill form inputs with test data
- Check state changes ([checked], [disabled], [expanded])
- Verify expected behavior after interactions

## B7. Multi-Step Flows

Test user journeys by chaining interactions:
1. Fill form inputs
2. Submit form
3. Verify success state or navigation
4. Check for expected content changes

## B8. Fix Issues

If problems found:
1. Fix the code causing the issue
2. Re-navigate to the page
3. Re-verify the fix

## B9. Report (browser mode)

Summarize results:
- Pages tested
- Interactions performed
- Issues found and fixed
- Location of screenshots

---

# All Mode

Use `all` mode to run both `run` and `browser` modes sequentially.

1. Execute steps 1-11 (run mode)
2. Execute steps B1-B9 (browser mode)
3. Combined report with all results

---

# Annotate Mode

Use `annotate` mode for live, interactive code editing based on user annotations.

**How it works:**
1. Opens browser (non-headless) at the specified URL
2. Injects an annotation overlay into the page
3. User clicks elements and types what should change
4. Claude Code receives each annotation immediately
5. Claude Code edits the code based on the annotation
6. Hot reload shows changes instantly
7. User can annotate again - repeat until satisfied

## A1. Launch Browser

Launch a non-headless browser and navigate to the dev server:

```javascript
import { connect, waitForPageLoad } from 'skills/otto/lib/browser/client.js'

const client = await connect({ headless: false })
const page = await client.page('annotate')
await page.goto(url) // Default: http://localhost:5173
await waitForPageLoad(page)
```

## A2. Inject Annotation Overlay

Inject the Agentation overlay for element selection:

```javascript
await client.injectAgentation('annotate')
await client.activateAnnotationMode('annotate')
```

The overlay provides:
- Click any element to select it
- Type a note describing what should change
- Submit to send annotation to Claude Code

## A3. Watch Annotation Loop

Poll for new annotations and process each one:

```javascript
const controller = new AbortController()

await client.watchAnnotations('annotate', async (annotation) => {
  // annotation structure:
  // {
  //   id: "ann_1706123456789_1",
  //   selector: ".sidebar > button.primary",
  //   boundingBox: { x: 100, y: 200, width: 80, height: 32 },
  //   text: "Submit",
  //   note: "Make this button blue and larger",
  //   timestamp: 1706123456789,
  //   ariaRole: "button",
  //   elementPath: "div.sidebar > button.btn.primary",
  //   element: "button.btn.primary"
  // }

  await processAnnotation(annotation)
}, { signal: controller.signal })
```

## A4. Process Each Annotation

For each annotation received:

### A4.1 Get Page Context

Get ARIA snapshot for additional context:

```javascript
const ariaSnapshot = await client.getAISnapshot('annotate')
```

### A4.2 Find Source Files

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

### A4.3 Edit Code

Based on the annotation note and context:

1. Read the identified source file(s)
2. Locate the specific element using selector/text context
3. Make the requested change
4. Write the updated file

**Common annotation patterns:**

| Note pattern | Action |
|--------------|--------|
| "Make this blue" | Change color/background-color CSS |
| "Make this larger" | Increase font-size/padding/dimensions |
| "Add a border" | Add border CSS property |
| "Change text to X" | Update text content |
| "Remove this" | Delete the element |
| "Move this above Y" | Reorder elements in markup |

### A4.4 Wait for Hot Reload

After editing, wait for HMR to update the page:

```javascript
await waitForPageLoad(page, { idleTime: 1000 })
```

### A4.5 Verify Change

1. Take screenshot for comparison
2. Get fresh ARIA snapshot
3. Confirm the change was applied

## A5. Handle Edge Cases

**Element has no clear source file:**
- Ask user which file contains this element
- Use broader grep patterns

**Annotation is ambiguous:**
- Ask clarifying question before editing
- Example: "Make this bigger" - bigger how? font, padding, or overall size?

**Hot reload fails:**
- Detect page errors or blank screen
- Undo the change if possible
- Notify user and wait for next instruction

**Multiple matching elements:**
- Use ARIA snapshot context to disambiguate
- Use bounding box to identify the specific instance

## A6. Exit Annotation Mode

User can exit annotation loop by:
- Clicking "Close" button on the overlay
- Pressing Escape key
- Closing the browser window

When exiting, disconnect the browser client:

```javascript
controller.abort()
await client.disconnect()
```

## A7. Example Session

```
$ /test annotate http://localhost:5173

Opening browser at http://localhost:5173...
Annotation overlay injected. Click elements to annotate.

[User clicks a button, types "Make this green"]

Received annotation:
  Element: button.submit-btn
  Note: "Make this green"

Finding source file...
  Found: src/components/Form.tsx:45

Editing Form.tsx...
  Changed: className="submit-btn" → className="submit-btn bg-green-500"

Waiting for hot reload...
Change applied successfully.

[User clicks header, types "Center this text"]

Received annotation:
  Element: h1.page-title
  Note: "Center this text"

Finding source file...
  Found: src/pages/Home.tsx:12

Editing Home.tsx...
  Changed: className="page-title" → className="page-title text-center"

Waiting for hot reload...
Change applied successfully.

[User clicks Close]

Annotation session ended.
  Total annotations processed: 2
  Files modified: 2
```
