#!/usr/bin/env bash
# log list command - List all Log entries with status
# Usage: log list [--status <status>] [--json]

# Show help for list command
list_usage() {
    cat <<'EOF'
log list - List all Log entries

Usage: log list [--status <status>] [--json]

Options:
  --status <status>  Filter by status: valid, stale, orphaned
  --json             Output results as JSON
  --help, -h         Show this help message

Examples:
  log list
  log list --status stale
  log list --json
  log list --status valid --json

Output includes:
  - File path (as tree or flat list)
  - Staleness status (valid, stale, orphaned)
  - Anchor files with modification status
EOF
}

# Extract anchors from a KB file's frontmatter
# Returns space-separated list of anchor paths
extract_anchors() {
    local file="$1"
    local in_anchors=false
    local anchors=()

    while IFS= read -r line; do
        # Check for frontmatter boundaries
        if [[ "$line" == "---" ]]; then
            if [[ "$in_anchors" == true ]]; then
                break
            fi
            continue
        fi

        # Start of anchors section
        if [[ "$line" =~ ^anchors: ]]; then
            in_anchors=true
            continue
        fi

        # End of anchors section (another key)
        if [[ "$in_anchors" == true ]] && [[ "$line" =~ ^[a-z_]+: ]] && [[ ! "$line" =~ ^[[:space:]]+-[[:space:]] ]]; then
            break
        fi

        # Capture anchor entries
        if [[ "$in_anchors" == true ]] && [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(.+)$ ]]; then
            anchors+=("${BASH_REMATCH[1]}")
        fi
    done < "$file"

    echo "${anchors[*]}"
}

# Compute staleness status for a KB file
# Returns: valid, stale, or orphaned
compute_staleness() {
    local kb_file="$1"
    local anchors
    anchors=$(extract_anchors "$kb_file")

    if [[ -z "$anchors" ]]; then
        echo "orphaned"
        return
    fi

    local kb_mtime
    kb_mtime=$(stat -f %m "$kb_file" 2>/dev/null || stat -c %Y "$kb_file" 2>/dev/null)

    local has_valid=false
    local has_stale=false
    local all_missing=true

    for anchor in $anchors; do
        if [[ -f "$anchor" ]]; then
            all_missing=false
            local anchor_mtime
            anchor_mtime=$(stat -f %m "$anchor" 2>/dev/null || stat -c %Y "$anchor" 2>/dev/null)

            if [[ "$anchor_mtime" -gt "$kb_mtime" ]]; then
                has_stale=true
            else
                has_valid=true
            fi
        fi
    done

    if [[ "$all_missing" == true ]]; then
        echo "orphaned"
    elif [[ "$has_stale" == true ]]; then
        echo "stale"
    else
        echo "valid"
    fi
}

# Get anchor display string with status
get_anchor_display() {
    local kb_file="$1"
    local anchors
    anchors=$(extract_anchors "$kb_file")

    if [[ -z "$anchors" ]]; then
        echo "(none)"
        return
    fi

    local kb_mtime
    kb_mtime=$(stat -f %m "$kb_file" 2>/dev/null || stat -c %Y "$kb_file" 2>/dev/null)

    local display_parts=()
    for anchor in $anchors; do
        if [[ -f "$anchor" ]]; then
            local anchor_mtime
            anchor_mtime=$(stat -f %m "$anchor" 2>/dev/null || stat -c %Y "$anchor" 2>/dev/null)

            if [[ "$anchor_mtime" -gt "$kb_mtime" ]]; then
                display_parts+=("$anchor (modified)")
            else
                display_parts+=("$anchor")
            fi
        else
            display_parts+=("$anchor (deleted)")
        fi
    done

    # Join with comma
    local IFS=', '
    echo "${display_parts[*]}"
}

# Escape string for JSON
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/\\r}"
    str="${str//$'\t'/\\t}"
    echo "$str"
}

# Build tree structure from file list
# Takes sorted file paths as input
build_tree() {
    local -a files=("$@")
    local -A entries
    local -A statuses

    # Read status info from stdin (path|status format)
    while IFS='|' read -r path status anchor_display; do
        entries["$path"]="$status"
        statuses["$path"]="$anchor_display"
    done

    # Group files by directory structure
    local current_dir=""
    local -a dir_stack=()
    local indent=""

    echo ".kit/logs/"

    for file in "${files[@]}"; do
        # Remove .kit/logs/ prefix for processing
        local rel_path="${file#.kit/logs/}"
        local dir_part
        local file_part

        if [[ "$rel_path" == */* ]]; then
            dir_part=$(dirname "$rel_path")
            file_part=$(basename "$rel_path")
        else
            dir_part=""
            file_part="$rel_path"
        fi

        # Handle directory changes
        if [[ "$dir_part" != "$current_dir" ]]; then
            current_dir="$dir_part"
            if [[ -n "$dir_part" ]]; then
                echo "    ${dir_part}/"
            fi
        fi

        # Print file entry
        local status="${entries[$file]}"
        local prefix="    "
        if [[ -n "$dir_part" ]]; then
            prefix="        "
        fi
        echo "${prefix}${file_part} [${status}]"
    done
}

# Print flat table format
print_flat_table() {
    local -a results=("$@")

    # Print header
    printf "%-35s %-10s %s\n" "PATH" "STATUS" "ANCHORS"
    printf "%-35s %-10s %s\n" "----" "------" "-------"

    # Print each entry
    for result in "${results[@]}"; do
        IFS='|' read -r path status anchor_display <<< "$result"
        printf "%-35s %-10s %s\n" "$path" "$status" "$anchor_display"
    done
}

# Main list function
cmd_list() {
    local filter_status=""
    local json_output=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help|-h)
                list_usage
                return 0
                ;;
            --json)
                json_output=true
                shift
                ;;
            --status)
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --status requires a value (valid, stale, orphaned)" >&2
                    return 1
                fi
                case "$2" in
                    valid|stale|orphaned)
                        filter_status="$2"
                        ;;
                    *)
                        echo "Error: Invalid status '$2'. Use: valid, stale, orphaned" >&2
                        return 1
                        ;;
                esac
                shift 2
                ;;
            -*)
                echo "Error: Unknown option '$1'" >&2
                list_usage >&2
                return 1
                ;;
            *)
                echo "Error: Unexpected argument '$1'" >&2
                list_usage >&2
                return 1
                ;;
        esac
    done

    # Check if .kit/logs directory exists
    if [[ ! -d ".kit/logs" ]]; then
        echo "Error: No .kit/logs directory found. Run 'kit init' first." >&2
        return 1
    fi

    # Find all .md files in .kit/logs, excluding tasks directory
    local kb_files=()
    while IFS= read -r -d '' file; do
        # Exclude .kit/logs/tasks/ directory
        if [[ ! "$file" =~ ^\.kit/logs/tasks/ ]]; then
            kb_files+=("$file")
        fi
    done < <(find .kit/logs -name "*.md" -type f -print0 2>/dev/null | sort -z)

    if [[ ${#kb_files[@]} -eq 0 ]]; then
        if [[ "$json_output" == true ]]; then
            echo "[]"
        else
            echo "No Log entries found."
        fi
        return 0
    fi

    # Sort files for consistent output
    IFS=$'\n' kb_files=($(sort <<<"${kb_files[*]}")); unset IFS

    # Collect results with status
    local results=()
    for kb_file in "${kb_files[@]}"; do
        local status
        status=$(compute_staleness "$kb_file")

        # Apply filter if specified
        if [[ -n "$filter_status" ]] && [[ "$status" != "$filter_status" ]]; then
            continue
        fi

        local anchors
        anchors=$(extract_anchors "$kb_file")
        local anchor_display
        anchor_display=$(get_anchor_display "$kb_file")

        if [[ "$json_output" == true ]]; then
            # Build JSON anchors array
            local anchors_json="["
            local first=true
            for anchor in $anchors; do
                if [[ "$first" == true ]]; then
                    first=false
                else
                    anchors_json+=","
                fi
                anchors_json+="\"$(json_escape "$anchor")\""
            done
            anchors_json+="]"

            results+=("{\"path\":\"$(json_escape "$kb_file")\",\"status\":\"$status\",\"anchors\":$anchors_json}")
        else
            results+=("$kb_file|$status|$anchor_display")
        fi
    done

    # Handle no results after filtering
    if [[ ${#results[@]} -eq 0 ]]; then
        if [[ "$json_output" == true ]]; then
            echo "[]"
        else
            if [[ -n "$filter_status" ]]; then
                echo "No Log entries with status '$filter_status' found."
            else
                echo "No Log entries found."
            fi
        fi
        return 0
    fi

    # Output results
    if [[ "$json_output" == true ]]; then
        echo "["
        local first=true
        for result in "${results[@]}"; do
            if [[ "$first" == true ]]; then
                first=false
            else
                echo ","
            fi
            echo "  $result"
        done
        echo "]"
    else
        # Use flat table format for clarity
        print_flat_table "${results[@]}"
    fi
}
