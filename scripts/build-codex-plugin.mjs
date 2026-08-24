#!/usr/bin/env node
// Build the Codex app plugin package from the provider-agnostic source skills.
//
// Source of truth: ../skills/<name>/ (neutral SKILL.md + bundled resources).
// Output (generated, do not hand-edit): ../plugins/ottonomous/
//   - skills/<name>/                copied from source
//   - skills/<name>/agents/openai.yaml   Codex interface metadata (generated)
//   - .codex-plugin/plugin.json     Codex package manifest
//
// Claude Code reads ../skills/ directly via ../.claude-plugin; it ignores the
// generated openai.yaml files. This script only produces the Codex-specific layer.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const sourceSkills = join(repoRoot, "skills");
const pkgRoot = join(repoRoot, "plugins", "ottonomous");
const pkgSkills = join(pkgRoot, "skills");
const PUBLISHED_SKILLS = ["build", "review", "spec", "summary"];

const PLUGIN = {
  name: "ottonomous",
  version: "2.0.0",
  description:
    "Four independent, provider-agnostic skills for product specification, code review, spec-driven implementation, and Moss change summaries.",
  author: { name: "Bersabel Tadesse" },
  homepage: "https://github.com/brsbl/ottonomous",
  repository: "https://github.com/brsbl/ottonomous",
  license: "MIT",
  keywords: [
    "ottonomous",
    "product-development",
    "spec",
    "build",
    "code-review",
    "change-summary",
    "moss",
    "subagents",
    "claude-code",
    "codex",
    "plugin",
  ],
};

// Per-skill Codex interface metadata. display_name/short_description/default_prompt
// drive the Codex app surface; default_prompt uses the `$<skill>` invocation form.
const INTERFACE = {
  spec: {
    display_name: "Spec",
    short_description:
      "Write a product spec through a collaborative interview with research",
    default_prompt:
      "Use $spec with this idea, working location, and output destination to write an independently reviewable product specification.",
  },
  build: {
    display_name: "Build",
    short_description:
      "Build a supplied spec through bounded delegation and verification",
    default_prompt:
      "Use $build with this spec reference and working location to implement and verify it to completion.",
  },
  review: {
    display_name: "Code Review",
    short_description:
      "Multi-agent code review with P0-P2 prioritized findings",
    default_prompt:
      "Use $review with this target and output destination to run a validated P0-P2 code review.",
  },
  summary: {
    display_name: "Moss Summary",
    short_description:
      "Align on a change's problem, outcomes, trade-offs, and implications",
    default_prompt:
      "Use $summary to summarize the current pull request or branch as a decision-focused Moss review brief.",
  },
};

// Files/dirs never copied into the Codex package. Test/build infra is dropped
// so the generated package contains only what the skill needs at run time (and
// so Dependabot doesn't discover a lockfile under generated output).
const EXCLUDE = new Set([
  "node_modules",
  "__tests__",
  ".DS_Store",
  ".git",
  "package-lock.json",
  "vitest.config.js",
]);

function listSkills() {
  const discovered = readdirSync(sourceSkills, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !EXCLUDE.has(d.name))
    .map((d) => d.name)
    .sort();

  if (JSON.stringify(discovered) !== JSON.stringify(PUBLISHED_SKILLS)) {
    throw new Error(
      `Expected exactly these source skills: ${PUBLISHED_SKILLS.join(", ")}. Found: ${discovered.join(", ") || "none"}`,
    );
  }

  return discovered;
}

function yamlString(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function writeOpenaiYaml(skill, dest) {
  const meta = INTERFACE[skill];
  if (!meta) {
    throw new Error(
      `No Codex interface metadata defined for skill "${skill}". Add it to INTERFACE in scripts/build-codex-plugin.mjs.`,
    );
  }
  const agentsDir = join(dest, "agents");
  mkdirSync(agentsDir, { recursive: true });
  const yaml = [
    "interface:",
    `  display_name: ${yamlString(meta.display_name)}`,
    `  short_description: ${yamlString(meta.short_description)}`,
    `  default_prompt: ${yamlString(meta.default_prompt)}`,
    "",
  ].join("\n");
  writeFileSync(join(agentsDir, "openai.yaml"), yaml);
}

// Codex resolves skill-bundled files relative to $SKILL_DIR, not the project
// working directory. Rewrite neutral bundled-resource references in the copied
// SKILL.md so Codex can locate personas and templates. Claude resolves the
// source-relative references directly.
function rewriteBundledPaths(dest) {
  const skillFile = join(dest, "SKILL.md");
  if (!existsSync(skillFile)) return;
  const body = readFileSync(skillFile, "utf8");
  const rewritten = body
    .replaceAll("`agents/", "`$SKILL_DIR/agents/")
    .replaceAll("`templates/", "`$SKILL_DIR/templates/");
  if (rewritten !== body) {
    writeFileSync(skillFile, rewritten);
  }
}

function main() {
  const skills = listSkills();

  // Clean and recreate the generated skills tree.
  rmSync(pkgSkills, { recursive: true, force: true });
  mkdirSync(pkgSkills, { recursive: true });

  for (const skill of skills) {
    const src = join(sourceSkills, skill);
    const dest = join(pkgSkills, skill);
    cpSync(src, dest, {
      recursive: true,
      filter: (s) => !EXCLUDE.has(basename(s)),
    });
    writeOpenaiYaml(skill, dest);
    rewriteBundledPaths(dest);
  }

  // Codex package manifest.
  const codexManifest = {
    ...PLUGIN,
    skills: "./skills/",
    interface: {
      displayName: "Ottonomous",
      shortDescription: "Independent spec, review, build, and summary skills",
      longDescription:
        "Codex app package for four independent Ottonomous skills: spec, review, build, and Moss change summary. Skills use explicit caller context or the active repository context without requiring a prescribed workflow or hidden state.",
      developerName: "Bersabel Tadesse",
      category: "Productivity",
      capabilities: ["Read", "Write"],
      websiteURL: "https://github.com/brsbl/ottonomous",
      defaultPrompt: [
        "Use $spec with this idea, working location, and output destination to write a product specification.",
        "Use $review with this target to run a validated P0-P2 code review.",
        "Use $build with this spec reference and working location to implement and verify it to completion.",
        "Use $summary to summarize the current pull request or branch as a decision-focused Moss review brief.",
      ],
    },
  };
  mkdirSync(join(pkgRoot, ".codex-plugin"), { recursive: true });
  writeFileSync(
    join(pkgRoot, ".codex-plugin", "plugin.json"),
    `${JSON.stringify(codexManifest, null, 2)}\n`,
  );

  console.log(
    `Built Codex package for ${skills.length} skills: ${skills.join(", ")}`,
  );
}

main();
