/**
 * Pure utility functions extracted from md-to-html.js for testing
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} markdown - Markdown content with optional frontmatter
 * @returns {{ content: string, meta: object }} Markdown without frontmatter and parsed metadata
 */
export function parseFrontmatter(markdown) {
  const meta = {};
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

  if (!frontmatterMatch) {
    return { content: markdown, meta };
  }

  const content = markdown.slice(frontmatterMatch[0].length);
  const frontmatter = frontmatterMatch[1];

  for (const line of frontmatter.split("\n")) {
    const [key, ...rest] = line.split(": ");
    if (key && rest.length) {
      meta[key.trim()] = rest.join(": ").trim();
    }
  }

  return { content, meta };
}

/**
 * Generate metadata HTML from parsed frontmatter
 * @param {object} meta - Parsed frontmatter metadata
 * @returns {string} HTML string for metadata display
 */
export function generateMetadataHtml(meta) {
  const parts = [];

  if (meta.date) {
    parts.push(`<strong>Date:</strong> ${escapeHtml(meta.date)}`);
  }

  if (meta.branch) {
    const commits = meta.commits
      ? ` (${escapeHtml(meta.commits)} commits)`
      : "";
    parts.push(`<strong>Branch:</strong> ${escapeHtml(meta.branch)}${commits}`);
  }

  if (meta.files_changed) {
    let linesHtml = "";
    if (meta.lines) {
      const match = meta.lines.match(/\+(\d+)\/-(\d+)/);
      if (match) {
        linesHtml = ` (<span style="color:#22863a">+${escapeHtml(match[1])}</span>/<span style="color:#cb2431">-${escapeHtml(match[2])}</span>)`;
      } else {
        linesHtml = ` (${escapeHtml(meta.lines)})`;
      }
    }
    parts.push(
      `<strong>Total Files:</strong> ${escapeHtml(meta.files_changed)} files changed${linesHtml}`,
    );
  }

  if (parts.length === 0) {
    return "";
  }

  return `<div class="metadata">${parts.join(" ")}</div>`;
}

/**
 * Parse command line arguments for input/output paths
 * @param {string[]} args - Command line arguments
 * @returns {{ inputPath: string|null, outputPath: string|null }} Parsed paths
 */
export function parseArgs(args) {
  if (args.length < 1) {
    return { inputPath: null, outputPath: null };
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.md$/, ".html");

  return { inputPath, outputPath };
}
