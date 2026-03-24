---
name: qa
description: Generates manual and automated verification checklists from specs. Creates structured QA plans with human and test verification steps. Use when preparing for QA, creating test plans, or validating completeness.
argument-hint: list | <spec-name-or-id>
model: opus
---

**Argument:** $ARGUMENTS

| Command | Behavior |
|---------|----------|
| `/qa list` | List existing QA checklists |
| `/qa {spec-name-or-id}` | Generate QA checklist from spec |

---

## List Mode

If `$ARGUMENTS` is `list`:

1. List `.otto/qa/*.md`
2. For each file, read frontmatter (spec_name, status, created_date)
3. Count automated (A-prefixed) and manual (M-prefixed) checklist items
4. Display as table:
   ```
   | Spec Name | Status | Created | Checks (Auto/Manual) |
   |-----------|--------|---------|----------------------|
   | Design Skill | approved | 2026-01-28 | 8 / 5 |
   ```
5. If no checklists found: "No QA checklists found. Run `/qa <spec-name>` to generate."
6. Stop here — do not continue to generation workflow.

---

## Generate Mode

**Usage:** `/qa <spec-name-or-id>`

### Resolve Spec Argument

1. Try reading `.otto/specs/$ARGUMENTS.md` (exact ID match)
2. If not found, list `.otto/specs/*.md` and read frontmatter of each:
   - Match `name` field (case-insensitive substring)
3. If exactly one match: use that spec
4. If multiple matches: use `AskUserQuestion` to disambiguate, showing name and ID for each
5. If no matches: "No spec matching '{argument}'. Run `/spec list` to see available specs."

### 1. Read Spec and Tasks

Resolve the spec argument (see above), then:

1. Read the spec file
2. Check for task file at `.otto/tasks/{spec-id}.json`
   - If exists: read tasks for additional context (done conditions, file lists)
   - If not: proceed with spec-only input

### 2. Gather Codebase Context

- Use Glob to find relevant source files referenced in the spec
- Use Read to understand existing test patterns and conventions
- Use Grep to find existing test files and testing frameworks
- Note: test runner, test file naming convention, existing test structure

### 3. Generate Checklist

Launch `checklist-generator` subagent with Task tool:

**Handoff to checklist-generator:**
- Full spec content
- Task list with done conditions (if available)
- Codebase context: test framework, existing test patterns, file structure
- Spec ID and name for reference

The subagent analyzes the spec and returns structured checklist items categorized as automated or manual.

Wait for subagent to complete.

### 4. Validate Checklist

Launch `checklist-validator` subagent with Task tool:

**Handoff to checklist-validator:**
- Generated checklist from step 3
- Full spec content
- Spec ID for reference

The subagent reviews the checklist for completeness against the spec — flags uncovered user stories, missing edge cases, and test coverage gaps. Returns prioritized findings (P0-P2).

Wait for validation to complete.

### 5. Interview User on Findings

If no findings, skip to step 6.

For each finding (highest priority first):
1. Present the finding with its priority level
2. If suggestion is clear: `AskUserQuestion` with "Accept", "Reject", "Modify"
3. If accepted: Add the suggested check to the checklist
4. If rejected: Skip to next finding
5. If modify: Apply user's modified version

After processing all findings, continue to step 6.

### 6. Save Checklist

```bash
mkdir -p .otto/qa
```

Write to `.otto/qa/{spec-id}.md`:

```yaml
---
spec_id: {spec-id}
spec_name: {spec-name}
created_date: {YYYY-MM-DD}
status: draft
---
```

**Checklist format:**

```markdown
# QA Checklist: {spec-name}

## Automated Verification

Tests that can be run programmatically.

| # | Category | Check | Expected Result | Test Command/File | Status |
|---|----------|-------|-----------------|-------------------|--------|
| A1 | API | POST /users returns 201 | User created with valid fields | `test/api/users.test.ts` | [ ] |
| A2 | Validation | Empty name rejected | 400 with error message | `test/api/users.test.ts` | [ ] |

## Manual Verification

Steps requiring human judgment or interaction.

| # | Category | Step | Expected Result | Status |
|---|----------|------|-----------------|--------|
| M1 | UI | Navigate to dashboard | Layout matches spec mockup | [ ] |
| M2 | UX | Submit form with valid data | Success feedback shown, data persists | [ ] |
| M3 | Edge Case | Resize to mobile viewport | Responsive layout, no overflow | [ ] |
```

**Status column:** Every item starts as `[ ]`. Update to `[x]` when verified passing. Failed items stay `[ ]` with the failure reason appended (e.g., `[ ] FAIL: timeout on click`). The checklist file is the single source of truth for verification progress.

### 7. Approval

**Output the full checklist** as rendered markdown so the user can review it inline.

**Use `AskUserQuestion`** with options:
- "Approve"
- "Request changes"
- "Open in editor" — run `open .otto/qa/{spec-id}.md`, then ask again

**After each revision:** Output the full updated checklist before asking for approval again. Revise until approved.

On approval, update `status: draft` to `status: approved` in the file.

Report: "QA checklist approved and saved to `.otto/qa/{spec-id}.md`"

### 8. Run Automated Tests

Run `/test` to execute the automated checks from the checklist (A-prefixed items).

**After each test suite completes**, update the checklist file at `.otto/qa/{spec-id}.md`:
- Mark passing items `[x]`
- Mark failing items `[ ] FAIL:` and append the failure reason

Report results: how many automated checks passed/failed.

### 9. Run Verification

**Use `AskUserQuestion`** with options:
- "Run /verify" — Launch the app and verify manual checks via browser/Electron automation
- "Skip verification" — Manual QA only, no automated verification

If user chooses to verify:

1. Read the approved QA checklist at `.otto/qa/{spec-id}.md`
2. Extract the Manual Verification items (M-prefixed)
3. Launch `/verify` with the spec, passing the manual checklist items as verification criteria

The `/verify` skill launches the app (web or Electron), connects browser automation, and checks the manual items that can be verified programmatically (UI layout, element presence, interaction flows). Items requiring subjective human judgment (visual aesthetics, "feels smooth") are flagged for manual follow-up.

4. **After each manual item is verified**, update the checklist file at `.otto/qa/{spec-id}.md`:
   - Mark passing items `[x]`
   - Mark failing items `[ ] FAIL:` and append the failure reason
   - Leave items that cannot be automated as `[ ]` for human follow-up

### 10. Summary

Report:
- Automated checks: {passed}/{total}
- Verified via app: {verified}/{total manual items}
- Remaining manual checks: {count} (require human verification)

> "For remaining manual checks, work through the unchecked items in `.otto/qa/{spec-id}.md`."
