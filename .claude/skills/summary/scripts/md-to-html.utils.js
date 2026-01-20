/**
 * Pure utility functions extracted from md-to-html.js for testing
 */

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} markdown - Markdown content with optional frontmatter
 * @returns {{ content: string, meta: object }} Markdown without frontmatter and parsed metadata
 */
export function parseFrontmatter(markdown) {
  const meta = {};
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);

  if (!frontmatterMatch) {
    return { content: markdown, meta };
  }

  const content = markdown.slice(frontmatterMatch[0].length);
  const frontmatter = frontmatterMatch[1];

  frontmatter.split('\n').forEach((line) => {
    const [key, ...rest] = line.split(': ');
    if (key && rest.length) {
      meta[key.trim()] = rest.join(': ').trim();
    }
  });

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
    parts.push(`<strong>Date:</strong> ${meta.date}`);
  }

  if (meta.branch) {
    const commits = meta.commits ? ` (${meta.commits} commits)` : '';
    parts.push(`<strong>Branch:</strong> ${meta.branch}${commits}`);
  }

  if (meta.files_changed) {
    let linesHtml = '';
    if (meta.lines) {
      const match = meta.lines.match(/\+(\d+)\/-(\d+)/);
      if (match) {
        linesHtml = ` (<span style="color:#22863a">+${match[1]}</span>/<span style="color:#cb2431">-${match[2]}</span>)`;
      } else {
        linesHtml = ` (${meta.lines})`;
      }
    }
    parts.push(`<strong>Total Files:</strong> ${meta.files_changed} files changed${linesHtml}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `<div class="metadata">${parts.join(' ')}</div>`;
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
  const outputPath = args[1] || inputPath.replace(/\.md$/, '.html');

  return { inputPath, outputPath };
}
