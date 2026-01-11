#!/usr/bin/env bash
# log-system/lib/config.sh
# Core configuration constants for the log CLI tool

# Prevent multiple sourcing
[[ -n "${_LOG_CONFIG_LOADED:-}" ]] && return 0
readonly _LOG_CONFIG_LOADED=1

# ==============================================================================
# Directory and File Constants
# ==============================================================================

# Base directory for all log files (relative to repo root)
readonly LOG_DIR=".kit/logs"

# Configuration file path (relative to repo root)
readonly CONFIG_FILE=".kit/config.yaml"

# Directory for task-related log files
readonly LOG_TASKS_DIR=".kit/tasks"

# ==============================================================================
# State Constants
# ==============================================================================

# Valid staleness states for KB files
readonly VALID_STATES=("valid" "stale" "orphaned")

# State descriptions (bash 3 compatible)
STATE_DESC_VALID="All anchors exist and KB file is up to date"
STATE_DESC_STALE="One or more anchors modified after KB file"
STATE_DESC_ORPHANED="One or more anchor files no longer exist"

# ==============================================================================
# File Patterns
# ==============================================================================

# Pattern for KB markdown files
readonly LOG_FILE_PATTERN="*.md"

# Directories to exclude from KB file searches
readonly LOG_EXCLUDE_DIRS=("tasks")

# ==============================================================================
# Frontmatter Constants
# ==============================================================================

# Frontmatter delimiters
readonly FRONTMATTER_DELIMITER="---"

# Required frontmatter fields
readonly REQUIRED_FIELDS=("anchors")

# ==============================================================================
# Output Formatting
# ==============================================================================

# Colors for terminal output (if supported)
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
# Helper Functions
# ==============================================================================

# Check if a state is valid
# Arguments:
#   $1 - state to check
# Returns:
#   0 if valid, 1 if invalid
log_is_valid_state() {
    local state="$1"
    local valid_state
    for valid_state in "${VALID_STATES[@]}"; do
        [[ "$state" == "$valid_state" ]] && return 0
    done
    return 1
}

# Get state description
# Arguments:
#   $1 - state
# Outputs:
#   Description string
log_get_state_description() {
    local state="$1"
    case "$state" in
        valid)    echo "$STATE_DESC_VALID" ;;
        stale)    echo "$STATE_DESC_STALE" ;;
        orphaned) echo "$STATE_DESC_ORPHANED" ;;
        *)        echo "Unknown state" ;;
    esac
}

# Get color for state
# Arguments:
#   $1 - state
# Outputs:
#   Color escape code
log_get_state_color() {
    local state="$1"
    case "$state" in
        valid)    echo "$COLOR_GREEN" ;;
        stale)    echo "$COLOR_YELLOW" ;;
        orphaned) echo "$COLOR_RED" ;;
        *)        echo "$COLOR_RESET" ;;
    esac
}
