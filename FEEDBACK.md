# Dogfooding Feedback

Feedback captured while using the system to refactor itself.

---

## Session Log

### 2026-01-12: /spec workflow

**Issue:** Running `/spec` asks the user if they want to write a spec, which is superfluous since they explicitly invoked the command.

**Current flow:**
1. User runs `/spec`
2. Skill loads and asks "Would you like me to help you write a spec?"
3. User says yes
4. Skill runs `/spec` command (but it's already running?)

**Problem:** The skill's confirmation flow is designed for auto-trigger, not explicit invocation. When user explicitly runs `/spec`, they've already decided they want a spec.

**Fix needed:**
- Skill should only ask for confirmation when auto-triggered by context
- When explicitly invoked via `/spec`, skip confirmation and start workflow immediately
- Or: Remove confirmation from skill entirely, let the command handle the workflow

**Resolution:** Claude Code has a built-in confirmation step for skills. Remove custom confirmation from skill - just redirect to command. Keeps skill ultra-thin.

---

### 2026-01-12: /spec interview improvements

**Feedback:** The interview phase should be more structured:
1. Ask user for reference projects upfront
2. When asking questions, present 2-3 options with:
   - A recommendation
   - Pros/cons of each option
   - What reference project(s) do
   - What best practices suggest (from web search)

**Rationale:** This makes the interview more productive - user gets informed options instead of open-ended questions.

---

### 2026-01-12: Spec = PRD + Tech Spec

**Feedback:** Specs should capture both:
1. Product requirements (PRD) - what and why
2. Technical spec / eng design - architecture and how

**Implication:** The Draft section should include architecture/design decisions, not just feature requirements.

---

### 2026-01-12: Command focus

**Feedback:** Each command should focus on one thing. Skills should link to all commands in a workflow.

**Implication for task system:**
- `/task` = generate tasks from spec (one-time)
- Need separate commands for: pick next, update status, close
- Skill links to all of these as a workflow

---

### 2026-01-12: Not using /spec skill properly

**Feedback:** When writing the log system spec, user asked "are you using the actual spec skill?"

**Issue:** I read the spec command and followed it loosely, but:
- Didn't ask about reference projects for all specs
- Didn't consistently do web research before interview
- Didn't always present structured options with recommendations

**Fix:** More disciplined adherence to the /spec workflow in command file.

---

### 2026-01-12: Log index purpose

**Feedback:** The log index should be like an API reference - a summary of all logs so the agent knows how to navigate the knowledge base.

**Not:** An anchor-to-entries mapping (anchors are already in each log's frontmatter).

**Purpose:** Agent reads index, knows what knowledge exists, navigates to specific entries.

---

### 2026-01-12: Log index needs structure

**Feedback:** Index should be structured table of contents, not flat list. Progressive disclosure means agent reads only relevant parts.

**Options:**
- By topic/domain (auth, api, data)
- By anchor file path (src/auth/, src/api/)
- Nested hierarchy
