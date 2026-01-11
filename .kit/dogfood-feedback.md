# Dogfood Feedback

Observations captured while using aidevkit to document itself.

**Workflow:**
1. Append observations below during testing
2. After session: create tasks from bugs/issues
3. Create log entries from learnings
4. Check off processed items

---

## Session: 2026-01-10

### Bugs
- [x] `kit spec create` fails: spec system looks for `specs/` but kit init creates `.kit/specs/`. SPEC_DIR not set by kit. **FIXED: Added SPEC_DIR, TASKS_DIR, LOG_DIR exports to bin/kit**

### UX Issues
- [x] Inconsistent command format in init output: spec says "spec create" but log says "kit log create" → **Task unified-cli-a51e:11**
- [x] `spec list` PATH column shows full path with spaces ("agent workflow/aidevkit/...") - should be relative → **Task spec-system-3b0d:10**
- [x] `task create` fails with sed error when title contains forward slash "/" - sed uses / as delimiter → **Task task-system-3f5a:11**
- [x] `task list` output is duplicated - shows each spec's tasks twice → **Task task-system-3f5a:10**
- [x] `kit status` reports "stale: 1" but `kit log stale` says "All log entries are valid" - inconsistent counting → **Task unified-cli-a51e:12**
- [x] `spec init` installs wrong SKILL.md content - init.sh has hardcoded SKILL_TEMPLATE that differs from systems/spec/templates/SKILL.md → **Task spec-system-3b0d:11**

### Missing Features
- [ ] `/spec` skill not registered in Claude Code - cannot invoke via Skill tool, must follow workflow manually

### Ideas
- [ ]

### Learnings (promote to log entries)
-
