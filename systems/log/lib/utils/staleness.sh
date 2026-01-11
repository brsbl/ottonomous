#!/usr/bin/env bash
# kb-system/lib/utils/staleness.sh
# Functions for determining staleness state of KB files based on git history

# Prevent multiple sourcing
[[ -n "${_KB_STALENESS_LOADED:-}" ]] && return 0
readonly _KB_STALENESS_LOADED=1

# Source dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config.sh"
source "${SCRIPT_DIR}/git.sh"
source "${SCRIPT_DIR}/frontmatter.sh"

# ==============================================================================
# Git Timestamp Functions
# ==============================================================================

# Get the last commit timestamp for a file (Unix epoch)
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional, defaults to current directory)
# Outputs:
#   Unix timestamp to stdout, or empty if file not tracked
# Returns:
#   0 on success, 1 if file not tracked or error
get_file_last_commit() {
    local file_path="$1"
    local repo_root="${2:-.}"

    # Get the timestamp of the last commit that modified this file
    local timestamp
    timestamp=$(git -C "$repo_root" log -1 --format="%ct" -- "$file_path" 2>/dev/null)

    if [[ -z "$timestamp" ]]; then
        # File might be new/untracked, use file modification time
        if [[ -f "$repo_root/$file_path" ]]; then
            # Use stat to get modification time
            if [[ "$(uname)" == "Darwin" ]]; then
                timestamp=$(stat -f "%m" "$repo_root/$file_path" 2>/dev/null)
            else
                timestamp=$(stat -c "%Y" "$repo_root/$file_path" 2>/dev/null)
            fi
        else
            return 1
        fi
    fi

    echo "$timestamp"
    return 0
}

# Get the last commit date in human-readable format
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   Date string to stdout
get_file_last_commit_date() {
    local file_path="$1"
    local repo_root="${2:-.}"

    local date_str
    date_str=$(git -C "$repo_root" log -1 --format="%ci" -- "$file_path" 2>/dev/null)

    if [[ -z "$date_str" ]]; then
        # Use file modification time
        if [[ -f "$repo_root/$file_path" ]]; then
            if [[ "$(uname)" == "Darwin" ]]; then
                date_str=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$repo_root/$file_path" 2>/dev/null)
            else
                date_str=$(stat -c "%y" "$repo_root/$file_path" 2>/dev/null | cut -d'.' -f1)
            fi
        fi
    fi

    echo "$date_str"
}

# ==============================================================================
# Staleness Detection
# ==============================================================================

# Check if an anchor file was modified after the KB file
# Arguments:
#   $1 - anchor file path (relative to repo root)
#   $2 - KB file path (relative to repo root)
#   $3 - repo root (optional)
# Returns:
#   0 if anchor is newer (stale), 1 if KB is newer or same (valid)
is_anchor_newer() {
    local anchor_path="$1"
    local kb_path="$2"
    local repo_root="${3:-.}"

    local anchor_time kb_time

    anchor_time=$(get_file_last_commit "$anchor_path" "$repo_root") || return 1
    kb_time=$(get_file_last_commit "$kb_path" "$repo_root") || return 1

    # Return 0 (true) if anchor is strictly newer
    [[ $anchor_time -gt $kb_time ]]
}

# Compute the staleness state of a KB file
# Arguments:
#   $1 - KB file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   State string to stdout: "valid", "stale", or "orphaned"
# Returns:
#   0 always (state is in output)
compute_staleness() {
    local kb_path="$1"
    local repo_root="${2:-.}"
    local full_kb_path="$repo_root/$kb_path"

    # Check KB file exists
    if [[ ! -f "$full_kb_path" ]]; then
        echo "orphaned"
        return 0
    fi

    # Get anchors from KB file
    local anchors=()
    while IFS= read -r anchor; do
        [[ -n "$anchor" ]] && anchors+=("$anchor")
    done < <(get_anchors "$full_kb_path")

    if [[ ${#anchors[@]} -eq 0 ]]; then
        # No anchors defined - consider orphaned
        echo "orphaned"
        return 0
    fi

    local has_missing=0
    local has_stale=0

    for anchor in "${anchors[@]}"; do
        local anchor_full_path="$repo_root/$anchor"

        # Check if anchor file exists
        if [[ ! -f "$anchor_full_path" ]]; then
            has_missing=1
            continue
        fi

        # Check if anchor is newer than KB file
        if is_anchor_newer "$anchor" "$kb_path" "$repo_root"; then
            has_stale=1
        fi
    done

    # Determine state based on findings
    if [[ $has_missing -eq 1 ]]; then
        echo "orphaned"
    elif [[ $has_stale -eq 1 ]]; then
        echo "stale"
    else
        echo "valid"
    fi

    return 0
}

# Get list of stale anchors (anchors newer than KB file)
# Arguments:
#   $1 - KB file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   One stale anchor path per line
# Returns:
#   0 on success
get_stale_anchors() {
    local kb_path="$1"
    local repo_root="${2:-.}"
    local full_kb_path="$repo_root/$kb_path"

    if [[ ! -f "$full_kb_path" ]]; then
        return 1
    fi

    local anchors=()
    while IFS= read -r anchor; do
        [[ -n "$anchor" ]] && anchors+=("$anchor")
    done < <(get_anchors "$full_kb_path")

    for anchor in "${anchors[@]}"; do
        local anchor_full_path="$repo_root/$anchor"

        # Skip missing files
        [[ ! -f "$anchor_full_path" ]] && continue

        # Check if anchor is newer
        if is_anchor_newer "$anchor" "$kb_path" "$repo_root"; then
            echo "$anchor"
        fi
    done

    return 0
}

# Get list of orphaned anchors (anchors that no longer exist)
# Arguments:
#   $1 - KB file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   One orphaned anchor path per line
# Returns:
#   0 on success
get_orphaned_anchors() {
    local kb_path="$1"
    local repo_root="${2:-.}"
    local full_kb_path="$repo_root/$kb_path"

    if [[ ! -f "$full_kb_path" ]]; then
        return 1
    fi

    local anchors=()
    while IFS= read -r anchor; do
        [[ -n "$anchor" ]] && anchors+=("$anchor")
    done < <(get_anchors "$full_kb_path")

    for anchor in "${anchors[@]}"; do
        local anchor_full_path="$repo_root/$anchor"

        if [[ ! -f "$anchor_full_path" ]]; then
            echo "$anchor"
        fi
    done

    return 0
}

# ==============================================================================
# Staleness Report
# ==============================================================================

# Generate a detailed staleness report for a KB file
# Arguments:
#   $1 - KB file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   Formatted report to stdout
generate_staleness_report() {
    local kb_path="$1"
    local repo_root="${2:-.}"
    local full_kb_path="$repo_root/$kb_path"

    if [[ ! -f "$full_kb_path" ]]; then
        echo "Error: KB file not found: $kb_path" >&2
        return 1
    fi

    local state
    state=$(compute_staleness "$kb_path" "$repo_root")
    local color
    color=$(log_get_state_color "$state")

    echo "KB File: $kb_path"
    echo "State:   ${color}${state}${COLOR_RESET}"
    echo "Last Modified: $(get_file_last_commit_date "$kb_path" "$repo_root")"
    echo ""
    echo "Anchors:"

    local anchors=()
    while IFS= read -r anchor; do
        [[ -n "$anchor" ]] && anchors+=("$anchor")
    done < <(get_anchors "$full_kb_path")

    for anchor in "${anchors[@]}"; do
        local anchor_full_path="$repo_root/$anchor"
        local anchor_status="valid"
        local anchor_color="$COLOR_GREEN"

        if [[ ! -f "$anchor_full_path" ]]; then
            anchor_status="missing"
            anchor_color="$COLOR_RED"
        elif is_anchor_newer "$anchor" "$kb_path" "$repo_root"; then
            anchor_status="stale"
            anchor_color="$COLOR_YELLOW"
        fi

        local anchor_date
        anchor_date=$(get_file_last_commit_date "$anchor" "$repo_root")
        echo "  ${anchor_color}[$anchor_status]${COLOR_RESET} $anchor"
        if [[ "$anchor_status" != "missing" ]]; then
            echo "          Last modified: $anchor_date"
        fi
    done
}

# Check if any log files in a directory are stale
# Arguments:
#   $1 - directory to check (defaults to LOG_DIR)
#   $2 - repo root (optional)
# Outputs:
#   List of stale/orphaned KB files
# Returns:
#   0 if all valid, 1 if any stale/orphaned
check_directory_staleness() {
    local check_dir="${1:-$LOG_DIR}"
    local repo_root="${2:-.}"
    local has_issues=0

    while IFS= read -r log_file; do
        [[ -z "$log_file" ]] && continue

        # Get relative path
        local rel_path="${log_file#$repo_root/}"
        local state
        state=$(compute_staleness "$rel_path" "$repo_root")

        if [[ "$state" != "valid" ]]; then
            local color
            color=$(log_get_state_color "$state")
            echo "${color}[$state]${COLOR_RESET} $rel_path"
            has_issues=1
        fi
    done < <(find "$repo_root/$check_dir" -name "*.md" -type f 2>/dev/null | grep -v "/tasks/")

    return $has_issues
}
