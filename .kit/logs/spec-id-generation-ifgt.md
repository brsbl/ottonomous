---
id: spec-id-generation-ifgt
anchors:
  - systems/spec/lib/utils/spec.sh
---

ID generation uses slugify plus 4-char random hex suffix. Slugify converts to lowercase, replaces non-alphanumeric with hyphens, collapses multiple hyphens, trims edges, truncates to 30 chars. Random suffix uses openssl rand or RANDOM fallback. Uniqueness validated by checking if file exists, retries up to 5 times.
