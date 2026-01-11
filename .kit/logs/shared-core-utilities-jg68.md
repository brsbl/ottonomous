---
id: shared-core-utilities-jg68
anchors:
  - shared/lib/core.sh
---

core.sh provides color constants using tput with fallbacks for non-TTY. Output functions include error (red stderr), success (green), info (blue), warn (yellow stderr), debug (only if DEBUG=1). Validation helpers include in_array, require_file, require_dir. String utilities include trim, to_lower, short_hash, slugify. Uses _AW_CORE_LOADED guard to prevent multiple sourcing.
