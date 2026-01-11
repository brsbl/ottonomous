---
id: task-next-algorithm-fw4u
anchors:
  - systems/tasks/lib/commands/next.sh
---

Next task selection algorithm: (1) collect all tasks from all spec files or filtered by --spec, (2) add spec_id to each for context, (3) filter to pending status, (4) filter to unblocked tasks where all depends_on are done, (5) sort by priority ascending (lower number equals higher priority), (6) return first task. Uses jq for all JSON manipulation.
