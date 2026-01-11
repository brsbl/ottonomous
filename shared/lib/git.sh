#!/usr/bin/env bash
# aw/shared/lib/git.sh
# Shared git utilities for all AW subsystems

# Prevent multiple sourcing
[[ -n "${_AW_GIT_LOADED:-}" ]] && return 0
readonly _AW_GIT_LOADED=1

# ==============================================================================
# Repository Detection
# ==============================================================================

# Check if we're inside a git repository
# Returns: 0 if in git repo, 1 if not
is_git_repo() {
    git rev-parse --git-dir &>/dev/null
}

# Get the repository root directory
# Outputs: absolute path to repo root
# Returns: 0 on success, 1 if not in a repo
get_repo_root() {
    if ! is_git_repo; then
        return 1
    fi
    git rev-parse --show-toplevel 2>/dev/null
}

# Require being in a git repository
# Returns: 0 if in repo, 1 with error if not
require_git_repo() {
    if ! is_git_repo; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi
    return 0
}

# ==============================================================================
# File Status
# ==============================================================================

# Check if a file is tracked by git
# Arguments: file path
# Returns: 0 if tracked, 1 if not
is_file_tracked() {
    local file="$1"
    git ls-files --error-unmatch "$file" &>/dev/null
}

# Check if a file has been modified (staged or unstaged)
# Arguments: file path
# Returns: 0 if modified, 1 if not
is_file_modified() {
    local file="$1"
    # Check for staged or unstaged changes
    ! git diff --quiet "$file" 2>/dev/null || ! git diff --cached --quiet "$file" 2>/dev/null
}

# Get the status of a file (untracked, modified, staged, clean)
# Arguments: file path
# Outputs: status string
get_file_status() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        echo "missing"
        return
    fi

    if ! is_file_tracked "$file"; then
        echo "untracked"
        return
    fi

    # Check staged changes
    if ! git diff --cached --quiet "$file" 2>/dev/null; then
        echo "staged"
        return
    fi

    # Check unstaged changes
    if ! git diff --quiet "$file" 2>/dev/null; then
        echo "modified"
        return
    fi

    echo "clean"
}

# ==============================================================================
# Staging Operations
# ==============================================================================

# Stage a single file
# Arguments: file path
# Returns: 0 on success, 1 on failure
stage_file() {
    local file="$1"

    if ! is_git_repo; then
        return 1
    fi

    git add "$file" 2>/dev/null
}

# Stage multiple files
# Arguments: file paths...
# Returns: 0 on success, 1 on failure
stage_files() {
    if ! is_git_repo; then
        return 1
    fi

    git add "$@" 2>/dev/null
}

# Get list of staged files
# Outputs: newline-separated list of staged files
get_staged_files() {
    git diff --cached --name-only 2>/dev/null
}

# ==============================================================================
# History and Timestamps
# ==============================================================================

# Get the last commit time for a file (Unix timestamp)
# Arguments: file path
# Outputs: Unix timestamp or empty if not tracked
get_file_last_commit_time() {
    local file="$1"

    if ! is_file_tracked "$file"; then
        return 1
    fi

    git log -1 --format="%ct" -- "$file" 2>/dev/null
}

# Get the last commit hash for a file
# Arguments: file path
# Outputs: commit hash (short)
get_file_last_commit() {
    local file="$1"
    git log -1 --format="%h" -- "$file" 2>/dev/null
}

# Check if file was modified after a reference file
# Arguments: file path, reference file path
# Returns: 0 if file is newer, 1 if older or same
is_file_newer_than() {
    local file="$1"
    local ref_file="$2"

    local file_time ref_time
    file_time=$(get_file_last_commit_time "$file")
    ref_time=$(get_file_last_commit_time "$ref_file")

    if [[ -z "$file_time" ]] || [[ -z "$ref_time" ]]; then
        return 1
    fi

    [[ "$file_time" -gt "$ref_time" ]]
}

# ==============================================================================
# Working Directory State
# ==============================================================================

# Check if the working directory is clean
# Returns: 0 if clean, 1 if dirty
is_working_dir_clean() {
    git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null
}

# Get list of changed files (staged and unstaged)
# Outputs: newline-separated list of changed files
get_changed_files() {
    git diff --name-only 2>/dev/null
    git diff --cached --name-only 2>/dev/null
}

# Get changed files since a commit
# Arguments: commit hash
# Outputs: newline-separated list of changed files
get_changed_files_since() {
    local commit="$1"
    git diff --name-only "$commit" HEAD 2>/dev/null
}

# ==============================================================================
# Utility
# ==============================================================================

# Touch a file and stage it
# Arguments: file path
# Returns: 0 on success
touch_and_stage() {
    local file="$1"
    touch "$file" && stage_file "$file"
}

# Get the current branch name
# Outputs: branch name or empty
get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null
}
