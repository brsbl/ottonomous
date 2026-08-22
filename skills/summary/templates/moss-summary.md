# {{TITLE}}

{{TAKEAWAY}}

## Change overview

{{OVERVIEW}}

## Explore the change

<!-- Duplicate cards as needed. Remove every empty lens and its filter button. -->

```moss-html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="moss-html-version" content="v1">
<link rel="icon" href="data:,">
<title>{{ARTIFACT_TITLE}}</title>
<style>
  * { box-sizing: border-box; }
  :root {
    color-scheme: light;
    /* Resolved from the Endless Color bb theme's light-mode tokens. Moss HTML
       is isolated, so these values cannot inherit the active bb variables. */
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
  html { min-height: 760px; background: var(--surface); }
  body {
    width: 100%;
    max-width: 1200px;
    min-height: 760px;
    margin: 0 auto;
    background: var(--surface);
    color: var(--ink);
    font-family: "Helvetica Neue", Helvetica, "Inter Variable", Inter, sans-serif;
  }
  button { font: inherit; }
  .artifact { min-height: 760px; padding: 32px; }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 28px;
    align-items: end;
    padding: 26px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .eyebrow {
    margin: 0 0 10px;
    color: var(--accent);
    font-size: 13px;
    font-weight: 760;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h1 { max-width: 760px; margin: 0; font-size: 36px; line-height: 1.1; letter-spacing: -0.03em; }
  .lede { max-width: 760px; margin: 14px 0 0; color: var(--muted); font-size: 18px; line-height: 1.55; }
  .metrics { display: grid; grid-template-columns: repeat(2, 112px); gap: 10px; }
  .metric { padding: 16px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
  .metric strong { display: block; font-size: 28px; line-height: 1; }
  .metric span { display: block; margin-top: 7px; color: var(--muted); font-size: 12px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 14px; }
  .filter {
    min-height: 40px;
    padding: 9px 14px;
    border: 1px solid var(--control-line);
    border-radius: 999px;
    background: var(--panel);
    color: var(--ink);
    cursor: pointer;
  }
  .filter:hover { border-color: var(--accent); }
  .filter:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .filter[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--ink); font-weight: 700; }
  .filter span { margin-left: 5px; color: var(--muted); font-size: 12px; }
  .result-count { min-height: 20px; margin: 0 0 16px; color: var(--muted); font-size: 13px; }
  .cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .card { padding: 22px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); box-shadow: var(--shadow-sm); }
  .card[hidden] { display: none; }
  .card-top { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
  .kind { display: inline-flex; padding: 5px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--ink); font-size: 11px; font-weight: 760; letter-spacing: 0.06em; text-transform: uppercase; }
  .card[data-kind="risk"] .kind { background: var(--risk-soft); color: var(--risk); }
  .scope { color: var(--muted); font-family: "Courier Prime", "Courier New", Courier, "American Typewriter", monospace; font-size: 12px; }
  .card h2 { margin: 14px 0 8px; font-size: 20px; line-height: 1.25; }
  .card p { margin: 0; color: var(--muted); line-height: 1.55; }
  .card footer { margin-top: 17px; padding-top: 14px; border-top: 1px solid var(--line); color: var(--ink); font-size: 13px; line-height: 1.45; }
  @media (max-width: 820px) {
    .artifact { padding: 20px; }
    .hero { grid-template-columns: 1fr; }
    .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cards { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <main class="artifact">
    <header class="hero">
      <div>
        <p class="eyebrow">Change map · {{SCOPE_LABEL}}</p>
        <h1>{{MAP_HEADING}}</h1>
        <p class="lede">{{MAP_GUIDANCE}}</p>
      </div>
      <div class="metrics" aria-label="Change metrics">
        <div class="metric"><strong>{{FILES_CHANGED}}</strong><span>files changed</span></div>
        <div class="metric"><strong>{{REVIEW_AREAS}}</strong><span>review areas</span></div>
      </div>
    </header>

    <nav class="toolbar" aria-label="Filter change map">
      <button class="filter" type="button" data-filter="all" aria-pressed="true">All <span>{{ALL_COUNT}}</span></button>
      <button class="filter" type="button" data-filter="outcome" aria-pressed="false">Outcome <span>{{OUTCOME_COUNT}}</span></button>
      <button class="filter" type="button" data-filter="architecture" aria-pressed="false">Architecture <span>{{ARCHITECTURE_COUNT}}</span></button>
      <button class="filter" type="button" data-filter="risk" aria-pressed="false">Risk <span>{{RISK_COUNT}}</span></button>
      <button class="filter" type="button" data-filter="evidence" aria-pressed="false">Evidence <span>{{EVIDENCE_COUNT}}</span></button>
    </nav>
    <p class="result-count" aria-live="polite">Showing {{ALL_COUNT}} change cards</p>

    <section class="cards" aria-label="Change cards">
      <article class="card" data-kind="outcome">
        <div class="card-top"><span class="kind">Outcome</span><span class="scope">{{CARD_SCOPE}}</span></div>
        <h2>{{CARD_TITLE}}</h2>
        <p>{{CARD_EXPLANATION}}</p>
        <footer>{{CARD_EVIDENCE}}</footer>
      </article>
    </section>
  </main>
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const buttons = Array.from(document.querySelectorAll(".filter"));
      const cards = Array.from(document.querySelectorAll(".card"));
      const result = document.querySelector(".result-count");

      for (const button of buttons) {
        button.addEventListener("click", () => {
          const selected = button.dataset.filter;
          let visible = 0;

          for (const candidate of buttons) {
            candidate.setAttribute("aria-pressed", String(candidate === button));
          }
          for (const card of cards) {
            const show = selected === "all" || card.dataset.kind === selected;
            card.hidden = !show;
            if (show) visible += 1;
          }
          result.textContent = `Showing ${visible} ${visible === 1 ? "change card" : "change cards"}`;
        });
      }
    });
  </script>
</body>
</html>
```

## Reviewer focus

- **{{REVIEW_AREA}}:** {{REVIEW_GUIDANCE}}

## Breaking changes

{{BREAKING_CHANGES}}

## Validation

- {{VALIDATION_RESULT}}

## Files changed

| File | Semantic change |
| --- | --- |
| [{{FILE_PATH}}]({{FILE_URL}}) | {{FILE_SUMMARY}} |

## Sources and limits

{{SOURCES_AND_LIMITS}}
