---
name: otto
description: Autonomous product development. Takes an idea and builds it end-to-end with subagents. Write a product spec, generate tasks from spec, implement each task while testing/reviewing changes, with final verification. Use when you want to build something from scratch.
argument-hint: [product idea]
---

**Product Idea:** $ARGUMENTS

---

## Autonomous Behavior

All skills are invoked via subagents.

When a skill asks questions or requests confirmation:
- Auto-select "(Recommended)" options
- Auto-approve specs, plans, and confirmations

---

## Phase Reference

| Phase | Action | Verify | Agents |
|-------|--------|--------|--------|
| `init` | Create session, branch | state.json exists | - |
| `spec` | `spec` skill with `{product_idea}` | spec file exists | - |
| `task` | `task` skill with `{spec_name_or_id}` | tasks file exists | - |
| `session:{id}:implement` | `next` skill (`session`) | session status is done | `frontend-developer`, `backend-architect` per task type |
| `session:{id}:test` | `test` skill (`write staged`) | tests pass | - |
| `session:{id}:verify` | `test` skill (`all`) plus project-specific harness | objective criteria pass or are marked `HUMAN` | project-specific validators |
| `session:{id}:review` | `review` skill (`staged`) | review complete | `architect-reviewer`, `senior-code-reviewer` per change type |
| `session:{id}:fix` | `review` skill (`fix P0-P1`) | P0/P1 fixed (if any) | - |
| `build` | `npm run build` | exit 0 | - |
| `test` | `test` skill (`all`) | tests pass | - |
| `verify` | `test` skill (`all`) plus project-specific harness | objective criteria pass or are marked `HUMAN` | project-specific validators |
| `review` | `review` skill (`branch`) | review complete | `architect-reviewer`, `senior-code-reviewer` per change type |
| `review:fix` | `review` skill (`fix P0-P1`) | P0/P1 fixed (if any) | - |
| `summary` | `summary` skill | HTML created | - |

---

## Workflow

**Before each phase** (except `init`): verify `git branch --show-current` matches `otto/${session_id}`. If not, `git checkout otto/${session_id}`.

### Phase: init

**Create session:**
```bash
session_id="otto-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 2)"
mkdir -p .otto/otto/sessions/${session_id}
```

**Initialize state.json:**
```json
{
  "session_id": "{session_id}",
  "status": "in_progress",
  "product_idea": "{product_idea}",
  "spec_id": null,
  "current_phase": "init",
  "current_session_id": null,
  "sessions": { "total": 0, "completed": 0 }
}
```

**Create feature branch:**
```bash
git checkout -b otto/${session_id}
```

Update `current_phase` → `spec`

---

### Phase: spec

**Invoke the `spec` skill with `{product_idea}`**

**Verify:** `.otto/specs/{id}.md` exists. If not, retry.

**After verification:**
- Update `spec_id` in state.json
- Update `current_phase` → `task`

---

### Phase: task

**Invoke the `task` skill with `{spec_name_or_id}`**

**Verify:** `.otto/tasks/{spec_id}.json` exists with sessions array. If not, retry.

Update `sessions.total` in state.json.

---

### Per-Session Loop

**Invoke the `next` skill (`session status`)**

Returns the next session id without implementing.

If no unblocked sessions and all are "done": proceed to Phase: build.
If no unblocked sessions but some blocked: report "{n} sessions blocked."

**After the `next` skill (`session status`) returns:**
- Update `current_session_id` → `{id}`
- Update `current_phase` → `session:{id}:implement`

#### Phase: session:{id}:implement

**Invoke the `next` skill (`session`)**

Subagent implements tasks using specialized agents:
- Frontend tasks → `frontend-developer`
- Backend tasks → `backend-architect`

(Subagent implements all tasks in the session, updating each task status as it goes)

Update `current_phase` → `session:{id}:test`

#### Phase: session:{id}:test

**Invoke the `test` skill (`write staged`)**

Update `current_phase` → `session:{id}:verify`

#### Phase: session:{id}:verify

**Run the `test` skill (`all`), then execute automatable checks using the project-specific harness.**

The legacy standalone verification skill has been removed. Use the `test` skill (`browser` or `electron`), the host environment's available browser automation tool, or the app's own validation harness. For Moss desktop UI, use the repo-local `moss-ui` workflow skill. Mark subjective or non-automatable checks as `HUMAN` with a reason.
Hard gate for objective automated checks — loops (diagnose → fix → rebuild → re-check) until failures pass.

Update `current_phase` → `session:{id}:review`

#### Phase: session:{id}:review

**Invoke the `review` skill (`staged`)** (creates fix plan)

Uses specialized reviewers based on change type:
- Architectural changes → `architect-reviewer`
- Implementation changes → `senior-code-reviewer`

If review finds P0/P1 issues:
- Update `current_phase` → `session:{id}:fix`

Otherwise:
- Increment `sessions.completed`

#### Phase: session:{id}:fix

**Invoke the `review` skill (`fix P0-P1`)** (implements P0/P1 fixes)

- Increment `sessions.completed`
- If more pending sessions: Return to **Per-Session Loop**
- If no more sessions: Update `current_phase` → `build`

**Checkpoint commit every 2 sessions:**
```bash
git add -A && git commit -m "otto: checkpoint - {completed}/{total} sessions"
```

---

### Phase: build

```bash
log_file=".otto/otto/sessions/${session_id}/build.log"
npm run build > >(tee "$log_file") 2>&1
```

**Verify:** Build exits 0. If not, fix issues and retry.

Update `current_phase` → `test`

---

### Phase: test

**Invoke the `test` skill (`all`)**

Update `current_phase` → `verify`

---

### Phase: verify

**Run the `test` skill (`all`), then execute automatable checks using the project-specific harness.**

The legacy standalone verification skill has been removed. Use the `test` skill (`browser` or `electron`), the host environment's available browser automation tool, or the app's own validation harness. For Moss desktop UI, use the repo-local `moss-ui` workflow skill. Objective automated failures are hard gates; subjective/non-automatable checks must be marked `HUMAN` for manual QA.

Update `current_phase` → `review`

---

### Phase: review

**Invoke the `review` skill (`branch`)** (creates fix plan)

If review finds P0/P1 issues:
- Update `current_phase` → `review:fix`

Otherwise:
- Update `current_phase` → `summary`

---

### Phase: review:fix

**Invoke the `review` skill (`fix P0-P1`)** (implements P0/P1 fixes)

**Final commit:**
```bash
git add -A && git commit -m "otto: complete - {completed}/{total} sessions"
```

Update `current_phase` → `summary`

---

### Phase: summary

**Invoke the `summary` skill**

Set `status` → `completed`

**Open the generated summary in the default browser:**
```bash
open .otto/summaries/{branch}-{date}.html
```

**Announce:**
```
Session complete!
- Sessions: {completed}/{total}
- Branch: otto/{session_id}
- Summary: .otto/summaries/{branch}-{date}.html
```

---

## Recovery

When `otto` is invoked, check for existing session:

1. Check `.otto/otto/sessions/` for state.json with `status: "in_progress"`
2. Read `current_phase` and `current_session_id`
3. Offer to resume or start fresh
4. If resuming, verify branch matches `otto/${session_id}`. If on wrong branch, switch: `git checkout otto/${session_id}`
5. Continue from `current_phase`
