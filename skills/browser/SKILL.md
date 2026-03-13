---
name: browser
description: Browser automation for web apps and Electron desktop apps. Supports navigation, screenshots, ARIA snapshots, forms, data extraction, and visual verification. Use when inspecting UI, verifying frontend behavior, or automating browser/desktop workflows.
argument-hint: [url | explore | verify | extract | electron]
model: opus
allowed-tools: Bash(agent-browser *), Bash(npx agent-browser *), Bash(open *), Bash(kill *), Bash(sleep *), Bash(curl *), Bash(lsof *), Read
---

**Argument:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `{url}` | Navigate to URL, capture screenshot + ARIA snapshot |
| `explore` | Interactive exploration — navigate, inspect, understand UI |
| `verify {description}` | Verify specific UI behavior or state |
| `extract {description}` | Extract data from frontend |
| `electron {app}` | Automate Electron/VS Code desktop app |

---

## Web Mode (default)

### Navigate & Capture

```bash
agent-browser open {url}
agent-browser wait 3000
agent-browser snapshot -i
agent-browser screenshot .otto/screenshots/page.png
```

### Interact

```bash
# Click by ref from snapshot
agent-browser click @e5

# Fill input
agent-browser fill @e3 "user@example.com"

# Press keys
agent-browser press Enter

# Re-snapshot after interaction
agent-browser snapshot -i
```

### Workflow Loop

1. Snapshot to discover elements
2. Interact using refs (@e1, @e2...)
3. Re-snapshot after navigation or state changes
4. Refs are invalidated on page changes — always re-snapshot

---

## Electron Mode

Automate Electron desktop apps (VS Code, Slack, Discord, Figma, etc.)
via Chrome DevTools Protocol.

### Launch with CDP

The app must be launched with `--remote-debugging-port`:

```bash
# VS Code
open -a "Visual Studio Code" --args --remote-debugging-port=9333

# VS Code with extension development
code --extensionDevelopmentPath=./ --disable-extensions \
     --remote-debugging-port=9333 --skip-release-notes .

# Generic Electron app
open -a "AppName" --args --remote-debugging-port=9333

# Linux
code --remote-debugging-port=9333
```

**Important:** Quit the app first if already running. The flag must be present at launch.

### Connect & Interact

```bash
# Wait for app startup
sleep 5

# Connect
agent-browser connect 9333

# Standard snapshot-interact workflow
agent-browser snapshot -i
agent-browser click @e5
agent-browser screenshot .otto/screenshots/electron.png
```

### Webview Support

Electron apps embed webviews as separate targets. Use tab management:

```bash
# List all targets (windows + webviews)
agent-browser tab
# Output:
#   0: [page]    VS Code - main window
#   1: [webview] Chat Panel content
#   2: [webview] Settings editor

# Switch to webview
agent-browser tab 1
agent-browser snapshot -i
agent-browser screenshot .otto/screenshots/webview.png
```

### VS Code Extension Verification Pattern

```bash
# 1. Build the extension
npm run compile

# 2. Launch VS Code with extension
code --extensionDevelopmentPath=./ --disable-extensions \
     --remote-debugging-port=9333 --skip-release-notes . &
APP_PID=$!
sleep 8

# 3. Connect
agent-browser connect 9333

# 4. Check main window
agent-browser snapshot -i

# 5. Check webviews (if extension has webview panels)
agent-browser tab
agent-browser tab 1
agent-browser snapshot -i
agent-browser screenshot .otto/screenshots/extension.png

# 6. Cleanup
agent-browser close
kill $APP_PID
```

---

## Diffing (Verify Changes)

```bash
# Snapshot diff — see what changed after an action
agent-browser snapshot -i
agent-browser click @e2
agent-browser diff snapshot

# Screenshot diff — visual regression
agent-browser screenshot baseline.png
# ... make changes ...
agent-browser diff screenshot --baseline baseline.png
```

---

## Cleanup

```bash
agent-browser close
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

Use `@eN` values (e.g., `@e3`) with interaction commands.
