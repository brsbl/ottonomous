# Validation utilities for spec-system
# Source this file to access validation functions

# Source config for VALID_STATUSES
_VALIDATE_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${_VALIDATE_SH_DIR}/../config.sh" ]; then
    . "${_VALIDATE_SH_DIR}/../config.sh"
fi

# Find all spec files (**/.kit/specs/*.md) from repo root
# Usage: find_all_specs "/path/to/repo"
# Output: List of spec file paths, one per line
find_all_specs() {
    local repo_root="${1:-.}"

    # Use find for POSIX compatibility
    find "$repo_root" -path "*/.kit/specs/*.md" -type f 2>/dev/null | sort
}

# Find a spec file by its ID
# Usage: find_spec_by_id "my-feature-a4b2" "/path/to/repo"
# Output: Path to spec file if found, empty otherwise
# Returns: 0 if found, 1 if not found
find_spec_by_id() {
    local id="$1"
    local repo_root="${2:-.}"
    local specs
    local spec_file

    specs=$(find_all_specs "$repo_root")

    if [ -z "$specs" ]; then
        return 1
    fi

    while IFS= read -r spec_file; do
        if [ -f "$spec_file" ]; then
            # Extract ID from frontmatter
            local file_id
            file_id=$(sed -n '/^---$/,/^---$/p' "$spec_file" | grep -E '^id:' | sed 's/^id:[[:space:]]*//' | tr -d '"'"'" | head -1)

            if [ "$file_id" = "$id" ]; then
                printf '%s' "$spec_file"
                return 0
            fi
        fi
    done <<< "$specs"

    return 1
}

# Validate that a status value is valid
# Usage: validate_status "approved"
# Returns: 0 if valid, 1 if invalid
validate_status() {
    local input_status="$1"
    local valid_status

    # Ensure VALID_STATUSES is defined
    if [ ${#VALID_STATUSES[@]} -eq 0 ]; then
        VALID_STATUSES=("draft" "in-review" "approved" "implemented" "deprecated")
    fi

    for valid_status in "${VALID_STATUSES[@]}"; do
        if [ "$input_status" = "$valid_status" ]; then
            return 0
        fi
    done

    return 1
}
