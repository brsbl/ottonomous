#!/usr/bin/env bash
#
# spec list command
# Usage: spec list [--status <status>] [--json]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/specs.sh"

# Parse frontmatter from a spec file
# Returns: name, status, created as tab-separated values
parse_frontmatter() {
    local file="$1"
    local name=""
    local status=""
    local created=""
    local in_frontmatter=false

    while IFS= read -r line; do
        if [[ "$line" == "---" ]]; then
            if [[ "$in_frontmatter" == false ]]; then
                in_frontmatter=true
                continue
            else
                break
            fi
        fi

        if [[ "$in_frontmatter" == true ]]; then
            case "$line" in
                name:*)
                    name="${line#name:}"
                    name="${name#"${name%%[![:space:]]*}"}"  # trim leading whitespace
                    name="${name%"${name##*[![:space:]]}"}"  # trim trailing whitespace
                    # Remove surrounding quotes if present
                    name="${name#\"}"
                    name="${name%\"}"
                    name="${name#\'}"
                    name="${name%\'}"
                    ;;
                status:*)
                    status="${line#status:}"
                    status="${status#"${status%%[![:space:]]*}"}"
                    status="${status%"${status##*[![:space:]]}"}"
                    status="${status#\"}"
                    status="${status%\"}"
                    status="${status#\'}"
                    status="${status%\'}"
                    ;;
                created:*)
                    created="${line#created:}"
                    created="${created#"${created%%[![:space:]]*}"}"
                    created="${created%"${created##*[![:space:]]}"}"
                    created="${created#\"}"
                    created="${created%\"}"
                    created="${created#\'}"
                    created="${created%\'}"
                    ;;
            esac
        fi
    done < "$file"

    printf '%s\t%s\t%s' "$name" "$status" "$created"
}

# Extract spec ID from filename (basename without .md extension)
get_spec_id() {
    local file="$1"
    local basename
    basename="$(basename "$file" .md)"
    echo "$basename"
}

# Get relative path from project root
get_relative_path() {
    local file="$1"
    local root
    root="$(get_project_root 2>/dev/null || pwd)"

    if [[ "$file" == "$root"* ]]; then
        echo "${file#$root/}"
    else
        echo "$file"
    fi
}

# Main list command
cmd_list() {
    local filter_status=""
    local output_json=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --status)
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --status requires a value" >&2
                    return 1
                fi
                filter_status="$2"
                shift 2
                ;;
            --json)
                output_json=true
                shift
                ;;
            *)
                echo "Error: Unknown option '$1'" >&2
                return 1
                ;;
        esac
    done

    # Get all spec files
    local spec_files
    spec_files="$(find_all_specs)"

    if [[ -z "$spec_files" ]]; then
        if [[ "$output_json" == true ]]; then
            echo "[]"
        else
            echo "No specs found."
        fi
        return 0
    fi

    # Collect spec data
    local specs=()
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        local id name status created path
        id="$(get_spec_id "$file")"
        path="$(get_relative_path "$file")"

        IFS=$'\t' read -r name status created <<< "$(parse_frontmatter "$file")"

        # Apply status filter if specified
        if [[ -n "$filter_status" && "$status" != "$filter_status" ]]; then
            continue
        fi

        specs+=("${id}|${name}|${status}|${path}|${created}")
    done <<< "$spec_files"

    # Check if any specs match after filtering
    if [[ ${#specs[@]} -eq 0 ]]; then
        if [[ "$output_json" == true ]]; then
            echo "[]"
        else
            echo "No specs found."
        fi
        return 0
    fi

    # Output results
    if [[ "$output_json" == true ]]; then
        # JSON output
        echo "["
        local first=true
        for spec in "${specs[@]}"; do
            IFS='|' read -r id name status path created <<< "$spec"

            if [[ "$first" == true ]]; then
                first=false
            else
                echo ","
            fi

            # Escape JSON strings
            id="${id//\\/\\\\}"
            id="${id//\"/\\\"}"
            name="${name//\\/\\\\}"
            name="${name//\"/\\\"}"
            status="${status//\\/\\\\}"
            status="${status//\"/\\\"}"
            path="${path//\\/\\\\}"
            path="${path//\"/\\\"}"
            created="${created//\\/\\\\}"
            created="${created//\"/\\\"}"

            printf '  {"id":"%s","name":"%s","status":"%s","path":"%s","created":"%s"}' \
                "$id" "$name" "$status" "$path" "$created"
        done
        echo ""
        echo "]"
    else
        # Table output
        # Print header
        printf "%-16s %-25s %-12s %s\n" "ID" "NAME" "STATUS" "PATH"

        # Print each spec
        for spec in "${specs[@]}"; do
            IFS='|' read -r id name status path created <<< "$spec"

            # Truncate name if too long
            if [[ ${#name} -gt 25 ]]; then
                name="${name:0:22}..."
            fi

            printf "%-16s %-25s %-12s %s\n" "$id" "$name" "$status" "$path"
        done
    fi
}

# Run if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cmd_list "$@"
fi
