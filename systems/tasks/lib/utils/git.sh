#!/usr/bin/env bash
# task-system/lib/utils/git.sh
# Git utility functions for task management

# Prevent multiple sourcing
[[ -n "${_TASKS_GIT_LOADED:-}" ]] && return 0
readonly _TASKS_GIT_LOADED=1

# Check if current directory is within a git repository
# Usage: is_git_repo
# Returns: 0 if in git repo, 1 otherwise
is_git_repo() {
    git rev-parse --git-dir >/dev/null 2>&1
}

# Get the root directory of the git repository
# Usage: get_repo_root
# Returns: absolute path to repo root
get_repo_root() {
    local root

    if ! is_git_repo; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    root="$(git rev-parse --show-toplevel 2>/dev/null)"
    if [[ -z "$root" ]]; then
        echo "Error: Could not determine repository root" >&2
        return 1
    fi

    echo "$root"
}

# Stage a file for commit
# Usage: stage_file "/path/to/file"
# Returns: 0 on success, 1 on failure
stage_file() {
    local file_path="$1"

    if ! is_git_repo; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    if [[ ! -e "$file_path" ]]; then
        echo "Error: File does not exist: $file_path" >&2
        return 1
    fi

    git add "$file_path" 2>/dev/null
}

# Stage multiple files for commit
# Usage: stage_files "/path/to/file1" "/path/to/file2" ...
# Returns: 0 on success, 1 on failure
stage_files() {
    local file

    if ! is_git_repo; then
        echo "Error: Not in a git repository" >&2
        return 1
    fi

    for file in "$@"; do
        if [[ -e "$file" ]]; then
            git add "$file" 2>/dev/null || return 1
        fi
    done

    return 0
}

# Get the current branch name
# Usage: get_current_branch
# Returns: branch name
get_current_branch() {
    if ! is_git_repo; then
        return 1
    fi

    git rev-parse --abbrev-ref HEAD 2>/dev/null
}

# Check if a file is tracked by git
# Usage: is_file_tracked "/path/to/file"
# Returns: 0 if tracked, 1 otherwise
is_file_tracked() {
    local file_path="$1"

    if ! is_git_repo; then
        return 1
    fi

    git ls-files --error-unmatch "$file_path" >/dev/null 2>&1
}

# Check if there are uncommitted changes to a file
# Usage: has_uncommitted_changes "/path/to/file"
# Returns: 0 if has changes, 1 if clean
has_uncommitted_changes() {
    local file_path="$1"

    if ! is_git_repo; then
        return 1
    fi

    # Check for staged or unstaged changes
    if git diff --quiet HEAD -- "$file_path" 2>/dev/null; then
        return 1  # No changes
    fi

    return 0  # Has changes
}

# Get relative path from repo root
# Usage: get_relative_path "/absolute/path/to/file"
# Returns: relative path from repo root
get_relative_path() {
    local file_path="$1"
    local repo_root

    repo_root="$(get_repo_root)" || return 1

    # Remove repo root prefix
    if [[ "$file_path" == "$repo_root"* ]]; then
        echo "${file_path#$repo_root/}"
    else
        echo "$file_path"
    fi
}
