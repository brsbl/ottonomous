import { execFileSync } from "node:child_process";
import * as Diff from "diff";

/**
 * Get file content from a specific git commit
 * @param {string} commit - Git commit reference (e.g., "HEAD", "HEAD~1", commit SHA)
 * @param {string} filePath - Path to file relative to repo root
 * @returns {string|null} File content or null if file doesn't exist in that commit
 */
export function getFileAtCommit(commit, filePath) {
  try {
    return execFileSync("git", ["show", `${commit}:${filePath}`], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

/**
 * Find all skill files that have changes between two commits
 * @param {string} baseCommit - Base commit to compare against
 * @param {string} targetCommit - Target commit (default: working directory)
 * @returns {string[]} Array of changed skill file paths
 */
export function findChangedSkills(baseCommit, targetCommit = null) {
  const args = targetCommit
    ? [
        "diff",
        "--name-only",
        baseCommit,
        targetCommit,
        "--",
        "skills/*/SKILL.md",
      ]
    : ["diff", "--name-only", baseCommit, "--", "skills/*/SKILL.md"];

  try {
    const output = execFileSync("git", args, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generate side-by-side diff HTML from two strings
 * @param {string} before - Original content
 * @param {string} after - Modified content
 * @returns {{ beforeHtml: string, afterHtml: string }} HTML for both sides
 */
export function generateDiffHtml(before, after) {
  const changes = Diff.diffWords(before || "", after || "");

  let beforeHtml = "";
  let afterHtml = "";

  for (const change of changes) {
    const escapedValue = escapeHtml(change.value);

    if (change.added) {
      // Added text only appears on the right (after) side
      afterHtml += `<span class="added">${escapedValue}</span>`;
    } else if (change.removed) {
      // Removed text only appears on the left (before) side
      beforeHtml += `<span class="removed">${escapedValue}</span>`;
    } else {
      // Unchanged text appears on both sides
      beforeHtml += `<span class="unchanged">${escapedValue}</span>`;
      afterHtml += `<span class="unchanged">${escapedValue}</span>`;
    }
  }

  return { beforeHtml, afterHtml };
}

/**
 * Extract skill name from skill file path
 * @param {string} skillPath - Path like "skills/otto/SKILL.md"
 * @returns {string} Skill name like "otto"
 */
export function getSkillName(skillPath) {
  const match = skillPath.match(/skills\/([^/]+)\/SKILL\.md/);
  return match ? match[1] : skillPath;
}

/**
 * Wrap diff content in a full HTML document
 * @param {string} skillName - Name of the skill
 * @param {string} beforeHtml - HTML content for before side
 * @param {string} afterHtml - HTML content for after side
 * @param {string} baseCommit - Base commit reference
 * @returns {string} Complete HTML document
 */
export function wrapInTemplate(skillName, beforeHtml, afterHtml, baseCommit) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skill Diff: ${skillName}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #24292f;
      --border-color: #d0d7de;
      --header-bg: #f6f8fa;
      --removed-bg: #fee2e2;
      --added-bg: #dcfce7;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --border-color: #30363d;
        --header-bg: #161b22;
        --removed-bg: #3d1a1a;
        --added-bg: #1a3d1a;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 20px;
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }

    .meta {
      color: #6e7781;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .diff-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
    }

    .diff-column {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
    }

    .diff-column h2 {
      margin: 0;
      padding: 12px 16px;
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
      font-size: 14px;
      font-weight: 600;
    }

    .diff-content {
      padding: 16px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .removed {
      background-color: var(--removed-bg);
      color: var(--text-color);
    }

    .added {
      background-color: var(--added-bg);
      color: var(--text-color);
    }

    .unchanged {
      color: var(--text-color);
    }

    .back-link {
      display: inline-block;
      margin-bottom: 20px;
      color: #0969da;
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <a href="index.html" class="back-link">&larr; Back to Index</a>
  <h1>Skill Diff: ${skillName}</h1>
  <p class="meta">Comparing against: ${baseCommit}</p>

  <div class="diff-container">
    <div class="diff-column">
      <h2>Before (${baseCommit})</h2>
      <div class="diff-content">${beforeHtml}</div>
    </div>
    <div class="diff-column">
      <h2>After (current)</h2>
      <div class="diff-content">${afterHtml}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate index page listing all skill diffs
 * @param {Array<{name: string, path: string}>} skills - Array of skill info
 * @param {string} baseCommit - Base commit reference
 * @returns {string} Complete HTML document for index
 */
export function generateIndexPage(skills, baseCommit) {
  const skillLinks = skills
    .map(
      (skill) =>
        `<li><a href="${skill.name}-diff.html">${skill.name}</a> <span class="path">(${skill.path})</span></li>`,
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skill Diffs</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #24292f;
      --border-color: #d0d7de;
      --link-color: #0969da;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --border-color: #30363d;
        --link-color: #58a6ff;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    h1 {
      margin: 0 0 10px 0;
    }

    .meta {
      color: #6e7781;
      margin-bottom: 30px;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    a {
      color: var(--link-color);
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    .path {
      color: #6e7781;
      font-size: 14px;
    }

    .empty {
      color: #6e7781;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>Skill Diffs</h1>
  <p class="meta">Comparing against: ${baseCommit}</p>

  ${
    skills.length > 0
      ? `<ul>
      ${skillLinks}
    </ul>`
      : '<p class="empty">No skill files have changes.</p>'
  }
</body>
</html>`;
}
