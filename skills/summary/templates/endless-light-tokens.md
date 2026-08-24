# Endless Color light tokens for optional Moss HTML

Use this literal palette only when the summary genuinely needs a scoped
`moss-html` node. Moss HTML is isolated, so it cannot inherit the host
application's theme variables.

```css
:root {
  color-scheme: light;
  --surface: #f1f2f4; /* --canvas */
  --panel: #fdfdff; /* --card */
  --ink: #0a0a0a; /* --ink */
  --muted: #3a3a3a; /* --muted-foreground */
  --line: rgba(90, 80, 48, 0.30); /* --border */
  --control-line: rgba(90, 80, 48, 0.55); /* --input */
  --accent: #2e6f95; /* --primary */
  --accent-soft: rgba(121, 173, 214, 0.30); /* --surface-selected */
  --risk: #872a14; /* --destructive-text */
  --risk-soft: rgba(40, 44, 60, 0.05); /* --surface-recessed */
  --radius: 12px; /* --radius */
  --shadow-sm: 0 0 0 1px rgba(90, 80, 48, 0.10), 0 2px 8px -1px rgba(70, 80, 130, 0.22), 0 1px 3px 0 rgba(46, 111, 149, 0.10); /* --shadow-sm */
  --shadow: 0 0 0 1px rgba(90, 80, 48, 0.10), 0 2px 8px -1px rgba(70, 80, 130, 0.22), 0 1px 3px 0 rgba(46, 111, 149, 0.10); /* --shadow */
}

body {
  font-family: "Helvetica Neue", Helvetica, "Inter Variable", Inter, sans-serif;
}

code,
pre {
  font-family: "Courier Prime", "Courier New", Courier, "American Typewriter", monospace;
}
```

Do not substitute a generic palette, fetch remote fonts or styles, or add
runtime coupling to the host application's theme variables.
