#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  findChangedSkills,
  findStagedSkills,
  findUncommittedSkills,
  generateDiffHtml,
  generateIndexPage,
  getFileAtCommit,
  getSkillName,
  getStagedContent,
  wrapInTemplate,
} from "./skill-diff.utils.js";

// Always compare against main
const baseCommit = "main";

// Output directory
const outputDir = ".otto/skill-diffs";

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Finding changed skills compared to ${baseCommit}...\n`);

// Find changes for each scope
const uncommittedSkills = findUncommittedSkills();
const stagedSkills = findStagedSkills();
const branchSkills = findChangedSkills(baseCommit);

// Collect all unique skills
const allSkillsSet = new Set([
  ...uncommittedSkills,
  ...stagedSkills,
  ...branchSkills,
]);

if (allSkillsSet.size === 0) {
  console.log("No skill files have changes.");

  // Still generate index page showing no changes
  const indexHtml = generateIndexPage([], [], [], baseCommit);
  fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);

  console.log(`\nOutput: ${outputDir}/index.html`);
  openInBrowser(path.join(outputDir, "index.html"));
  process.exit(0);
}

// Report what was found
if (uncommittedSkills.length > 0) {
  console.log(`Uncommitted (${uncommittedSkills.length}):`);
  for (const skill of uncommittedSkills) {
    console.log(`  - ${skill}`);
  }
  console.log();
}

if (stagedSkills.length > 0) {
  console.log(`Staged (${stagedSkills.length}):`);
  for (const skill of stagedSkills) {
    console.log(`  - ${skill}`);
  }
  console.log();
}

if (branchSkills.length > 0) {
  console.log(`Branch vs ${baseCommit} (${branchSkills.length}):`);
  for (const skill of branchSkills) {
    console.log(`  - ${skill}`);
  }
  console.log();
}

// Generate diff HTML for each scope
const uncommittedInfos = [];
const stagedInfos = [];
const branchInfos = [];

// Process uncommitted changes (working tree vs HEAD)
for (const skillPath of uncommittedSkills) {
  const skillName = getSkillName(skillPath);
  const outputName = `uncommitted-${skillName}`;
  console.log(`Processing uncommitted: ${skillName}...`);

  const before = getFileAtCommit("HEAD", skillPath);
  const after = fs.existsSync(skillPath)
    ? fs.readFileSync(skillPath, "utf-8")
    : null;

  if (!before && !after) continue;

  const { beforeHtml, afterHtml } = generateDiffHtml(before, after);
  const html = wrapInTemplate(
    skillName,
    beforeHtml,
    afterHtml,
    "HEAD",
    "working tree",
  );

  const outputPath = path.join(outputDir, `${outputName}-diff.html`);
  fs.writeFileSync(outputPath, html);
  const lines = after ? after.split("\n").length : 0;
  uncommittedInfos.push({
    name: skillName,
    path: skillPath,
    outputName,
    lines,
  });
}

// Process staged changes (index vs HEAD)
for (const skillPath of stagedSkills) {
  const skillName = getSkillName(skillPath);
  const outputName = `staged-${skillName}`;
  console.log(`Processing staged: ${skillName}...`);

  const before = getFileAtCommit("HEAD", skillPath);
  const after = getStagedContent(skillPath);

  if (!before && !after) continue;

  const { beforeHtml, afterHtml } = generateDiffHtml(before, after);
  const html = wrapInTemplate(
    skillName,
    beforeHtml,
    afterHtml,
    "HEAD",
    "staged",
  );

  const outputPath = path.join(outputDir, `${outputName}-diff.html`);
  fs.writeFileSync(outputPath, html);
  const lines = after ? after.split("\n").length : 0;
  stagedInfos.push({ name: skillName, path: skillPath, outputName, lines });
}

// Process branch changes (HEAD vs main)
for (const skillPath of branchSkills) {
  const skillName = getSkillName(skillPath);
  const outputName = `branch-${skillName}`;
  console.log(`Processing branch: ${skillName}...`);

  const before = getFileAtCommit(baseCommit, skillPath);
  const after = getFileAtCommit("HEAD", skillPath);

  if (!before && !after) continue;

  const { beforeHtml, afterHtml } = generateDiffHtml(before, after);
  const html = wrapInTemplate(
    skillName,
    beforeHtml,
    afterHtml,
    baseCommit,
    "HEAD",
  );

  const outputPath = path.join(outputDir, `${outputName}-diff.html`);
  fs.writeFileSync(outputPath, html);
  const lines = after ? after.split("\n").length : 0;
  branchInfos.push({ name: skillName, path: skillPath, outputName, lines });
}

// Generate index page
const indexHtml = generateIndexPage(
  uncommittedInfos,
  stagedInfos,
  branchInfos,
  baseCommit,
);
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
