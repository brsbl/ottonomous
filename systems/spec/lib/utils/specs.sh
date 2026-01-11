# Combined utilities for spec-system commands
# Sources all other utility files and provides unified interface

_SPECS_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source all utility files
source "${_SPECS_SH_DIR}/../config.sh"
source "${_SPECS_SH_DIR}/id.sh"
source "${_SPECS_SH_DIR}/frontmatter.sh"
source "${_SPECS_SH_DIR}/git.sh"
source "${_SPECS_SH_DIR}/validate.sh"

# Alias for compatibility
get_project_root() {
    get_repo_root
}

# Find all spec files from current directory or repo root
# Usage: find_all_specs
# Output: List of spec file paths, one per line
find_all_specs() {
    local root
    root="$(get_repo_root)"
    find "$root" -path "*/.kit/specs/*.md" -type f 2>/dev/null | sort
}

# Find a spec file by its ID (checks frontmatter id field)
# Usage: find_spec_by_id "my-feature-a4b2"
# Output: Path to spec file if found
# Returns: 0 if found, 1 if not found
find_spec_by_id() {
    local id="$1"
    local root
    root="$(get_repo_root)"
    local specs
    local spec_file

    specs=$(find_all_specs)

    if [[ -z "$specs" ]]; then
        return 1
    fi

    while IFS= read -r spec_file; do
        [[ -z "$spec_file" ]] && continue
        if [[ -f "$spec_file" ]]; then
            local file_id
            file_id=$(get_field "$spec_file" "id")
            if [[ "$file_id" == "$id" ]]; then
                echo "$spec_file"
                return 0
            fi
        fi
    done <<< "$specs"

    return 1
}
