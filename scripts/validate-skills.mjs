#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_SKILLS = ["build", "review", "spec"];

const here = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = join(here, "..");

function directoryNames(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function walkFiles(path) {
  if (!existsSync(path)) return [];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(entryPath));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files.sort();
}

function parseFrontmatter(body) {
  const match = body.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return null;

  const value = (key) => {
    const field = match[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    if (!field) return null;
    return field[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  };

  return { name: value("name"), description: value("description") };
}

function compareSurface(errors, label, actual) {
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_SKILLS)) {
    errors.push(
      `${label} must contain exactly ${EXPECTED_SKILLS.join(", ")}; found ${actual.join(", ") || "none"}`,
    );
  }
}

export function validateRepository(repoRoot = defaultRepoRoot) {
  const errors = [];
  const sourceRoot = join(repoRoot, "skills");
  const generatedRoot = join(repoRoot, "plugins", "ottonomous", "skills");

  compareSurface(errors, "Source skill surface", directoryNames(sourceRoot));
  compareSurface(
    errors,
    "Generated Codex skill surface",
    directoryNames(generatedRoot),
  );

  for (const skill of EXPECTED_SKILLS) {
    const sourceSkillFile = join(sourceRoot, skill, "SKILL.md");
    if (!existsSync(sourceSkillFile)) {
      errors.push(`Missing source skill file: skills/${skill}/SKILL.md`);
      continue;
    }

    const sourceBody = readFileSync(sourceSkillFile, "utf8");
    const frontmatter = parseFrontmatter(sourceBody);
    if (!frontmatter) {
      errors.push(`Missing frontmatter: skills/${skill}/SKILL.md`);
    } else {
      if (frontmatter.name !== skill) {
        errors.push(
          `Frontmatter name for skills/${skill}/SKILL.md must be ${skill}; found ${frontmatter.name}`,
        );
      }
      if (!frontmatter.description) {
        errors.push(`Missing description: skills/${skill}/SKILL.md`);
      } else if (frontmatter.description.length > 1024) {
        errors.push(
          `Description exceeds 1024 characters: skills/${skill}/SKILL.md`,
        );
      }
    }

    const generatedSkillFile = join(generatedRoot, skill, "SKILL.md");
    if (!existsSync(generatedSkillFile)) {
      errors.push(
        `Missing generated skill file: ${relative(repoRoot, generatedSkillFile)}`,
      );
    } else {
      const expectedGeneratedBody = sourceBody.replaceAll(
        "`agents/",
        "`$SKILL_DIR/agents/",
      );
      const generatedBody = readFileSync(generatedSkillFile, "utf8");
      if (generatedBody !== expectedGeneratedBody) {
        errors.push(
          `Generated skill is stale: plugins/ottonomous/skills/${skill}/SKILL.md`,
        );
      }
    }

    const openaiYaml = join(generatedRoot, skill, "agents", "openai.yaml");
    if (!existsSync(openaiYaml)) {
      errors.push(
        `Missing Codex interface metadata: ${relative(repoRoot, openaiYaml)}`,
      );
    }

    const sourceAgentsRoot = join(sourceRoot, skill, "agents");
    for (const sourceAgent of walkFiles(sourceAgentsRoot).filter((file) =>
      file.endsWith(".md"),
    )) {
      const agentRelativePath = relative(join(sourceRoot, skill), sourceAgent);
      const generatedAgent = join(generatedRoot, skill, agentRelativePath);
      if (!existsSync(generatedAgent)) {
        errors.push(
          `Missing generated agent persona: ${relative(repoRoot, generatedAgent)}`,
        );
      } else if (
        readFileSync(sourceAgent, "utf8") !==
        readFileSync(generatedAgent, "utf8")
      ) {
        errors.push(
          `Generated agent persona is stale: ${relative(repoRoot, generatedAgent)}`,
        );
      }
    }
  }

  for (const runtimeRoot of [sourceRoot, generatedRoot]) {
    for (const file of walkFiles(runtimeRoot)) {
      if (!statSync(file).isFile()) continue;
      const body = readFileSync(file, "utf8");
      if (/\.otto(?:\/|\b)/.test(body)) {
        errors.push(
          `Legacy storage reference in runtime skill content: ${relative(repoRoot, file)}`,
        );
      }
    }
  }

  const localSkillFiles = walkFiles(join(repoRoot, ".claude", "skills")).filter(
    (file) => file.endsWith("SKILL.md"),
  );
  if (localSkillFiles.length > 0) {
    errors.push(
      `Repository-local skills are outside the three-skill surface: ${localSkillFiles.map((file) => relative(repoRoot, file)).join(", ")}`,
    );
  }

  const claudeManifestPath = join(repoRoot, ".claude-plugin", "plugin.json");
  const rootCodexManifestPath = join(repoRoot, ".codex-plugin", "plugin.json");
  const generatedManifestPath = join(
    repoRoot,
    "plugins",
    "ottonomous",
    ".codex-plugin",
    "plugin.json",
  );

  for (const manifestPath of [
    claudeManifestPath,
    rootCodexManifestPath,
    generatedManifestPath,
  ]) {
    if (!existsSync(manifestPath)) {
      errors.push(`Missing manifest: ${relative(repoRoot, manifestPath)}`);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.version !== "2.0.0") {
      errors.push(
        `Breaking three-skill manifest must be version 2.0.0: ${relative(repoRoot, manifestPath)}`,
      );
    }
  }

  if (existsSync(claudeManifestPath)) {
    const manifest = JSON.parse(readFileSync(claudeManifestPath, "utf8"));
    const expectedAgents = [
      "./skills/build/agents/implementation-worker.md",
      "./skills/review/agents/architect-reviewer.md",
      "./skills/review/agents/false-positive-validator.md",
      "./skills/review/agents/senior-code-reviewer.md",
      "./skills/spec/agents/technical-product-manager.md",
    ].sort();
    const actualAgents = [...(manifest.agents ?? [])].sort();
    if (JSON.stringify(actualAgents) !== JSON.stringify(expectedAgents)) {
      errors.push(
        "Claude manifest agent exports do not match the three-skill surface",
      );
    }
    for (const agentPath of manifest.agents ?? []) {
      if (!existsSync(join(repoRoot, agentPath))) {
        errors.push(`Claude manifest exports missing agent: ${agentPath}`);
      }
    }
  }

  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const errors = validateRepository();
  if (errors.length > 0) {
    console.error("Skill validation failed:\n");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Validated exactly ${EXPECTED_SKILLS.length} skills: ${EXPECTED_SKILLS.join(", ")}`,
    );
  }
}
