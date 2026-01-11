# Git utilities for spec-system
# Source this file to access git-related functions

# Check if current directory is inside a git repository
# Usage: is_git_repo
# Returns: 0 if in git repo, 1 otherwise
is_git_repo() {
    git rev-parse --git-dir >/dev/null 2>&1
    return $?
}

# Get the root directory of the git repository
# Falls back to current directory if not in a git repo
# Usage: get_repo_root
# Output: Absolute path to repo root or current directory
get_repo_root() {
    local root

    if is_git_repo; then
        root=$(git rev-parse --show-toplevel 2>/dev/null)
        if [ -n "$root" ]; then
            printf '%s' "$root"
            return 0
        fi
    fi

    # Not in a git repo or error, return current directory
    pwd
}

# Stage a file for commit
# Usage: stage_file "/path/to/file"
# Returns: 0 on success, 1 on failure
stage_file() {
    local file="$1"

    if [ ! -f "$file" ]; then
        return 1
    fi

    if ! is_git_repo; then
        return 1
    fi

    git add "$file" 2>/dev/null
    return $?
}

# Stage a file for deletion
# Usage: stage_deletion "/path/to/file"
# Returns: 0 on success, 1 on failure
stage_deletion() {
    local file="$1"

    if ! is_git_repo; then
        return 1
    fi

    # Use git rm if file is tracked, otherwise just remove
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        git rm "$file" 2>/dev/null
    else
        rm -f "$file" 2>/dev/null
    fi

    return $?
}
