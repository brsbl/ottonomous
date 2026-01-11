# Log System Redesign & Dogfooding Plan

## Executive Summary

This plan addresses two key goals:

1. **Log System Redesign**: Unlike spec and task (where the USER has context), with log the AGENT has the context. The agent just investigated the code and knows what to capture. No interview needed.

2. **Dogfooding**: Use aidevkit to document and validate itself by creating specs, tasks, and log entries for each subsystem.

---

## Part 1: Architecture Changes

### 1.1 Key Insight: Agent-First Log Capture

| System | Who has context? | Flow |
|--------|------------------|------|
| Spec | User | Interview -> extract from user |
| Task | User | Interview -> extract from user |
| Log | **Agent** | Agent already knows -> just capture |

The agent doesn't need to interview anyone - it just investigated the code and knows:
- What files it read (anchors)
- What it learned (the discovery)

### 1.2 Log Index

**Purpose:** Pre-computed metadata for fast search and staleness queries.

**Location:** `.kit/logs/index.json`

**Structure:**
```json
{
  "version": 1,
  "updated_at": "2024-01-15T10:30:00Z",
  "entries": {
    "auth-flow-a1b2": {
      "path": ".kit/logs/auth/auth-flow-a1b2.md",
      "name": "Auth Flow",
      "category": "auth",
      "anchors": [
        {
          "path": "src/auth/session.js",
          "hash": "abc123",
          "mtime": 1705320000
        }
      ],
      "entry_mtime": 1705325000,
      "status": "valid",
      "snippet": "Sessions use JWT stored in httpOnly..."
    }
  }
}
```

### 1.3 Index Update Strategy

| Trigger | Action |
|---------|--------|
| `log create` | Add entry to index |
| `log edit` | Update entry in index |
| `log verify` | Update entry mtime and status |
| `log remove` | Remove entry from index |
| `log list` | Lazy revalidate if index stale |
| `log search` | Use index for fast search |
| `log reindex` | Full rebuild from filesystem |

### 1.4 CLI Unification

All commands go through `kit`:
```bash
kit log create --name "..." --anchors ... --prompt "..."
```

No separate `systems/log/bin/log` paths in documentation or skills.

---

## Part 2: Dogfooding Plan

### 2.1 Phase 1: Initialize

```bash
cd /Users/brsbl/Documents/agent\ workflow/aidevkit
./bin/kit init
```

### 2.2 Phase 2: Create Specifications

Create specs for each system documenting expected behavior:

#### Spec System Specification
```bash
./bin/kit spec create --name "Spec System" --content "..."
```

Content covers:
- Data format (markdown + YAML frontmatter)
- ID generation algorithm
- All commands (init, create, list, show, update, edit, remove, search)
- Status workflow (draft -> in-review -> approved -> implemented -> deprecated)
- Implementation files

#### Task System Specification
```bash
./bin/kit spec create --name "Task System" --content "..."
```

Content covers:
- JSON storage format
- Task status (pending, in_progress, done)
- Priority levels (0-4)
- Dependency handling
- Next task algorithm
- All commands

#### Log System Specification
```bash
./bin/kit spec create --name "Log System" --content "..."
```

Content covers:
- Entry format with anchors
- Staleness detection mechanism
- Category organization
- All commands
- Index feature (new)

#### Unified CLI Specification
```bash
./bin/kit spec create --name "Unified CLI" --content "..."
```

Content covers:
- Command routing
- Global commands (init, status, help, version)
- Subsystem delegation

### 2.3 Phase 3: Generate Task Lists

Initialize task lists from specs:
```bash
./bin/kit task init .kit/specs/spec-system-XXXX.md
./bin/kit task init .kit/specs/task-system-XXXX.md
./bin/kit task init .kit/specs/log-system-XXXX.md
./bin/kit task init .kit/specs/unified-cli-XXXX.md
```

Create verification tasks for each system (~40+ tasks total):

**Spec System Tasks:**
- Verify spec init creates .kit/specs/ directory
- Verify spec init installs Claude skill and command
- Verify spec create generates valid ID format
- Verify spec create handles ID collision with retry
- Verify spec list shows all specs with correct status
- ... and more

**Task System Tasks:**
- Verify tasks init creates JSON with correct structure
- Verify tasks next returns highest priority unblocked task
- Verify tasks next reports all-blocked correctly
- Verify tasks dep add creates dependency
- ... and more

**Log System Tasks:**
- Verify log create validates anchor files exist
- Verify log stale detects modified anchors
- Verify log stale detects deleted anchors
- Verify log verify updates entry timestamp
- ... and more

**Unified CLI Tasks:**
- Verify kit init creates all required directories
- Verify kit status shows accurate counts
- Verify kit routes to correct subsystems
- ... and more

### 2.4 Phase 4: Create Log Entries

Document internal implementations (~15+ entries):

**Spec System Internals:**
```bash
./bin/kit log create --name "Spec ID Generation" \
  --anchors systems/spec/lib/utils/spec.sh \
  --prompt "ID generation uses slugify + 4-char random hex suffix..."

./bin/kit log create --name "Spec Init Flow" \
  --category spec \
  --anchors systems/spec/lib/commands/init.sh \
  --prompt "Init creates .kit/specs/, Claude skill, and command..."
```

**Task System Internals:**
```bash
./bin/kit log create --name "Task Next Algorithm" \
  --anchors systems/tasks/lib/commands/next.sh \
  --prompt "Next task selection: filter pending, filter unblocked, sort by priority..."
```

**Log System Internals:**
```bash
./bin/kit log create --name "Staleness Detection" \
  --anchors systems/log/lib/commands/stale.sh \
  --prompt "Staleness compares mtime of log entry vs anchor files..."
```

**CLI Internals:**
```bash
./bin/kit log create --name "CLI Routing Architecture" \
  --anchors bin/kit \
  --prompt "Main routing uses case statement. Subsystems use exec..."
```

---

## Part 3: Implementation Order

### Sprint 1: Index Foundation
1. Create `systems/log/lib/utils/index.sh` - Index CRUD operations
2. Create `systems/log/lib/utils/hash.sh` - Content hashing
3. Create `systems/log/lib/commands/reindex.sh` - Full rebuild command
4. Modify `systems/log/lib/commands/init.sh` - Initialize empty index

### Sprint 2: Command Integration
1. Modify `create.sh` - Add to index after create
2. Modify `edit.sh` - Update index after edit
3. Modify `verify.sh` - Update index after verify
4. Modify `remove.sh` - Remove from index after delete

### Sprint 3: Query Optimization
1. Modify `list.sh` - Read from index if available
2. Modify `search.sh` - Fast path via index
3. Modify `stale.sh` - Read status from index
4. Add `status.sh` - Log health overview

### Sprint 4: Skill & Command Updates
1. Update `systems/log/templates/SKILL.md` - Agent-first workflow
2. Update `claude/commands/log.md` - Simplified capture flow
3. Remove interview steps (agent has context)

### Sprint 5: Dogfooding
1. Run `kit init` in aidevkit directory
2. Create 4 specifications
3. Generate task lists (~40+ tasks)
4. Create log entries (~15+ entries)
5. Run verification tasks
6. Run `kit status` to validate

---

## Part 4: File Changes Summary

### New Files
| Path | Purpose |
|------|---------|
| `systems/log/lib/utils/index.sh` | Index operations |
| `systems/log/lib/utils/hash.sh` | Content hashing |
| `systems/log/lib/commands/reindex.sh` | Full rebuild command |
| `systems/log/lib/commands/status.sh` | Log health overview |

### Modified Files
| Path | Changes |
|------|---------|
| `systems/log/lib/commands/init.sh` | Initialize empty index |
| `systems/log/lib/commands/create.sh` | Add to index after create |
| `systems/log/lib/commands/edit.sh` | Update index after edit |
| `systems/log/lib/commands/verify.sh` | Update index after verify |
| `systems/log/lib/commands/remove.sh` | Remove from index after delete |
| `systems/log/lib/commands/list.sh` | Read from index if available |
| `systems/log/lib/commands/search.sh` | Fast path via index |
| `systems/log/lib/commands/stale.sh` | Read status from index |
| `systems/log/bin/log` | Add reindex, status commands |
| `systems/log/templates/SKILL.md` | Agent-first workflow |
| `claude/commands/log.md` | Simplified capture flow |

### Files to Remove
| Path | Reason |
|------|--------|
| `systems/log/lib/commands/add.sh` | Redundant with `create.sh` |
| `systems/log/templates/init-prompt.md` | User interview not needed |

---

## Part 5: Feedback Capture During Dogfooding

During dogfooding, we record all observations in a simple markdown file:

**Location:** `.kit/dogfood-feedback.md`

**Format:**
```markdown
# Dogfood Feedback

## Session: YYYY-MM-DD

### Bugs
- [ ] `kit spec create` fails with quotes in content
- [ ] `kit task next` shows wrong spec ID

### UX Issues
- [ ] No confirmation message after `log create`
- [ ] Error messages don't suggest fixes

### Missing Features
- [ ] Need `--dry-run` flag for create commands
- [ ] Want `kit log show <id>` to view single entry

### Ideas
- [ ] Index should cache first 100 chars as snippet
- [ ] Add shell completion support

### Learnings (for log entries later)
- ID collision retry works correctly (tested with 1000 creates)
- Staleness detection uses mtime comparison
```

**Workflow:**
1. During testing: append observations to feedback file
2. After session: review feedback file
3. Create tasks from bugs/issues: `kit task create --spec <id> "Fix: ..."`
4. Create log entries from learnings: `kit log create ...`
5. Check off processed items in feedback file

**Why this approach:**
- Works even when the tool is broken
- No context switching during testing
- Batch process feedback efficiently
- Creates audit trail of what we found

---

## Part 6: Success Criteria

After implementation:

1. **Index works correctly**
   - `kit log create` updates index
   - `kit log search` uses index for fast lookup
   - `kit log stale` reads pre-computed status

2. **Dogfooding validates the tool**
   - All 4 specs created successfully
   - All task lists generated
   - All log entries captured
   - `kit status` shows accurate counts

3. **Agent-first workflow**
   - SKILL.md describes agent capture (no interview)
   - `/log` command accepts direct input
   - No prompting for information agent already knows

4. **Unified CLI**
   - All docs use `kit log ...` not direct paths
   - Skills call `kit log create` not `log create`
