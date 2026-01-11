#!/usr/bin/env bash
# task-system/lib/config.sh
# Core configuration constants for the tasks CLI

# Prevent multiple sourcing
[[ -n "${_TASKS_CONFIG_LOADED:-}" ]] && return 0
readonly _TASKS_CONFIG_LOADED=1

# Valid task statuses
readonly VALID_TASK_STATUSES=("pending" "in_progress" "done")

# Default priority for new tasks (1=highest, 3=lowest)
readonly DEFAULT_PRIORITY=2

# Directory for task files (relative to repo root)
readonly TASKS_DIR=".kit/tasks"

# Validate a task status
# Usage: is_valid_status "pending"
# Returns: 0 if valid, 1 if invalid
is_valid_status() {
    local status="$1"
    local valid
    for valid in "${VALID_TASK_STATUSES[@]}"; do
        [[ "$status" == "$valid" ]] && return 0
    done
    return 1
}

# Get status display name (for pretty printing)
# Usage: get_status_display "in_progress" -> "In Progress"
get_status_display() {
    local status="$1"
    case "$status" in
        pending)     echo "Pending" ;;
        in_progress) echo "In Progress" ;;
        done)        echo "Done" ;;
        *)           echo "$status" ;;
    esac
}
