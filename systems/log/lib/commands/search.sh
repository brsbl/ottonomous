#!/usr/bin/env bash
# log search command - Search across log entries
# Usage: log search <term> [--json]

# Show help for search command
search_usage() {
    cat <<'EOF'
log search - Search across log entries

Usage: log search <term> [--json]

Arguments:
  <term>      Search term (required)

Options:
  --json      Output results as JSON
  --help, -h  Show this help message

Examples:
  log search "authentication"
  log search "JWT" --json
  log search "session timeout"

Output includes:
  - File path
  - Staleness status (valid, stale, orphaned)
  - Anchor files
  - Matching snippet with context
EOF
}

# Extract anchors from a log file's frontmatter
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

# Compute staleness status for a log file
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

# Get anchor status details (for display)
# Returns anchor with modification status
get_anchor_details() {
    local kb_file="$1"
    local anchors
    anchors=$(extract_anchors "$kb_file")

    if [[ -z "$anchors" ]]; then
        echo "(none)"
        return
    fi

    local kb_mtime
    kb_mtime=$(stat -f %m "$kb_file" 2>/dev/null || stat -c %Y "$kb_file" 2>/dev/null)

    local details=()
    for anchor in $anchors; do
        if [[ -f "$anchor" ]]; then
            local anchor_mtime
            anchor_mtime=$(stat -f %m "$anchor" 2>/dev/null || stat -c %Y "$anchor" 2>/dev/null)

            if [[ "$anchor_mtime" -gt "$kb_mtime" ]]; then
                details+=("$anchor (modified)")
            else
                details+=("$anchor")
            fi
        else
            details+=("$anchor (deleted)")
        fi
    done

    echo "${details[*]}"
}

# Create snippet from matching line with context
create_snippet() {
    local line="$1"
    local max_len=60

    # Strip leading/trailing whitespace
    line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

    # Truncate if too long
    if [[ ${#line} -gt $max_len ]]; then
        line="${line:0:$max_len}..."
    fi

    echo "...$line..."
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

# Main search function
cmd_search() {
    local search_term=""
    local json_output=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help|-h)
                search_usage
                return 0
                ;;
            --json)
                json_output=true
                shift
                ;;
            -*)
                echo "Error: Unknown option '$1'" >&2
                search_usage >&2
                return 1
                ;;
            *)
                if [[ -z "$search_term" ]]; then
                    search_term="$1"
                else
                    echo "Error: Multiple search terms provided. Use quotes for phrases." >&2
                    return 1
                fi
                shift
                ;;
        esac
    done

    # Require search term
    if [[ -z "$search_term" ]]; then
        echo "Error: Search term required" >&2
        search_usage >&2
        return 1
    fi

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
    done < <(find .kit/logs -name "*.md" -type f -print0 2>/dev/null)

    if [[ ${#kb_files[@]} -eq 0 ]]; then
        if [[ "$json_output" == true ]]; then
            echo "[]"
        else
            echo "No log entries found."
        fi
        return 0
    fi

    # Search and collect results
    local results=()
    local found_match=false

    for kb_file in "${kb_files[@]}"; do
        # Search for term in file (case-insensitive)
        local match_line
        match_line=$(grep -i -m 1 "$search_term" "$kb_file" 2>/dev/null || true)

        if [[ -n "$match_line" ]]; then
            found_match=true
            local entry_status
            entry_status=$(compute_staleness "$kb_file")
            local entry_anchors
            entry_anchors=$(extract_anchors "$kb_file")
            local anchor_details
            anchor_details=$(get_anchor_details "$kb_file")
            local snippet
            snippet=$(create_snippet "$match_line")

            if [[ "$json_output" == true ]]; then
                # Build JSON object
                local anchors_json="["
                local first_anchor=true
                for anchor in $entry_anchors; do
                    if [[ "$first_anchor" == true ]]; then
                        first_anchor=false
                    else
                        anchors_json+=","
                    fi
                    anchors_json+="\"$(json_escape "$anchor")\""
                done
                anchors_json+="]"

                results+=("{\"path\":\"$(json_escape "$kb_file")\",\"status\":\"$entry_status\",\"anchors\":$anchors_json,\"snippet\":\"$(json_escape "$snippet")\"}")
            else
                results+=("$kb_file|$entry_status|$anchor_details|$snippet")
            fi
        fi
    done

    # Output results
    if [[ "$found_match" == false ]]; then
        if [[ "$json_output" == true ]]; then
            echo "[]"
        else
            echo "No log entries match '$search_term'"
        fi
        return 0
    fi

    if [[ "$json_output" == true ]]; then
        # Output JSON array
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
        # Output human-readable format
        for result in "${results[@]}"; do
            IFS='|' read -r path status anchor_details snippet <<< "$result"
            echo "$path [$status]"
            echo "  Anchors: $anchor_details"
            echo "  $snippet"
            echo ""
        done
    fi
}
