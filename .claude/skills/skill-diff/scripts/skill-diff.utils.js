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
 * Get file content from the staging area (index)
 * @param {string} filePath - Path to file relative to repo root
 * @returns {string|null} File content or null if file doesn't exist in staging
 */
export function getStagedContent(filePath) {
  try {
    return execFileSync("git", ["show", `:${filePath}`], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

/**
 * Find skill files with uncommitted changes (working tree vs HEAD)
 * @returns {string[]} Array of changed file paths
 */
export function findUncommittedSkills() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", "--", "skills/**/*.md"],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Find skill files with staged changes (index vs HEAD)
 * @returns {string[]} Array of changed file paths
 */
export function findStagedSkills() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--", "skills/**/*.md"],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Find skill files changed between current branch and base commit
 * @param {string} baseCommit - Base commit to compare against (e.g., "main")
 * @returns {string[]} Array of changed file paths
 */
export function findChangedSkills(baseCommit) {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", `${baseCommit}...HEAD`, "--", "skills/**/*.md"],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
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
 * Extract display name from file path
 * @param {string} filePath - Path like "skills/otto/SKILL.md" or "skills/doc/agents/file-documenter.md"
 * @returns {string} Name like "otto" or "doc-agents-file-documenter"
 */
export function getSkillName(filePath) {
  // Remove "skills/" prefix and ".md" suffix, replace "/" with "-"
  const match = filePath.match(/^skills\/(.+)\.md$/);
  if (match) {
    return match[1].replace(/\//g, "-").replace(/-SKILL$/, "");
  }
  return filePath;
}

/**
 * Wrap diff content in a full HTML document
 * @param {string} skillName - Name of the skill
 * @param {string} beforeHtml - HTML content for before side
 * @param {string} afterHtml - HTML content for after side
 * @param {string} beforeLabel - Label for before side (e.g., "main", "HEAD")
 * @param {string} afterLabel - Label for after side (e.g., "HEAD", "staged", "working tree")
 * @returns {string} Complete HTML document
 */
export function wrapInTemplate(skillName, beforeHtml, afterHtml, beforeLabel, afterLabel) {
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
  <p class="meta">Comparing: ${beforeLabel} → ${afterLabel}</p>

  <div class="diff-container">
    <div class="diff-column">
      <h2>Before (${beforeLabel})</h2>
      <div class="diff-content">${beforeHtml}</div>
    </div>
    <div class="diff-column">
      <h2>After (${afterLabel})</h2>
      <div class="diff-content">${afterHtml}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate index page listing all skill diffs by scope
 * @param {Array<{name: string, path: string, outputName: string}>} uncommitted - Uncommitted changes
 * @param {Array<{name: string, path: string, outputName: string}>} staged - Staged changes
 * @param {Array<{name: string, path: string, outputName: string}>} branch - Branch changes vs main
 * @param {string} baseCommit - Base commit reference
 * @returns {string} Complete HTML document for index
 */
export function generateIndexPage(uncommitted, staged, branch, baseCommit) {
  const renderSection = (title, description, skills) => {
    if (skills.length === 0) {
      return `
    <section>
      <h2>${title}</h2>
      <p class="description">${description}</p>
      <p class="empty">No changes</p>
    </section>`;
    }

    const links = skills
      .map(
        (skill) =>
          `<li><a href="${skill.outputName}-diff.html">${skill.name}</a> <span class="lines">${skill.lines} lines</span> <span class="path">${skill.path}</span></li>`,
      )
      .join("\n        ");

    return `
    <section>
      <h2>${title} <span class="count">(${skills.length})</span></h2>
      <p class="description">${description}</p>
      <ul>
        ${links}
      </ul>
    </section>`;
  };

  const uncommittedSection = renderSection(
    "Uncommitted",
    "Working tree changes not yet staged",
    uncommitted,
  );

  const stagedSection = renderSection(
    "Staged",
    "Changes staged for commit",
    staged,
  );

  const branchSection = renderSection(
    "Branch",
    `All committed changes compared to ${baseCommit}`,
    branch,
  );

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
      --section-bg: #f6f8fa;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --border-color: #30363d;
        --link-color: #58a6ff;
        --section-bg: #161b22;
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

    section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--section-bg);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    section h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    .count {
      font-weight: normal;
      color: #6e7781;
    }

    .description {
      color: #6e7781;
      font-size: 14px;
      margin: 0 0 16px 0;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    li {
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color);
    }

    li:last-child {
      border-bottom: none;
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

    .lines {
      color: #6e7781;
      font-size: 12px;
      margin-left: 8px;
    }

    .empty {
      color: #6e7781;
      font-style: italic;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Skill Diffs</h1>
  <p class="meta">Comparing against: ${baseCommit}</p>
  ${uncommittedSection}
  ${stagedSection}
  ${branchSection}
</body>
</html>`;
}
