---
name: otto
description: Autonomous product development. Takes an idea and builds it end-to-end with subagents. Write a product spec, generate tasks from spec, implement each task while testing/reviewing/documenting changes, with final verification. Use when you want to build something from scratch.
argument-hint: [product idea]
model: opus
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
| `spec` | `/spec {product_idea}` | spec file exists | - |
| `task` | `/task {spec_id}` | tasks file exists | - |
| `session:{id}:implement` | `/next {id}` | session status is done | `frontend-developer`, `backend-architect` per task type |
| `session:{id}:test` | `/test write staged` | tests pass | - |
| `session:{id}:review` | `/review staged` | review complete | `architect-reviewer`, `senior-code-reviewer` per change type |
| `session:{id}:fix` | `/review fix P0-P1` | P0/P1 fixed (if any) | - |
| `session:{id}:doc` | `/doc staged` | doc entry exists | - |
| `build` | `npm run build` | exit 0 | - |
| `test` | `/test all` | tests pass | - |
| `review` | `/review branch` | review complete | `architect-reviewer`, `senior-code-reviewer` per change type |
| `review:fix` | `/review fix P0-P1` | P0/P1 fixed (if any) | - |
| `summary` | `/summary` | HTML created | - |

---

## Workflow

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

**Invoke `/spec {product_idea}`**

**Verify:** `.otto/specs/{id}.md` exists. If not, retry.

**After verification:**
- Update `spec_id` in state.json
- Update `current_phase` → `task`

---

### Phase: task

**Invoke `/task {spec_id}`**

**Verify:** `.otto/tasks/{spec_id}.json` exists with sessions array. If not, retry.

Update `sessions.total` in state.json.

---

### Per-Session Loop

**Invoke `/next session`** (no other arguments)

Returns the next session id without implementing.

**After /next session returns:**
- Update `current_session_id` → `{id}`
- Update `current_phase` → `session:{id}:implement`

#### Phase: session:{id}:implement

**Invoke `/next {session-id}`**

Subagent implements tasks using specialized agents:
- Frontend tasks → `frontend-developer`
- Backend tasks → `backend-architect`

(Subagent implements all tasks in the session, updating each task status as it goes)

Update `current_phase` → `session:{id}:test`

#### Phase: session:{id}:test

**Invoke `/test write staged`**

Update `current_phase` → `session:{id}:review`

#### Phase: session:{id}:review

**Invoke `/review staged`** (creates fix plan)

Uses specialized reviewers based on change type:
- Architectural changes → `architect-reviewer`
- Implementation changes → `senior-code-reviewer`

If review finds P0/P1 issues:
- Update `current_phase` → `session:{id}:fix`

Otherwise:
- Update `current_phase` → `session:{id}:doc`

#### Phase: session:{id}:fix

**Invoke `/review fix P0-P1`** (implements P0/P1 fixes)

Update `current_phase` → `session:{id}:doc`

#### Phase: session:{id}:doc

**Invoke `/doc staged`**

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

**Invoke `/test all`**

Update `current_phase` → `review`

---

### Phase: review

**Invoke `/review branch`** (creates fix plan)

If review finds P0/P1 issues:
- Update `current_phase` → `review:fix`

Otherwise:
- Update `current_phase` → `summary`

---

### Phase: review:fix

**Invoke `/review fix P0-P1`** (implements P0/P1 fixes)

**Final commit:**
```bash
git add -A && git commit -m "otto: complete - {completed}/{total} sessions"
```

Update `current_phase` → `summary`

---

### Phase: summary

**Invoke `/summary`**

Set `status` → `completed`

**Announce:**
```
Session complete!
- Sessions: {completed}/{total}
- Branch: otto/{session_id}
- Summary: .otto/summaries/{branch}-{date}.html
```

---

## Recovery

When `/otto` is invoked, check for existing session:

1. Check `.otto/otto/sessions/` for state.json with `status: "in_progress"`
2. Read `current_phase` and `current_session_id`
3. Offer to resume or start fresh
4. If resuming, continue from `current_phase`
