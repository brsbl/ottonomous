---
id: cli-routing-architecture-s2tt
anchors:
  - bin/kit
---

Main routing uses case statement on first argument. Global commands (init, status, help, version) handled directly in kit script. Subsystem commands (spec, task, log) export environment variables (SPEC_DIR, TASKS_DIR, LOG_DIR) then use exec to replace process with subsystem script. Exec means subsystem errors propagate correctly and no shell state is shared.
