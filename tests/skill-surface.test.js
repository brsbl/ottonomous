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

describe("published skill surface", () => {
  it("contains exactly spec, review, and build in source and generated output", () => {
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
  it("preserves the spec research, interview, review, and approval loop", () => {
    const spec = readSkill("spec");

    expect(spec).toMatch(/Research the problem/);
    expect(spec).toMatch(/Interview for consequential decisions/);
    expect(spec).toMatch(/technical-product-manager/);
    expect(spec).toMatch(/Get approval and deliver/);
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
});
