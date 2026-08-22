import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EXPECTED_SKILLS,
  validateRepository,
} from "../scripts/validate-skills.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const readSkill = (name) =>
  readFileSync(join(repoRoot, "skills", name, "SKILL.md"), "utf8");
const readSummaryTemplate = () =>
  readFileSync(
    join(repoRoot, "skills", "summary", "templates", "moss-summary.md"),
    "utf8",
  );
const readGeneratedSummaryInterface = () =>
  readFileSync(
    join(
      repoRoot,
      "plugins",
      "ottonomous",
      "skills",
      "summary",
      "agents",
      "openai.yaml",
    ),
    "utf8",
  );

describe("published skill surface", () => {
  it("contains exactly spec, review, build, and summary in source and generated output", () => {
    const source = readdirSync(join(repoRoot, "skills")).sort();
    const generated = readdirSync(
      join(repoRoot, "plugins", "ottonomous", "skills"),
    ).sort();

    expect(source).toEqual(EXPECTED_SKILLS);
    expect(generated).toEqual(EXPECTED_SKILLS);
    expect(validateRepository(repoRoot)).toEqual([]);
  });

  it("keeps every runtime skill independent from legacy workflow storage", () => {
    for (const skill of EXPECTED_SKILLS) {
      const body = readSkill(skill);
      expect(body).not.toMatch(/\.otto(?:\/|\b)/);
      expect(body).toMatch(/caller|supplied/i);
    }
  });
});

describe("standalone contracts", () => {
  it("writes the researched and reviewed spec, then hands off only its link", () => {
    const spec = readSkill("spec");

    expect(spec).toMatch(/Research the problem/);
    expect(spec).toMatch(/Interview for consequential decisions/);
    expect(spec).toMatch(/technical-product-manager/);
    expect(spec).toMatch(/Write and link the spec/);
    expect(spec).toMatch(/\[Open the spec\]\(\{destination link\}\)/);
    expect(spec).not.toMatch(/approv/i);
    expect(spec).toMatch(/output destination/i);
  });

  it("preserves prioritized parallel review and false-positive validation", () => {
    const review = readSkill("review");

    expect(review).toMatch(/P0-P2/);
    expect(review).toMatch(/Run independent scopes in parallel/);
    expect(review).toMatch(/false-positive-validator/);
    expect(review).toMatch(/caller-supplied findings/);
  });

  it("builds directly from a spec through bounded delegation and repeated verification", () => {
    const build = readSkill("build");

    expect(build).toMatch(/Spec reference/);
    expect(build).toMatch(/Choose the next bounded slice/);
    expect(build).toMatch(/Delegate each selected slice to a subagent/);
    expect(build).toMatch(/Integrate and verify the slice/);
    expect(build).toMatch(/Reconcile with the spec and repeat/);
    expect(build).toMatch(/genuine blocker/i);
  });

  it("writes a decision-focused summary from the native Moss template", () => {
    const summary = readSkill("summary");
    const template = readSummaryTemplate();
    const generatedInterface = readGeneratedSummaryInterface();

    expect(summary).toMatch(/align on the problem first/i);
    expect(summary).toMatch(/templates\/moss-summary\.md/);
    expect(summary).toMatch(
      /return the complete Moss Markdown summary inline by default/i,
    );
    expect(summary).toMatch(
      /pull request attached to the current bb thread or branch/i,
    );
    expect(summary).not.toMatch(/\*\*Working location:\*\*/);
    expect(summary).not.toMatch(/\*\*Output destination:\*\*/);
    expect(summary).toMatch(/every changed file/i);
    expect(summary).toMatch(/problem the change claims to solve/i);
    expect(summary).toMatch(/performance, security, privacy/i);
    expect(summary).toMatch(/extensibility\/future-proofing/i);
    expect(summary).toMatch(/maintainability/i);
    expect(summary).not.toMatch(/\.otto(?:\/|\b)/);

    expect(template).toMatch(/^# \{\{TITLE\}\}/);
    expect(template).toMatch(/```moss-callout\npriority/);
    expect(template).toMatch(/Problem this change claims to solve/);
    expect(template).toMatch(/Affected user or system/);
    expect(template).toMatch(/## Issues encountered/);
    expect(template).toMatch(/## Trade-offs/);
    expect(template).toMatch(/## Platform implications/);
    for (const implication of [
      "Performance",
      "Security",
      "Privacy",
      "Extensibility / future-proofing",
      "Maintainability",
    ]) {
      expect(template).toContain(`| ${implication} |`);
    }
    expect(template).not.toMatch(/```moss-html|<script|<button/);
    expect(generatedInterface).toMatch(
      /problem, outcomes, trade-offs, and implications/i,
    );
    expect(generatedInterface).not.toMatch(/interactive change map/i);
  });
});
