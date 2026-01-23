---
name: otto
description: Autonomous product development. Takes an idea and builds it end-to-end with subagents. Write a product spec, generate tasks from spec, implement each task while testing/reviewing/documenting changes, with final verification. Use when you want to build something from scratch.
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

| Phase | Action | Verify |
|-------|--------|--------|
| `init` | Create session, branch | state.json exists |
| `spec` | `/spec {product_idea}` | spec file exists |
| `task` | `/task {spec_id}` | tasks file exists |
| `task:{id}:implement` | `/next {id}` | task status is done |
| `task:{id}:test` | `/test staged` | tests pass |
| `task:{id}:review` | `/review staged` | P0/P1 fixed |
| `task:{id}:doc` | `/doc staged` | doc entry exists |
| `build` | `npm run build` | exit 0 |
| `test` | `/test branch` | tests pass |
| `review` | `/review branch` | P0/P1 fixed |
| `summary` | `/summary` | HTML created |

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
  "current_task_id": null,
  "tasks": { "total": 0, "completed": 0 }
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

**Verify:** `.otto/tasks/{spec_id}.json` exists with tasks array. If not, retry.

Update `tasks.total` in state.json.

---

### Per-Task Loop

**Invoke `/next`** (no argument)

Returns the next task id without implementing.

**After /next returns:**
- Update `current_task_id` → `{id}`
- Update `current_phase` → `task:{id}:implement`

#### Phase: task:{id}:implement

**Invoke `/next {id}`**

Update `current_phase` → `task:{id}:test`

#### Phase: task:{id}:test

**Invoke `/test staged`**

Update `current_phase` → `task:{id}:review`

#### Phase: task:{id}:review

**Invoke `/review staged`**

Update `current_phase` → `task:{id}:doc`

#### Phase: task:{id}:doc

**Invoke `/doc staged`**

- Increment `tasks.completed`
- If more pending tasks: Return to **Per-Task Loop**
- If no more tasks: Update `current_phase` → `build`

**Checkpoint commit every 5 tasks:**
```bash
git add -A && git commit -m "otto: checkpoint - {completed}/{total} tasks"
```

---

### Phase: build

```bash
npm run build 2>&1 | tee .otto/otto/sessions/${session_id}/build.log
```

**Verify:** Build exits 0. If not, fix issues and retry.

Update `current_phase` → `test`

---

### Phase: test

**Invoke `/test branch`**

Update `current_phase` → `review`

---

### Phase: review

**Invoke `/review branch`**

**Final commit:**
```bash
git add -A && git commit -m "otto: complete - {completed}/{total} tasks"
```

Update `current_phase` → `summary`

---

### Phase: summary

Create `.otto/docs/main-project-overview.md` with What/Why/Notable Details.

**Invoke `/summary`**

Set `status` → `completed`

**Announce:**
```
Session complete!
- Tasks: {completed}/{total}
- Branch: otto/{session_id}
- Summary: .otto/summaries/{branch}-{date}.html
```

---

## Recovery

When `/otto` is invoked, check for existing session:

1. Check `.otto/otto/sessions/` for state.json with `status: "in_progress"`
2. Read `current_phase` and `current_task_id`
3. Offer to resume or start fresh
4. If resuming, continue from `current_phase`
