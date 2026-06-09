#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import {
  escapeHtml,
  generateMetadataHtml,
  parseArgs,
  parseFrontmatter,
} from "./md-to-html.utils.js";

// Configure marked with syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

// Enable GitHub Flavored Markdown
marked.use({ gfm: true });

const htmlTemplate = (content, title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #24292f;
      --border-color: #d0d7de;
      --code-bg: #f6f8fa;
      --link-color: #0969da;
      --blockquote-color: #57606a;
      --meta-bg: #f6f8fa;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --border-color: #30363d;
        --code-bg: #161b22;
        --link-color: #58a6ff;
        --blockquote-color: #8b949e;
        --meta-bg: #161b22;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
      line-height: 1.6;
      color: var(--text-color);
      background: var(--bg-color);
    }

    h1 {
      font-size: 2em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.3em;
      margin-top: 24px;
    }

    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.3em;
      margin-top: 24px;
    }

    h3 {
      font-size: 1.25em;
      margin-top: 24px;
    }

    code {
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 85%;
    }

    pre {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      line-height: 1.45;
    }

    pre code {
      background: none;
      padding: 0;
      font-size: 100%;
    }

    blockquote {
      border-left: 4px solid var(--border-color);
      margin: 0;
      padding: 0 16px;
      color: var(--blockquote-color);
    }

    a {
      color: var(--link-color);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    ul, ol {
      padding-left: 2em;
    }

    li {
      margin: 4px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    th, td {
      border: 1px solid var(--border-color);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: var(--code-bg);
      font-weight: 600;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 24px 0;
    }

    .metadata {
      background: var(--meta-bg);
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      font-size: 14px;
    }

    strong {
      font-weight: 600;
    }

    /* Highlight.js overrides for dark mode */
    @media (prefers-color-scheme: dark) {
      .hljs-keyword, .hljs-selector-tag, .hljs-title, .hljs-section,
      .hljs-doctag, .hljs-name, .hljs-strong { color: #ff7b72; }
      .hljs-string, .hljs-attr { color: #a5d6ff; }
      .hljs-comment, .hljs-quote, .hljs-deletion { color: #8b949e; }
      .hljs-number, .hljs-literal, .hljs-type { color: #79c0ff; }
      .hljs-built_in, .hljs-builtin-name { color: #ffa657; }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;

// Main execution
const args = process.argv.slice(2);
const { inputPath, outputPath } = parseArgs(args);

if (!inputPath) {
  console.error("Usage: node md-to-html.js <input.md> [output.html]");
  process.exit(1);
}

try {
  const rawMarkdown = fs.readFileSync(inputPath, "utf-8");

  // Extract and parse YAML frontmatter
  const { content: markdown, meta } = parseFrontmatter(rawMarkdown);
  const metadataHtml = generateMetadataHtml(meta);

  // Configure custom renderer for GitHub links in h3 file paths
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    if (depth === 3 && meta.repo && meta.branch) {
      // Check if text looks like a file path (contains / or .)
      if (text.includes("/") || text.includes(".")) {
        const githubUrl = `https://github.com/${meta.repo}/blob/${meta.branch}/${text}`;
        return `<h3><a href="${githubUrl}">${text}</a></h3>\n`;
      }
    }
    return `<h${depth}>${text}</h${depth}>\n`;
  };
  marked.use({ renderer });

  // Extract title from first heading or filename
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = escapeHtml(
    titleMatch ? titleMatch[1] : path.basename(inputPath, ".md"),
  );

  // Convert markdown to HTML
  const htmlContent = metadataHtml + marked(markdown);

  // Generate full HTML document
  const fullHtml = htmlTemplate(htmlContent, title);

  // Write output
  fs.writeFileSync(outputPath, fullHtml);
  console.log(`Converted: ${inputPath} -> ${outputPath}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
