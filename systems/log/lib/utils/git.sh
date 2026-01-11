#!/usr/bin/env bash
# log-system/lib/utils/git.sh
# Git utility functions for the log CLI tool

# Prevent multiple sourcing
[[ -n "${_LOG_GIT_LOADED:-}" ]] && return 0
readonly _LOG_GIT_LOADED=1

# Source dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config.sh"

# ==============================================================================
# Repository Detection
# ==============================================================================

# Check if current directory (or specified directory) is inside a git repository
# Arguments:
#   $1 - directory to check (optional, defaults to current directory)
# Returns:
#   0 if in git repo, 1 if not
is_git_repo() {
    local dir="${1:-.}"
    git -C "$dir" rev-parse --git-dir &>/dev/null
}

# Get the root directory of the git repository
# Arguments:
#   $1 - directory to start from (optional, defaults to current directory)
# Outputs:
#   Absolute path to repo root
# Returns:
#   0 on success, 1 if not in a git repo
get_repo_root() {
    local dir="${1:-.}"

    if ! is_git_repo "$dir"; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    git -C "$dir" rev-parse --show-toplevel 2>/dev/null
}

# Get the current branch name
# Arguments:
#   $1 - repo root (optional)
# Outputs:
#   Branch name to stdout
# Returns:
#   0 on success, 1 on error
get_current_branch() {
    local repo_root="${1:-.}"
    git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null
}

# ==============================================================================
# Staging Functions
# ==============================================================================

# Stage a file for commit
# Arguments:
#   $1 - file path (relative to repo root or absolute)
#   $2 - repo root (optional)
# Returns:
#   0 on success, 1 on error
stage_file() {
    local file_path="$1"
    local repo_root="${2:-.}"

    if ! is_git_repo "$repo_root"; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    # Convert to path relative to repo root if absolute
    if [[ "$file_path" = /* ]]; then
        local abs_repo_root
        abs_repo_root=$(get_repo_root "$repo_root")
        file_path="${file_path#$abs_repo_root/}"
    fi

    git -C "$repo_root" add "$file_path" 2>/dev/null
    local result=$?

    if [[ $result -ne 0 ]]; then
        echo "Error: Failed to stage file: $file_path" >&2
        return 1
    fi

    return 0
}

# Stage a file for deletion
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Returns:
#   0 on success, 1 on error
stage_deletion() {
    local file_path="$1"
    local repo_root="${2:-.}"

    if ! is_git_repo "$repo_root"; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    git -C "$repo_root" rm "$file_path" 2>/dev/null
    local result=$?

    if [[ $result -ne 0 ]]; then
        echo "Error: Failed to stage deletion: $file_path" >&2
        return 1
    fi

    return 0
}

# Stage multiple files at once
# Arguments:
#   $1 - repo root
#   $2... - file paths
# Returns:
#   0 on success, 1 on error
stage_files() {
    local repo_root="$1"
    shift
    local files=("$@")

    if ! is_git_repo "$repo_root"; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    if [[ ${#files[@]} -eq 0 ]]; then
        return 0
    fi

    git -C "$repo_root" add "${files[@]}" 2>/dev/null
}

# ==============================================================================
# File Timestamp Functions
# ==============================================================================

# Touch a file to update its modification timestamp and stage it
# This is useful for marking a KB file as "reviewed" without content changes
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Returns:
#   0 on success, 1 on error
touch_and_stage() {
    local file_path="$1"
    local repo_root="${2:-.}"

    if ! is_git_repo "$repo_root"; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    local full_path="$repo_root/$file_path"

    if [[ ! -f "$full_path" ]]; then
        echo "Error: File not found: $file_path" >&2
        return 1
    fi

    # Touch the file to update mtime
    touch "$full_path" || {
        echo "Error: Failed to touch file: $file_path" >&2
        return 1
    }

    # Stage the file
    stage_file "$file_path" "$repo_root"
}

# ==============================================================================
# File Status Functions
# ==============================================================================

# Check if a file is tracked by git
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Returns:
#   0 if tracked, 1 if not
is_file_tracked() {
    local file_path="$1"
    local repo_root="${2:-.}"

    git -C "$repo_root" ls-files --error-unmatch "$file_path" &>/dev/null
}

# Check if a file has uncommitted changes
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Returns:
#   0 if modified/staged, 1 if clean
is_file_modified() {
    local file_path="$1"
    local repo_root="${2:-.}"

    # Check both staged and unstaged changes
    local status
    status=$(git -C "$repo_root" status --porcelain "$file_path" 2>/dev/null)

    [[ -n "$status" ]]
}

# Get file status (modified, added, deleted, etc.)
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Outputs:
#   Status string to stdout
get_file_status() {
    local file_path="$1"
    local repo_root="${2:-.}"

    local status
    status=$(git -C "$repo_root" status --porcelain "$file_path" 2>/dev/null)

    if [[ -z "$status" ]]; then
        echo "clean"
        return 0
    fi

    local status_code="${status:0:2}"
    case "$status_code" in
        "M "| " M"|"MM") echo "modified" ;;
        "A "| " A"|"AM") echo "added" ;;
        "D "| " D")      echo "deleted" ;;
        "R "| " R")      echo "renamed" ;;
        "C "| " C")      echo "copied" ;;
        "??")            echo "untracked" ;;
        "!!")            echo "ignored" ;;
        *)               echo "unknown" ;;
    esac
}

# ==============================================================================
# Utility Functions
# ==============================================================================

# Ensure we're in a git repository, exit with error if not
# Arguments:
#   $1 - custom error message (optional)
# Returns:
#   0 if in git repo, exits with 1 if not
require_git_repo() {
    local message="${1:-This command must be run inside a git repository}"

    if ! is_git_repo; then
        echo "Error: $message" >&2
        return 1
    fi

    return 0
}

# Get list of files changed since a specific commit
# Arguments:
#   $1 - commit reference (e.g., HEAD~1, commit hash)
#   $2 - repo root (optional)
# Outputs:
#   List of changed file paths
get_changed_files_since() {
    local commit_ref="$1"
    local repo_root="${2:-.}"

    git -C "$repo_root" diff --name-only "$commit_ref" 2>/dev/null
}

# Get list of staged files
# Arguments:
#   $1 - repo root (optional)
# Outputs:
#   List of staged file paths
get_staged_files() {
    local repo_root="${1:-.}"
    git -C "$repo_root" diff --cached --name-only 2>/dev/null
}

# Unstage a file
# Arguments:
#   $1 - file path (relative to repo root)
#   $2 - repo root (optional)
# Returns:
#   0 on success, 1 on error
unstage_file() {
    local file_path="$1"
    local repo_root="${2:-.}"

    git -C "$repo_root" reset HEAD "$file_path" &>/dev/null
}

# Check if working directory is clean
# Arguments:
#   $1 - repo root (optional)
# Returns:
#   0 if clean, 1 if dirty
is_working_dir_clean() {
    local repo_root="${1:-.}"

    local status
    status=$(git -C "$repo_root" status --porcelain 2>/dev/null)

    [[ -z "$status" ]]
}
