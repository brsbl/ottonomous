#!/usr/bin/env bash
# log-system/lib/utils/search.sh
# Search and discovery functions for log files

# Prevent multiple sourcing
[[ -n "${_LOG_SEARCH_LOADED:-}" ]] && return 0
readonly _LOG_SEARCH_LOADED=1

# Source dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config.sh"
source "${SCRIPT_DIR}/git.sh"

# ==============================================================================
# File Discovery
# ==============================================================================

# Find all log markdown files (excluding tasks directory)
# Arguments:
#   $1 - repo root (optional, defaults to current directory)
# Outputs:
#   One log file path per line (relative to repo root)
# Returns:
#   0 on success
find_all_log_files() {
    local repo_root="${1:-.}"
    local log_dir="$repo_root/$LOG_DIR"

    if [[ ! -d "$log_dir" ]]; then
        return 0
    fi

    # Find all .md files, excluding tasks directory
    find "$log_dir" -type f -name "*.md" 2>/dev/null | while read -r file; do
        # Skip files in tasks directory
        if [[ "$file" == *"/tasks/"* ]]; then
            continue
        fi

        # Output relative path from repo root
        echo "${file#$repo_root/}"
    done
}

# Find log files matching a glob pattern
# Arguments:
#   $1 - glob pattern (e.g., "auth*", "*.md")
#   $2 - repo root (optional)
# Outputs:
#   Matching log file paths
find_kb_by_pattern() {
    local pattern="$1"
    local repo_root="${2:-.}"

    find_all_log_files "$repo_root" | while read -r log_file; do
        local basename
        basename=$(basename "$log_file")
        # shellcheck disable=SC2053
        if [[ "$basename" == $pattern ]] || [[ "$log_file" == *$pattern* ]]; then
            echo "$log_file"
        fi
    done
}

# Find a log file by its exact path
# Arguments:
#   $1 - path to search for (can be partial)
#   $2 - repo root (optional)
# Outputs:
#   Full path to log file if found
# Returns:
#   0 if found, 1 if not found
find_kb_by_path() {
    local search_path="$1"
    local repo_root="${2:-.}"

    # First try exact match
    local exact_path="$repo_root/$search_path"
    if [[ -f "$exact_path" ]]; then
        echo "$search_path"
        return 0
    fi

    # Try with LOG_DIR prefix if not already present
    if [[ "$search_path" != "$LOG_DIR"* ]]; then
        exact_path="$repo_root/$LOG_DIR/$search_path"
        if [[ -f "$exact_path" ]]; then
            echo "$LOG_DIR/$search_path"
            return 0
        fi
    fi

    # Try adding .md extension if not present
    if [[ "$search_path" != *.md ]]; then
        if [[ -f "$repo_root/$search_path.md" ]]; then
            echo "$search_path.md"
            return 0
        fi
        if [[ -f "$repo_root/$LOG_DIR/$search_path.md" ]]; then
            echo "$LOG_DIR/$search_path.md"
            return 0
        fi
    fi

    # Search for partial match
    local matches=()
    while IFS= read -r log_file; do
        if [[ "$log_file" == *"$search_path"* ]]; then
            matches+=("$log_file")
        fi
    done < <(find_all_log_files "$repo_root")

    if [[ ${#matches[@]} -eq 1 ]]; then
        echo "${matches[0]}"
        return 0
    elif [[ ${#matches[@]} -gt 1 ]]; then
        echo "Error: Multiple matches found:" >&2
        printf '  %s\n' "${matches[@]}" >&2
        return 1
    fi

    return 1
}

# ==============================================================================
# Content Search
# ==============================================================================

# Search log files for content matching a pattern
# Arguments:
#   $1 - search pattern (grep regex)
#   $2 - repo root (optional)
#   $3 - context lines (optional, default 2)
# Outputs:
#   Matching lines with context
# Returns:
#   0 if matches found, 1 if no matches
search_log() {
    local pattern="$1"
    local repo_root="${2:-.}"
    local context="${3:-2}"

    local log_dir="$repo_root/$LOG_DIR"

    if [[ ! -d "$log_dir" ]]; then
        echo "Error: Log directory not found: $log_dir" >&2
        return 1
    fi

    local found=0

    # Use grep to search with context
    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        local full_path="$repo_root/$log_file"
        local matches
        matches=$(grep -n -C "$context" -E "$pattern" "$full_path" 2>/dev/null)

        if [[ -n "$matches" ]]; then
            found=1
            echo "${COLOR_BOLD}$log_file${COLOR_RESET}"
            echo "$matches"
            echo ""
        fi
    done < <(find_all_log_files "$repo_root")

    if [[ $found -eq 0 ]]; then
        echo "No matches found for pattern: $pattern" >&2
        return 1
    fi

    return 0
}

# Search log files and return only filenames
# Arguments:
#   $1 - search pattern (grep regex)
#   $2 - repo root (optional)
# Outputs:
#   Matching log file paths
search_log_files_only() {
    local pattern="$1"
    local repo_root="${2:-.}"

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        local full_path="$repo_root/$log_file"
        if grep -q -E "$pattern" "$full_path" 2>/dev/null; then
            echo "$log_file"
        fi
    done < <(find_all_log_files "$repo_root")
}

# ==============================================================================
# Anchor-based Search
# ==============================================================================

# Find log files that reference a specific anchor file
# Arguments:
#   $1 - anchor file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   log file paths that reference this anchor
find_kb_for_anchor() {
    local anchor_path="$1"
    local repo_root="${2:-.}"

    # Source frontmatter utilities
    source "${SCRIPT_DIR}/frontmatter.sh"

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        local full_kb_path="$repo_root/$log_file"

        while IFS= read -r anchor; do
            if [[ "$anchor" == "$anchor_path" ]]; then
                echo "$log_file"
                break
            fi
        done < <(get_anchors "$full_kb_path")
    done < <(find_all_log_files "$repo_root")
}

# Find all log files that reference files in a directory
# Arguments:
#   $1 - directory path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   log file paths
find_kb_for_directory() {
    local dir_path="$1"
    local repo_root="${2:-.}"

    # Normalize directory path (remove trailing slash)
    dir_path="${dir_path%/}"

    # Source frontmatter utilities
    source "${SCRIPT_DIR}/frontmatter.sh"

    local seen_files=()

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        local full_kb_path="$repo_root/$log_file"

        while IFS= read -r anchor; do
            if [[ "$anchor" == "$dir_path"/* ]]; then
                # Check if we already output this log file
                local already_seen=0
                for seen in "${seen_files[@]}"; do
                    if [[ "$seen" == "$log_file" ]]; then
                        already_seen=1
                        break
                    fi
                done

                if [[ $already_seen -eq 0 ]]; then
                    echo "$log_file"
                    seen_files+=("$log_file")
                fi
                break
            fi
        done < <(get_anchors "$full_kb_path")
    done < <(find_all_log_files "$repo_root")
}

# ==============================================================================
# Listing and Statistics
# ==============================================================================

# List all log files with their status
# Arguments:
#   $1 - repo root (optional)
# Outputs:
#   Formatted list of log files with state
list_log_files() {
    local repo_root="${1:-.}"

    source "${SCRIPT_DIR}/staleness.sh"

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        local state
        state=$(compute_staleness "$log_file" "$repo_root")
        local color
        color=$(kb_get_state_color "$state")

        printf "%s[%s]%s %s\n" "$color" "$state" "$COLOR_RESET" "$log_file"
    done < <(find_all_log_files "$repo_root")
}

# Get statistics about log files
# Arguments:
#   $1 - repo root (optional)
# Outputs:
#   Statistics summary
get_kb_stats() {
    local repo_root="${1:-.}"

    source "${SCRIPT_DIR}/staleness.sh"

    local total=0
    local valid=0
    local stale=0
    local orphaned=0

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        ((total++))

        local state
        state=$(compute_staleness "$log_file" "$repo_root")

        case "$state" in
            valid)    ((valid++)) ;;
            stale)    ((stale++)) ;;
            orphaned) ((orphaned++)) ;;
        esac
    done < <(find_all_log_files "$repo_root")

    echo "KB Statistics:"
    echo "  Total files: $total"
    echo "  ${COLOR_GREEN}Valid:${COLOR_RESET}    $valid"
    echo "  ${COLOR_YELLOW}Stale:${COLOR_RESET}    $stale"
    echo "  ${COLOR_RED}Orphaned:${COLOR_RESET} $orphaned"
}

# Check if any log files exist
# Arguments:
#   $1 - repo root (optional)
# Returns:
#   0 if log files exist, 1 if none
has_log_files() {
    local repo_root="${1:-.}"

    local first_file
    first_file=$(find_all_log_files "$repo_root" | head -n 1)

    [[ -n "$first_file" ]]
}
