#!/usr/bin/env bash
# task-system/lib/utils/json.sh
# Pure bash JSON utilities (no jq dependency)

# Prevent multiple sourcing
[[ -n "${_TASKS_JSON_LOADED:-}" ]] && return 0
readonly _TASKS_JSON_LOADED=1

# Extract a simple field value from JSON
# Usage: json_get_field '{"name":"test"}' "name" -> test
# Handles: strings, numbers, booleans, null
# Does NOT handle: nested objects, arrays as values
json_get_field() {
    local json="$1"
    local field="$2"
    local value

    # Match "field": "value" or "field": value (for numbers/booleans/null)
    if [[ "$json" =~ \"$field\"[[:space:]]*:[[:space:]]*\"([^\"\\]*(\\.[^\"\\]*)*)\" ]]; then
        # String value - unescape basic sequences
        value="${BASH_REMATCH[1]}"
        value="${value//\\n/$'\n'}"
        value="${value//\\t/$'\t'}"
        value="${value//\\\"/\"}"
        value="${value//\\\\/\\}"
        echo "$value"
    elif [[ "$json" =~ \"$field\"[[:space:]]*:[[:space:]]*([0-9.eE+-]+|true|false|null) ]]; then
        # Number, boolean, or null
        echo "${BASH_REMATCH[1]}"
    else
        return 1
    fi
}

# Get the length of a JSON array
# Usage: json_get_array_length '[1,2,3]' -> 3
# Usage: json_get_array_length '{"tasks":[...]}' "tasks" -> count
json_get_array_length() {
    local json="$1"
    local field="${2:-}"
    local array_content
    local count=0

    if [[ -n "$field" ]]; then
        # Extract array from field
        if [[ "$json" =~ \"$field\"[[:space:]]*:[[:space:]]*\[([^]]*)\] ]]; then
            array_content="${BASH_REMATCH[1]}"
        else
            echo "0"
            return 0
        fi
    else
        # JSON is the array itself
        if [[ "$json" =~ ^\[([^]]*)\]$ ]]; then
            array_content="${BASH_REMATCH[1]}"
        else
            echo "0"
            return 1
        fi
    fi

    # Empty array
    if [[ -z "${array_content// /}" ]]; then
        echo "0"
        return 0
    fi

    # Count objects by counting opening braces at depth 0
    local depth=0
    local in_string=false
    local prev_char=""
    local char
    local i

    for ((i=0; i<${#array_content}; i++)); do
        char="${array_content:$i:1}"

        if [[ "$in_string" == true ]]; then
            if [[ "$char" == '"' && "$prev_char" != '\' ]]; then
                in_string=false
            fi
        else
            case "$char" in
                '"') in_string=true ;;
                '{')
                    if ((depth == 0)); then
                        ((count++))
                    fi
                    ((depth++))
                    ;;
                '}') ((depth--)) ;;
            esac
        fi
        prev_char="$char"
    done

    echo "$count"
}

# Escape a string for JSON output
# Usage: json_escape 'hello "world"' -> hello \"world\"
json_escape() {
    local string="$1"
    local result=""
    local char
    local i

    for ((i=0; i<${#string}; i++)); do
        char="${string:$i:1}"
        case "$char" in
            $'\n') result+="\\n" ;;
            $'\t') result+="\\t" ;;
            $'\r') result+="\\r" ;;
            '"')   result+="\\\"" ;;
            '\\')  result+="\\\\" ;;
            *)     result+="$char" ;;
        esac
    done

    echo "$result"
}

# Read and parse a task JSON file
# Usage: read_task_file "/path/to/tasks.json"
# Sets global variables: TASK_FILE_CONTENT, TASK_SPEC_ID, TASK_SPEC_PATH
# Returns: 0 on success, 1 on failure
read_task_file() {
    local file_path="$1"

    if [[ ! -f "$file_path" ]]; then
        return 1
    fi

    # Read entire file content
    TASK_FILE_CONTENT="$(cat "$file_path")" || return 1

    # Extract top-level fields
    TASK_SPEC_ID="$(json_get_field "$TASK_FILE_CONTENT" "spec_id")" || TASK_SPEC_ID=""
    TASK_SPEC_PATH="$(json_get_field "$TASK_FILE_CONTENT" "spec_path")" || TASK_SPEC_PATH=""

    return 0
}

# Extract a single task object from the tasks array by index
# Usage: json_get_task_at_index "$json" 0
# Returns: the task JSON object
json_get_task_at_index() {
    local json="$1"
    local target_index="$2"
    local depth=0
    local in_string=false
    local prev_char=""
    local char
    local i
    local task_start=-1
    local current_index=-1
    local in_tasks_array=false
    local tasks_depth=0

    # Find the tasks array and extract object at index
    for ((i=0; i<${#json}; i++)); do
        char="${json:$i:1}"

        if [[ "$in_string" == true ]]; then
            if [[ "$char" == '"' && "$prev_char" != '\' ]]; then
                in_string=false
            fi
        else
            case "$char" in
                '"') in_string=true ;;
                '[')
                    if [[ "$in_tasks_array" == false ]]; then
                        # Check if this is the tasks array
                        local before="${json:0:$i}"
                        if [[ "$before" =~ \"tasks\"[[:space:]]*:[[:space:]]*$ ]]; then
                            in_tasks_array=true
                            tasks_depth=$depth
                        fi
                    fi
                    ((depth++))
                    ;;
                ']')
                    ((depth--))
                    if [[ "$in_tasks_array" == true && "$depth" == "$tasks_depth" ]]; then
                        # End of tasks array
                        return 1
                    fi
                    ;;
                '{')
                    if [[ "$in_tasks_array" == true && "$depth" == "$((tasks_depth + 1))" ]]; then
                        ((current_index++))
                        if ((current_index == target_index)); then
                            task_start=$i
                        fi
                    fi
                    ((depth++))
                    ;;
                '}')
                    ((depth--))
                    if [[ "$task_start" -ge 0 && "$depth" == "$((tasks_depth + 1))" ]]; then
                        # Found the end of our target task
                        echo "${json:$task_start:$((i - task_start + 1))}"
                        return 0
                    fi
                    ;;
            esac
        fi
        prev_char="$char"
    done

    return 1
}

# Write task data to a JSON file
# Usage: write_task_file "/path/to/tasks.json" "$spec_id" "$spec_path" "$tasks_array_json"
# tasks_array_json should be a valid JSON array string
write_task_file() {
    local file_path="$1"
    local spec_id="$2"
    local spec_path="$3"
    local tasks_json="$4"

    # Ensure directory exists
    local dir
    dir="$(dirname "$file_path")"
    mkdir -p "$dir" || return 1

    # Escape strings for JSON
    local escaped_spec_id
    local escaped_spec_path
    escaped_spec_id="$(json_escape "$spec_id")"
    escaped_spec_path="$(json_escape "$spec_path")"

    # Build JSON output with proper formatting
    cat > "$file_path" << EOF
{
  "spec_id": "${escaped_spec_id}",
  "spec_path": "${escaped_spec_path}",
  "tasks": ${tasks_json}
}
EOF
    return $?
}

# Build a task JSON object
# Usage: build_task_json "1" "Title" "pending" "[]" "2" "Description"
# Returns: JSON object string
build_task_json() {
    local id="$1"
    local title="$2"
    local status="$3"
    local depends_on="$4"  # JSON array string, e.g., '["1", "2"]'
    local priority="$5"
    local description="$6"

    local escaped_title
    local escaped_description
    escaped_title="$(json_escape "$title")"
    escaped_description="$(json_escape "$description")"

    cat << EOF
{
      "id": "${id}",
      "title": "${escaped_title}",
      "status": "${status}",
      "depends_on": ${depends_on},
      "priority": ${priority},
      "description": "${escaped_description}"
    }
EOF
}

# Extract the depends_on array from a task object
# Usage: json_get_depends_on '{"depends_on": ["1", "2"]}'
# Returns: space-separated list of IDs
json_get_depends_on() {
    local task_json="$1"
    local result=""

    # Extract the depends_on array content
    if [[ "$task_json" =~ \"depends_on\"[[:space:]]*:[[:space:]]*\[([^]]*)\] ]]; then
        local array_content="${BASH_REMATCH[1]}"
        # Extract quoted strings
        while [[ "$array_content" =~ \"([^\"]+)\" ]]; do
            [[ -n "$result" ]] && result+=" "
            result+="${BASH_REMATCH[1]}"
            array_content="${array_content#*\"${BASH_REMATCH[1]}\"}"
        done
    fi

    echo "$result"
}
