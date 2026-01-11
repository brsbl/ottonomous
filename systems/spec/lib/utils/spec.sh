#!/usr/bin/env bash
#
# Spec-specific utility functions
#

# Generate a unique ID from a name
# Format: slugified-name-xxxx (where xxxx is random suffix)
generate_id() {
    local name="$1"
    local slug
    local suffix

    # Convert to lowercase, replace spaces/special chars with hyphens
    slug=$(echo "$name" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//' | \
        cut -c1-30)

    # Generate random 4-character suffix (alphanumeric)
    if command -v openssl >/dev/null 2>&1; then
        suffix=$(openssl rand -hex 2)
    else
        suffix=$(printf '%04x' $((RANDOM % 65536)))
    fi

    echo "${slug}-${suffix}"
}

# Validate that an ID is unique in the specs directory
validate_unique() {
    local id="$1"
    local specs_dir="${2:-specs}"

    # Check if file already exists
    if [[ -f "${specs_dir}/${id}.md" ]]; then
        return 1
    fi

    return 0
}

# Write a spec file with frontmatter
write_spec() {
    local id="$1"
    local name="$2"
    local content="$3"
    local path="$4"
    local created="${5:-$(date +%Y-%m-%d)}"

    # Create the spec file with YAML frontmatter
    cat > "$path" << EOF
---
id: ${id}
name: ${name}
status: draft
created: ${created}
updated: ${created}
---

# ${name}

${content}
EOF

    return 0
}

# Read spec frontmatter
read_spec_frontmatter() {
    local path="$1"
    local field="$2"

    if [[ ! -f "$path" ]]; then
        return 1
    fi

    # Extract value from YAML frontmatter
    sed -n '/^---$/,/^---$/p' "$path" | \
        grep "^${field}:" | \
        sed "s/^${field}:[[:space:]]*//"
}

# List all spec IDs
list_spec_ids() {
    local specs_dir="${1:-specs}"

    if [[ ! -d "$specs_dir" ]]; then
        return 1
    fi

    find "$specs_dir" -maxdepth 1 -name "*.md" -type f | \
        xargs -I {} basename {} .md | \
        sort
}

# Get spec path by ID
get_spec_path() {
    local id="$1"
    local specs_dir="${2:-specs}"

    local path="${specs_dir}/${id}.md"
    if [[ -f "$path" ]]; then
        echo "$path"
        return 0
    fi

    return 1
}
