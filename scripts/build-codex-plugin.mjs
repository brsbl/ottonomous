#!/usr/bin/env node
// Build the Codex app plugin package from the provider-agnostic source skills.
//
// Source of truth: ../skills/<name>/ (neutral SKILL.md + agents/*.md personas).
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
  readFileSync,
  readdirSync,
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

const PLUGIN = {
  name: "ottonomous",
  version: "1.0.0",
  description:
    "Provider-agnostic skills for autonomous product development: spec, task, implement, test, review, and summarize changes.",
  author: { name: "Bersabel Tadesse" },
  homepage: "https://github.com/brsbl/ottonomous",
  repository: "https://github.com/brsbl/ottonomous",
  license: "MIT",
  keywords: [
    "ottonomous",
    "product-development",
    "spec",
    "tasks",
    "code-review",
    "testing",
    "subagents",
    "autonomous",
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
      "Use $spec to write a product specification for this idea through a collaborative interview.",
  },
  task: {
    display_name: "Task Breakdown",
    short_description:
      "Break a spec into atomic, prioritized, parallelizable tasks",
    default_prompt:
      "Use $task to break this spec into atomic tasks grouped into work sessions.",
  },
  next: {
    display_name: "Implement Next",
    short_description: "Pick up and implement the next pending task or session",
    default_prompt:
      "Use $next to plan and implement the next pending task or session.",
  },
  test: {
    display_name: "Test",
    short_description:
      "Lint, type check, run tests, and visually verify changes",
    default_prompt:
      "Use $test to lint, type check, and run the tests for these changes.",
  },
  review: {
    display_name: "Code Review",
    short_description:
      "Multi-agent code review with P0-P2 prioritized findings",
    default_prompt:
      "Use $review to run a multi-agent code review of the current changes.",
  },
  summary: {
    display_name: "Change Summary",
    short_description: "Synthesize changes into a user-facing HTML summary",
    default_prompt:
      "Use $summary to generate a semantic HTML summary of the current changes.",
  },
  otto: {
    display_name: "Otto Autopilot",
    short_description:
      "Autonomously build an idea end-to-end: spec, tasks, implement, verify",
    default_prompt: "Use $otto to autonomously build this idea end-to-end.",
  },
  reset: {
    display_name: "Reset Workspace",
    short_description:
      "Clear .otto workflow artifacts (specs, tasks, sessions)",
    default_prompt: "Use $reset to clear the .otto workflow artifacts.",
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
  return readdirSync(sourceSkills, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !EXCLUDE.has(d.name))
    .map((d) => d.name)
    .sort();
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
// working directory. Rewrite the neutral `agents/<persona>.md` references in the
// copied SKILL.md to `$SKILL_DIR/agents/...` so a Codex agent can locate the
// persona file. Claude needs no rewrite: it invokes each persona as a registered
// subagent by name, so the source keeps the plain relative reference.
function rewritePersonaPaths(dest) {
  const skillFile = join(dest, "SKILL.md");
  if (!existsSync(skillFile)) return;
  const body = readFileSync(skillFile, "utf8");
  const rewritten = body.replaceAll("`agents/", "`$SKILL_DIR/agents/");
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
    rewritePersonaPaths(dest);
  }

  // Codex package manifest.
  const codexManifest = {
    ...PLUGIN,
    skills: "./skills/",
    interface: {
      displayName: "Ottonomous",
      shortDescription: "Skills for autonomous product development",
      longDescription:
        "Codex app package for the Ottonomous product-development skills (spec, task, next, test, review, summary, otto, reset). Generated from the provider-agnostic skills in this repository.",
      developerName: "Bersabel Tadesse",
      category: "Productivity",
      capabilities: ["Read", "Write"],
      websiteURL: "https://github.com/brsbl/ottonomous",
      defaultPrompt: [
        "Use $spec to write a product specification for this idea, then $task to break it into work sessions.",
        "Use $review to run a multi-agent code review of my current changes and propose prioritized fixes.",
        "Use $otto to autonomously build this small idea end-to-end with spec, tasks, implementation, and verification.",
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
