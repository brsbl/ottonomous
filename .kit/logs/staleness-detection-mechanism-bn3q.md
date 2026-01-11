---
id: staleness-detection-mechanism-bn3q
anchors:
  - systems/log/lib/commands/stale.sh
  - systems/log/lib/utils/frontmatter.sh
---

Staleness is computed by comparing mtime of log entry file vs anchor files. Uses stat -f %m on macOS or stat -c %Y on Linux. If anchor mtime is greater than log mtime, entry is stale. If anchor file does not exist, entry is orphaned. Anchors extracted from YAML frontmatter by parsing lines between --- delimiters.
