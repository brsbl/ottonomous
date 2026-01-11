#!/usr/bin/env bash
# aw/shared/lib/core.sh
# Shared core utilities for all AW subsystems

# Prevent multiple sourcing
[[ -n "${_AW_CORE_LOADED:-}" ]] && return 0
readonly _AW_CORE_LOADED=1

# ==============================================================================
# Color Support
# ==============================================================================

if [[ -t 1 ]] && command -v tput &>/dev/null; then
    readonly COLOR_RED=$(tput setaf 1)
    readonly COLOR_GREEN=$(tput setaf 2)
    readonly COLOR_YELLOW=$(tput setaf 3)
    readonly COLOR_BLUE=$(tput setaf 4)
    readonly COLOR_RESET=$(tput sgr0)
    readonly COLOR_BOLD=$(tput bold)
else
    readonly COLOR_RED=""
    readonly COLOR_GREEN=""
    readonly COLOR_YELLOW=""
    readonly COLOR_BLUE=""
    readonly COLOR_RESET=""
    readonly COLOR_BOLD=""
fi

# ==============================================================================
# Output Functions
# ==============================================================================

# Print error message to stderr
# Arguments: message
error() {
    echo "${COLOR_RED}Error:${COLOR_RESET} $*" >&2
}

# Print success message
# Arguments: message
success() {
    echo "${COLOR_GREEN}$*${COLOR_RESET}"
}

# Print info message
# Arguments: message
info() {
    echo "${COLOR_BLUE}$*${COLOR_RESET}"
}

# Print warning message to stderr
# Arguments: message
warn() {
    echo "${COLOR_YELLOW}Warning:${COLOR_RESET} $*" >&2
}

# Print debug message if DEBUG=1
# Arguments: message
debug() {
    [[ "${DEBUG:-0}" == "1" ]] && echo "Debug: $*" >&2
}

# ==============================================================================
# Validation Functions
# ==============================================================================

# Check if a value is in an array
# Arguments: value, array elements...
# Returns: 0 if found, 1 if not
in_array() {
    local value="$1"
    shift
    local item
    for item in "$@"; do
        [[ "$value" == "$item" ]] && return 0
    done
    return 1
}

# Check if a file exists
# Arguments: file path
# Returns: 0 if exists, 1 if not (with error message)
require_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        error "File not found: $file"
        return 1
    fi
    return 0
}

# Check if a directory exists
# Arguments: directory path
# Returns: 0 if exists, 1 if not (with error message)
require_dir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        error "Directory not found: $dir"
        return 1
    fi
    return 0
}

# ==============================================================================
# String Functions
# ==============================================================================

# Trim leading and trailing whitespace
# Arguments: string
# Outputs: trimmed string
trim() {
    local var="$*"
    var="${var#"${var%%[![:space:]]*}"}"
    var="${var%"${var##*[![:space:]]}"}"
    echo "$var"
}

# Convert string to lowercase (bash 3 compatible)
# Arguments: string
# Outputs: lowercase string
to_lower() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Generate a short hash from a string
# Arguments: string
# Outputs: 4-character hash
short_hash() {
    echo -n "$1" | md5 2>/dev/null | cut -c1-4 || echo -n "$1" | md5sum 2>/dev/null | cut -c1-4
}

# Slugify a string (lowercase, replace spaces with hyphens)
# Arguments: string
# Outputs: slugified string
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-'
}
