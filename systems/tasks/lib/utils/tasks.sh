#!/usr/bin/env bash
# task-system/lib/utils/tasks.sh
# Task management utility functions

# Prevent multiple sourcing
[[ -n "${_TASKS_UTILS_LOADED:-}" ]] && return 0
readonly _TASKS_UTILS_LOADED=1

# Source dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config.sh"
source "${SCRIPT_DIR}/json.sh"
source "${SCRIPT_DIR}/git.sh"

# Find task file for a spec ID
# Usage: find_task_file "user-auth-a7x3"
# Returns: path to task file or empty string
find_task_file() {
    local spec_id="$1"
    local repo_root
    local task_file

    repo_root="$(get_repo_root)" || return 1
    task_file="${repo_root}/${TASKS_DIR}/${spec_id}.json"

    if [[ -f "$task_file" ]]; then
        echo "$task_file"
        return 0
    fi

    return 1
}

# Find all task files in the repository
# Usage: find_all_task_files
# Returns: newline-separated list of task file paths
find_all_task_files() {
    local repo_root
    local tasks_dir

    repo_root="$(get_repo_root)" || return 1
    tasks_dir="${repo_root}/${TASKS_DIR}"

    if [[ ! -d "$tasks_dir" ]]; then
        return 0
    fi

    # Find all .json files in the tasks directory
    local file
    for file in "$tasks_dir"/*.json; do
        if [[ -f "$file" ]]; then
            echo "$file"
        fi
    done
}

# Extract spec ID from a spec file path
# Usage: get_spec_id_from_path "specs/user-auth-a7x3.md"
# Returns: user-auth-a7x3
get_spec_id_from_path() {
    local spec_path="$1"
    local filename
    local spec_id

    # Get basename and remove extension
    filename="$(basename "$spec_path")"
    spec_id="${filename%.md}"

    echo "$spec_id"
}

# Get the next sequential task ID for a task file
# Usage: get_next_task_id "/path/to/tasks.json"
# Returns: next ID number as string
get_next_task_id() {
    local task_file="$1"
    local max_id=0
    local task_count
    local i
    local task_json
    local task_id

    if [[ ! -f "$task_file" ]]; then
        echo "1"
        return 0
    fi

    read_task_file "$task_file" || {
        echo "1"
        return 0
    }

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        task_id="$(json_get_field "$task_json" "id")" || continue

        # Convert to number and track maximum
        if [[ "$task_id" =~ ^[0-9]+$ ]] && ((task_id > max_id)); then
            max_id=$task_id
        fi
    done

    echo "$((max_id + 1))"
}

# Check if a task is blocked by unmet dependencies
# Usage: is_task_blocked "/path/to/tasks.json" "3"
# Returns: 0 if blocked, 1 if not blocked
is_task_blocked() {
    local task_file="$1"
    local task_id="$2"
    local task_count
    local i
    local task_json
    local current_id
    local depends_on
    local dep_id
    local dep_status

    read_task_file "$task_file" || return 1

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    # Find the target task
    local target_depends=""
    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        current_id="$(json_get_field "$task_json" "id")" || continue

        if [[ "$current_id" == "$task_id" ]]; then
            target_depends="$(json_get_depends_on "$task_json")"
            break
        fi
    done

    # No dependencies means not blocked
    if [[ -z "$target_depends" ]]; then
        return 1
    fi

    # Build a map of task statuses
    declare -A status_map
    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        current_id="$(json_get_field "$task_json" "id")" || continue
        status_map["$current_id"]="$(json_get_field "$task_json" "status")"
    done

    # Check each dependency
    for dep_id in $target_depends; do
        dep_status="${status_map[$dep_id]:-}"
        if [[ "$dep_status" != "done" ]]; then
            return 0  # Blocked
        fi
    done

    return 1  # Not blocked
}

# Find the highest priority unblocked pending task
# Usage: find_next_unblocked "/path/to/tasks.json"
# Returns: task ID or empty if none found
find_next_unblocked() {
    local task_file="$1"
    local task_count
    local i
    local task_json
    local task_id
    local task_status
    local task_priority
    local best_id=""
    local best_priority=999

    read_task_file "$task_file" || return 1

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        task_id="$(json_get_field "$task_json" "id")" || continue
        task_status="$(json_get_field "$task_json" "status")" || continue

        # Skip non-pending tasks
        [[ "$task_status" != "pending" ]] && continue

        # Check if blocked
        if is_task_blocked "$task_file" "$task_id"; then
            continue
        fi

        # Get priority (default to DEFAULT_PRIORITY)
        task_priority="$(json_get_field "$task_json" "priority")" || task_priority=$DEFAULT_PRIORITY

        # Track highest priority (lowest number)
        if ((task_priority < best_priority)); then
            best_priority=$task_priority
            best_id=$task_id
        fi
    done

    if [[ -n "$best_id" ]]; then
        echo "$best_id"
        return 0
    fi

    return 1
}

# Detect circular dependencies in tasks
# Usage: detect_cycle "/path/to/tasks.json"
# Returns: 0 if cycle detected (with cycle path on stdout), 1 if no cycle
detect_cycle() {
    local task_file="$1"
    local task_count
    local i
    local task_json
    local task_id

    read_task_file "$task_file" || return 1

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    # Build adjacency list (task -> dependencies)
    declare -A deps_map
    declare -a all_ids=()

    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        task_id="$(json_get_field "$task_json" "id")" || continue
        all_ids+=("$task_id")
        deps_map["$task_id"]="$(json_get_depends_on "$task_json")"
    done

    # DFS-based cycle detection
    declare -A visited
    declare -A in_stack
    declare -a path=()

    # Recursive DFS function
    _dfs_visit() {
        local node="$1"
        local dep

        visited["$node"]=1
        in_stack["$node"]=1
        path+=("$node")

        for dep in ${deps_map[$node]}; do
            if [[ -z "${visited[$dep]:-}" ]]; then
                if _dfs_visit "$dep"; then
                    return 0
                fi
            elif [[ -n "${in_stack[$dep]:-}" ]]; then
                # Found cycle - build cycle path
                local cycle_start=0
                local j
                for ((j=0; j<${#path[@]}; j++)); do
                    if [[ "${path[$j]}" == "$dep" ]]; then
                        cycle_start=$j
                        break
                    fi
                done

                # Output cycle
                local cycle_path=""
                for ((j=cycle_start; j<${#path[@]}; j++)); do
                    [[ -n "$cycle_path" ]] && cycle_path+=" -> "
                    cycle_path+="${path[$j]}"
                done
                cycle_path+=" -> $dep"
                echo "$cycle_path"
                return 0
            fi
        done

        unset 'path[-1]'
        in_stack["$node"]=""
        return 1
    }

    # Visit all nodes
    for task_id in "${all_ids[@]}"; do
        if [[ -z "${visited[$task_id]:-}" ]]; then
            path=()
            if _dfs_visit "$task_id"; then
                return 0  # Cycle found
            fi
        fi
    done

    return 1  # No cycle
}

# Get task by ID
# Usage: get_task_by_id "/path/to/tasks.json" "3"
# Returns: task JSON object
get_task_by_id() {
    local task_file="$1"
    local target_id="$2"
    local task_count
    local i
    local task_json
    local task_id

    read_task_file "$task_file" || return 1

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        task_id="$(json_get_field "$task_json" "id")" || continue

        if [[ "$task_id" == "$target_id" ]]; then
            echo "$task_json"
            return 0
        fi
    done

    return 1
}

# Count tasks by status
# Usage: count_tasks_by_status "/path/to/tasks.json" "done"
# Returns: count as integer
count_tasks_by_status() {
    local task_file="$1"
    local target_status="$2"
    local task_count
    local i
    local task_json
    local task_status
    local count=0

    read_task_file "$task_file" || {
        echo "0"
        return 0
    }

    task_count="$(json_get_array_length "$TASK_FILE_CONTENT" "tasks")"

    for ((i=0; i<task_count; i++)); do
        task_json="$(json_get_task_at_index "$TASK_FILE_CONTENT" "$i")" || continue
        task_status="$(json_get_field "$task_json" "status")" || continue

        if [[ "$task_status" == "$target_status" ]]; then
            ((count++))
        fi
    done

    echo "$count"
}
