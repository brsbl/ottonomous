#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  findChangedSkills,
  generateDiffHtml,
  generateIndexPage,
  getFileAtCommit,
  getSkillName,
  wrapInTemplate,
} from "./skill-diff.utils.js";

// Parse command line arguments
const args = process.argv.slice(2);
const baseCommit = args[0] || "HEAD";

// Output directory
const outputDir = ".otto/skill-diffs";

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Finding changed skills compared to ${baseCommit}...`);

// Find changed skill files
const changedSkills = findChangedSkills(baseCommit);

if (changedSkills.length === 0) {
  console.log("No skill files have changes.");

  // Still generate index page showing no changes
  const indexHtml = generateIndexPage([], baseCommit);
  fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);

  console.log(`\nOutput: ${outputDir}/index.html`);
  openInBrowser(path.join(outputDir, "index.html"));
  process.exit(0);
}

console.log(`Found ${changedSkills.length} changed skill(s):`);
for (const skill of changedSkills) {
  console.log(`  - ${skill}`);
}

// Generate diff HTML for each changed skill
const skillInfos = [];

for (const skillPath of changedSkills) {
  const skillName = getSkillName(skillPath);
  console.log(`\nProcessing ${skillName}...`);

  // Get before and after content
  const before = getFileAtCommit(baseCommit, skillPath);
  const after = fs.existsSync(skillPath)
    ? fs.readFileSync(skillPath, "utf-8")
    : null;

  if (!before && !after) {
    console.log(`  Skipping - file doesn't exist in either version`);
    continue;
  }

  // Generate diff HTML
  const { beforeHtml, afterHtml } = generateDiffHtml(before, after);

  // Wrap in template
  const html = wrapInTemplate(skillName, beforeHtml, afterHtml, baseCommit);

  // Write to file
  const outputPath = path.join(outputDir, `${skillName}-diff.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`  Created: ${outputPath}`);

  skillInfos.push({ name: skillName, path: skillPath });
}

// Generate index page
const indexHtml = generateIndexPage(skillInfos, baseCommit);
fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);
console.log(`\nIndex: ${outputDir}/index.html`);

// Open in browser
openInBrowser(path.join(outputDir, "index.html"));

/**
 * Open a file in the default browser
 * @param {string} filePath - Path to file to open
 */
function openInBrowser(filePath) {
  const absolutePath = path.resolve(filePath);

  try {
    // macOS
    if (process.platform === "darwin") {
      execFileSync("open", [absolutePath], { stdio: "ignore" });
    }
    // Windows
    else if (process.platform === "win32") {
      execFileSync("cmd", ["/c", "start", "", absolutePath], {
        stdio: "ignore",
      });
    }
    // Linux
    else {
      execFileSync("xdg-open", [absolutePath], { stdio: "ignore" });
    }
  } catch {
    console.log(`\nOpen in browser: file://${absolutePath}`);
  }
}
