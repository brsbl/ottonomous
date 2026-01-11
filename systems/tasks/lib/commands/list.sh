#!/usr/bin/env bash
# list.sh - List tasks from task files
# Usage: tasks list [--spec <id>] [--status <status>] [--json]

# Use TASKS_DIR from config if available, otherwise default
if [[ -z "${TASKS_DIR:-}" ]]; then
    TASKS_DIR=".kit/tasks"
fi

# Show help for list command
list_usage() {
    cat <<'EOF'
tasks list - List tasks

Usage: tasks list [--spec <id>] [--status <status>] [--json]

Options:
  --spec <id>      List tasks for a specific spec only
  --status <s>     Filter by status (pending, in_progress, done)
  --json           Output in JSON format
  -h, --help       Show this help message

Examples:
  tasks list                         # List all tasks
  tasks list --spec user-auth-a7x3   # List tasks for specific spec
  tasks list --status pending        # List only pending tasks
  tasks list --json                  # Output as JSON
EOF
}

# Get all task files
get_task_files() {
    local spec_filter="$1"

    if [[ ! -d "${TASKS_DIR}" ]]; then
        return
    fi

    if [[ -n "${spec_filter}" ]]; then
        local file="${TASKS_DIR}/${spec_filter}.json"
        if [[ -f "${file}" ]]; then
            echo "${file}"
        fi
    else
        find "${TASKS_DIR}" -name "*.json" -type f 2>/dev/null | sort
    fi
}

# Extract spec ID from filename
get_spec_id() {
    local file="$1"
    basename "${file}" .json
}

# Filter tasks by status using jq
filter_tasks_by_status() {
    local tasks_json="$1"
    local status_filter="$2"

    if [[ -n "${status_filter}" ]]; then
        echo "${tasks_json}" | jq --arg status "${status_filter}" '[.[] | select(.status == $status)]'
    else
        echo "${tasks_json}"
    fi
}

# Format dependencies for display
format_depends() {
    local depends="$1"

    if [[ -z "${depends}" ]] || [[ "${depends}" == "null" ]] || [[ "${depends}" == "[]" ]]; then
        echo "-"
    else
        # Convert JSON array to comma-separated string
        echo "${depends}" | jq -r 'if type == "array" then map(tostring) | join(",") else "-" end'
    fi
}

# Print human-readable output for a spec
print_spec_tasks() {
    local spec_id="$1"
    local tasks_json="$2"
    local task_count

    task_count=$(echo "${tasks_json}" | jq 'length')

    if [[ "${task_count}" -eq 0 ]]; then
        return
    fi

    echo "${spec_id} (${task_count} tasks)"
    printf "  %-4s %-24s %-12s %-4s %s\n" "ID" "TITLE" "STATUS" "PRI" "DEPENDS"

    # Iterate through tasks using jq to format each row
    echo "${tasks_json}" | jq -r '.[] |
        (.depends_on // []) as $deps |
        (if ($deps | length) == 0 then "-" else ($deps | map(tostring) | join(",")) end) as $dep_str |
        (.title | if length > 24 then .[:21] + "..." else . end) as $title |
        "\(.id)\t\($title)\t\(.status)\t\(.priority // 2)\t\($dep_str)"
    ' | while IFS=$'\t' read -r id title status priority dep_str; do
        printf "  %-4s %-24s %-12s %-4s %s\n" "${id}" "${title}" "${status}" "${priority}" "${dep_str}"
    done

    echo ""
}

# Build JSON output
build_json_output() {
    local spec_filter="$1"
    local status_filter="$2"
    local result="[]"
    local files

    files=$(get_task_files "${spec_filter}")

    if [[ -z "${files}" ]]; then
        echo "[]"
        return
    fi

    while IFS= read -r file; do
        [[ -z "${file}" ]] && continue
        [[ ! -f "${file}" ]] && continue

        local spec_id
        spec_id=$(get_spec_id "${file}")

        local file_json
        file_json=$(cat "${file}" 2>/dev/null)

        if [[ -z "${file_json}" ]] || ! echo "${file_json}" | jq empty 2>/dev/null; then
            continue
        fi

        # Extract tasks array from file
        local tasks_json
        tasks_json=$(echo "${file_json}" | jq '.tasks // []')

        # Apply status filter
        tasks_json=$(filter_tasks_by_status "${tasks_json}" "${status_filter}")

        # Skip if no tasks after filtering
        local count
        count=$(echo "${tasks_json}" | jq 'length')
        if [[ "${count}" -eq 0 ]]; then
            continue
        fi

        # Add to result
        result=$(echo "${result}" | jq --arg sid "${spec_id}" --argjson tasks "${tasks_json}" \
            '. + [{"spec_id": $sid, "tasks": $tasks}]')
    done <<< "${files}"

    echo "${result}"
}

# Main list command
cmd_list() {
    local spec_filter=""
    local status_filter=""
    local json_output=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --spec)
                spec_filter="$2"
                shift 2
                ;;
            --status)
                status_filter="$2"
                # Validate status
                if [[ ! "${status_filter}" =~ ^(pending|in_progress|done)$ ]]; then
                    echo "Error: Invalid status '${status_filter}'. Must be: pending, in_progress, done" >&2
                    exit 1
                fi
                shift 2
                ;;
            --json)
                json_output=true
                shift
                ;;
            -h|--help)
                list_usage
                exit 0
                ;;
            *)
                echo "Error: Unknown option '$1'" >&2
                list_usage
                exit 1
                ;;
        esac
    done

    # Check if tasks directory exists
    if [[ ! -d "${TASKS_DIR}" ]]; then
        if [[ "${json_output}" == true ]]; then
            echo "[]"
        else
            echo "No tasks found. Run 'tasks init <spec-path>' to create tasks."
        fi
        exit 0
    fi

    # JSON output
    if [[ "${json_output}" == true ]]; then
        build_json_output "${spec_filter}" "${status_filter}"
        exit 0
    fi

    # Human-readable output
    local files
    files=$(get_task_files "${spec_filter}")

    if [[ -z "${files}" ]]; then
        if [[ -n "${spec_filter}" ]]; then
            echo "No tasks found for spec '${spec_filter}'."
        else
            echo "No tasks found. Run 'tasks init <spec-path>' to create tasks."
        fi
        exit 0
    fi

    local found_any=false

    while IFS= read -r file; do
        [[ -z "${file}" ]] && continue
        [[ ! -f "${file}" ]] && continue

        local spec_id
        spec_id=$(get_spec_id "${file}")

        local file_json
        file_json=$(cat "${file}" 2>/dev/null)

        if [[ -z "${file_json}" ]] || ! echo "${file_json}" | jq empty 2>/dev/null; then
            continue
        fi

        # Extract tasks array from file
        local tasks_json
        tasks_json=$(echo "${file_json}" | jq '.tasks // []')

        # Apply status filter
        tasks_json=$(filter_tasks_by_status "${tasks_json}" "${status_filter}")

        # Check if any tasks remain
        local count
        count=$(echo "${tasks_json}" | jq 'length')
        if [[ "${count}" -eq 0 ]]; then
            continue
        fi

        found_any=true
        print_spec_tasks "${spec_id}" "${tasks_json}"
    done <<< "${files}"

    if [[ "${found_any}" == false ]]; then
        if [[ -n "${status_filter}" ]]; then
            echo "No tasks found with status '${status_filter}'."
        else
            echo "No tasks found."
        fi
    fi
}

# Run the command
cmd_list "$@"
